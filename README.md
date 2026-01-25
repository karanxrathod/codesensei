<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CodeSensei 🤖
### AI-Powered Code Learning Assistant

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://gemini.google.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A production-ready AI-powered platform that helps engineering students and developers understand codebases faster. Upload your projects or connect GitHub repositories to get instant architecture explanations, interactive learning tasks, and AI-powered guidance.

🌐 **Live Demo:** [https://codesensei.app](https://codesensei-929150751698.us-west1.run.app/
)  
📽️ **Demo Video:** [Watch on YouTube](https://youtu.be/6K6oIdje2_k)  
🏆 **Built for:** Hackathon

---

## ✨ Features

### 🧠 Intelligent Code Analysis
- **AI-Powered Explanations**: Get detailed architecture explanations using Google Gemini API
- **Smart Code Understanding**: Automatically detects patterns, dependencies, and structure
- **Learning-Focused**: Explanations tailored for students and junior developers

### 📁 Flexible Project Upload
- **Local File Upload**: Drag & drop your local projects
- **GitHub Integration**: Connect any public/private repository
- **Multi-Format Support**: Works with various project structures

### 🎯 Interactive Learning
- **Task-Based Guidance**: Step-by-step tasks for common scenarios
  - Understand this project
  - Add a new feature
  - Fix a bug
  - Understand ML pipeline
- **Progress Tracking**: Track your learning journey
- **Checkpoint System**: Mark completed tasks

### 💬 AI-Powered Chat
- **Context-Aware Conversations**: Chat about your specific codebase
- **File References**: AI can reference specific files in responses
- **Learning-Oriented**: Answers designed to help you learn, not just solve

### 📊 Visualization Tools
- **Architecture Diagrams**: Automatic Mermaid.js diagrams
- **Zoom & Pan**: Interactive diagram exploration
- **Tech Stack Detection**: Identifies technologies used

### 🎨 Professional UI/UX
- **Dark/Light Themes**: Choose your preferred theme
- **Mobile Responsive**: Works perfectly on all devices
- **PWA Support**: Install as a desktop/mobile app
- **Clean, Professional Design**: Feels like a real startup product

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Firebase account
- Gemini API key (from Google AI Studio)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/codesensei.git
   cd codesensei



##🏗️ Project Structure
codesensei/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── projects/       # Project management
│   │   ├── chat/           # Chat interface
│   │   ├── diagrams/       # Diagram components
│   │   └── ui/            # Reusable UI components
│   ├── contexts/           # React contexts (Auth, Theme, etc.)
│   ├── firebase/           # Firebase configuration and services
│   │   ├── firebaseConfig.js
│   │   ├── authService.js
│   │   ├── dbService.js
│   │   └── storageService.js
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── styles/            # Global styles and Tailwind config
│   └── assets/            # Images, icons, etc.
├── public/                # Static files
├── .env.example          # Environment variables template
├── tailwind.config.js    # Tailwind CSS configuration
├── package.json          # Dependencies
└── README.md            # This file

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ZsB5gipYLEAuxuxWYcNiFLOdrkFqYJvQ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
