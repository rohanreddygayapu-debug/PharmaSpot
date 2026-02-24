import React, { useState, useEffect, useCallback } from 'react'
import './DataTable.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function DataTable({ 
  title, 
  columns, 
  apiEndpoint, 
  icon = '📊',
  showActions = true,
  onEdit,
  onDelete,
  onDownload
}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}${apiEndpoint}`)
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiEndpoint])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredData = data.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return columns.some(col => {
      const value = item[col.key]
      return value && value.toString().toLowerCase().includes(searchLower)
    })
  })

  if (loading) {
    return (
      <div className="data-table-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="data-table-container">
        <div className="error-message">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="data-table-container">
      <div className="data-table-header">
        <div className="table-title">
          <span className="table-icon">{icon}</span>
          <h2>{title}</h2>
        </div>
        <div className="table-actions">
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {onDownload && (
            <button className="btn btn-primary" onClick={() => onDownload(data)}>
              📥 Download
            </button>
          )}
          <button className="btn btn-primary" onClick={fetchData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="data-table-stats">
        <span className="stat-badge">
          Total Records: <strong>{data.length}</strong>
        </span>
        {searchTerm && (
          <span className="stat-badge">
            Filtered: <strong>{filteredData.length}</strong>
          </span>
        )}
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (showActions ? 1 : 0)} className="no-data">
                  No records found
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <tr key={row._id || `row-${index}-${JSON.stringify(row).substring(0, 20)}`}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                    </td>
                  ))}
                  {showActions && (
                    <td className="actions-cell">
                      {onEdit && (
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => onEdit(row)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => onDelete(row)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable
