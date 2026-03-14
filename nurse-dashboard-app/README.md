# 🏥 لوحة الممرضة — Nurse Dashboard PWA

A production-ready Progressive Web App for nurse appointment and patient management.
Built with **Vite + TailwindCSS + Firebase**. Installable on Android, iOS, and Desktop. Wrappable as a native app via **Capacitor**.

---

## 📱 Features
- 📅 Appointment management — pending, accepted, manual booking
- 👥 Patient book — registry with full visit history
- 🗓️ Calendar — daily agenda, open/close days
- 📊 Statistics — charts, donuts, visit analytics
- 📝 Notes — quick notes with pin & search
- 🔴 Real-time Firebase sync
- 📲 PWA — installable, offline-capable
- 🌐 Full Arabic RTL UI

---

## 🗂️ Project Structure
```
nurse-dashboard-app/
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service worker
│   └── icons/               # All icon sizes (generated)
├── src/
│   ├── firebase.js          # Firebase modular SDK wrapper
│   ├── main.js              # App entry + PWA install prompt
│   └── styles/main.css      # Tailwind + custom CSS
├── scripts/
│   └── generate-icons.js    # Icon generator (requires sharp)
├── index.html               # App shell
├── vite.config.js           # Vite + PWA (Workbox)
├── tailwind.config.js
├── postcss.config.js
├── capacitor.config.ts      # Android + iOS config
├── firebase.json            # Firebase Hosting
├── vercel.json              # Vercel deployment
└── package.json
```

---

## 🚀 Install & Run

```bash
# Clone & install
git clone https://github.com/YOUR_USERNAME/nurse-dashboard-app.git
cd nurse-dashboard-app
npm install

# Generate icons (install sharp once)
npm install --save-dev sharp
node scripts/generate-icons.js

# Start dev server
npm run dev          # → http://localhost:3000

# Production build
npm run build

# Preview production build
npm run preview
```

---

## 🌐 Deploy

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # public dir = "dist", SPA = yes
npm run build && firebase deploy
```

### Vercel
```bash
npm install -g vercel
npm run build && vercel --prod
```

---

## 📲 PWA Installation

| Platform | Steps |
|----------|-------|
| **Android** | Chrome → tap install banner or menu → "Install app" |
| **iOS** | Safari → Share (📤) → "Add to Home Screen" |
| **Desktop** | Chrome/Edge → ➕ icon in address bar → "Install app" |

---

## 📱 Build Native Apps (Capacitor)

```bash
# First build
npm run build

# Add platforms
npx cap add android
npx cap add ios        # macOS only

# Open in Android Studio / Xcode
npm run cap:android
npm run cap:ios

# After code changes, sync
npm run cap:sync
```

**Android:** Requires Android Studio + JDK 17+
**iOS:** Requires macOS + Xcode 15+ + Apple Developer account

---

## 📤 Push to GitHub

```bash
git init
git add .
git commit -m "🚀 Initial commit — Nurse Dashboard PWA"
git remote add origin https://github.com/YOUR_USERNAME/nurse-dashboard-app.git
git branch -M main
git push -u origin main
```

---

## ⚙️ Configuration

**Change Firebase project** → edit `src/firebase.js` → replace `firebaseConfig`

**Change app name/icon** →
1. Edit `public/icons/icon.svg`
2. Run `node scripts/generate-icons.js`
3. Update `public/manifest.json` name fields
4. Update `capacitor.config.ts` appId/appName

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite 5 |
| CSS | TailwindCSS 3 |
| PWA | vite-plugin-pwa + Workbox |
| Database | Firebase Realtime Database v10 |
| Mobile | Capacitor 6 |
| Deploy | Firebase Hosting / Vercel |

---

© 2026 nawwacode — All rights reserved.
