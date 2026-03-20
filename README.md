# LimeChat-ChatWebsite-MernStack
# 💬 LimeChat – Real-Time MERN Chat Application

A **full-stack real-time chat application** built using the **MERN stack (MongoDB, Express, React + Vite, Node.js)** with modern UI, strong validations, and real-world features.

---

## 🚀 Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS (White + Lime Theme)
* Axios
* Socket.io-client
* React Router DOM
* Zustand / Context API (State Management)

### Backend

* Node.js
* Express.js
* MongoDB + Mongoose
* Socket.io
* JWT Authentication
* Bcrypt (Password hashing)

---

## 🎨 UI Theme

* **Primary Color:** White (#FFFFFF)
* **Accent Color:** Lime (#84cc16)
* Clean, minimal, modern UI
* Smooth animations & transitions
* Mobile responsive

---

## 🔐 Authentication & Security

### User Auth

* Register with:

  * Username
  * Email
  * Password
* Login with Email + Password
* JWT-based authentication
* Password hashing (bcrypt)
* Secure cookies / token handling

### Validation (Frontend + Backend)

* Email format validation
* Password:

  * Min 6 characters
  * At least 1 number
* Username:

  * Min 3 characters
* Prevent empty inputs
* Duplicate email check
* Error messages (real-time)

---

## 👤 User Features

### 💬 Chat System

* One-to-one real-time chat
* Instant messaging (Socket.io)
* Typing indicator
* Online / Offline status
* Last seen feature

### 📩 Messages

* Send text messages
* Emoji support 😊
* Time & date stamps
* Message status (sent / delivered / seen)

### 🖼️ Media (Optional Advanced)

* Image upload
* File sharing

---

## 🧑‍💼 Admin Features

* Admin login
* View all users
* Delete / block users
* Monitor chats (optional)
* Dashboard:

  * Total users
  * Active users
  * Messages count

---

## 📁 Project Structure

```
/client (React Vite)
  /src
    /components
    /pages
    /store
    /services
    /utils

/server
  /controllers
  /models
  /routes
  /middlewares
  /config
```

---

## ⚡ Real-Time Features (Socket.io)

* Live messaging
* User online tracking
* Typing indicator
* Real-time updates without refresh

---

## 🧠 Database Design

### User Model

* name
* email
* password
* profilePic
* status (online/offline)
* lastSeen

### Message Model

* senderId
* receiverId
* message
* createdAt

---

## 🔧 API Endpoints

### Auth

* POST `/api/auth/register`
* POST `/api/auth/login`

### Users

* GET `/api/users`
* GET `/api/users/:id`

### Messages

* GET `/api/messages/:chatId`
* POST `/api/messages`

---

## 🛡️ Extra Security

* JWT Middleware protection
* Route protection
* Input sanitization
* Rate limiting (optional)
* CORS setup

---

## 📱 Responsive Design

* Mobile-first UI
* Tablet + Desktop optimized
* Chat layout like WhatsApp / Messenger

---

## 🌟 Advanced Features (Optional)

* Group chat
* Voice messages
* Video call (WebRTC)
* Dark mode toggle
* Push notifications

---

## 🧪 Testing

* Manual testing for:

  * Auth flow
  * Chat flow
* Edge cases:

  * Empty messages
  * Invalid login
  * Network issues

---

## 🛠️ Setup Instructions

### 1. Clone Repo

```bash
git clone <your-repo-link>
cd limechat
```

### 2. Backend Setup

```bash
cd server
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

---

## 🔑 Environment Variables

### Backend (.env)

```
PORT=5000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret_key
```

---

## 📌 Goals of This Project

* Real-world chat experience
* Scalable architecture
* Clean UI/UX
* Secure authentication
* Production-ready code

---

## 👑 Final Note

This project is designed to be:

* Beginner → Advanced friendly
* Portfolio-level 💼
* Startup-ready 🚀

---

## ❤️ Credits

Built with passion using MERN Stack

---
# 💬 LimeChat Pro – Real-Time Chat + Call + Video MERN App

A **production-level real-time chat application** built with **MERN + React (Vite)** featuring:

* 💬 Real-time messaging
* 📞 Voice calling
* 🎥 Video calling
* ⚡ Live user status
* 🎨 Custom chat wallpapers

Designed with a **modern White + Lime UI** and built like a **real-world scalable application**.

---

## 🚀 Core Features

### 💬 Chat System

* One-to-one real-time chat
* Instant messaging using Socket.io
* Typing indicator
* Online / Offline status
* Last seen tracking
* Message seen / delivered status

---

## 📞 Voice Call (NEW)

* Real-time voice calling using **WebRTC**
* Call button in chat header
* Call ringing system
* Mute / Unmute options
* Call duration timer

### 📲 Call Flow

1. User A clicks **Call**
2. User B gets **Incoming Call Screen**
3. B can:

   * ✅ Accept → Call connects
   * ❌ Reject → A gets "Call Declined"
4. If no response → Auto timeout

---

## 🎥 Video Call (NEW)

* Live video communication (WebRTC)
* Camera ON/OFF toggle
* Mic ON/OFF toggle
* End call button
* Real-time streaming

### 📲 Video Call Flow

1. User A clicks **Video Call**
2. User B gets **Incoming Video Call UI**
3. Accept → Start live video
4. Reject → Notify caller instantly

---

## 🔁 Real-Time Communication Tech

* **WebRTC** → Audio & Video streaming
* **Socket.io** → Signaling (call request, accept, reject)
* **STUN/TURN servers** → Connection stability

---

## 🎨 Chat UI Features

### 🖼️ Custom Chat Wallpaper (NEW)

* Users can:

  * Set custom background image
  * Choose from presets
* Stored per user
* Applied instantly to chat screen

---

## 🔐 Authentication & Validation

### Strong Validation (Frontend + Backend)

#### User

* Email:

  * Valid format
  * Unique
* Password:

  * Min 6 characters
  * At least 1 number
* Username:

  * Min 3 characters

#### Extra Security

* JWT Authentication
* Bcrypt password hashing
* Protected routes
* Input sanitization

---

## 🧑‍💼 Admin Panel

* Admin login
* View all users
* Block / delete users
* Monitor active users
* Call logs (NEW 🔥)
* Report system (optional)

---

## 📊 Advanced Features (Pro Level)

### 📁 Chat Enhancements

* Emoji picker 😊
* File sharing
* Image preview
* Message delete (for me / for everyone)

### 🔔 Notifications

* Incoming call popup
* Message notifications
* Sound alerts

### 📶 Presence System

* Online / offline
* Typing...
* In call status

---

## 📁 Project Structure

```id="prostruc1"
/client
  /components
  /pages
  /features (chat, call, video)
  /hooks
  /store

/server
  /controllers
  /routes
  /models
  /sockets
  /webrtc
```

---

## ⚙️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS (White + Lime)
* Socket.io-client
* WebRTC APIs

### Backend

* Node.js + Express
* MongoDB
* Socket.io
* JWT + Bcrypt

---

## 🔌 Important Modules

### Socket Events

* send_message
* receive_message
* typing
* call_user
* accept_call
* reject_call
* end_call

---

## 🌐 WebRTC Setup

* Peer-to-peer connection
* ICE candidates exchange
* STUN server (Google default)
* TURN server (for production)

---

## 🛠️ Setup

### Install Dependencies

```bash
cd server && npm install
cd client && npm install
```

### Run Project

```bash
npm run dev
```

---

## 🔑 Environment Variables

```id="envpro1"
MONGO_URI=your_db
JWT_SECRET=your_secret

# WebRTC
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=your_turn_server
```

---

## 🔥 Extra Features (Recommended by Me)

### 🧠 Smart Features

* Message search 🔍
* Chat pinning 📌
* Unread message count

### 🛡️ Safety

* Block user
* Report user
* Spam detection (basic)

### 💾 Performance

* Lazy loading chats
* Pagination
* Optimized socket events

---

## 🎯 Project Goal

* Build a **real-world chat + calling app**
* Production-ready architecture
* Portfolio-level premium project

---

## 👑 Final

**LimeChat Pro is not just a chat app — it's a full communication platform.**

---

🔥 *Chat. Call. Connect.*


**🔥 LimeChat – Clean. Fast. Real-Time.**
# 🍋 LimeChat v2 – Real-Time MERN Chat App

## 🚀 Quick Start

```bash
# 1. Make sure MongoDB is running
mongod

# 2. Backend
cd limechat/server && npm install && npm run dev

# 3. Frontend (new terminal)
cd limechat/client && npm install && npm run dev
```

- App: **http://localhost:5173**
- API: **http://localhost:5000**

## 👑 Admin Login
Email field: **admin** · Password: **admin**

## ✨ v2 Features
| Feature | Details |
|---|---|
| 📞 Voice Call | Real WebRTC, ring sound, mute, duration timer |
| 📹 Video Call | Live camera stream, PiP local view, cam toggle |
| 📲 Call Flow | Initiate → Incoming popup → Accept/Reject → Auto-timeout 30s |
| 🔔 Notifications | Sound alerts for messages & incoming calls |
| 🖼️ Wallpapers | 8 presets + custom upload, per-chat, instant apply |
| 📞 Call Logs | Per-user history + admin view with status & duration |
| 🚨 Reports | Users report others → Admin reviews/dismisses |
| 👥 Group Chat | Create, join, group messages, group typing |
| 📊 Admin Dashboard | 6-stat grid: users, online, messages, blocked, calls, reports |
| 🌙 Dark Mode | Full dark theme toggle |
| ✏️ Edit/Delete | Per-message, delete for me or everyone |
| 😊 Reactions | 6 emoji reactions on any message |
| 🎤 Voice Messages | Hold-to-record |
| 📁 File/Image Share | Upload up to 20MB |
| 🟢 Presence | Online, offline, 📞 in-call indicator |
| ⌨️ Typing | Real-time typing indicator |
