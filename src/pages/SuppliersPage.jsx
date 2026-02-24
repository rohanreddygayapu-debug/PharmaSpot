import React from 'react'
import DataTable from '../components/DataTable'

function SuppliersPage() {
  const columns = [
    { key: 'supID', label: 'Supplier ID' },
    { key: 'name', label: 'Name' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' }
  ]

  return (
    <div className="page-container">
      <DataTable
        title="Suppliers"
        icon="🚚"
        columns={columns}
        apiEndpoint="/api/suppliers"
        showActions={false}
      />
    </div>
  )
}

export default SuppliersPage
