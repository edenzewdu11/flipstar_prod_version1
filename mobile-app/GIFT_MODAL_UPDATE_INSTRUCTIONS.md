# Gift Modal Update Instructions

## Summary
The new `TelebirrGiftModal` component has been created with the telebirr payment design. You need to replace the old gift modals in both HomeScreen.js and ReelsScreen.js with this new component.

## Files Already Updated
✅ `src/screens/feed/ReelsScreen.js` - Already using TelebirrGiftModal
✅ `src/components/gifts/TelebirrGiftModal.js` - New component created
✅ `src/services/TelebirrGiftService.js` - Service layer created

## File That Still Needs Update
❌ `src/screens/feed/HomeScreen.js` - Still using old gift modal

## Steps to Complete the Update

### 1. Add Import to HomeScreen.js
Add this line after the other imports (around line 20):
```javascript
import TelebirrGiftModal from '../../components/gifts/TelebirrGiftModal';
```

### 2. Update State Variables in HomeScreen.js
Find these lines (around line 387-424) and replace with:
```javascript
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftRecipientUser, setGiftRecipientUser] = useState(null);
```

Remove these unused state variables:
- `giftRecipient`
- `giftMessage`
- `sendingGift`
- `giftSent`
- `giftError`
- `userCoins`
- `gifts`
- `giftsSentToday`
- `dailyGiftLimit`
- `selectedGift`
- `giftQuantity`
- `selectedCategory`

### 3. Update openGiftModal Function
Find the `openGiftModal` function (around line 1179) and replace with:
```javascript
  const openGiftModal = (postOrUser) => {
    const isPost = !!postOrUser.id && !!postOrUser.user;
    const postUser = isPost ? postOrUser.user : postOrUser;
    setGiftRecipientUser(postUser);
    setShowGiftModal(true);
  };

  const handleGiftSent = (giftData) => {
    console.log('Gift sent successfully:', giftData);
    Alert.alert(
      'Gift Sent! 🎉',
      `Your ${giftData.gift.name} gift has been delivered to @${giftData.recipient}`,
      [{ text: 'OK' }]
    );
  };
```

### 4. Remove Old Gift Functions
Delete these functions from HomeScreen.js:
- `loadUserCoins` (around line 566)
- `sendGift` (around line 1191)
- Any `useEffect` hooks related to loading gifts

### 5. Replace Gift Modal JSX
Find the old gift modal JSX (around line 2290-2420) and replace with:
```javascript
      {/* Telebirr Gift Modal */}
      <TelebirrGiftModal
        visible={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        recipientUsername={giftRecipientUser?.username || 'User'}
        onGiftSent={handleGiftSent}
      />
```

### 6. Clean Up Styles
Remove these unused styles from the StyleSheet at the bottom:
- `giftSheet`
- `coinBalance`
- `coinLabel`
- `giftLimitLabel`
- `sendButton`
- `sendButtonText`
- `categoryFilter`
- `categoryButton`
- `categoryButtonActive`
- `categoryButtonText`
- `categoryButtonTextActive`
- `giftGrid`
- `giftItem`
- `giftItemActive`
- `giftEmoji`
- `giftCoinValue`
- `selectedGiftContainer`
- `selectedGiftName`
- `quantitySelector`
- `quantityButton`
- `quantityButtonText`
- `quantityValue`
- `fieldLabel`
- `input`
- `errorText`

## Verification
After making these changes:
1. Run the app
2. Open a post and click the gift button
3. You should see the new telebirr-style gift modal
4. The modal should show:
   - Gift catalog with categories
   - Rarity tiers (COMMON, RARE, EPIC, LEGENDARY)
   - Payment flow states
   - Telebirr branding

## If You See Errors
- Make sure `expo-linear-gradient` is installed: `npm install expo-linear-gradient`
- Check that all imports are correct
- Verify the component path is correct

## Backend Integration
Once the backend engineer implements the telebirr API endpoints, update:
1. Uncomment the API calls in `TelebirrGiftModal.js`
2. Replace the simulated payment flow with real API calls
3. Test the full payment flow

---

**Note**: The disk was full when trying to make these final changes automatically. Please follow these manual steps to complete the integration.
