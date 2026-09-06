# 🌟 Magical Math Practice 🌟

A delightful, premium, single-page web application designed specifically for an 8-year-old girl to practice math. Built with love, vibrant aesthetics, and encouraging gamification to make learning math an enchanting daily adventure.

---

## 🚀 Live Demo

### 👉 **[Play Magical Math Practice Now!](https://hclx.github.io/MathPractice/)** 🦄✨

---

## ✨ Key Features

### 🔢 Multiple Practice Stages
- **✖️ Multiplication & ➗ Division**: Switch between stages anytime using the stage switcher at the top of the app.
- **Independent Progress**: Each stage keeps its own daily challenge, stars, success rate, trophy shelf, and adventure log, so switching stages never loses progress in the other.
- **Long Division with Remainders**: The Division stage practices long division — a larger dividend split by a smaller (1-2 digit) divisor — and asks for both the answer and the remainder (e.g. `59 ÷ 3 = 19 R 2`).

### 🐾 Gamified Pet Feeding Arena
- **Choose Your Magical Pet**: Select from 5 adorable companions: 🦄 Sparkles the Unicorn, 🐱 Whiskers the Kitten, 🐶 Barnaby the Puppy, 🐰 Clover the Bunny, or 🐼 Pip the Panda.
- **Flying Food Animation**: Every correct answer feeds the pet! Watch their favorite treats (🧁, 🐟, 🥩, 🥕, 🍪) fly directly from the math problem to the pet's mouth.
- **Emotional Pet Reactions**: When fed, pets bounce happily and show floating heart bubbles (💖). When an incorrect attempt is made, they look sad (💧) and encourage her to try again.

### 📅 Tailored Daily Challenges
- **10 Questions Daily**: Each day generates a fresh set of 10 unique problems for the selected stage — 2-digit by 2-digit multiplication, or long division with remainders.
- **Progressive Difficulty Ramp**: Questions begin with smaller numbers (e.g., 10–15), move to multiples of 10, and end with a couple of challenge questions to keep practice fun and never overwhelming.
- **Daily Persistence**: Powered by local storage, progress on today's challenge is saved instantly. If the browser is closed and reopened, practice resumes exactly where she left off.

### 🎉 Gamified Immediate Feedback
- **✨ Check Answer**: Hitting Enter instantly validates the input.
- **Correct Answers**: Triggers a beautiful burst of star and circle confetti, synthesizes a magical audio chime, awards a golden star, and displays cheerful praise.
- **Supportive Encouragement**: Incorrect attempts produce a gentle audio boop and supportive messages, encouraging her to try again without giving away the answer.

### 🏡 My Pet Room & Trophy Shelf
- **Cozy Pet Living Area**: View your selected pet resting happily on their magic rug in their cozy room!
- **Grand Trophy Display Shelf**: Every completed daily challenge adds a permanent trophy to your pet's collection, complete with date badges and earned stars.
- **Starter History Seed**: Automatically populates starter practice records on your very first visit so your pet's room and trophy shelf look beautifully decorated right away.
- **Detailed Adventure Log**: Tabular record tracking past dates, question counts, success rates, and visual medal badges:
  - 🥇 **Gold Trophy 👑** (100% Success)
  - 🥈 **Silver Star ⭐** (80%–99% Success)
  - 🥉 **Bronze Medal** (<80% Success)
- **🔄 Restart Challenge Button**: Finished today's practice but want to play again? Use the Restart Challenge button to generate a fresh set of questions anytime!

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

- [`index.html`](index.html): Main HTML layout, tab navigation, pet arena, and modal setup.
- [`style.css`](style.css): Glassmorphism design system, pet animation styles, and responsive layouts.
- [`app.js`](app.js): Vanilla JS state management, daily question generation, pet feeding logic, audio synthesis, and confetti engine.
- [`implementation.md`](implementation.md): Detailed architectural plan and feature breakdown.
