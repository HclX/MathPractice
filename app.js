/**
 * Magical Math Practice App with Pet Feeding Gamification
 * Designed for an 8-year-old girl to practice 2-digit multiplications.
 */

class MathApp {
    constructor() {
        this.TOTAL_QUESTIONS = 10;
        this.STORAGE_KEY_PREFIX = 'math_practice_';
        this.HISTORY_KEY = 'math_practice_history';
        this.PET_STORAGE_KEY = 'math_selected_pet';
        
        this.PETS = {
            unicorn: { name: "Sparkles the Unicorn", avatar: "🦄", food: "🧁", happy: "✨", sad: "💧", chew: "😋", actionName: "Sparkles" },
            kitten: { name: "Whiskers the Kitten", avatar: "🐱", food: "🐟", happy: "💖", sad: "😿", chew: "👅", actionName: "Whiskers" },
            puppy: { name: "Barnaby the Puppy", avatar: "🐶", food: "🥩", happy: "💖", sad: "🥺", chew: "🦴", actionName: "Barnaby" },
            bunny: { name: "Clover the Bunny", avatar: "🐰", food: "🥕", happy: "💖", sad: "💧", chew: "😋", actionName: "Clover" },
            panda: { name: "Pip the Panda", avatar: "🐼", food: "🍪", happy: "💖", sad: "🥺", chew: "😋", actionName: "Pip" }
        };

        this.selectedPet = localStorage.getItem(this.PET_STORAGE_KEY) || 'unicorn';
        this.todayStr = this.getTodayDateString();
        this.state = this.loadTodayState();
        
        this.audioCtx = null;
        this.initConfettiCanvas();
        this.initDOM();
        this.render();
    }

