# 💠 WhiteDUMP: Advanced Threat Intelligence Platform

WhiteDUMP is a premium, AI-powered dark web monitoring and threat intelligence platform designed for high-security organizations. This repository contains the complete frontend landing experience, including professional authentication flows and an immersive user onboarding wizard.

---

## 🎯 Project Overview

WhiteDUMP helps organizations stay ahead of data breaches by:
- **Dark Web Monitoring:** Scanning Tor-based (.onion) sources for leaked credentials and exposed databases.
- **AI-Powered Intelligence:** Using NLP for natural language query processing and smart keyword expansion.
- **Steganography Analysis:** Detecting hidden data within images to uncover covert communications.
- **Blockchain-Based Access:** Securing the platform with MegaETH-backend smart contracts for usage and payments.

## 🚀 Key Features

### 1. High-Fidelity Landing Page
- **Cyber-Tech Aesthetic:** A deep dark-green and neon emerald theme built with premium glassmorphism and subtle CSS animations.
- **Dynamic Backgrounds:** Integrated high-quality GIFs (`landing_BG.gif`) for a realistic, 24/7 scanning effect.
- **Actionable Dashboard Mock:** A visual representation of threat velocity, active scans, and critical alerts.

### 2. Immersive Onboarding (Cyber Command)
A specialized 3-step setup wizard that guides new users through:
- **Targeting:** Mapping organizational sectors and deep-scan keywords.
- **Protocols:** Configuring encrypted email, webhook, and out-of-band SMS alert preferences.
- **Deployment:** Synchronizing the organization with the WhiteDUMP threat mesh via simulated MegaETH node connections.
- **SYSTEM_LOG.DAT Feed:** A real-time, terminal-style log feed that provides feedback during the setup process.

### 3. Integrated Auth Flow
- **Professional Login/Signup:** Heavy glassmorphism authentication cards with floating background nebula effects.
- **Client-Side Routing:** Powered by `react-router-dom` for seamless, single-page navigation.

## 🛠️ Technology Stack

- **Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing:** [React Router v6](https://reactrouter.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Styling:** Vanilla CSS (Modern CSS variables, Flex/Grid, Keyframe Animations)
- **Visuals:** Custom Glassmorphism, Ethereal Glow overlays, and Neon Grid motifs.

## 📂 Project Structure

```text
LANDING/
├── src/
│   ├── components/       # Reusable UI components (Navbar, Hero, Footer, etc.)
│   ├── pages/            # Page-level components
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   └── Onboarding.jsx  # Multi-step wizard logic
│   ├── App.jsx           # Main router & layout configuration
│   ├── App.css           # Core landing page styling
│   ├── Auth.css          # Deep-glass & Terminal styling for auth flows
│   └── index.css         # Global variables and base styles
├── public/               # Static assets (Favicons, Background GIFs)
└── package.json
```

## ⚙️ Installation & Setup

1. **Navigate to the Directory:**
   ```bash
   cd LANDING
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

## 📜 Metadata & Compliance

- **Current Version:** 1.0.0
- **Release Year:** 2026
- **Status:** Integrated Threat Monitoring Active 🟢
- **Simulated Compliance:** SOC 2 Type II, ISO 27001

---

© 2026 **WhiteDUMP Inc.** All Rights Reserved. Stay secure, stay ahead.
