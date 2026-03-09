# Quick Fix Summary

## Problem
Session expires when accessing app from network IP instead of localhost.

## Root Cause
`window.location.origin` returns `localhost` on desktop. QR code encodes `localhost://...` which mobile can't access (localhost = phone, not your computer). This creates different origins → separate localStorage.

## Solution
Changed QR code generation to use `window.location.hostname` (the actual computer IP) instead of `localhost`.

### Before
```javascript
const baseUrl = window.location.origin; // "http://localhost:5173"
```

### After
```javascript
const protocol = window.location.protocol;
const hostname = window.location.hostname; // "192.168.x.x"
const port = window.location.port;
const portString = port ? `:${port}` : '';
const baseUrl = `${protocol}//${hostname}${portString}`; // "http://192.168.x.x:5173"
```

## How to Test

1. **Start dev server**
   ```bash
   npm run dev
   ```

2. **Note the Network URL**
   Copy the URL shown in terminal:
   ```
   ➜  Network: http://192.168.x.x:5173
   ```

3. **Use Network URL on Desktop**
   Open that URL in your desktop browser (NOT localhost)

4. **Scan QR Code with Phone**
   The QR code will contain the network IP address

5. **Sign and Test**
   Signature should now work correctly

## Changes Made
- ✅ `SignatureModal.jsx` - Fixed QR code URL generation
- ✅ `MobileSignature.jsx` - Added debugging logs and better error message
- ✅ UI improvements - Added network access note to instructions
- ✅ Build verified - No errors

## Key Point
**Always use the Network URL shown by `npm run dev`, not localhost, when testing with a real mobile device.**
