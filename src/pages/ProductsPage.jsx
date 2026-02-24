import React from 'react'
import DataTable from '../components/DataTable'
import { exportToPDF } from '../utils/exportUtils'

function ProductsPage() {
  const columns = [
    { key: 'name', label: 'Product Name' },
    { key: 'barcode', label: 'Barcode' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { 
      key: 'price', 
      label: 'Price',
      render: (value) => `$${parseFloat(value || 0).toFixed(2)}`
    },
    { key: 'stock', label: 'Stock' },
    { 
      key: 'stockStatus', 
      label: 'Stock Status',
      render: (value, row) => {
        const isLow = row.stock <= row.minStock
        return (
          <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
            {isLow ? 'Low Stock' : 'In Stock'}
          </span>
        )
      }
    }
  ]

  const handleDownload = (data) => {
    const exportColumns = columns.filter(col => col.key !== 'stockStatus').map(col => ({
      key: col.key,
      label: col.label,
      render: col.render
    }))
    // Add a simplified stock status for export
    exportColumns.push({
      key: 'stock',
      label: 'Status',
      render: (value, row) => row.stock <= row.minStock ? 'Low Stock' : 'In Stock'
    })
    exportToPDF(data, exportColumns, 'Products Report', 'products.pdf')
  }

  return (
    <div className="page-container">
      <DataTable
        title="Products"
        icon="📦"
        columns={columns}
        apiEndpoint="/api/inventory/products"
        showActions={false}
        onDownload={handleDownload}
      />
    </div>
  )
}

export default ProductsPage
