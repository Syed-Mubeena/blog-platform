# InkSpace — Blog Platform with Comments

A full-stack blogging platform where users can create posts and engage through comments.

## ✨ Features
- User registration, login, and authentication (JWT)
- Create, edit, delete blog posts (author-only permissions)
- Comment section for user interaction
- Authors can delete their own comments

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Auth | JWT + bcrypt |

## 📦 Installation

### Backend
```bash
cd backend
npm install
node index.js
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 🔐 Environment Variables
Create a `.env` file in the backend folder:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```