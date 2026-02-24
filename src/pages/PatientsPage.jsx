import React from 'react'
import DataTable from '../components/DataTable'
import { exportToPDF } from '../utils/exportUtils'

function PatientsPage() {
  const columns = [
    { key: 'patientID', label: 'Patient ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'birthdate', label: 'Birth Date' },
    { key: 'gender', label: 'Gender' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    { key: 'insurance', label: 'Insurance' }
  ]

  const handleDownload = (data) => {
    exportToPDF(data, columns, 'Patients Report', 'patients.pdf')
  }

  return (
    <div className="page-container">
      <DataTable
        title="Patients"
        icon="🧑‍⚕️"
        columns={columns}
        apiEndpoint="/api/patients"
        showActions={false}
        onDownload={handleDownload}
      />
    </div>
  )
}

export default PatientsPage
