# Testing Mobile Signature Feature on Network

## The Problem (Now Fixed)
When accessing the app from different addresses (localhost vs network IP), they're treated as different origins, causing localStorage to be separate.

## The Solution
The QR code now automatically uses the actual hostname/IP address of the computer you're running the dev server on, not `localhost`.

## How to Test on Same Network

### Step 1: Start the Dev Server
```bash
npm run dev
```

Note the output:
```
VITE v7.2.5 ready in xxx ms

➜  Local:   http://localhost:5173
➜  Network: http://192.168.x.x:5173
```

### Step 2: On Desktop - Use the Network URL
Instead of `http://localhost:5173`, go to the network URL shown in the output:
```
http://192.168.x.x:5173
```

(Replace `192.168.x.x` with the actual IP shown in your terminal)

### Step 3: Follow the Signature Flow
1. Navigate to PDF Workspace
2. Upload a PDF
3. Click "Sign PDF"
4. Select the "📱 Mobile" tab
5. A QR code will appear that encodes your network IP (not localhost)

### Step 4: On Your Phone
1. Open your phone camera (iPhone) or QR code scanner app (Android)
2. Point at the QR code
3. Tap the link that appears
4. The mobile signing page should load
5. Sign your signature
6. Click "Save"
7. Return to desktop and see your signature appear

## Why This Works Now

### Before
- Desktop running on: `http://localhost:5173`
- QR code contained: `http://localhost:5173/mobile-sign?session=...`
- Mobile scanning: Could not access `localhost` (refers to the phone, not your computer)
- Result: Session not found

### After
- Desktop running on: `http://192.168.x.x:5173`
- QR code contains: `http://192.168.x.x:5173/mobile-sign?session=...`
- Mobile scanning: Accesses the computer's IP address ✓
- Result: Both share same origin, same localStorage ✓

## Important Notes

### Network Requirements
- Both devices must be on the same WiFi network
- No VPN/proxy should block local network access
- Firewall must allow connections on the dev server port (typically 5173)

### Using Desktop "localhost" with Mobile
If you're running the dev server on desktop and want to use `localhost`:
- ❌ DON'T manually change the QR URL to localhost
- ✅ DO use the Network URL for both desktop and mobile
- The QR code will automatically have the correct network IP

### Debugging
If you still see "Session not found or expired":
1. Check the browser console on mobile (tap F12 if available)
2. Look for logs showing the session ID and origin
3. Ensure both desktop and mobile have same hostname/port
4. Try refreshing both pages
5. Check console on desktop for any errors

## Console Debugging

The mobile page now logs debug info:
```javascript
Session ID: abc123xyz...
Current origin: http://192.168.x.x:5173
Session data found: true/false
```

If `Session data found: false`, then the origins don't match.

## Advanced: Manual Testing

If you want to manually test without QR code:

1. Create a session on desktop:
   - Open browser DevTools
   - Console tab
   - Run: `localStorage.getItem('sig-session-abc123')`
   - If undefined, session hasn't been created yet

2. Manually navigate on mobile:
   - Get the session ID from the QR code (or create one manually)
   - Type in mobile browser: `http://192.168.x.x:5173/mobile-sign?session=YOUR_SESSION_ID`
   - Should load the signing page

## Testing on Same Device (Development)

If you want to test on the same computer (without actual mobile):

1. Open two browser tabs
2. Tab 1: `http://192.168.x.x:5173` (your app)
3. Tab 2: Open DevTools console, manually navigate to mobile signing URL
4. Or simulate mobile: F12 → Device Emulation (but still same origin)

This works because they share the same origin and localStorage.

---

**Key Takeaway**: Always use the Network URL from `npm run dev` output when testing with a real mobile device, not `localhost`.
