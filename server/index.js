import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { getPartners, getUserEmail, saveData, getUserSubmissions, updateSubmission, checkDuplicateSubmission, getAllSubmissions, normalizeUrl } from './googleSheetsService.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: ['https://regalis-deal-sourcer.netlify.app', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000']
}))
app.use(express.json())

// API Routes
app.get('/api/partners', async (req, res) => {
  try {
    const partners = await getPartners()
    res.json(partners)
  } catch (error) {
    console.error('Error fetching partners:', error)
    res.status(500).json({ error: 'Failed to fetch partners' })
  }
})

app.get('/api/user', async (req, res) => {
  try {
    const email = await getUserEmail()
    res.json({ email })
  } catch (error) {
    console.error('Error fetching user email:', error)
    res.json({ email: '' })
  }
})

app.post('/api/submit', async (req, res) => {
  try {
    const { partner, listingLink, sourceType } = req.body
    
    // Validate required fields
    if (!partner || !listingLink) {
      return res.status(400).json({ error: 'Partner and listing link are required' })
    }
    
    // Normalize the listing link for duplicate checking
    let normalizedListingLink
    try {
      normalizedListingLink = normalizeUrl(listingLink)
    } catch (error) {
      return res.status(400).json({ error: 'Invalid listing link URL' })
    }
    
    // Skip duplicate check if sourceType is "Resourced"
    if (sourceType !== "Resourced") {
      // Check if partner and listing link combination already exists
      const exists = await checkDuplicateSubmission(partner, normalizedListingLink)
      if (exists) {
        return res.status(409).json({ error: 'Listing Link already exists' })
      }
    }
    
    const result = await saveData(req.body)
    res.json(result)
  } catch (error) {
    console.error('Error saving data:', error)
    res.status(500).json({ error: 'Failed to save data' })
  }
})

const ADMIN_EMAILS = ['tanveer@regaliscapital.com', 'n8n@regaliscapital.com']

app.get('/api/submissions', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' })
    }
    
    // Check if user is admin
    if (ADMIN_EMAILS.includes(email)) {
      const data = await getAllSubmissions()
      res.json(data)
    } else {
      const data = await getUserSubmissions(email)
      res.json(data)
    }
  } catch (error) {
    console.error('Error fetching submissions:', error)
    res.json({ submissions: [] })
  }
})

app.put('/api/update-submission', async (req, res) => {
  try {
    const result = await updateSubmission(req.body)
    res.json(result)
  } catch (error) {
    console.error('Error updating submission:', error)
    res.status(500).json({ error: 'Failed to update submission' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
