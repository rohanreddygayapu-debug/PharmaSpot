# Chatbot Product-Specific Expiry Query Feature

## Overview
This feature enhancement allows staff to query the AI chatbot about specific products expiring within a certain timeframe, enabling instant retrieval of expiry information without manual search.

## Feature Description
The chatbot can now understand and respond to product-specific expiry queries such as:
- "How many ORS packets expire in the next 30 days?"
- "How many Aspirin bottles expire in the next 30 days?"
- "Check Paracetamol expiry in 30 days"

## Technical Implementation

### Backend Changes (`backend/api/chatbot.js`)

#### 1. Product Name Extraction Function
A new helper function `extractProductName()` was added to parse natural language queries and extract the product name:
- Removes common phrases like "how many", "expire", "in the next", etc.
- Removes unit descriptors like "packets", "bottles", "boxes"
- Filters out common words
- Returns the meaningful product name from the query

#### 2. Enhanced Expiry Query Handler
The expiry query handler now:
- Detects if a query contains a specific product name
- Queries the database for products matching the name that expire within 30 days
- Returns count of batches and total quantity
- Provides detailed information including:
  - Product name
  - Stock quantity
  - Expiry date
  - Days until expiry
  - SKU/Batch number

#### 3. Response Format
**When product found:**
```json
{
  "answer": "Found 2 batch(es) of \"ORS\" expiring in the next 30 days, with a total quantity of 150 units.",
  "data": [
    {
      "name": "ORS Powder",
      "stock": 100,
      "expiryDate": "2024-01-15",
      "daysUntilExpiry": 15,
      "sku": "ORS-001"
    }
  ],
  "suggestions": ["Show all expiry alerts", "Apply FEFO dispensing", "Check other products"]
}
```

**When product not found:**
```json
{
  "answer": "No batches of \"ORS\" are expiring in the next 30 days.",
  "suggestions": ["Check all expiring products", "Search for other products"]
}
```

### Frontend Changes (`src/components/Chatbot.jsx`)

Enhanced the message display to show:
- Product name
- Stock quantity
- Formatted expiry date (MM/DD/YYYY)
- Days until expiry
- SKU/Batch number

### Quick Actions
Added a new quick action button: **"Product Expiry Check"** with example query: "How many Aspirin expire in the next 30 days?"

## Usage Examples

### Query Patterns Supported:
1. "How many [product] packets expire in the next 30 days?"
2. "How many [product] bottles expire in 30 days?"
3. "Check [product] expiry"
4. "[Product] expiring soon"
5. "Show [product] expiry in next 30 days"

### Example Interactions:

**Staff Query:** "How many ORS packets expire in the next 30 days?"

**Chatbot Response:** "Found 2 batch(es) of "ors" expiring in the next 30 days, with a total quantity of 150 units."
- Displays batch details with expiry dates
- Shows actionable suggestions

**Staff Query:** "How many Vitamin C tablets expire?"

**Chatbot Response:** "Found 1 batch(es) of "vitamin tablets" expiring in the next 30 days, with a total quantity of 50 units."

## Testing

Unit tests were added in `tests/chatbot.test.js` to verify:
- Product name extraction from various query formats
- Handling of different unit descriptors (packets, bottles, boxes)
- Multi-word product names
- Edge cases and error handling

### Test Coverage:
- ✅ Single-word product names (ORS, Aspirin, Ibuprofen)
- ✅ Multi-word product names (Vitamin C, ORS Powder)
- ✅ Various unit descriptors (packets, bottles, boxes, units)
- ✅ Different query patterns
- ✅ Common word filtering
- ✅ Empty and null inputs

## Database Queries

The feature queries the `Product` collection with:
- Product name regex match (case-insensitive)
- Expiry date exists and is not null
- Expiry date is within next 30 days
- Expiry date is not in the past

## Security Considerations

- Uses parameterized queries with MongoDB regex to prevent injection
- Input sanitization through regex pattern matching
- No direct user input in database queries
- Error handling prevents information leakage

## Benefits

1. **Instant Access**: Staff can quickly check specific product expiry without navigating multiple screens
2. **Natural Language**: Uses conversational queries instead of complex filters
3. **Context-Aware**: Automatically calculates days until expiry
4. **Actionable**: Provides relevant suggestions for follow-up actions
5. **Efficient**: Single query retrieves all relevant information

## Future Enhancements

Potential improvements could include:
- Support for date ranges other than 30 days
- Batch-specific queries
- Category-based expiry queries
- Export/print functionality for results
- Email alerts for specific products
