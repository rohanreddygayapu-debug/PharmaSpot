import React, { useState, useEffect } from 'react'
import { getApiUrl } from '../utils/config'
import PaymentModal from './PaymentModal'
import './POSView.css'

function POSView() {
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [discount, setDiscount] = useState(0)
  const [showPayment, setShowPayment] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadResults, setUploadResults] = useState(null)

  useEffect(() => {
    // Fetch products from API
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/inventory/products`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id)
    if (existingItem) {
      setCart(cart.map(item =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId))
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item =>
        item._id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    return Math.max(0, subtotal - discount)
  }

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  )

  const handlePaymentClick = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items first.')
      return
    }
    setShowPayment(true)
  }

  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Save transaction
      const response = await fetch(`${getApiUrl()}/transactions/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      })

      if (response.ok) {
        alert('✓ Payment successful! Transaction saved.')
        setCart([])
        setDiscount(0)
        setShowPayment(false)
        fetchProducts() // Refresh products to update stock
      } else {
        throw new Error('Failed to save transaction')
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
      alert('⚠ Transaction failed. Please try again or contact support.')
      // Don't clear the cart so customer can retry
      setShowPayment(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${getApiUrl()}/file-analysis/analyze`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setUploadResults(data.matchedProducts)
        setShowUploadModal(true)
      } else {
        const error = await response.json()
        alert('⚠ Failed to analyze file: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('⚠ Error uploading file. Please try again.')
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = null
    }
  }

  const handleAddUploadedProducts = () => {
    if (!uploadResults) return

    const productsToAdd = uploadResults.filter(item => !item.notFound)
    
    productsToAdd.forEach(product => {
      const existingItem = cart.find(item => item._id === product._id)
      if (existingItem) {
        setCart(cart => cart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + (product.requestedQuantity || 1) }
            : item
        ))
      } else {
        setCart(cart => [...cart, { ...product, quantity: product.requestedQuantity || 1 }])
      }
    })

    setShowUploadModal(false)
    setUploadResults(null)
    alert(`✓ Added ${productsToAdd.length} products to cart!`)
  }

  return (
    <div className="pos-view">
      <div className="pos-container">
        <div className="cart-section">
          <h2>Shopping Cart</h2>
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>🛒 Cart is empty</p>
                <p>Add items to start a transaction</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p className="cart-item-price">${item.price?.toFixed(2)}</p>
                  </div>
                  <div className="cart-item-controls">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item._id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-summary">
            <div className="discount-input">
              <label>Discount:</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                min="0"
                placeholder="0.00"
              />
            </div>
            <div className="total">
              <h3>Total:</h3>
              <h3>${calculateTotal().toFixed(2)}</h3>
            </div>
            <div className="cart-actions">
              <button className="btn-cancel" onClick={() => setCart([])}>
                Cancel
              </button>
              <button className="btn-hold" onClick={() => alert('Hold order feature coming soon')}>
                Hold
              </button>
              <button className="btn-pay" onClick={handlePaymentClick}>
                Pay
              </button>
            </div>
          </div>
        </div>

        <div className="products-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products by name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="upload-section">
              <input
                type="file"
                id="fileUpload"
                accept=".jpg,.jpeg,.png,.xlsx,.xls,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              <label htmlFor="fileUpload" className={`upload-btn ${uploading ? 'uploading' : ''}`}>
                {uploading ? '⏳ Processing...' : '📤 Upload File'}
              </label>
            </div>
          </div>

          <div className="products-grid">
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <p>No products found</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <div
                  key={product._id}
                  className="product-card"
                  onClick={() => addToCart(product)}
                >
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p className="product-price">${product.price?.toFixed(2)}</p>
                    <p className="product-stock">Stock: {product.quantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={calculateTotal()}
        items={cart}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {showUploadModal && uploadResults && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Results</h2>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>✕</button>
            </div>
            <div className="modal-content">
              <p className="results-summary">
                Found {uploadResults.filter(item => !item.notFound).length} matching products
                {uploadResults.filter(item => item.notFound).length > 0 && 
                  ` (${uploadResults.filter(item => item.notFound).length} not found)`}
              </p>
              <div className="results-list">
                {uploadResults.map((item, index) => (
                  <div key={index} className={`result-item ${item.notFound ? 'not-found' : 'found'}`}>
                    <div className="result-info">
                      <h4>{item.name}</h4>
                      {!item.notFound && (
                        <>
                          <p className="result-price">${item.price?.toFixed(2)}</p>
                          <p className="result-stock">Stock: {item.stock || item.quantity}</p>
                          <p className="result-qty">Quantity to add: {item.requestedQuantity || 1}</p>
                        </>
                      )}
                      {item.notFound && (
                        <p className="not-found-msg">⚠️ Product not found in database</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-add" 
                onClick={handleAddUploadedProducts}
                disabled={uploadResults.filter(item => !item.notFound).length === 0}
              >
                Add to Cart ({uploadResults.filter(item => !item.notFound).length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default POSView
