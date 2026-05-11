import React, { useState } from 'react'
import './Panel.css'

const Panel = ({ submissions, onRefresh }) => {
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [editingRow, setEditingRow] = useState(null)
  const [editFormData, setEditFormData] = useState({})

  const statusOptions = [
    'Pending NDA',
    'NDA Signed', 
    'Follow up',
    'For Broker Intro Call',
    'Re-sourced',
    'Added in Bitrix',
    'Axed'
  ]

  const isDueToday = (dueDate) => {
    if (!dueDate) return false;
    
    // Get today's date in EST
    const today = new Date();
    const todayEST = new Date(today.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const todayString = todayEST.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if today's date equals due date OR is past the due date
    return dueDate <= todayString;
  }

  const toggleRow = (submissionId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(submissionId)) {
      newExpanded.delete(submissionId)
    } else {
      newExpanded.add(submissionId)
    }
    setExpandedRows(newExpanded)
  }

  const startEdit = (submission) => {
    setEditingRow(submission.submissionId)
    setEditFormData({
      cimReceived: submission.cimReceived || 'FALSE',
      status: submission.status || '',
      notes: submission.notes || '',
      dueDate: submission.dueDate || ''
    })
  }

  const cancelEdit = () => {
    setEditingRow(null)
    setEditFormData({})
  }

  const saveEdit = async () => {
    try {
      const response = await fetch('/api/update-submission', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: editingRow,
          cimReceived: editFormData.cimReceived,
          status: editFormData.status,
          notes: editFormData.notes,
          dueDate: editFormData.dueDate
        })
      })

      if (response.ok) {
        setEditingRow(null)
        setEditFormData({})
        onRefresh() // Refresh the data
      } else {
        console.error('Failed to update submission')
      }
    } catch (error) {
      console.error('Error updating submission:', error)
    }
  }

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>My Sourced Deals</h3>
        <button className="refresh-btn" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Entry Date</th>
              <th>Partner</th>
              <th>Listing</th>
              <th>Type</th>
              <th>Link</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  No submissions yet
                </td>
              </tr>
            ) : (
              submissions.map((submission) => (
                <React.Fragment key={submission.submissionId}>
                  <tr 
                    className={`clickable-row ${isDueToday(submission.dueDate) ? 'due-today' : ''}`}
                    onClick={() => toggleRow(submission.submissionId)}
                  >
                    <td className="submission-id">
                      {submission.timestamp ? 
                        (() => {
                          try {
                            // Handle Google Sheets timestamp format (YYYY-MM-DD HH:MM:SS)
                            const dateStr = submission.timestamp.trim();
                            // Extract just the date part if it's in YYYY-MM-DD HH:MM:SS format
                            const dateOnly = dateStr.split(' ')[0];
                            return new Date(dateOnly).toLocaleDateString('en-CA');
                          } catch (error) {
                            console.error('Error parsing timestamp:', submission.timestamp, error);
                            return 'Invalid Date';
                          }
                        })() : 'N/A'}
                    </td>
                    <td>{submission.partner}</td>
                    <td>{submission.listingName}</td>
                    <td>{submission.sourceType}</td>
                    <td>
                      <a
                        href={submission.listingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open
                      </a>
                    </td>
                    <td>
                      <button alt="Edit Entry" title="Edit Entry"
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!expandedRows.has(submission.submissionId)) {
                            toggleRow(submission.submissionId)
                          }
                          startEdit(submission)
                        }}
                      >
                        🖉
                      </button>
                    </td>
                  </tr>
                  
                  {expandedRows.has(submission.submissionId) && (
                    <tr className="collapsible-row">
                      <td colSpan="6">
                        <div className="collapsible-content">
                          {editingRow === submission.submissionId ? (
                            <div className="edit-form">
                              <div className="edit-form-grid">
                                <div className="edit-item">
                                  <label>CIM Received:</label>
                                  <div className="checkbox-toggle">
                                    <input
                                      type="checkbox"
                                      checked={editFormData.cimReceived === 'TRUE'}
                                      onChange={(e) => handleEditChange('cimReceived', e.target.checked ? 'TRUE' : 'FALSE')}
                                    />
                                  </div>
                                </div>
                                <div className="edit-item">
                                  <label>Status:</label>
                                  <select
                                    value={editFormData.status}
                                    onChange={(e) => handleEditChange('status', e.target.value)}
                                  >
                                    <option value="">Select Status</option>
                                    {statusOptions.map(option => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="edit-item full-width">
                                  <label>Notes:</label>
                                  <textarea
                                    value={editFormData.notes}
                                    onChange={(e) => handleEditChange('notes', e.target.value)}
                                    rows="3"
                                  />
                                </div>
                                <div className="edit-item">
                                  <label>Due Date:</label>
                                  <input
                                    type="date"
                                    value={editFormData.dueDate}
                                    onChange={(e) => handleEditChange('dueDate', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="edit-actions">
                                <button className="save-btn" onClick={saveEdit}>
                                  Save Changes
                                </button>
                                <button className="cancel-btn" onClick={cancelEdit}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="deal-details">
                            <div className="detail-item">
                              <span className="detail-label">Submission ID:</span>
                              <span className="detail-value">{submission.submissionId || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Brokerage:</span>
                              <span className="detail-value">{submission.brokerage || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Broker Name:</span>
                              <span className="detail-value">{submission.brokerName || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Broker Email:</span>
                              <span className="detail-value">{submission.brokerEmail || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">CIM Received:</span>
                              <span className="detail-value">
                                {submission.cimReceived === 'TRUE' ? (
                                  <span className="checkbox checked">✓</span>
                                ) : submission.cimReceived === 'FALSE' ? (
                                  <span className="checkbox unchecked">✗</span>
                                ) : (
                                  <span className="checkbox unknown">?</span>
                                )}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Status:</span>
                              <span className="detail-value">{submission.status || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Notes:</span>
                              <span className="detail-value">{submission.notes || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Due Date:</span>
                              <span className="detail-value">{submission.dueDate || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Modified Date:</span>
                              <span className="detail-value">{submission.modifiedDate || 'N/A'}</span>
                            </div>
                          </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Panel
