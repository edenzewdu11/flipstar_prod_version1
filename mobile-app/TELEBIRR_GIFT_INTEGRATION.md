# Telebirr Gift Payment Integration

## Overview
This document describes the implementation of the telebirr payment integration for the gift-sending feature in FlipStar mobile app.

## Features Implemented

### 1. **Modern Gift Modal UI**
- **File**: `src/components/gifts/TelebirrGiftModal.js`
- Gift catalog with rarity tiers (COMMON, RARE, EPIC, LEGENDARY)
- Category filtering (All, Flowers, Hearts, Animals, Luxury)
- Beautiful card-based gift selection
- Real-time payment status tracking
- Animated loading states

### 2. **Payment Flow States**
1. **Selecting** - User browses and selects gifts
2. **Waiting** - User approves payment on their phone via telebirr PIN
3. **Success** - Gift delivered successfully
4. **Cancelled** - Payment was cancelled by user
5. **Error** - Payment failed (with retry option)

### 3. **Service Layer**
- **File**: `src/services/TelebirrGiftService.js`
- Handles all telebirr payment API calls
- Payment status polling
- Transaction reference generation
- Gift catalog management

## Backend API Endpoints Required

Your backend engineer needs to implement these endpoints:

### 1. Initiate Gift Payment
```
POST /api/telebirr/gift-payment/
Content-Type: application/json

Request Body:
{
  "gift_id": 1,
  "recipient_username": "johndoe",
  "amount_etb": 10.00,
  "reference": "GFT5X8YZ9ABC"
}

Response (200 OK):
{
  "payment_id": "telebir_12345",
  "status": "pending",
  "telebirr_url": "https://telebirr.et/payment/...",
  "amount_etb": 10.00,
  "expires_at": "2024-01-15T10:30:00Z"
}
```

### 2. Check Payment Status
```
GET /api/telebirr/payment-status/{reference}/

Response (200 OK):
{
  "status": "approved",  // pending | approved | completed | cancelled | failed
  "payment_id": "telebirr_12345",
  "reference": "GFT5X8YZ9ABC",
  "updated_at": "2024-01-15T10:25:00Z"
}
```

### 3. Cancel Payment
```
POST /api/telebirr/cancel-payment/
Content-Type: application/json

Request Body:
{
  "reference": "GFT5X8YZ9ABC"
}

Response (200 OK):
{
  "status": "cancelled",
  "message": "Payment cancelled successfully"
}
```

### 4. Get Gift Catalog
```
GET /api/gifts/catalog/

Response (200 OK):
{
  "gifts": [
    {
      "id": 1,
      "name": "Rose",
      "icon": "🌹",
      "price_coins": 100,
      "rarity": "COMMON",
      "category": "flowers",
      "color": "#E91E63"
    },
    {
      "id": 2,
      "name": "Heart",
      "icon": "❤️",
      "price_coins": 200,
      "rarity": "COMMON",
      "category": "hearts",
      "color": "#F44336"
    }
    // ... more gifts
  ]
}
```

### 5. Payment History
```
GET /api/telebirr/payment-history/?limit=20&offset=0

Response (200 OK):
{
  "payments": [
    {
      "payment_id": "telebirr_12345",
      "reference": "GFT5X8YZ9ABC",
      "gift_name": "Rose",
      "recipient_username": "johndoe",
      "amount_etb": 10.00,
      "status": "completed",
      "created_at": "2024-01-15T10:20:00Z",
      "completed_at": "2024-01-15T10:25:00Z"
    }
  ],
  "total": 45
}
```

## Database Schema Recommendations

### TelebirrPayment Table
```sql
CREATE TABLE telebirr_payments (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    payment_id VARCHAR(100),
    user_id BIGINT REFERENCES users(id),
    gift_id BIGINT REFERENCES gifts(id),
    recipient_id BIGINT REFERENCES users(id),
    amount_etb DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    telebirr_url TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_telebirr_payment_reference ON telebirr_payments(reference);
CREATE INDEX idx_telebirr_payment_user ON telebirr_payments(user_id);
CREATE INDEX idx_telebirr_payment_status ON telebirr_payments(status);
```

### Gift Table (if not exists)
```sql
CREATE TABLE gifts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10),
    price_coins INTEGER NOT NULL,
    rarity VARCHAR(20) DEFAULT 'COMMON',
    category VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Payment Status Flow

```
pending → approved → completed
                  ↓
              cancelled
                  ↓
               failed
