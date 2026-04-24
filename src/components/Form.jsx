import React, { useState } from 'react'
import Select from 'react-select'
import './Form.css'

const Form = ({ partners, userEmail, onSubmit, onTogglePanel, panelVisible }) => {
  const [partner, setPartner] = useState(null)
  const [listingName, setListingName] = useState('')
  const [listingLink, setListingLink] = useState('')
  const [brokerage, setBrokerage] = useState('')
  const [brokerName, setBrokerName] = useState('')
  const [brokerEmail, setBrokerEmail] = useState('')
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

    if (!partner || !listingName || !listingLink || !brokerEmail || !sourceType) {
      alert('Please fill all required fields')
      return
    }

    setIsSubmitting(true)
    setStatus('Submitting...')

    try {
      const result = await onSubmit({
        partner: partner.value,
        listingName,
        listingLink,
        brokerage,
        brokerName,
        brokerEmail,
        sourceType,
        notes,
      })

      setStatus(`Saved ${result.id}`)

      // Reset form
      setPartner(null)
      setListingName('')
      setListingLink('')
      setBrokerage('')
      setBrokerName('')
      setBrokerEmail('')
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

        <label>Brokerage</label>
        <input
          type="text"
          value={brokerage}
          onChange={(e) => setBrokerage(e.target.value)}
          disabled={isSubmitting}
        />

        <label>Broker Name</label>
        <input
          type="text"
          value={brokerName}
          onChange={(e) => setBrokerName(e.target.value)}
          disabled={isSubmitting}
        />

        <label>Broker Email</label>
        <input
          type="text"
          value={brokerEmail}
          onChange={(e) => setBrokerEmail(e.target.value)}
          disabled={isSubmitting}
        />

        <label>Source Type</label>
        <select
          value={sourceType}
          onChange={handleSourceTypeChange}
          disabled={isSubmitting}
        >
          <option value="" disabled>-- Select Source Type --</option>
          <option value="Resource">Resource</option>
          <option value="New">New</option>
        </select>

        <label>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
        />

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
