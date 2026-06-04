import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

// Spreadsheet IDs
const PARTNERS_SHEET_ID = "1j0nSI9PPX1lhgwEQzmATtD8AtsXny11JysV77tVXMhE";
const SUBMISSIONS_SHEET_ID = "1vRdVw3NywawevVlWVc9Rlu0m9PGcVb--6tVjkDLH4bg";

/**
 * Normalize URL for duplicate detection
 * - Converts hostname to lowercase
 * - Removes www. prefix
 * - Removes trailing slash
 * - Preserves important query parameters (listingId, id, listing, etc.)
 * - Removes tracking parameters (utm_*, fbclid, etc.)
 * - Normalizes protocol (HTTP/HTTPS treated the same)
 * @param {string} url - The URL to normalize
 * @returns {string} Normalized URL
 * @throws {Error} If URL is invalid
 */
export function normalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL: URL must be a non-empty string');
  }

  try {
    // Parse URL
    const parsed = new URL(url);
    
    // Convert hostname to lowercase
    parsed.hostname = parsed.hostname.toLowerCase();
    
    // Remove www. prefix
    if (parsed.hostname.startsWith('www.')) {
      parsed.hostname = parsed.hostname.slice(4);
    }
    
    // Remove trailing slash from pathname
    parsed.pathname = parsed.pathname.replace(/\/$/, '');
    
    // Remove hash
    parsed.hash = '';
    
    // Preserve important query parameters, remove tracking parameters
    const importantParams = ['listingId', 'id', 'listing', 'propertyId', 'mls', 'mlsid'];
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
    
    const params = new URLSearchParams(parsed.search);
    const filteredParams = new URLSearchParams();
    
    for (const [key, value] of params.entries()) {
      const lowerKey = key.toLowerCase();
      // Keep if it's an important parameter or not a tracking parameter
      if (importantParams.includes(lowerKey) || !trackingParams.some(tp => lowerKey.startsWith(tp))) {
        filteredParams.append(key, value);
      }
    }
    
    // Update search with filtered parameters
    parsed.search = filteredParams.toString();
    
    // Reconstruct URL (protocol is normalized by URL constructor)
    return parsed.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
}

// Initialize Google Sheets API
let auth;
const keyEnv = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

if (keyEnv && !keyEnv.startsWith("./") && !keyEnv.startsWith("/")) {
  // Parse JSON from environment variable (for production/Render)
  const credentials = typeof keyEnv === "string" ? JSON.parse(keyEnv) : keyEnv;
  auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
} else {
  // Use file (for local development)
  const keyFile =
    keyEnv && (keyEnv.startsWith("./") || keyEnv.startsWith("/"))
      ? keyEnv
      : "./react-deal-sourcer-45126b11537a.json";
  auth = new google.auth.GoogleAuth({
    keyFile: keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

const sheets = google.sheets({ version: "v4", auth });

// Get Partners from Active Overview sheet
export async function getPartners() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: PARTNERS_SHEET_ID,
      range: "Active Overview!A3:A",
    });

    const values = response.data.values || [];
    return values.flat().filter(Boolean).map(String);
  } catch (error) {
    console.error("Error fetching partners:", error);
    throw error;
  }
}

// Get User Email (placeholder - in real app, this comes from auth)
export async function getUserEmail() {
  return process.env.USER_EMAIL || "";
}

// Check if partner and listing link combination already exists in Submissions sheet
export async function checkDuplicateSubmission(partnerName, listingLink) {
  try {
    // Normalize the listing link for comparison
    const normalizedListingLink = normalizeUrl(listingLink);
    
    // Fetch only columns D (Partner Name) and F (Listing Link) to reduce data transfer
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
      range: "Submissions!D:F",
    });

    const rows = response.data.values || [];

    // Skip header row
    const dataRows = rows.slice(1);

    // Clean partner name by removing special characters
    const cleanedPartnerName = partnerName.replace(/[❗⭐]/g, '').trim();

    console.log("Checking for duplicate submission:");
    console.log("Partner Name (cleaned):", cleanedPartnerName);
    console.log("Listing Link (normalized):", normalizedListingLink);
    console.log("Total rows in sheet:", dataRows.length);

    // Check if both partner name (column D, index 0 in this range) and listing link (column F, index 2 in this range) match
    const exists = dataRows.some((row) => {
      const existingPartner = String(row[0] || "").replace(/[❗⭐]/g, '').trim();
      const existingLink = String(row[2] || "").trim();
      
      // Normalize existing link for comparison
      let normalizedExistingLink;
      try {
        normalizedExistingLink = normalizeUrl(existingLink);
      } catch (error) {
        // If existing link is invalid, skip this row
        console.log("Skipping invalid existing link:", existingLink);
        return false;
      }
      
      const partnerMatch = existingPartner === cleanedPartnerName;
      const linkMatch = normalizedExistingLink === normalizedListingLink;
      
      // console.log("Comparing:", existingPartner, "with", cleanedPartnerName, "=>", partnerMatch);
      // console.log("Comparing:", normalizedExistingLink, "with", normalizedListingLink, "=>", linkMatch);
      
      return partnerMatch && linkMatch;
    });

    console.log("Duplicate found:", exists);
    return exists;
  } catch (error) {
    console.error("Error checking duplicate submission:", error);
    // If sheet doesn't exist yet, return false
    return false;
  }
}

