# Rawand Artist — Gaming Store

A full-featured e-commerce store with a customer-facing website and admin panel, powered by Firebase.

## Features

### Customer Website
- Modern dark gaming theme with light/dark mode toggle
- Responsive design (mobile + desktop)
- Product categories with filtering
- Live search with suggestions
- Product detail pages with image slider and zoom
- Featured products and new arrivals sections
- Related products
- Telegram "Buy Now" button
- QR code, share, and copy link for each product
- Lazy-loaded images and smooth animations

### Admin Panel
- Secure Firebase Authentication login
- Dashboard with store statistics
- Add, edit, and delete products
- Upload multiple images with automatic compression
- Category management
- Featured / New arrival toggles
- Stock management

## Quick Start (Demo Mode)

The store runs immediately with sample data — no Firebase setup required.

1. Open `index.html` in your browser (or use a local server)
2. Browse products, search, and view product details
3. Admin panel is at `admin/login.html` (requires Firebase to log in)

### Local Server (recommended)

```bash
# Python
cd Rawand_Artist
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Then visit `http://localhost:8080`

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Add a **Web app** and copy the config

### 2. Configure the Store

Edit `firebase/config.js` with your credentials:

```js
const firebaseConfig = {
  apiKey: "your-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

Edit `assets/js/config.js`:

```js
telegram: "https://t.me/YOUR_USERNAME",
demoMode: false  // Switch off demo data
```

### 3. Enable Firebase Services

| Service | Steps |
|---------|-------|
| **Authentication** | Enable Email/Password → Create your admin user |
| **Firestore** | Create database → Apply security rules (see `admin/settings.html`) |
| **Storage** | Enable → Set rules to allow authenticated writes |

**Storage Rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 4. Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Initial Rawand Artist store"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Rawand_Artist.git
git push -u origin main
```

In your GitHub repo:
1. Go to **Settings → Pages**
2. Source: **Deploy from branch** → `main` → `/ (root)`
3. Your store will be live at `https://YOUR_USERNAME.github.io/Rawand_Artist/`

> Add your GitHub Pages URL to Firebase **Authorized domains** (Authentication → Settings).

## Project Structure

```
Rawand_Artist/
├── index.html              # Homepage
├── products.html           # Product listing
├── product.html            # Product detail
├── search.html             # Search page
├── admin/
│   ├── login.html          # Admin login
│   ├── dashboard.html      # Stats dashboard
│   ├── products.html       # Product management
│   ├── categories.html     # Category management
│   └── settings.html       # Setup guide
├── assets/
│   ├── css/                # Stylesheets
│   ├── js/                 # Frontend + admin scripts
│   ├── images/             # Static images
│   └── icons/              # Icons
├── firebase/
│   └── config.js           # Firebase credentials
└── README.md
```

## Admin Usage

1. Visit `/admin/login.html`
2. Sign in with your Firebase admin account
3. Add categories first, then products
4. Upload images — they are automatically compressed before upload
5. Toggle Featured / New flags as needed
6. Changes appear on the customer site instantly

## Customization

| What | Where |
|------|-------|
| Store name & tagline | `assets/js/config.js` |
| Telegram link | `assets/js/config.js` |
| Colors & theme | `assets/css/main.css` (`:root` variables) |
| Currency | `assets/js/config.js` |

## License

Private project for Rawand Artist. All rights reserved.
