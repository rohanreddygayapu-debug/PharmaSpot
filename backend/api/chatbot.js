const app = require("express")();
const Product = require("../models/Product");
const ExpiryAlert = require("../models/ExpiryAlert");
const InventoryForecast = require("../models/InventoryForecast");
const Transaction = require("../models/Transaction");

module.exports = app;

/**
 * Helper function to extract product name from query
 * Handles queries like "How many ORS packets expire in the next 30 days?"
 */
function extractProductName(queryLower) {
    // Pattern to extract product name from various query formats
    // Examples: "how many ORS packets", "ORS expire", "check Aspirin expiry"
    
    // Remove common words and phrases
    const cleanQuery = queryLower
        .replace(/how many/gi, '')
        .replace(/expire[sd]?/gi, '')
        .replace(/expiring/gi, '')
        .replace(/expiry/gi, '')
        .replace(/in the next/gi, '')
        .replace(/within/gi, '')
        .replace(/\d+\s*(day|days|week|weeks|month|months)/gi, '')
        .replace(/packet[s]?/gi, '')
        .replace(/bottle[s]?/gi, '')
        .replace(/box(es)?/gi, '')
        .replace(/unit[s]?/gi, '')
        .replace(/item[s]?/gi, '')
        .replace(/product[s]?/gi, '')
        .replace(/check/gi, '')
        .replace(/show/gi, '')
        .replace(/find/gi, '')
        .replace(/\?/g, '')
        .trim();
    
    // Split by common separators and take the most meaningful part
    const words = cleanQuery.split(/\s+/).filter(word => 
        word.length > 2 && 
        !['the', 'and', 'for', 'are', 'any', 'all', 'that', 'this', 'will', 'can', 'has', 'have'].includes(word)
    );
    
    // Return the first meaningful word(s) as product name
    if (words.length > 0) {
        // If there are multiple words, join first 2-3 words as they might be product name
        return words.slice(0, Math.min(3, words.length)).join(' ');
    }
    
    return null;
}

/**
 * POST endpoint: Process chatbot query
 */
