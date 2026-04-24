import { google } from 'googleapis'
import dotenv from 'dotenv'

dotenv.config()

// Spreadsheet IDs
const PARTNERS_SHEET_ID = '1j0nSI9PPX1lhgwEQzmATtD8AtsXny11JysV77tVXMhE'
const SUBMISSIONS_SHEET_ID = '1vRdVw3NywawevVlWVc9Rlu0m9PGcVb--6tVjkDLH4bg'

// Initialize Google Sheets API
let auth
const keyEnv = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

if (keyEnv && !keyEnv.startsWith('./') && !keyEnv.startsWith('/')) {
  // Parse JSON from environment variable (for production/Render)
  const credentials = typeof keyEnv === 'string' ? JSON.parse(keyEnv) : keyEnv
  auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
} else {
  // Use file (for local development)
  const keyFile = keyEnv && (keyEnv.startsWith('./') || keyEnv.startsWith('/')) ? keyEnv : './react-deal-sourcer-45126b11537a.json'
  auth = new google.auth.GoogleAuth({
    keyFile: keyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

const sheets = google.sheets({ version: 'v4', auth })

// Get Partners from Active Overview sheet
export async function getPartners() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: PARTNERS_SHEET_ID,
      range: 'Active Overview!A3:A',
    })

    const values = response.data.values || []
    return values.flat().filter(Boolean).map(String)
  } catch (error) {
    console.error('Error fetching partners:', error)
    throw error
  }
}

// Get User Email (placeholder - in real app, this comes from auth)
export async function getUserEmail() {
  return process.env.USER_EMAIL || ''
}

// Save Data to Submissions sheet
export async function saveData(data) {
  try {
    // Get or create Submissions sheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
    })

    let sheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === 'Submissions'
    )

    if (!sheet) {
      // Create the sheet with headers
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SUBMISSIONS_SHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Submissions',
                },
              },
            },
          ],
        },
      })

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SUBMISSIONS_SHEET_ID,
        range: 'Submissions!A1:H1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [
            [
              'Submission ID',
              'Timestamp',
              'User Email',
              'Partner Name',
              'Listing Name',
              'Listing Link',
              'Source Type',
              'Notes',
            ],
          ],
        },
      })
    }

    // Get current counter from a separate sheet or use a different method
    // For simplicity, we'll read the last row to determine the next ID
    const lastRowResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
      range: 'Submissions!A:A',
    })

    const rows = lastRowResponse.data.values || []
    const counter = rows.length // Simple counter based on row count

    // Format ID: SUB-000001
    const id = 'SUB-' + String(counter).padStart(6, '0')

    // Format timestamp in EST timezone
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6')

    // Append new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
      range: 'Submissions!A:H',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            id,
            timestamp,
            data.user,
            data.partner,
            data.listingName,
            data.listingLink,
            data.sourceType,
            data.notes || '',
          ],
        ],
      },
    })

    return { id }
  } catch (error) {
    console.error('Error saving data:', error)
    throw error
  }
}

// Get User Submissions
export async function getUserSubmissions(email) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SUBMISSIONS_SHEET_ID,
      range: 'Submissions!A:H',
    })

    const rows = response.data.values || []

    // Skip header row
    const dataRows = rows.slice(1)

    // Filter by user email
    const filtered = dataRows.filter((row) => {
      const userEmail = String(row[2] || '').trim()
      return userEmail === email
    })

    const submissions = filtered.map((row) => ({
      submissionId: row[0],
      partner: row[3],
      listingName: row[4],
      listingLink: row[5],
      sourceType: row[6],
      notes: row[7],
    }))

    return { submissions }
  } catch (error) {
    console.error('Error fetching submissions:', error)
    // Return empty if sheet doesn't exist yet
    return { submissions: [] }
  }
}
