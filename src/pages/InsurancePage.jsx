import React from 'react'
import DataTable from '../components/DataTable'

function InsurancePage() {
  const columns = [
    { key: 'name', label: 'Insurance Name' },
    { key: 'phone', label: 'Phone' },
    { 
      key: 'coPay', 
      label: 'Co-Pay',
      render: (value) => (
        <span className={`badge ${value === 'Yes' ? 'badge-success' : 'badge-secondary'}`}>
          {value}
        </span>
      )
    }
  ]

  return (
    <div className="page-container">
      <DataTable
        title="Insurance Providers"
        icon="🏥"
        columns={columns}
        apiEndpoint="/api/insurance"
        showActions={false}
      />
    </div>
  )
}

export default InsurancePage
