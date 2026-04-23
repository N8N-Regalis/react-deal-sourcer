import React, { useState, useEffect } from 'react'
import Form from './components/Form'
import Panel from './components/Panel'
import Header from './components/Header'
import SignIn from './components/SignIn'
import Footer from './components/Footer'
import './App.css'

function App() {
  const [partners, setPartners] = useState([])
  const [userEmail, setUserEmail] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [panelVisible, setPanelVisible] = useState(true)
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    loadPartners()
    loadSubmissions()
  }, [])

  const handleSignIn = (email) => {
    setUserEmail(email)
    setIsSignedIn(true)
  }

  const handleSignOut = () => {
    setUserEmail('')
    setIsSignedIn(false)
  }

  const loadPartners = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const response = await fetch(`${apiUrl}/partners`)
      const data = await response.json()
      console.log('Partners loaded:', data)
      setPartners(data)
    } catch (error) {
      console.error('Error loading partners:', error)
      alert('Failed to load partners. Check console for details.')
    }
  }

  const loadSubmissions = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const response = await fetch(`${apiUrl}/submissions?email=${encodeURIComponent(userEmail)}`)
      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const response = await fetch(`${apiUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, user: userEmail }),
      })
      const data = await response.json()
      loadSubmissions()
      return data
    } catch (error) {
      console.error('Error submitting data:', error)
      alert('Error saving data')
      throw error
    }
  }

  const togglePanel = () => {
    setPanelVisible(!panelVisible)
  }

  return (
    <div className={`body ${isSignedIn ? 'signed-in' : ''}`}>
      {isSignedIn && <Header userEmail={userEmail} onSignOut={handleSignOut} />}
      
      <div className="container">
        {!isSignedIn ? (
          <SignIn onSignIn={handleSignIn} />
        ) : (
          <>
            <Form
              partners={partners}
              userEmail={userEmail}
              onSubmit={handleSubmit}
              onTogglePanel={togglePanel}
              panelVisible={panelVisible}
            />
            {panelVisible && <Panel submissions={submissions} onRefresh={loadSubmissions} />}
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default App