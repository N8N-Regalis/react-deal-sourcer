import React, { useRef, useEffect } from 'react'
import './SignIn.css'

const GOOGLE_CLIENT_ID = '29993372948-si7cpq9i26t89adv5qdrqrnii4me2p3c.apps.googleusercontent.com'

const SignIn = ({ onSignIn }) => {
  const googleButtonRef = useRef(null)

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
      })

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        })
      }
    }
  }, [])

  const handleCredentialResponse = (response) => {
    console.log('Google Sign-In callback triggered:', response)
    try {
      const base64Url = response.credential.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      const payload = JSON.parse(jsonPayload)
      console.log('Decoded payload:', payload)
      onSignIn(payload.email)
    } catch (error) {
      console.error('Error parsing credential:', error)
    }
  }

  return (
    <div className="card sign-in-card">
      <h1 className="sign-in-title">Deal Source Tracker</h1>
      <h2>Sign In Required</h2>
      <p>Please sign in with your Google account to access the Deal Sourcer Form.</p>
      <div ref={googleButtonRef}></div>
    </div>
  )
}

export default SignIn
