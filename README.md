# Midnight Monk
Version 1.0
# 🌙 Midnight Monk — Late Night Food Delivery App

A full-stack food delivery web app built for late-night cravings.
Built with **React + Vite** (frontend) and **Flask + MongoDB** (backend).

---

## 🚀 Features 

- 👤 **User** — Browse kitchens, order food, track order status live
- 🍳 **Kitchen Admin** — Manage menu, update order statuses, view analytics
- 👑 **Master Admin** — Full control over kitchens, admins, orders, support tickets
- 🌙 **Dark / Light mode** — Global theme toggle, remembers your preference
- 📱 **Fully responsive** — Desktop on laptop, mobile layout on phone
- 🔐 **JWT Authentication** — Separate auth for users, admins, master admin
- 📦 **Real order tracking** — Live status progress bar (Placed → Preparing → Out for Delivery → Delivered)
- 🎫 **OTP system** — Each order gets a unique OTP for delivery verification

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, React Router v6   |
| Backend    | Python 3, Flask, Flask-CORS       |
| Database   | MongoDB Atlas                     |
| Auth       | JWT (PyJWT), SHA256 password hash |
| Styling    | Inline styles + CSS (responsive)  |

---

## 📋 Prerequisites — Install These First

### 1. Node.js (for the frontend)
- Download from: https://nodejs.org
- Choose the **LTS version** (e.g. 20.x)
- After installing, verify:
```bash
node --version
npm --version
```

### 2. Python 3.10+ (for the backend)
- Download from: https://python.org/downloads
- ✅ During install on Windows, check **"Add Python to PATH"**
- After installing, verify:
```bash
python3 --version
# On Windows:
python --version
```

### 3. Git
- Download from: https://git-scm.com
- After installing, verify:
```bash
git --version
```

---

## ⚙️ Setup Instructions

### Step 1 — Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/midnight-monk.git
cd midnight-monk
```

---

### Step 2 — Set up the Backend

```bash
cd backend
```

**Create a virtual environment:**
```bash
# Mac / Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

**Install all dependencies:**
```bash
pip install -r requirements.txt
```

**Create your `.env` file** inside the `backend/` folder:
```bash
# Create a file called .env with this content:
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@midnightmonk.w63vctf.mongodb.net/
JWT_SECRET=any_random_secret_string_here
PORT=8000
```

> ⚠️ Ask the project owner for the actual `MONGO_URI` and `JWT_SECRET` values.
> Do NOT commit this file to GitHub.

**Seed the database (first time only):**
```bash
python3 seed.py
```

**Start the backend server:**
```bash
python3 app.py
```

You should see:
```
* Running on http://0.0.0.0:8000
```

---

### Step 3 — Set up the Frontend

Open a **new terminal window** and:

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

### Step 4 — Open the App

Open your browser and go to:
```
http://localhost:5173
```

---

## 🔑 Default Login Credentials

### User Login
> Register a new account from the Register page with your name and mobile number.

### Kitchen Admin Login
| Username | Password | Kitchen       |
|----------|----------|---------------|
| admin1   | 1234     | Night Bites   |
| admin2   | 1234     | Midnight Meals|

Go to: `http://localhost:5173/login/admin`

### Master Admin Login
| Username | Password |
|----------|----------|
| master   | master123|

Go to: `http://localhost:5173/login/master`

---

## 📁 Project Structure

```
midnight-monk/
├── backend/
│   ├── app.py                  # Flask app entry point
│   ├── config.py               # Config (reads from .env)
│   ├── requirements.txt        # Python dependencies
│   ├── seed.py                 # Database seeder
│   ├── database/
│   │   └── db.py               # MongoDB connection
│   ├── models/
│   │   ├── user_model.py
│   │   ├── kitchen_model.py
│   │   ├── menu_model.py
│   │   └── order_model.py
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── kitchen_routes.py
│   │   ├── menu_routes.py
│   │   ├── order_routes.py
│   │   └── admin_routes.py
│   └── utils/
│       └── helpers.py
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx            # App entry + providers
│       ├── App.jsx             # All routes
│       ├── services/
│       │   └── api.js          # All API calls
│       ├── context/
│       │   ├── ThemeContext.jsx
│       │   ├── UserAuthContext.jsx
│       │   ├── AdminAuthContext.jsx
│       │   ├── MasterAuthContext.jsx
│       │   ├── CartContext.jsx
│       │   ├── OrderContext.jsx
│       │   └── SupportContext.jsx
│       ├── components/
│       │   └── Navbar.jsx
│       ├── pages/
│       │   ├── Landing.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Kitchens.jsx
│       │   ├── Menu.jsx
│       │   ├── Cart.jsx
│       │   ├── Checkout.jsx
│       │   ├── OrderSuccess.jsx
│       │   ├── Orders.jsx
│       │   ├── AdminLogin.jsx
│       │   ├── AdminDashboard.jsx
│       │   ├── AdminMenu.jsx
│       │   ├── AdminOrders.jsx
│       │   ├── AdminAnalytics.jsx
│       │   ├── MasterAdminLogin.jsx
│       │   ├── MasterAdminDashboard.jsx
│       │   ├── MasterKitchens.jsx
│       │   ├── MasterOrders.jsx
│       │   ├── MasterAdminAdmins.jsx
│       │   ├── MasterSupport.jsx
│       │   └── MasterAnalytics.jsx
│       └── styles/
│           ├── global.css
│           └── responsive.css
│
└── README.md
```

---

## 🌐 Running on Mobile (Same WiFi)

To test on your phone while running locally:

1. Find your laptop's local IP:
   ```bash
   # Mac / Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```
   Look for something like `192.168.1.x`

2. On your phone (same WiFi), open:
   ```
   http://192.168.1.x:5173
   ```

---

## ❓ Common Issues

**Backend won't start — `ModuleNotFoundError`**
→ Make sure your venv is activated before running `python3 app.py`

**Frontend can't connect to backend — CORS error**
→ Make sure backend is running on port `8000`, not `5000`

**`npm install` fails**
→ Delete `node_modules/` folder and run `npm install` again

**MongoDB connection error**
→ Check your `MONGO_URI` in `.env`. Make sure your IP is whitelisted in MongoDB Atlas (Network Access → Add `0.0.0.0/0` for development)

---

## 👨‍💻 Built By

**[SHRADDHA JAIN & TEAM]**

---

## 📄 License

This project is for educational purposes.
