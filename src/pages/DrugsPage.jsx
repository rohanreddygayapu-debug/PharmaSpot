import React from 'react'
import DataTable from '../components/DataTable'

function DrugsPage() {
  const columns = [
    { key: 'NDC', label: 'NDC' },
    { key: 'brandName', label: 'Brand Name' },
    { key: 'genericName', label: 'Generic Name' },
    { key: 'dosage', label: 'Dosage' },
    { key: 'expDate', label: 'Exp Date' },
    { 
      key: 'purchasePrice', 
      label: 'Purchase Price',
      render: (value) => `$${parseFloat(value || 0).toFixed(2)}`
    },
    { 
      key: 'sellPrice', 
      label: 'Sell Price',
      render: (value) => `$${parseFloat(value || 0).toFixed(2)}`
    },
    { key: 'supID', label: 'Supplier ID' }
  ]

  return (
    <div className="page-container">
      <DataTable
        title="Drugs"
        icon="💊"
        columns={columns}
        apiEndpoint="/api/drugs"
        showActions={false}
      />
    </div>
  )
}

export default DrugsPage
