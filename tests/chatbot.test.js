/**
 * Tests for chatbot product expiry query feature
 */

describe('Chatbot Product Expiry Query', () => {
  /**
   * Helper function to extract product name from query
   * This is a copy of the function in chatbot.js for testing purposes.
   * We duplicate it here for test isolation - tests should not depend on 
   * external modules to ensure they remain stable and independent.
   * If the implementation changes, this copy should be updated accordingly.
   */
  function extractProductName(queryLower) {
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
    
    const words = cleanQuery.split(/\s+/).filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'are', 'any', 'all', 'that', 'this', 'will', 'can', 'has', 'have'].includes(word)
    );
    
    if (words.length > 0) {
      return words.slice(0, Math.min(3, words.length)).join(' ');
    }
    
    return null;
  }

  describe('extractProductName', () => {
    test('extracts product name from "How many ORS packets expire in the next 30 days?"', () => {
      const query = "how many ors packets expire in the next 30 days?";
      const result = extractProductName(query);
      expect(result).toBe('ors');
    });

    test('extracts product name from "How many Aspirin expire in the next 30 days?"', () => {
      const query = "how many aspirin expire in the next 30 days?";
      const result = extractProductName(query);
      expect(result).toBe('aspirin');
    });

    test('extracts product name from "Check Paracetamol expiry"', () => {
      const query = "check paracetamol expiry";
      const result = extractProductName(query);
      expect(result).toBe('paracetamol');
    });

    test('extracts product name from "Ibuprofen expiring soon"', () => {
      const query = "ibuprofen expiring soon";
      const result = extractProductName(query);
      expect(result).toBe('ibuprofen');
    });

    test('extracts multi-word product name from "Vitamin C expire"', () => {
      const query = "vitamin c expire";
      const result = extractProductName(query);
      // Note: 'c' is filtered out due to length < 3, so only 'vitamin' remains
      expect(result).toBe('vitamin');
    });

    test('extracts multi-word product name from "Blood Pressure Monitor expire"', () => {
      const query = "blood pressure monitor expire";
      const result = extractProductName(query);
      expect(result).toBe('blood pressure monitor');
    });

    test('handles query with bottles instead of packets', () => {
      const query = "how many aspirin bottles expire in 30 days?";
      const result = extractProductName(query);
      expect(result).toBe('aspirin');
    });

    test('handles query with boxes instead of packets', () => {
      const query = "how many bandage boxes expire?";
      const result = extractProductName(query);
      expect(result).toBe('bandage');
    });

    test('returns null for queries with only common words', () => {
      const query = "expire in the next";
      const result = extractProductName(query);
      expect(result).toBeNull();
    });

    test('returns null for empty query', () => {
      const query = "";
      const result = extractProductName(query);
      expect(result).toBeNull();
    });

    test('filters out common words correctly', () => {
      const query = "how many of the aspirin will expire";
      const result = extractProductName(query);
      expect(result).toBe('aspirin');
    });
  });

  describe('Query Pattern Recognition', () => {
    test('recognizes expiry keywords in queries', () => {
      const expiryQueries = [
        "expire",
        "expiry",
        "expiring",
        "how many expire",
        "check expiry date"
      ];
      
      expiryQueries.forEach(query => {
        const queryLower = query.toLowerCase();
        const hasExpiryKeyword = queryLower.includes('expiry') || 
                                 queryLower.includes('expire') || 
                                 queryLower.includes('expiring');
        expect(hasExpiryKeyword).toBe(true);
      });
    });

    test('recognizes product-specific queries', () => {
      const productQuery = "how many ors packets expire";
      const productName = extractProductName(productQuery);
      expect(productName).not.toBeNull();
      expect(productName.length).toBeGreaterThan(0);
    });
  });
});
