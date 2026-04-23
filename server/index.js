import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { getPartners, getUserEmail, saveData, getUserSubmissions } from './googleSheetsService.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
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
    const result = await saveData(req.body)
    res.json(result)
  } catch (error) {
    console.error('Error saving data:', error)
    res.status(500).json({ error: 'Failed to save data' })
  }
})

app.get('/api/submissions', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' })
    }
    const data = await getUserSubmissions(email)
    res.json(data)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    res.json({ submissions: [] })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
