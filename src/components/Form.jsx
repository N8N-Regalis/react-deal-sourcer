import React, { useState } from 'react'
import Select from 'react-select'
import './Form.css'

const Form = ({ partners, userEmail, onSubmit, onTogglePanel, panelVisible }) => {
  const [partner, setPartner] = useState(null)
  const [listingName, setListingName] = useState('')
  const [listingLink, setListingLink] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const partnerOptions = partners.map(p => ({ value: p, label: p }))

  const handleSourceTypeChange = (e) => {
    setSourceType(e.target.value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!partner || !listingName || !listingLink || !sourceType) {
      alert('Please fill all required fields')
      return
    }

    if (sourceType === 'Old' && !notes) {
      alert('Notes required for Old source')
      return
    }

    setIsSubmitting(true)
    setStatus('Submitting...')

    try {
      const result = await onSubmit({
        partner: partner.value,
        listingName,
        listingLink,
        sourceType,
        notes,
      })

      setStatus(`Saved ${result.id}`)

      // Reset form
      setPartner(null)
      setListingName('')
      setListingLink('')
      setSourceType('')
      setNotes('')
    } catch (error) {
      alert('Error saving data')
      setStatus('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h2>Deal Sourcing Form</h2>

      <form onSubmit={handleSubmit}>
        <label>Partner Name</label>
        <Select
          value={partner}
          onChange={setPartner}
          options={partnerOptions}
          placeholder="-- Select Partner --"
          className="react-select-container"
          classNamePrefix="react-select"
          isDisabled={isSubmitting}
        />

        <label>Listing Name</label>
        <input
          type="text"
          value={listingName}
          onChange={(e) => setListingName(e.target.value)}
          disabled={isSubmitting}
        />

        <label>Listing Link</label>
        <input
          type="text"
          value={listingLink}
          onChange={(e) => setListingLink(e.target.value)}
          disabled={isSubmitting}
        />

        <label>Source Type</label>
        <select
          value={sourceType}
          onChange={handleSourceTypeChange}
          disabled={isSubmitting}
        >
          <option value="" disabled>-- Select Source Type --</option>
          <option value="Old">Old</option>
          <option value="New">New</option>
        </select>

        {sourceType === 'Old' && (
          <div className="notes-container">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        )}

        <label>User Email</label>
        <input type="text" value={userEmail} readOnly />

        <div className="button-row">
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            className="glass-btn"
            onClick={onTogglePanel}
          >
            {panelVisible ? 'Hide Sourced Deals' : 'Show Sourced Deals'}
          </button>
        </div>

        {status && (
          <div className="status">
            <span>{status}</span>
          </div>
        )}
      </form>
    </div>
  )
}

export default Form
