const mongoose = require('mongoose');

const inventoryForecastSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    demandForecast: {
        type: Number,
        default: 0
    },
    recommendedStock: {
        type: Number,
        default: 0
    },
    forecastPeriod: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
    },
    confidence: {
        type: Number,
        default: 0
    },
    trendAnalysis: {
        type: String
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

inventoryForecastSchema.index({ productId: 1 });
inventoryForecastSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('InventoryForecast', inventoryForecastSchema);
