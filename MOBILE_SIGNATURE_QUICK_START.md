# Mobile Signature QR Code Feature - Quick Start Guide

## 🎯 How to Use

### Desktop (Step 1-3)
1. **Open PDF Workspace** and upload your PDF
2. **Click "Sign PDF"** button
3. **Click the "📱 Mobile" tab** in the modal that appears

### Mobile (Step 4-6)
4. **Point your phone camera at the QR code** that appears on desktop
5. **Tap the link** that appears in the notification
6. **Sign on your phone** using your finger or stylus

### Desktop Again (Step 7-8)
7. **Signature appears automatically** on desktop
8. **Place it on the PDF** wherever you want it to appear

---

## 🔄 Technical Flow

```
Desktop Screen
┌─────────────────────────────────┐
│ Sign PDF Modal                  │
├─────────────────────────────────┤
│ [✏️ Draw] [📸 Upload] [📱 Mobile]│
│                                 │
│  ┌──────────────────────────┐   │
│  │   QR CODE IMAGE          │   │
│  │   [████████████████]     │   │
│  │   Scan with your phone   │   │
│  └──────────────────────────┘   │
│                                 │
│  ⏳ Waiting for signature...     │
└─────────────────────────────────┘
           ↓ Scans QR Code ↓
                   
Mobile Screen (New Window)
┌──────────────────────────────┐
│ Sign Document        [X]      │
│ Draw using your finger        │
├──────────────────────────────┤
│                              │
│   ┌──────────────────────┐   │
│   │                      │   │
│   │   [Canvas for sig]   │   │
│   │                      │   │
│   └──────────────────────┘   │
│                              │
│ [Clear] [Cancel] [Save]      │
└──────────────────────────────┘
           ↓ Saves ↓
                   
Desktop (Signature Received)
┌─────────────────────────────────┐
│ Signature received!             │
│ You can now place it on the PDF │
└─────────────────────────────────┘
```

---

## 📱 Device Requirements

### Desktop
- ✅ Any modern browser (Chrome, Safari, Firefox, Edge)
- ✅ Internet connection (optional, works fully offline)

### Mobile
- ✅ Any modern smartphone with camera
- ✅ Built-in QR code scanner (iOS 11+, Android 9+)
- ✅ OR a dedicated QR code scanning app

---

## 🔐 How It Works Behind the Scenes

1. **Session ID Created** - 16-character unique ID generated
2. **QR Code Encoded** - URL with session ID encoded in QR image
3. **Mobile Opens** - Scanning QR code opens signing page on your phone
4. **Signature Captured** - You draw on phone
5. **Sent Back** - Signature stored in browser localStorage
6. **Received on Desktop** - Desktop app listens and gets signature
7. **Cleaned Up** - Session data deleted when done

---

## ⚙️ What Happens with Each Tab

### ✏️ Draw Tab (Desktop Signature)
- Original functionality
- Draw directly on desktop computer
- Great for touchpads/stylus devices

### 📸 Upload Tab (Image Import)
- Original functionality
- Upload a pre-made signature image
- Good if you have a digital signature file

### 📱 Mobile Tab (NEW!)
- Scan QR code with phone
- Sign on your mobile device
- Signature sent back automatically
- Perfect for natural handwriting with touchscreen

---

## 🚀 New Features Added

| Feature | Location | Description |
|---------|----------|-------------|
| QR Code Generation | SignatureModal.jsx | Creates unique QR for each session |
| Mobile Signing Page | MobileSignature.jsx | Touch-friendly signature pad |
| Session Management | useSignatureSession.js | Handles cross-device communication |
| Cross-Device Sync | localStorage events | Signature sent from phone to desktop |
| Automatic Save | SignatureModal.jsx | Signature imported when received |

---

## 💡 Tips & Tricks

1. **Large Signature Area** - Mobile screen is full-height for better control
2. **Portrait Mode** - Works best in portrait orientation on phone
3. **Multiple Signatures** - Each "Sign PDF" creates a new QR code
4. **No Account Needed** - Works without login or cloud sync
5. **Offline Works** - Everything happens locally in your browser

---

## ❓ FAQ

**Q: Does this require a backend server?**
A: No! Everything works using browser localStorage. Completely local.

**Q: Can anyone scan my QR code and sign?**
A: Sessions are unique per modal opening, so someone would need physical access to your screen.

**Q: What if I close the modal before scanning?**
A: Session is cleaned up. Just open "Sign PDF" again to get a new QR code.

**Q: Can I use this offline?**
A: Yes! localStorage is fully offline. No internet needed.

**Q: Does the signature get saved somewhere?**
A: No, it stays in your browser until you export the PDF. It's not uploaded anywhere.

---

## 🛠️ Troubleshooting

### QR Code Won't Scan
- Ensure good lighting
- Move phone closer to screen
- Try a different QR code app

### Mobile Signature Page Won't Load
- Check internet connection
- Try refreshing the page
- Ensure JavaScript is enabled

### Signature Not Appearing on Desktop
- Check if browser allows localStorage
- Try a different browser
- Make sure mobile window/tab is still open when you save

---

## 📚 Technical Notes

- **Session IDs**: 16-character alphanumeric (nanoid)
- **QR Format**: PNG, 300x300px, high error correction
- **Storage**: Browser localStorage (no server needed)
- **Communication**: Storage events + custom events
- **Cleanup**: Automatic when modal closes

---

**🎉 Enjoy signing documents from your phone!**
