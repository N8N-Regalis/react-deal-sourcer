import React from 'react'
import './Panel.css'

const Panel = ({ submissions, onRefresh }) => {
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
              <th>ID</th>
              <th>Partner</th>
              <th>Listing</th>
              <th>Type</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  No submissions yet
                </td>
              </tr>
            ) : (
              submissions.map((submission) => (
                <tr key={submission.submissionId}>
                  <td className="submission-id">{submission.submissionId}</td>
                  <td>{submission.partner}</td>
                  <td>{submission.listingName}</td>
                  <td>{submission.sourceType}</td>
                  <td>
                    <a
                      href={submission.listingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Panel