    /**
     * Get current date string in YYYY-MM-DD format
     */
    getTodayDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Load today's practice state from localStorage or initialize a new one
     */
    loadTodayState() {
        const key = this.STORAGE_KEY_PREFIX + this.todayStr;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Error parsing saved state", e);
            }
        }
        
        // Initialize new state for today
        const questions = this.generateDailyQuestions();
        const newState = {
            date: this.todayStr,
            questions: questions,
            currentIndex: 0,
            completed: false,
            stars: 0,
            successRate: 0
        };
        localStorage.setItem(key, JSON.stringify(newState));
        return newState;
    }

    /**
     * Save current state to localStorage
     */
    saveState() {
        const key = this.STORAGE_KEY_PREFIX + this.todayStr;
        localStorage.setItem(key, JSON.stringify(this.state));
    }

    /**
     * Generate 10 tailored 2-digit by 2-digit multiplication questions
     */
    generateDailyQuestions() {
        const questions = [];
        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        for (let i = 0; i < this.TOTAL_QUESTIONS; i++) {
            let num1, num2;
            if (i < 2) {
                num1 = rand(10, 15); num2 = rand(10, 15);
            } else if (i < 5) {
                num1 = rand(2, 5) * 10; num2 = rand(11, 25);
            } else if (i < 8) {
                num1 = rand(12, 25); num2 = rand(12, 25);
            } else {
                num1 = rand(25, 45); num2 = rand(25, 45);
            }

            if (Math.random() > 0.5) {
                const temp = num1; num1 = num2; num2 = temp;
            }

            questions.push({
                num1: num1, num2: num2, answer: num1 * num2, correct: null, attempts: 0
            });
        }
        return questions;
    }

    /**
     * Initialize DOM elements and event listeners
     */
    initDOM() {
        this.answerInput = document.getElementById('answer-input');
        this.checkBtn = document.getElementById('check-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.feedbackMsg = document.getElementById('feedback-message');
        this.petModal = document.getElementById('pet-selector-modal');
        
        this.answerInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                if (!this.checkBtn.classList.contains('hidden')) {
                    this.checkAnswer();
                } else if (!this.nextBtn.classList.contains('hidden')) {
                    this.nextQuestion();
                }
            }
        });
    }

    /**
     * Open & Close Pet Selector Modal
     */
    openPetSelector() {
        this.petModal.classList.remove('hidden');
    }

    closePetSelector() {
        this.petModal.classList.add('hidden');
        if (this.answerInput && !this.state.completed) {
            this.answerInput.focus();
        }
    }

    selectPet(petId) {
        if (this.PETS[petId]) {
            this.selectedPet = petId;
            localStorage.setItem(this.PET_STORAGE_KEY, petId);
            this.renderPetArea();
            this.closePetSelector();
        }
    }

    /**
     * Render Pet display arena
     */
    renderPetArea() {
        const pet = this.PETS[this.selectedPet];
        document.getElementById('pet-name-display').textContent = pet.name;
        
        const avatarEl = document.getElementById('pet-avatar');
        avatarEl.textContent = pet.avatar;
        avatarEl.className = 'pet-avatar'; // reset state
        
        document.getElementById('pet-mood-bubble').textContent = pet.happy;
        document.getElementById('pet-instruction').textContent = `Answer correctly to feed ${pet.actionName} a ${pet.food}!`;
    }

    /**
     * Switch between practice and summary tabs
     */
    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(view => view.classList.add('hidden'));
        
        const activeBtn = document.getElementById(`tab-${tabId}`);
        const activeView = document.getElementById(`view-${tabId}`);
        
        if (activeBtn) activeBtn.classList.add('active');
        if (activeView) activeView.classList.remove('hidden');

        if (tabId === 'summary') {
            this.renderSummary();
        } else if (tabId === 'practice') {
            this.render();
            if (this.answerInput && !this.state.completed) {
                this.answerInput.focus();
            }
        }
    }

    /**
     * Render practice view
     */
    render() {
        this.renderPetArea();
        document.getElementById('current-date-display').textContent = `📅 ${this.formatDate(this.todayStr)}`;
        
        const progressPct = (this.state.currentIndex / this.TOTAL_QUESTIONS) * 100;
        document.getElementById('practice-progress').style.width = `${progressPct}%`;
        document.getElementById('practice-progress-text').textContent = `${this.state.currentIndex} / ${this.TOTAL_QUESTIONS}`;
        
        const questionArea = document.getElementById('question-area');
        const dayCompleteArea = document.getElementById('day-complete-area');

        if (this.state.completed) {
            questionArea.classList.add('hidden');
            dayCompleteArea.classList.remove('hidden');
            document.getElementById('today-success-rate').textContent = `${this.state.successRate}%`;
            document.getElementById('today-stars-earned').textContent = `${this.state.stars} ⭐`;
            return;
        }

        questionArea.classList.remove('hidden');
        dayCompleteArea.classList.add('hidden');

        const q = this.state.questions[this.state.currentIndex];
        document.getElementById('question-number-badge').textContent = `Question ${this.state.currentIndex + 1} of ${this.TOTAL_QUESTIONS}`;
        document.getElementById('stars-earned-display').textContent = `⭐ ${this.state.stars}`;
        
        document.getElementById('num1').textContent = q.num1;
        document.getElementById('num2').textContent = q.num2;
        
        this.answerInput.value = '';
        this.answerInput.disabled = false;
        this.answerInput.focus();
        
        this.checkBtn.classList.remove('hidden');
        this.nextBtn.classList.add('hidden');
        
        this.feedbackMsg.className = 'feedback-area';
        this.feedbackMsg.textContent = '';
    }

    /**
     * Check answer and trigger pet feeding / reactions
     */
    checkAnswer() {
        const userAnswer = parseInt(this.answerInput.value, 10);
        if (isNaN(userAnswer)) {
            this.showFeedback("💡 Please enter a number first!", "warning");
            return;
        }

        const q = this.state.questions[this.state.currentIndex];
        const pet = this.PETS[this.selectedPet];
        q.attempts++;

        if (userAnswer === q.answer) {
            // Correct Answer!
            q.correct = true;
            if (q.attempts === 1) {
                this.state.stars++;
            }
            
            this.answerInput.disabled = true;
            this.checkBtn.classList.add('hidden');
            this.nextBtn.classList.remove('hidden');
            this.nextBtn.focus();

            this.playChime(true);
            this.triggerConfetti();
            
            // Trigger Flying Food Animation
            this.animateFlyingFood();

            const praises = [
                `🎉 Wow! ${pet.actionName} loves the ${pet.food}! ⭐`,
                `✨ Amazing! ${pet.actionName} is so happy! 💖`,
                `🦄 Brilliant! That ${pet.food} looks delicious! 🌸`,
                `🌟 Incredible job! ${pet.actionName} is doing a happy dance! 🎈`
            ];
            const randomPraise = praises[Math.floor(Math.random() * praises.length)];
            this.showFeedback(randomPraise, "success");

            this.saveState();
        } else {
            // Incorrect Answer
            this.playChime(false);
            
            // Pet gets sad
            const avatarEl = document.getElementById('pet-avatar');
            avatarEl.className = 'pet-avatar pet-sad';
            document.getElementById('pet-mood-bubble').textContent = pet.sad;
            document.getElementById('pet-instruction').textContent = `Oh no, ${pet.actionName} is still hungry! Let's try again!`;
            
            setTimeout(() => {
                if (avatarEl.classList.contains('pet-sad')) {
                    avatarEl.className = 'pet-avatar';
                    document.getElementById('pet-mood-bubble').textContent = pet.happy;
                    document.getElementById('pet-instruction').textContent = `Answer correctly to feed ${pet.actionName} a ${pet.food}!`;
                }
            }, 1500);

            const encouragements = [
                `💡 Oops! Not quite, but ${pet.actionName} knows you can do it! Try again! ✨`,
                `💖 Good try! Let's double check our calculation for ${pet.actionName}! 🌸`,
                `🦄 Almost there! You can do this! 💪`
            ];
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            this.showFeedback(randomEncouragement, "error");
            
            this.answerInput.value = '';
            this.answerInput.focus();
            this.saveState();
        }
    }

    /**
     * Animate Food Flying from Input to Pet Avatar Mouth
     */
    animateFlyingFood() {
        const pet = this.PETS[this.selectedPet];
        const startRect = this.answerInput.getBoundingClientRect();
        const avatarEl = document.getElementById('pet-avatar');
        const endRect = avatarEl.getBoundingClientRect();

        const foodEl = document.createElement('div');
        foodEl.className = 'flying-food';
        foodEl.textContent = pet.food;
        foodEl.style.left = `${startRect.left + startRect.width / 2 - 30}px`;
        foodEl.style.top = `${startRect.top + startRect.height / 2 - 30}px`;
        
        document.body.appendChild(foodEl);

        // Force reflow
        foodEl.getBoundingClientRect();

        // Animate to mouth
        foodEl.style.left = `${endRect.left + endRect.width / 2 - 20}px`;
        foodEl.style.top = `${endRect.top + endRect.height / 2 - 20}px`;
        foodEl.style.transform = 'scale(0.4)';

        // Pet reaction
        avatarEl.className = 'pet-avatar pet-happy';
        document.getElementById('pet-mood-bubble').textContent = '💖';
        document.getElementById('pet-instruction').textContent = `${pet.actionName} happily munches on the ${pet.food}! Yum! 😋`;

        setTimeout(() => {
            if (foodEl.parentNode) {
                foodEl.parentNode.removeChild(foodEl);
            }
        }, 800);
    }

    /**
     * Advance to next question
     */
    nextQuestion() {
        this.state.currentIndex++;
        if (this.state.currentIndex >= this.TOTAL_QUESTIONS) {
            this.finishDailyChallenge();
        } else {
            this.saveState();
            this.render();
        }
    }

    /**
     * Finish today's challenge
     */
    finishDailyChallenge() {
        this.state.completed = true;
        let firstAttemptCorrect = 0;
        this.state.questions.forEach(q => {
            if (q.correct && q.attempts === 1) {
                firstAttemptCorrect++;
            }
        });
        this.state.successRate = Math.round((firstAttemptCorrect / this.TOTAL_QUESTIONS) * 100);
        this.saveState();
        this.saveToHistory();
        this.render();
        this.triggerConfetti(true);
    }

    /**
     * Save today's results to history
     */
    saveToHistory() {
        let history = [];
        const savedHistory = localStorage.getItem(this.HISTORY_KEY);
        if (savedHistory) {
            try { history = JSON.parse(savedHistory); } catch (e) { console.error(e); }
        }
        history = history.filter(item => item.date !== this.todayStr);
        history.push({
            date: this.todayStr, totalQuestions: this.TOTAL_QUESTIONS, stars: this.state.stars, successRate: this.state.successRate
        });
        history.sort((a, b) => b.date.localeCompare(a.date));
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    }

    /**
     * Render Trophy Room summary
     */
    renderSummary() {
        let history = [];
        const savedHistory = localStorage.getItem(this.HISTORY_KEY);
        if (savedHistory) {
            try { history = JSON.parse(savedHistory); } catch (e) { console.error(e); }
        }

        const totalDays = history.length;
        const totalStars = history.reduce((sum, item) => sum + (item.stars || 0), 0);
        const avgSuccess = totalDays > 0 
            ? Math.round(history.reduce((sum, item) => sum + (item.successRate || 0), 0) / totalDays)
            : 0;

        document.getElementById('total-days-practiced').textContent = totalDays;
        document.getElementById('total-stars-collected').textContent = totalStars;
        document.getElementById('average-success-rate').textContent = `${avgSuccess}%`;

        const tbody = document.getElementById('history-table-body');
        tbody.innerHTML = '';

        if (history.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4">No practice records found yet. Complete today's challenge to earn your first trophy! 🏆</td>`;
            tbody.appendChild(tr);
            return;
        }

        history.forEach(item => {
            const tr = document.createElement('tr');
            let badge = "🥉 Bronze Medal";
            if (item.successRate === 100) badge = "🥇 Gold Trophy 👑";
            else if (item.successRate >= 80) badge = "🥈 Silver Star ⭐";

            tr.innerHTML = `
                <td>${this.formatDate(item.date)}</td>
                <td>${item.totalQuestions}</td>
                <td><strong>${item.successRate}%</strong></td>
                <td>${badge}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    showFeedback(msg, type) {
        this.feedbackMsg.className = `feedback-area ${type}`;
        this.feedbackMsg.textContent = msg;
    }

    formatDate(dateStr) {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    playChime(isCorrect) {
        try {
            if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain); gain.connect(this.audioCtx.destination);

            if (isCorrect) {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.1);
                osc.frequency.setValueAtTime(783.99, now + 0.2);
                osc.frequency.setValueAtTime(1046.50, now + 0.3);
                gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                osc.start(now); osc.stop(now + 0.6);
            } else {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now); osc.frequency.setValueAtTime(200, now + 0.15);
                gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
            }
        } catch (e) { console.log(e); }
    }

    initConfettiCanvas() {
        this.canvas = document.getElementById('confetti-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animating = false;
        const resize = () => { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; };
        window.addEventListener('resize', resize); resize();
    }

    triggerConfetti(isGrand = false) {
        const count = isGrand ? 150 : 60;
        const colors = ['#ff758c', '#ff7eb3', '#6ee7b7', '#3b82f6', '#f59e0b', '#9333ea', '#ec4899'];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: window.innerWidth / 2, y: window.innerHeight * 0.8,
                vx: (Math.random() - 0.5) * (isGrand ? 25 : 15), vy: (Math.random() - 1) * (isGrand ? 25 : 18),
                size: Math.random() * 8 + 6, color: colors[Math.floor(Math.random() * colors.length)],
                rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.2,
                shape: Math.random() > 0.3 ? 'circle' : 'star', alpha: 1
            });
        }
        if (!this.animating) { this.animating = true; this.animateConfetti(); }
    }

    animateConfetti() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let activeParticles = 0; const gravity = 0.4; const drag = 0.98;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (p.alpha <= 0) continue;
            activeParticles++; p.vx *= drag; p.vy += gravity; p.x += p.vx; p.y += p.vy; p.rot += p.rotSpeed; p.alpha -= 0.008;

            this.ctx.save(); this.ctx.translate(p.x, p.y); this.ctx.rotate(p.rot);
            this.ctx.globalAlpha = Math.max(0, p.alpha); this.ctx.fillStyle = p.color;

            if (p.shape === 'circle') {
                this.ctx.beginPath(); this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); this.ctx.fill();
            } else {
                this.ctx.beginPath();
                for (let j = 0; j < 5; j++) {
                    this.ctx.lineTo(Math.cos((18 + j * 72) * Math.PI / 180) * p.size, -Math.sin((18 + j * 72) * Math.PI / 180) * p.size);
                    this.ctx.lineTo(Math.cos((54 + j * 72) * Math.PI / 180) * (p.size / 2), -Math.sin((54 + j * 72) * Math.PI / 180) * (p.size / 2));
                }
                this.ctx.closePath(); this.ctx.fill();
            }
            this.ctx.restore();
        }
        if (activeParticles > 0) requestAnimationFrame(() => this.animateConfetti());
        else { this.particles = []; this.animating = false; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => { app = new MathApp(); });
