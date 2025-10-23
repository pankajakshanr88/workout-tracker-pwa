# 🏋️ Intelligent Workout Tracker

**A smart, progressive web app for tracking workouts with intelligent progressive overload and automatic PR detection.**

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" />
  <img src="https://img.shields.io/badge/PWA-Ready-green" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## ✨ Features

### 🎯 **Smart Progressive Overload**
- Automatic weight suggestions based on your last workout
- Exercise-specific increments (Deadlift +10lbs, OHP +2.5lbs, etc.)
- Tracks progression over time

### 🏆 **Automatic PR Detection**
- Detects Weight PRs, Volume PRs, and Rep PRs automatically
- Beautiful celebration animations with haptic feedback
- Tracks all-time personal records

### 📊 **Progress Tracking**
- Visual charts showing weight progression over time
- Workout history with detailed performance data
- Recent sets with RIR (Reps In Reserve) indicators

### 🎮 **Full Control**
- Select and reorder exercises for each workout
- Skip exercises or end workout early
- Staging screen between exercises

### 🧠 **Smart Alerts System**
- **Stagnation Detection** - Identifies when you're not progressing
- **Sandbagging Detection** - Detects when not training to failure
- **Personalized Interventions** - Suggests specific solutions for each issue
- **Real-time Analysis** - Automatic alert generation after workouts

### ⚡ **PWA Capabilities**
- Works offline (all data stored locally)
- Installable on any device
- Fast and responsive
- No backend required

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/workout-tracker-pwa.git
cd workout-tracker-pwa

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

---

## 📱 Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **State Management:** Zustand
- **Routing:** React Router v6
- **Database:** sql.js (SQLite in browser)
- **Persistence:** IndexedDB
- **Charts:** Chart.js
- **PWA:** vite-plugin-pwa + Workbox

---

## 🎯 Core Philosophy

Based on evidence-based fitness principles:

1. **Progressive Overload** (60% of results)
   - Continuously increase weight over time
   - App makes this impossible to ignore

2. **Train to Failure (1 RIR)** (60% of results)
   - Train until 1 rep left in reserve
   - Validated after every set

3. **Sufficient Weekly Volume** (30% of results)
   - 10-15 sets per muscle group per week
   - (Coming in Phase 2C)

---

## 📊 Current Status

### ✅ Phase 1: MVP Core (Complete)
- Workout logging
- Progressive overload suggestions
- RIR validation
- Rest timer with predictions

### ✅ Phase 2A: Progress & PRs (Complete)
- Automatic PR detection
- PR celebrations
- Progress charts
- Workout history

### ✅ Phase 2B: Intelligence Layer (Complete) 🚀
- **Stagnation Detection** - Identifies plateaus and suggests interventions
- **Sandbagging Detection** - Detects when not training to failure
- **Smart Alerts System** - Comprehensive alert management
- **Real-time Analysis** - Automatic alert generation after workouts

### ✅ Deployed & Live! 🚀
- Successfully deployed to Vercel
- PWA installable on any device
- All features tested and working
- Smart alerts active and functional

### 🚧 Phase 2C: Advanced Features (Next)
- Weekly volume tracking
- Exercise variations
- Program templates
- Advanced analytics

---

## 🗂️ Project Structure

```
workout-tracker-pwa/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/        # Button, Card, Input, etc.
│   │   ├── charts/        # ProgressChart
│   │   ├── workout/       # RIRButtons, RestTimer, etc.
│   │   └── alerts/        # StagnationAlert, SandbaggingAlert
│   ├── screens/           # Page components
│   │   ├── HomeScreen.tsx
│   │   ├── WorkoutScreen.tsx
│   │   ├── RestScreen.tsx
│   │   ├── ProgressScreen.tsx
│   │   ├── ExerciseCompleteScreen.tsx
│   │   ├── ExerciseSelectScreen.tsx
│   │   └── AlertsScreen.tsx
│   ├── services/          # Business logic
│   │   ├── database/      # Database operations
│   │   ├── progression/   # Algorithms
│   │   └── alerts/        # Smart detection systems
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript types
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Helper functions
├── public/                # Static assets
└── docs/                  # Documentation
```

---

## 🎮 Usage

### Starting a Workout

1. **Home Screen:** See today's suggested weights
2. Click **"✏️ Customize"** to select/reorder exercises
3. Click **"START WORKOUT"**

### During Workout

1. Enter weight and reps
2. Answer: "Could you do 1 more rep?"
   - ✓ Yes, maybe (perfect - 1 RIR)
   - ⚠️ Yes, easily (too easy)
   - ❌ No way (failure)
3. **Complete Set** → Rest timer
4. Repeat for 5 sets

### After Exercise

- View performance summary
- Choose: Continue | Different Exercise | Finish Early

### Track Progress

- Click **"📊 View Progress"**
- See weight progression charts
- Check personal records
- Review workout history

### Smart Alerts

- Click **"⚠️ View Alerts"** (when alerts are active)
- Review stagnation and intensity warnings
- Get personalized training recommendations
- Dismiss or act on alerts as needed

---

## 📖 Documentation

- **[SESSION-SUMMARY.md](./SESSION-SUMMARY.md)** - Development session summary
- **[PROGRESS.md](./PROGRESS.md)** - Complete project progress
- **[ROADMAP.md](./ROADMAP.md)** - Future development phases
- **[NEXT-STEPS.md](./NEXT-STEPS.md)** - What to build next
- **[PHASE2A-PROGRESS-AND-PR-TRACKING.md](./PHASE2A-PROGRESS-AND-PR-TRACKING.md)** - PR detection docs
- **[FEATURE-EXERCISE-CONTROL.md](./FEATURE-EXERCISE-CONTROL.md)** - Exercise control feature
- **[BUGFIXES.md](./BUGFIXES.md)** - Bug fixes documentation
- **[LESSONS-LEARNED.md](./LESSONS-LEARNED.md)** - Development lessons and pitfalls to avoid

---

## 🚢 Deployment

### 🌐 Live Demo
**🔥 [View Live App](https://workout-tracker-fkzkfkdvi-pankajakshanr88s-projects.vercel.app)**

*Install on your phone for the best experience! 📱*

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login (opens browser)
vercel login

# Deploy to production
vercel --prod
```

**Important:** After deployment, disable authentication protection in Vercel Dashboard → Settings → Functions → Authentication → Set to "None"

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with React, Vite, and TailwindCSS
- Inspired by StrongLifts 5×5 program
- Chart visualization by Chart.js
- Database by sql.js

---

## 📧 Contact

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/workout-tracker-pwa/issues)
- **Discussions:** [GitHub Discussions](https://github.com/YOUR_USERNAME/workout-tracker-pwa/discussions)

---

## 🎯 Roadmap

- [x] Phase 1: MVP Core
- [x] Phase 2A: Progress & PRs
- [x] **Phase 2B: Intelligence Layer** 🚀
- [x] **🚀 DEPLOYED & LIVE!**
- [ ] Phase 2C: Weekly Volume Tracking
- [ ] Phase 3: Exercise Variations
- [ ] Phase 4: React Native Mobile App

---

<p align="center">
  <strong>Built with 💪 for lifters who want to get stronger</strong>
</p>

<p align="center">
  <a href="https://github.com/YOUR_USERNAME/workout-tracker-pwa">⭐ Star this repo if you found it helpful!</a>
</p>
