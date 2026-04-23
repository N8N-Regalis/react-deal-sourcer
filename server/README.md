# Backend Server Setup

This server provides API endpoints for the React Deal Sourcer app to interact with Google Sheets.

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Give it a name (e.g., "deal-sourcer-app")
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### 3. Generate Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Select "JSON" and click "Create"
5. Save the JSON file as `service-account.json` in the `server` directory

### 4. Share Google Sheets with Service Account

1. Open the JSON file you just downloaded
2. Copy the `client_email` value (e.g., `deal-sourcer-app@project-id.iam.gserviceaccount.com`)
3. Open your Google Sheets:
   - Partners sheet: `1j0nSI9PPX1lhgwEQzmATtD8AtsXny11JysV77tVXMhE`
   - Submissions sheet: `1vRdVw3NywawevVlWVc9Rlu0m9PGcVb--6tVjkDLH4bg`
4. Click "Share" on each sheet
5. Paste the service account email and give it "Editor" permissions

### 5. Install Dependencies

```bash
cd server
npm install
```

### 6. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:
- Set `USER_EMAIL` to your test email
- Ensure `GOOGLE_SERVICE_ACCOUNT_KEY` points to your service account JSON file

### 7. Start the Server

```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

- `GET /api/partners` - Get list of partners
- `GET /api/user` - Get current user email
- `POST /api/submit` - Submit a new deal
- `GET /api/submissions` - Get user's submissions

## Security Notes

- **Never commit** `service-account.json` to version control
- Add `service-account.json` to `.gitignore`
- In production, use proper authentication (OAuth, JWT, etc.) instead of hardcoded emails
- Consider using environment variables for sensitive data
