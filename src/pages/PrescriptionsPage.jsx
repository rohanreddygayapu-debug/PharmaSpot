import React from 'react'
import DataTable from '../components/DataTable'

function PrescriptionsPage() {
  const columns = [
    { key: 'patientID', label: 'Patient ID' },
    { key: 'physID', label: 'Physician ID' },
    { key: 'NDC', label: 'Drug NDC' },
    { key: 'qty', label: 'Quantity' },
    { key: 'days', label: 'Days' },
    { key: 'refills', label: 'Refills' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => {
        const statusClass = value === 'picked up' ? 'badge-success' : 
                           value === 'filled' ? 'badge-info' : 'badge-warning'
        return (
          <span className={`badge ${statusClass}`}>
            {value || 'pending'}
          </span>
        )
      }
    }
  ]

  return (
    <div className="page-container">
      <DataTable
        title="Prescriptions"
        icon="📋"
        columns={columns}
        apiEndpoint="/api/prescriptions"
        showActions={false}
      />
    </div>
  )
}

export default PrescriptionsPage
