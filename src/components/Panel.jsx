import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import './Panel.css'

const Panel = ({ submissions, onRefresh }) => {
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [editingRow, setEditingRow] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [sortBy, setSortBy] = useState('entryDate')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filters, setFilters] = useState({
    entryDate: [],
    partner: [],
    listingName: [],
    sourceType: [],
    status: []
  })
  const [activeFilterDropdown, setActiveFilterDropdown] = useState(null)
  const [filterSearch, setFilterSearch] = useState('')
  const [debouncedFilterSearch, setDebouncedFilterSearch] = useState('')
  const dropdownRefs = useRef({})

  const statusOptions = [
    'Pending NDA',
    'NDA Signed', 
    'Follow up',
    'For Broker Intro Call',
    'Re-sourced',
    'Added in Bitrix',
    'Axed'
  ]

  const columnConfig = [
    { key: 'entryDate', label: 'Entry Date', accessor: 'timestamp' },
    { key: 'partner', label: 'Partner', accessor: 'partner' },
    { key: 'listingName', label: 'Listing Name', accessor: 'listingName' },
    { key: 'sourceType', label: 'Type', accessor: 'sourceType' },
    { key: 'status', label: 'Status', accessor: 'status' }
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

  const sortOptions = [
    { value: 'partnerName', label: 'Partner Name' },
    { value: 'listingName', label: 'Listing Name' },
    { value: 'entryDate', label: 'Entry Date' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'status', label: 'Status' }
  ]

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    try {
      // Handle Google Sheets timestamp format (YYYY-MM-DD HH:MM:SS)
      const trimmedStr = dateStr.trim();
      const dateOnly = trimmedStr.split(' ')[0];
      return new Date(dateOnly);
    } catch (error) {
      return new Date(0);
    }
  }

  const getUniqueValues = useCallback((columnKey) => {
    const column = columnConfig.find(col => col.key === columnKey)
    if (!column) return []
    
    const values = submissions.map(submission => {
      let value = submission[column.accessor]
      
      // Special handling for entry date
      if (column.key === 'entryDate' && value) {
        try {
          const dateStr = value.trim()
          const dateOnly = dateStr.split(' ')[0]
          value = new Date(dateOnly).toLocaleDateString('en-CA')
        } catch (error) {
          value = 'Invalid Date'
        }
      }
      
      return value || '(Blank)'
    })
    
    // Remove duplicates and sort
    return [...new Set(values)].sort((a, b) => {
      if (a === '(Blank)') return -1
      if (b === '(Blank)') return 1
      return a.localeCompare(b)
    })
  }, [submissions])

  // Cache unique values to avoid recalculation
  const uniqueValuesCache = useMemo(() => {
    const cache = {}
    columnConfig.forEach(column => {
      cache[column.key] = getUniqueValues(column.key)
    })
    return cache
  }, [submissions, getUniqueValues])

  const toggleFilterDropdown = (columnKey) => {
    if (activeFilterDropdown === columnKey) {
      setActiveFilterDropdown(null)
      setFilterSearch('')
      setDebouncedFilterSearch('')
    } else {
      setActiveFilterDropdown(columnKey)
      setFilterSearch('')
      setDebouncedFilterSearch('')
    }
  }

  const handleFilterChange = (columnKey, value) => {
    setFilters(prev => {
      const currentFilters = prev[columnKey] || []
      let newFilters
      
      if (currentFilters.includes(value)) {
        newFilters = currentFilters.filter(f => f !== value)
      } else {
        newFilters = [...currentFilters, value]
      }
      
      return {
        ...prev,
        [columnKey]: newFilters
      }
    })
  }

  const clearColumnFilter = (columnKey) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: []
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      entryDate: [],
      partner: [],
      listingName: [],
      sourceType: [],
      status: []
    })
  }

  const selectAllInColumn = (columnKey) => {
    const allValues = getUniqueValues(columnKey)
    setFilters(prev => ({
      ...prev,
      [columnKey]: allValues
    }))
  }

  const getFilteredValues = useCallback((columnKey, searchValue) => {
    const allValues = uniqueValuesCache[columnKey] || []
    if (!searchValue) return allValues
    
    // Instant filtering without debounce
    return allValues.filter(value => 
      value.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [uniqueValuesCache])

  // Handle clicks outside filter dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeFilterDropdown && dropdownRefs.current[activeFilterDropdown]) {
        const dropdownElement = dropdownRefs.current[activeFilterDropdown]
        if (!dropdownElement.contains(event.target)) {
          setActiveFilterDropdown(null)
          setFilterSearch('')
          setDebouncedFilterSearch('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeFilterDropdown])

  const FilterDropdown = React.memo(({ columnKey }) => {
    const [localFilterSearch, setLocalFilterSearch] = useState('')
    const column = columnConfig.find(col => col.key === columnKey)
    const allValues = uniqueValuesCache[columnKey] || []
    const filteredValues = getFilteredValues(columnKey, localFilterSearch)
    const selectedValues = filters[columnKey] || []
    const isActive = activeFilterDropdown === columnKey
    
    if (!isActive) return null
    
    // Only render filtered options if search is ready
    const displayValues = localFilterSearch ? filteredValues : allValues
    
    return (
      <div 
        ref={(el) => dropdownRefs.current[columnKey] = el}
        className="filter-dropdown"
      >
        <div className="filter-search">
          <input
            type="text"
            placeholder="Search values..."
            value={localFilterSearch}
            onChange={(e) => {
              const value = e.target.value
              setLocalFilterSearch(value)
            }}
            className="filter-search-input"
          />
                  </div>
        
        <div className="filter-actions">
          <button 
            className="filter-action-btn"
            onClick={() => selectAllInColumn(columnKey)}
          >
            Select All
          </button>
          <button 
            className="filter-action-btn"
            onClick={() => clearColumnFilter(columnKey)}
          >
            Clear
          </button>
        </div>
        
        <div className="filter-options">
          {displayValues.map(value => (
            <label key={value} className="filter-option">
              <input
                type="checkbox"
                checked={selectedValues.includes(value)}
                onChange={() => handleFilterChange(columnKey, value)}
              />
              <span className="filter-option-text">{value}</span>
            </label>
          ))}
        </div>
      </div>
    )
  })

  const getFilteredAndSortedSubmissions = () => {
    let filtered = submissions.filter(submission => {
      // Check each column filter
      for (const column of columnConfig) {
        const columnFilters = filters[column.key] || []
        if (columnFilters.length === 0) continue // No filter for this column
        
        let value = submission[column.accessor]
        
        // Special handling for entry date
        if (column.key === 'entryDate' && value) {
          try {
            const dateStr = value.trim()
            const dateOnly = dateStr.split(' ')[0]
            value = new Date(dateOnly).toLocaleDateString('en-CA')
          } catch (error) {
            value = 'Invalid Date'
          }
        }
        
        const displayValue = value || '(Blank)'
        
        if (!columnFilters.includes(displayValue)) {
          return false
        }
      }
      
      return true
    })

    // Apply sorting to filtered results
    const sorted = filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'partnerName':
          aValue = a.partner || '';
          bValue = b.partner || '';
          return aValue.localeCompare(bValue);
        case 'listingName':
          aValue = a.listingName || '';
          bValue = b.listingName || '';
          return aValue.localeCompare(bValue);
        case 'entryDate':
          aValue = parseDate(a.timestamp);
          bValue = parseDate(b.timestamp);
          return aValue - bValue;
        case 'dueDate':
          aValue = parseDate(a.dueDate);
          bValue = parseDate(b.dueDate);
          return aValue - bValue;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          return aValue.localeCompare(bValue);
        default:
          return 0;
      }
    });

    return sortOrder === 'asc' ? sorted : sorted.reverse();
  }
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>My Sourced Deals</h3>
        <button className="refresh-btn" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div className="sort-section">
        <button 
          className="clear-filters-btn"
          onClick={clearAllFilters}
          title="Clear all filters"
        >
          Clear All Filters
        </button>
        <div className="sort-controls">
          <label className="sort-label">Sort By:</label>
          <select 
            className="sort-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button 
            className="sort-order-btn"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columnConfig.map(column => {
                const hasFilter = filters[column.key] && filters[column.key].length > 0
                return (
                  <th key={column.key} className="filterable-header">
                    <div className="header-content">
                      <span className="header-text">{column.label}</span>
                      <button 
                        className={`filter-btn ${hasFilter ? 'active' : ''}`}
                        onClick={() => toggleFilterDropdown(column.key)}
                        title="Filter this column"
                      >
                        ▼
                      </button>
                    </div>
                    {activeFilterDropdown === column.key && (
                      <div className="filter-dropdown-container">
                        <FilterDropdown columnKey={column.key} />
                      </div>
                    )}
                  </th>
                )
              })}
              <th>Link</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredAndSortedSubmissions().length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  No submissions yet
                </td>
              </tr>
            ) : (
              getFilteredAndSortedSubmissions().map((submission) => (
                <React.Fragment key={submission.submissionId}>
                  <tr 
                    className={`clickable-row ${isDueToday(submission.dueDate) && submission.status !== 'Axed' && submission.status !== 'Added in Bitrix' ? 'due-today' : ''}`}
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
                      <span className={`status-badge ${submission.status?.toLowerCase().replace(/\s+/g, '-') || 'no-status'}`}>
                        {submission.status || 'N/A'}
                      </span>
                    </td>
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
                      <td colSpan="7">
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
                              <span className="detail-label">Due Date:</span>
                              <span className="detail-value">{submission.dueDate || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Modified Date:</span>
                              <span className="detail-value">{submission.modifiedDate || 'N/A'}</span>
                            </div>                            
                            <div className="detail-item">
                              <span className="detail-label">Sourced By:</span>
                              <span className="detail-value">{submission.sourcerEmail || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Notes:</span>
                              <span className="detail-value">{submission.notes || 'N/A'}</span>
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
