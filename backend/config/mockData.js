// Mock data for when MongoDB is not available
const fs = require('fs');
const path = require('path');

function parseCSV(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map((line, index) => {
            const values = line.split(',');
            const obj = { _id: `mock_${index}` };
            headers.forEach((header, i) => {
                obj[header] = values[i] ? values[i].trim() : '';
            });
            return obj;
        });
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

const datasetsDir = path.join(__dirname, '../datasets');

const mockData = {
    doctors: parseCSV(path.join(datasetsDir, 'DOCTOR1(1).csv')),
    patients: parseCSV(path.join(datasetsDir, 'PATIENT1(1).csv')),
    drugs: parseCSV(path.join(datasetsDir, 'DRUGS.csv')),
    insurance: parseCSV(path.join(datasetsDir, 'INSURANCE.csv')),
    prescriptions: parseCSV(path.join(datasetsDir, 'PRESCRIPTIONS.csv')),
    suppliers: parseCSV(path.join(datasetsDir, 'SUPPLIER.csv')),
    products: [
        { _id: 'prod1', name: 'Aspirin', barcode: '12345', sku: 'ASP001', category: 'Pain Relief', price: 9.99, cost: 5.00, stock: 100, quantity: 100, minStock: 20 },
        { _id: 'prod2', name: 'Ibuprofen', barcode: '12346', sku: 'IBU001', category: 'Pain Relief', price: 12.99, cost: 7.00, stock: 75, quantity: 75, minStock: 15 },
        { _id: 'prod3', name: 'Vitamin C', barcode: '12347', sku: 'VIT001', category: 'Supplements', price: 15.99, cost: 8.00, stock: 50, quantity: 50, minStock: 10 },
    ],
    customers: [
        { _id: 'cust1', name: 'John Doe', email: 'john@example.com', phone: '555-0100', address: '123 Main St' },
        { _id: 'cust2', name: 'Jane Smith', email: 'jane@example.com', phone: '555-0101', address: '456 Oak Ave' },
    ]
};

module.exports = mockData;
