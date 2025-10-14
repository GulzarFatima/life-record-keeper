# capstone2025

# Life Record Keeper.

**Life Record Keeper** is a secure, personal web application that helps users record and organise important life events such as **Education**, **Career**, and **Travel** — along with their associated documents, images, and dates.  
Built using the **MERN stack** (MongoDB, Express, React + Vite, Node.js), the app emphasizes privacy, simplicity, and accessibility.

---

## Features

### Authentication
- Register, verify, and log in with email and password  
- “Remember Me” option for persistent login  
- Secure password reset, change, and account deletion  
- Firebase Authentication integration for simplicity and safety

### Record Management
- Add, view, edit, and delete categorized records  
- Categories include: Education, Career, and Travel for now
- Attach supporting documents or images to each record  
- Real-time UI updates after actions (React state-based refresh)

### Document Uploads
- Upload and view documents as thumbnails  
- Click to open files in a new tab  
- Delete documents safely without affecting records  
- Backend handles file associations by `recordId`

### Navigation & UI
- Clean, responsive design built with **CSS tokens** for consistent theme  
- Dedicated **About** and **Support & Feedback** pages  
- Accessible and mobile-friendly layout  
- Organized modals for adding and managing records

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React (Vite), React Router, CSS Modules |
| Backend | Node.js, Express.js |
| Database | MongoDB (Local / Atlas) |
| Auth | Firebase Authentication |
| Deployment | In-Progress |

---