```

1. **pending**: Payment initiated, waiting for user approval on telebirr app
2. **approved**: User approved payment with PIN
3. **completed**: Payment processed, gift delivered to recipient
4. **cancelled**: User cancelled payment
5. **failed**: Payment processing failed (insufficient balance, timeout, etc.)

## Security Considerations

### 1. Transaction Reference Format
- Format: `GFT<timestamp><random>`
- Example: `GFT5X8YZ9ABC123`
- Must be unique for each transaction
- Used for idempotency

### 2. Payment Expiry
- Set expiry time (recommended: 5-10 minutes)
- Auto-cancel expired payments
- Clean up pending transactions

### 3. Validation
- Validate gift exists and is active
- Verify recipient user exists
- Check user has sufficient coins (if applicable)
- Prevent duplicate payments with same reference

### 4. Rate Limiting
- Limit payment attempts per user (e.g., 10/hour)
- Prevent spam/abuse

## Testing the Integration

### 1. Test Payment Flow
```javascript
import TelebirrGiftService from './src/services/TelebirrGiftService';

// Generate reference
const reference = TelebirrGiftService.generateReference();
console.log('Reference:', reference);

// Initiate payment
const result = await TelebirrGiftService.initiateGiftPayment(
  1, // gift_id
  'johndoe', // recipient
  10.00, // amount in ETB
  reference
);

console.log('Payment initiated:', result);

// Start polling for status
const controller = TelebirrGiftService.startPaymentPolling(
  reference,
  (status) => {
    console.log('Status update:', status);
  }
);

// Stop polling when needed
// controller.stop();
```

### 2. Test Modal
```javascript
import TelebirrGiftModal from './src/components/gifts/TelebirrGiftModal';

<TelebirrGiftModal
  visible={true}
  onClose={() => console.log('Modal closed')}
  recipientUsername="johndoe"
  onGiftSent={(data) => console.log('Gift sent:', data)}
/>
```

## Conversion Rate
- **1 coin = 0.01 ETB** (configurable)
- Example: 100 coins gift = 1.00 ETB payment

## Localization Support
All text strings are ready for localization. Key strings:
- "Send a gift"
- "Paid securely with telebirr"
- "Waiting for telebirr"
- "Payment requested"
- "Approve with your telebirr PIN"
- "Gift delivered"
- "Payment cancelled"

## Error Handling

### Common Error Scenarios
1. **Insufficient Balance**: Show clear message with option to add funds
2. **Network Error**: Retry mechanism with exponential backoff
3. **Timeout**: Clear status with retry option
4. **Invalid Gift**: Graceful fallback
5. **Recipient Not Found**: Validation before payment

## Performance Optimizations

1. **Gift Catalog Caching**: Cache gifts locally for 1 hour
2. **Payment Polling**: Adaptive interval (3s → 5s → 10s)
3. **Image Optimization**: Use vector icons where possible
4. **Lazy Loading**: Load gift categories on demand

## Monitoring & Analytics

Track these metrics:
- Payment initiation rate
- Payment completion rate
- Average approval time
- Cancellation rate
- Most popular gifts
- Revenue per gift category

## Support & Troubleshooting

### User can't see telebirr prompt
- Verify telebirr app is installed
- Check phone number is linked to telebirr
- Verify network connectivity

### Payment stuck in "pending"
- Auto-expire after 10 minutes
- Allow manual cancellation
- Provide status check option

### Double-charging prevention
- Use idempotent transaction references
- Check payment status before retry
- Implement transaction logs

## Next Steps for Backend Engineer

1. ✅ Review API endpoint specifications
2. ✅ Set up database tables
3. ✅ Implement telebirr SDK integration
4. ✅ Add payment status webhooks (if telebirr supports)
5. ✅ Set up payment expiry cron job
6. ✅ Add transaction logging
7. ✅ Implement rate limiting
8. ✅ Add admin panel for payment monitoring
9. ✅ Test with telebirr sandbox environment
10. ✅ Deploy to production with monitoring

## Contact & Questions

For questions about the frontend implementation, contact the mobile team.
For backend API specifications, refer to this document.

---

**Last Updated**: January 2024
**Version**: 1.0.0
