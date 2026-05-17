# 🌟 Magical Math Practice 🌟

A delightful, premium, single-page web application designed specifically for an 8-year-old girl to practice 2-digit by 2-digit multiplication. Built with love, vibrant aesthetics, and encouraging gamification to make learning math an enchanting daily adventure.

---

## 🚀 Live Demo

### 👉 **[Play Magical Math Practice Now!](https://hclx.github.io/MathPractice/)** 🦄✨

---

## ✨ Key Features

### 📅 Tailored Daily Challenges
- **10 Questions Daily**: Each day generates a fresh set of 10 unique 2-digit by 2-digit multiplication problems (10–99).
- **Progressive Difficulty Ramp**: Questions begin with smaller numbers (e.g., 10–15), move to multiples of 10, and end with a couple of challenge questions to keep practice fun and never overwhelming.
- **Daily Persistence**: Powered by local storage, progress on today's challenge is saved instantly. If the browser is closed and reopened, practice resumes exactly where she left off.

### 🎉 Gamified Immediate Feedback
- **✨ Check Answer**: Hitting Enter instantly validates the input.
- **Correct Answers**: Triggers a beautiful burst of star and circle confetti, synthesizes a magical audio chime, awards a golden star, and displays cheerful praise.
- **Supportive Encouragement**: Incorrect attempts produce a gentle audio boop and supportive messages, encouraging her to try again without giving away the answer.

### 🏆 My Trophy Room (Summary Dashboard)
- **Lifetime Statistics**: Tracks total days practiced, total stars collected, and average lifetime success rate.
- **Visual Badges**: Earn cute medals based on daily performance:
  - 🥇 **Gold Trophy 👑** (100% Success)
  - 🥈 **Silver Star ⭐** (80%–99% Success)
  - 🥉 **Bronze Medal** (<80% Success)

### 💖 Magical Aesthetics
- **Vibrant & Kid-Friendly**: Pastel pink, purple, and mint gradient styling with floating background emojis (🦄, 🌟, 💖, 🌸, 🎈).
- **Premium Typography**: Uses the rounded, friendly `Fredoka` font from Google Fonts.
- **100% Offline Capable**: Utilizes the browser's native Web Audio API and canvas rendering for sound and confetti without relying on external media files.

---

## 🛠️ Running Locally

Since the application is entirely self-contained, running it locally is incredibly simple:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HclX/MathPractice.git
   cd MathPractice
   ```

2. **Open in a browser**:
   Simply open `index.html` in any modern web browser:
   ```bash
   # On Linux
   xdg-open index.html
   
   # On macOS
   open index.html
   ```

---

## 📁 Repository Structure

- [`index.html`](index.html): Main HTML layout, tab navigation, and canvas setup.
- [`style.css`](style.css): Glassmorphism design system, CSS animations, and responsive styles.
- [`app.js`](app.js): Vanilla JS state management, daily question generation, audio synthesis, and confetti engine.
- [`implementation.md`](implementation.md): Detailed architectural plan and feature breakdown.
