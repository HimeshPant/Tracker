Execution Tracker
A startup-grade execution tracker built to plan, track, and review daily progress across high-priority goals. Designed for immediate personal use with a scalable architecture ready for future product evolution.

Overview
A robust, full-stack application designed to enforce daily discipline. It allows for planning daily focus areas, tracking execution against those plans, and maintaining consistency through a "Streak" system for non-negotiable habits.

Why this exists
This tracker was built to encourage consistent execution by making daily goals and actual progress visible. It focuses on reducing planning friction and increasing accountability through simple, repeatable actions.

Key Features
Daily Execution Log: Plan primary goals and specific focus areas (Work, Health, Learning) by date.

Challenge System: Track non-negotiable habits with an automated streak counter.

Visual Feedback: Clear indicators for completed tasks and active streaks.

Cloud Persistence: Data is stored in MongoDB, ensuring access across environments.

Scalable Architecture: Built with a "Service Layer" pattern on the frontend and a proper Model-Controller structure on the backend.

Tech Stack
Frontend:

React (Vite)

Tailwind CSS

Lucide React (Icons)

Backend:

Node.js & Express

MongoDB & Mongoose

REST API

Architecture & Current Status
Authentication: Currently operates on a "Single-Tenant" mode using a hardcoded User ID middleware. This allows for immediate personal usage without the friction of logging in, while the database structure is already multi-tenant ready.

Data Flow: The frontend communicates with the Express backend via a centralized storageService.

State Management: React local state synced with MongoDB.

Design Philosophy
Execution over Aesthetics: The UI is clean, distraction-free, and utility-first.

Simplicity over Overengineering: No Redux, no complex routing—just pure React state and API calls.

Consistency over Motivation: The "Streak" feature is central to the user experience.

Running Locally
Backend:

Bash

cd server
npm run dev

# Runs on localhost:5000

Frontend:

Bash

# In root folder

npm run dev

# Runs on localhost:5173

Future Scope
Real Authentication: Replace the hardcoded ID middleware with JWT/Auth0.

Analytics Dashboard: Visual graphs of completion rates over time.

Mobile Support: PWA implementation for easier mobile access.

Weekly Reviews: Automated summaries of the past 7 days.