app.post("/query", async function (req, res) {
    try {
        const { query, context } = req.body;
        const queryLower = query.toLowerCase();

        let response = {
            answer: '',
            data: null,
            suggestions: []
        };

        // Stock queries
        if (queryLower.includes('stock') || queryLower.includes('inventory')) {
            if (queryLower.includes('low') || queryLower.includes('shortage')) {
                const lowStock = await Product.find({ 
                    $expr: { $lt: ['$stock', '$minStock'] }
                });
                response.answer = `Found ${lowStock.length} products with low stock.`;
                response.data = lowStock.slice(0, 5);
                response.suggestions = ['Show all low stock items', 'Generate reorder report'];
            } else {
                // Extract product name if possible
                const products = await Product.find({}).limit(10);
                response.answer = `Currently tracking ${products.length} products. What specific product would you like to know about?`;
                response.data = products.map(p => ({ name: p.name, stock: p.stock }));
            }
        }
        // Expiry queries
        else if (queryLower.includes('expiry') || queryLower.includes('expire') || queryLower.includes('expiring')) {
            // Check if query is asking about a specific product
            const productNameMatch = extractProductName(queryLower);
            
            if (productNameMatch) {
                // Query for specific product expiry in next 30 days
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                
                const expiringProducts = await Product.find({
                    name: { $regex: productNameMatch, $options: 'i' },
                    expiryDate: { 
                        $exists: true, 
                        $ne: null,
                        $lte: thirtyDaysFromNow,
                        $gte: new Date()
                    }
                });
                
                if (expiringProducts.length > 0) {
                    const totalQuantity = expiringProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
                    response.answer = `Found ${expiringProducts.length} batch(es) of "${productNameMatch}" expiring in the next 30 days, with a total quantity of ${totalQuantity} units.`;
                    response.data = expiringProducts.map(p => ({
                        name: p.name,
                        stock: p.stock,
                        expiryDate: p.expiryDate,
                        daysUntilExpiry: Math.ceil((new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
                        sku: p.sku
                    }));
                    response.suggestions = ['Show all expiry alerts', 'Apply FEFO dispensing', 'Check other products'];
                } else {
                    response.answer = `No batches of "${productNameMatch}" are expiring in the next 30 days.`;
                    response.suggestions = ['Check all expiring products', 'Search for other products'];
                }
            } else {
                // General expiry query
                const criticalAlerts = await ExpiryAlert.find({ 
                    status: 'active',
                    alertLevel: 'critical'
                }).limit(5);
                
                response.answer = `Found ${criticalAlerts.length} products expiring soon (within 30 days).`;
                response.data = criticalAlerts;
                response.suggestions = ['Show all expiry alerts', 'Apply FEFO dispensing'];
            }
        }
        // Sales queries
        else if (queryLower.includes('sales') || queryLower.includes('revenue') || queryLower.includes('profit')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todaysTransactions = await Transaction.find({
                createdAt: { $gte: today },
                status: 'completed'
            });

            let totalRevenue = 0;
            let totalProfit = 0;
            todaysTransactions.forEach(t => {
                totalRevenue += t.total || 0;
                // Calculate profit from items
                t.items.forEach(item => {
                    totalProfit += (item.price - (item.cost || 0)) * item.quantity;
                });
            });

            response.answer = `Today's sales: ${todaysTransactions.length} transactions, Revenue: $${totalRevenue.toFixed(2)}, Profit: $${totalProfit.toFixed(2)}`;
            response.data = {
                transactions: todaysTransactions.length,
                revenue: totalRevenue,
                profit: totalProfit
            };
            response.suggestions = ['View detailed report', 'View best-selling products'];
        }
        // Forecast queries
        else if (queryLower.includes('forecast') || queryLower.includes('demand') || queryLower.includes('predict')) {
            const forecasts = await InventoryForecast.find({}).sort({ demandForecast: -1 }).limit(5);
            response.answer = `Here are the top 5 demand forecasts for the week.`;
            response.data = forecasts;
            response.suggestions = ['Generate new forecast', 'View shortage predictions'];
        }
        // Search for specific product
        else if (queryLower.includes('find') || queryLower.includes('search')) {
            const searchTerm = query.replace(/(find|search|for|product)/gi, '').trim();
            if (searchTerm.length > 2) {
                const products = await Product.find({
                    name: { $regex: searchTerm, $options: 'i' }
                }).limit(5);
                
                response.answer = `Found ${products.length} products matching "${searchTerm}".`;
                response.data = products;
            } else {
                response.answer = 'Please provide a product name to search for.';
            }
        }
        // Help/Guide
        else if (queryLower.includes('help') || queryLower.includes('guide') || queryLower.includes('how')) {
            response.answer = 'I can help you with: checking stock levels, expiry alerts (including product-specific queries like "How many Aspirin expire in 30 days?"), sales reports, demand forecasts, and product searches. What would you like to know?';
            response.suggestions = [
                'Show low stock items',
                'Check expiring products',
                'How many Aspirin expire in 30 days?',
                'Today\'s sales report',
                'Demand forecast'
            ];
        }
        // Default response
        else {
            response.answer = 'I can assist you with inventory management, expiry tracking, sales reports, and forecasting. Try asking about stock levels, expiry dates, or sales performance.';
            response.suggestions = [
                'Check stock levels',
                'Show expiring products',
                'Today\'s sales',
                'Demand forecast'
            ];
        }

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            error: error.message,
            answer: 'Sorry, I encountered an error processing your request.'
        });
    }
});

/**
 * GET endpoint: Get chatbot conversation history
 */
app.get("/history", async function (req, res) {
    try {
        // This would typically fetch from a conversation history collection
        res.json({ message: 'History feature coming soon' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET endpoint: Get quick actions for chatbot
 */
app.get("/quick-actions", async function (req, res) {
    try {
        const actions = [
            { label: 'Check Low Stock', query: 'Show low stock items' },
            { label: 'Expiring Soon', query: 'Show products expiring soon' },
            { label: 'Product Expiry Check', query: 'How many Aspirin expire in the next 30 days?' },
            { label: 'Today\'s Sales', query: 'Show today\'s sales report' },
            { label: 'Demand Forecast', query: 'Show demand forecast' },
            { label: 'Search Product', query: 'Find product' }
        ];
        res.json(actions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
