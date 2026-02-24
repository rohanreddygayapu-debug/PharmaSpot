import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Export data to PDF
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column definitions with key and label
 * @param {string} title - Title of the document
 * @param {string} filename - Filename for the downloaded PDF
 */
export const exportToPDF = (data, columns, title, filename = 'export.pdf') => {
  try {
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text(title, 14, 20)
    
    // Add timestamp
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)
    
    // Add summary
    doc.text(`Total Records: ${data.length}`, 14, 36)
    
    // Prepare table headers
    const headers = columns.map(col => col.label)
    
    // Prepare table data
    const rows = data.map(row => {
      return columns.map(col => {
        const value = row[col.key]
        // Handle different data types
        if (value === null || value === undefined) return '-'
        if (col.render) {
          // If there's a custom render function, use it
          const rendered = col.render(value, row)
          // For PDF export, extract plain text from rendered content
          if (typeof rendered === 'string') {
            // Create a temporary DOM element to safely extract text content
            if (typeof document !== 'undefined') {
              const temp = document.createElement('div')
              temp.innerHTML = rendered
              return temp.textContent || temp.innerText || ''
            }
            // Fallback: simple tag stripping 
            // Note: This is safe for PDF text extraction (jsPDF), not for HTML rendering
            // The output is only used in PDF text content, never rendered as HTML
            let text = rendered
            // Remove all tags iteratively to handle nested tags
            while (/<[^>]+>/.test(text)) {
              text = text.replace(/<[^>]+>/g, '')
            }
            return text
          }
          return String(value)
        }
        // Format dates
        if (value instanceof Date) {
          return value.toLocaleDateString()
        }
        // Check if string looks like a date (ISO format or common date patterns)
        if (typeof value === 'string' && (col.label && (col.label.toLowerCase().includes('date') || col.label.toLowerCase().includes('time')))) {
          try {
            const parsed = new Date(value)
            if (!isNaN(parsed.getTime())) {
              return parsed.toLocaleDateString()
            }
          } catch {
            // Not a valid date, continue
          }
        }
        // Format numbers (only add decimals for prices/money values)
        if (typeof value === 'number') {
          // Check if column label suggests this is a monetary value
          const isMonetary = col.label && (col.label.toLowerCase().includes('price') || col.label.toLowerCase().includes('cost') || col.label.toLowerCase().includes('total') || col.label.toLowerCase().includes('revenue') || col.label.toLowerCase().includes('profit'))
          return isMonetary ? value.toFixed(2) : String(value)
        }
        return String(value)
      })
    })
    
    // Add table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 42,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { top: 42 },
    })
    
    // Save the PDF
    doc.save(filename)
    return true
  } catch (error) {
    console.error('Error generating PDF:', error)
    return false
  }
}

/**
 * Export table data to PDF with custom formatting
 * @param {Array} data - Array of data objects
 * @param {Object} config - Configuration object
 */
export const exportTableToPDF = (data, config) => {
  const {
    columns,
    title = 'Export',
    filename = 'export.pdf',
    includeStats = false,
    stats = {}
  } = config
  
  try {
    const doc = new jsPDF()
    let yPosition = 20
    
    // Add title
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text(title, 14, yPosition)
    yPosition += 10
    
    // Add timestamp
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, yPosition)
    yPosition += 6
    
    // Add stats if provided
    if (includeStats && stats) {
      Object.keys(stats).forEach(key => {
        doc.text(`${key}: ${stats[key]}`, 14, yPosition)
        yPosition += 5
      })
      yPosition += 5
    }
    
    // Prepare table
    const headers = columns.map(col => col.label)
    const rows = data.map(row => {
      return columns.map(col => {
        const value = row[col.key]
        if (value === null || value === undefined) return '-'
        if (col.exportFormat) return col.exportFormat(value, row)
        if (col.render && typeof col.render === 'function') {
          const rendered = col.render(value, row)
          // For PDF export, extract plain text from rendered content
          if (typeof rendered === 'string') {
            // Create a temporary DOM element to safely extract text content
            if (typeof document !== 'undefined') {
              const temp = document.createElement('div')
              temp.innerHTML = rendered
              return temp.textContent || temp.innerText || ''
            }
            // Fallback: simple tag stripping 
            // Note: This is safe for PDF text extraction (jsPDF), not for HTML rendering
            // The output is only used in PDF text content, never rendered as HTML
            let text = rendered
            // Remove all tags iteratively to handle nested tags
            while (/<[^>]+>/.test(text)) {
              text = text.replace(/<[^>]+>/g, '')
            }
            return text
          }
          return String(value)
        }
        return String(value)
      })
    })
    
    // Add table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    })
    
    // Save the PDF
    doc.save(filename)
    return true
  } catch (error) {
    console.error('Error generating PDF:', error)
    return false
  }
}
