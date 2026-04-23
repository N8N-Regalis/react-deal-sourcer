# React Deal Sourcer App

A React application for sourcing and managing deals, integrated with Google Sheets as the backend data store.

## Features

- **Deal Sourcing Form**: Submit new deals with partner, listing details, and source type
- **Partner Selection**: Dynamic dropdown populated from Google Sheets
- **Submission Tracking**: View all your sourced deals in a responsive table
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Dark theme with glass-morphism effects and smooth animations

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Select** - Custom dropdown component
- **CSS3** - Styling with responsive design

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Google Sheets API** - Data storage
- **CORS** - Cross-origin resource sharing

## Project Structure

```
react-deal-sourcer/
├── src/
│   ├── components/
│   │   ├── Form.jsx          # Deal submission form
│   │   ├── Form.css
│   │   ├── Panel.jsx         # Submissions display panel
│   │   └── Panel.css
│   ├── App.jsx               # Main application component
│   ├── App.css
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles
├── server/
│   ├── index.js              # Express server
│   ├── googleSheetsService.js # Google Sheets API integration
│   ├── package.json
│   ├── .env.example
│   └── README.md             # Backend setup instructions
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Cloud account with access to Google Sheets API

### 1. Clone and Install Frontend Dependencies

```bash
cd "d:/Regalis Files/React Deal Sourcer App"
npm install
```

### 2. Setup Backend

Follow the detailed instructions in `server/README.md` to:

1. Enable Google Sheets API in Google Cloud Console
2. Create a service account
3. Generate and download service account key
4. Share your Google Sheets with the service account
5. Install backend dependencies
6. Configure environment variables

### 3. Start the Backend Server

```bash
cd server
npm install
npm start
```

The server will run on `http://localhost:5000`

### 4. Start the Frontend Development Server

```bash
# In the root directory
npm run dev
```

The app will be available at `http://localhost:3000`

## Usage

1. **Select a Partner**: Choose from the dropdown (populated from Google Sheets)
2. **Enter Listing Details**: Add listing name and link
3. **Choose Source Type**: Select "Old" or "New" (notes required for "Old")
4. **Submit**: Click submit to save the deal to Google Sheets
5. **View Submissions**: Your submissions appear in the panel on the right
6. **Toggle Panel**: Hide/show the submissions panel as needed

## API Endpoints

- `GET /api/partners` - Fetch list of partners from Google Sheets
- `GET /api/user` - Get current user email
- `POST /api/submit` - Submit a new deal to Google Sheets
- `GET /api/submissions` - Fetch user's submissions from Google Sheets

## Google Sheets Configuration

The app uses two Google Sheets:

1. **Partners Sheet** (`1j0nSI9PPX1lhgwEQzmATtD8AtsXny11JysV77tVXMhE`)
   - Sheet name: "Active Overview"
   - Range: A3:A (partner names)

2. **Submissions Sheet** (`1vRdVw3NywawevVlWVc9Rlu0m9PGcVb--6tVjkDLH4bg`)
   - Sheet name: "Submissions" (auto-created if doesn't exist)
   - Columns: Submission ID, Timestamp, User Email, Partner Name, Listing Name, Listing Link, Source Type, Notes

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Security Notes

- **Never commit** `service-account.json` to version control
- Add `service-account.json` to `.gitignore`
- In production, implement proper authentication (OAuth, JWT, etc.)
- Use environment variables for all sensitive configuration
- Consider using a secrets manager for production deployments

## Development

The frontend uses Vite's HMR (Hot Module Replacement) for fast development. Changes to React components and CSS will be reflected immediately without refreshing the page.

## Troubleshooting

### CORS Errors
Ensure the backend server is running and CORS is properly configured in `server/index.js`.

### Google Sheets API Errors
- Verify the service account email has "Editor" permissions on both Google Sheets
- Check that the service account key file path is correct in `.env`
- Ensure the Google Sheets API is enabled in Google Cloud Console

### Partner Dropdown Empty
- Verify the Partners sheet ID is correct
- Check that the "Active Overview" sheet exists and has data in column A

## License

Internal use - Automations Team