// Save Data to Submissions sheet
export async function saveData(data) {
  try {
    // Get or create Submissions sheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
    });

    let sheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === "Submissions",
    );

    if (!sheet) {
      // Create the sheet with headers
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SUBMISSIONS_SHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "Submissions",
                },
              },
            },
          ],
        },
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SUBMISSIONS_SHEET_ID,
        range: "Submissions!A1:P1",
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              "Submission ID",
              "Timestamp",
              "User Email",
              "Partner Name",
              "Listing Name",
              "Listing Link",
              "Brokerage",
              "Broker Name",
              "Broker Email",
              "Source Type",
              "Notes",
              "CIM Received",
              "Status",
              "Due Date",
              "Modified Date",
              "Sourcer Email",
            ],
          ],
        },
      });
    }

    // Get the last submission ID from the sheet
    const lastRowResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
      range: "Submissions!A:A",
    });

    const rows = lastRowResponse.data.values || [];
    let counter = 1;

    // Skip header row and find the last valid ID
    if (rows.length > 1) {
      const lastId = rows[rows.length - 1][0]; // Get last row's ID
      if (lastId && lastId.startsWith("SUB-")) {
        const lastNumber = parseInt(lastId.replace("SUB-", ""), 10);
        counter = lastNumber + 1;
      }
    }

    // Format ID: SUB-000001
    const id = "SUB-" + String(counter).padStart(6, "0");

    // Format timestamp in EST timezone
    const timestamp = new Date()
      .toLocaleString("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, "$3-$1-$2 $4:$5:$6");

    // Append new row
    const rowData = [
      id,
      timestamp,
      data.user,
      data.partner,
      data.listingName,
      data.listingLink,
      data.brokerage || "",
      data.brokerName || "",
      data.brokerEmail || "",
      data.sourceType,
      data.notes || "",
      "FALSE", // CIM Received
      data.status || "", // Status
      "", // Due Date
      "", // Modified Date
      data.user, // Sourcer Email (same as User Email)
    ];
    
    console.log("Submitting data to Google Sheets:", rowData);
    console.log("CIM Received value (index 11):", rowData[11]);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
      range: "Submissions!A:P",
      valueInputOption: "RAW",
      requestBody: {
        values: [rowData],
      },
    });

    return { id };
  } catch (error) {
    console.error("Error saving data:", error);
    throw error;
  }
}

// Get User Submissions
export async function getUserSubmissions(email) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
      range: "Submissions!A:P",
    });

    const rows = response.data.values || [];

    // Skip header row
    const dataRows = rows.slice(1);

    // Filter by user email
    const filtered = dataRows.filter((row) => {
      const userEmail = String(row[2] || "").trim();
      return userEmail === email;
    });

    const submissions = filtered.map((row) => ({
      submissionId: row[0],
      timestamp: row[1],
      partner: row[3],
      listingName: row[4],
      listingLink: row[5],
      brokerage: row[6],
      brokerName: row[7],
      brokerEmail: row[8],
      sourceType: row[9],
      notes: row[10],
      cimReceived: row[11],
      status: row[12],
      dueDate: row[13],
      modifiedDate: row[14],
      sourcerEmail: row[15],
    }));

    return { submissions };
  } catch (error) {
    console.error("Error fetching submissions:", error);
    // Return empty if sheet doesn't exist yet
    return { submissions: [] };
  }
}

// Get All Submissions (for admin users)
export async function getAllSubmissions() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
      range: "Submissions!A:P",
    });

    const rows = response.data.values || [];

    // Skip header row
    const dataRows = rows.slice(1);

    const submissions = dataRows.map((row) => ({
      submissionId: row[0],
      timestamp: row[1],
      partner: row[3],
      listingName: row[4],
      listingLink: row[5],
      brokerage: row[6],
      brokerName: row[7],
      brokerEmail: row[8],
      sourceType: row[9],
      notes: row[10],
      cimReceived: row[11],
      status: row[12],
      dueDate: row[13],
      modifiedDate: row[14],
      sourcerEmail: row[15],
    }));

    return { submissions };
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    return { submissions: [] };
  }
}

// Update Submission
export async function updateSubmission(data) {
  try {
    console.log("Update submission data received:", data);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
      range: "Submissions!A:P",
    });

    const rows = response.data.values || [];
    console.log("Sheet rows retrieved:", rows.length);
    console.log("Header row:", rows[0]);

    // Find the row index for the submission ID
    const rowIndex = rows.findIndex(
      (row, index) => index > 0 && row[0] === data.submissionId,
    );

    if (rowIndex === -1) {
      throw new Error("Submission not found");
    }

    console.log("Found submission at row index:", rowIndex, "row data:", rows[rowIndex]);
    console.log("Row length:", rows[rowIndex].length);

    // Ensure the row has enough columns (at least 16 for A-P)
    const currentRow = rows[rowIndex];
    while (currentRow.length < 16) {
      currentRow.push(''); // Add empty columns if missing
    }

    // Format current timestamp in EST for Modified Date
    const modifiedDate = new Date()
      .toLocaleString("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, "$3-$1-$2 $4:$5:$6");

    console.log("Updating with data:", {
      cimReceived: data.cimReceived,
      status: data.status,
      dueDate: data.dueDate,
      modifiedDate: modifiedDate
    });

    // Update CIM, Status, Due Date, and Modified Date (columns L-O)
    const updateRange = `Submissions!L${rowIndex + 1}:O${rowIndex + 1}`;
    console.log("Update range:", updateRange);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
      range: updateRange,
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          data.cimReceived, 
          data.status, 
          data.dueDate || '',
          modifiedDate
        ]],
      },
    });

    console.log("Columns L-O updated successfully");

    // Update notes in column K
    await sheets.spreadsheets.values.update({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
      range: `Submissions!K${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[data.notes]],
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating submission:", error);
    throw error;
  }
}
