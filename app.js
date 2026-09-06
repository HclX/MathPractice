/**
 * Magical Math Practice App with Pet Feeding Gamification
 * Designed for an 8-year-old girl to practice math, across multiple stages
 * (multiplication, division).
 */

class MathApp {
    constructor() {
        this.TOTAL_QUESTIONS = 10;
        this.STORAGE_KEY_PREFIX = 'math_practice_';
        this.HISTORY_KEY_PREFIX = 'math_practice_history_';
        this.PET_STORAGE_KEY = 'math_selected_pet';
        this.STAGE_STORAGE_KEY = 'math_selected_stage';
        this.QUIZ_BEST_KEY_PREFIX = 'math_quiz_best_';
        this.QUIZ_DURATION_SECONDS = 90;

        this.STAGES = {
            multiplication: { name: "Multiplication", icon: "✖️", symbol: "×" },
            division: { name: "Division", icon: "➗", symbol: "÷", hasRemainder: true }
        };

        this.PETS = {
            unicorn: { name: "Sparkles the Unicorn", avatar: "🦄", sadAvatar: "🦄", food: "🧁", flyingFood: ["🧁"], happy: "✨", sad: "💔", chew: "😋", actionName: "Sparkles" },
            kitten: { name: "Whiskers the Kitten", avatar: "🐱", sadAvatar: "😿", food: "🍓 & 🐟", flyingFood: ["🍓", "🐟", "🫐"], happy: "💖", sad: "💔", chew: "👅", actionName: "Whiskers" },
            puppy: { name: "Barnaby the Puppy", avatar: "🐶", sadAvatar: "🐶", food: "🥩", flyingFood: ["🥩", "🦴"], happy: "💖", sad: "💔", chew: "🦴", actionName: "Barnaby" },
            bunny: { name: "Clover the Bunny", avatar: "🐰", sadAvatar: "🐰", food: "🥕", flyingFood: ["🥕"], happy: "💖", sad: "💔", chew: "😋", actionName: "Clover" },
            panda: { name: "Pip the Panda", avatar: "🐼", sadAvatar: "🐼", food: "🍪", flyingFood: ["🍪", "🎋"], happy: "💖", sad: "💔", chew: "😋", actionName: "Pip" }
        };

        let savedPet = localStorage.getItem(this.PET_STORAGE_KEY);
        if (!savedPet || !this.PETS[savedPet]) {
            savedPet = 'unicorn';
        }
        this.selectedPet = savedPet;

        let savedStage = localStorage.getItem(this.STAGE_STORAGE_KEY);
        if (!savedStage || !this.STAGES[savedStage]) {
            savedStage = 'multiplication';
        }
        this.selectedStage = savedStage;

        this.todayStr = this.getTodayDateString();
        this.migrateLegacyStorage();
        this.state = this.loadTodayState();
        this.questionStartTime = null;
        this._timerQuestionIndex = null;

        this.quizActive = false;
        this.quizTimerInterval = null;
        this.quizAttempted = 0;
        this.quizCorrect = 0;
        this.quizTimeLeft = 0;
        this.quizQuestion = null;

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
     * One-time migration of pre-stage data (originally multiplication-only) into
     * the new per-stage storage keys, so existing progress/history isn't lost.
     */
    migrateLegacyStorage() {
        const legacyHistory = localStorage.getItem('math_practice_history');
        if (legacyHistory && !localStorage.getItem(this.getHistoryKey('multiplication'))) {
            localStorage.setItem(this.getHistoryKey('multiplication'), legacyHistory);
        }

        const legacyTodayKey = this.STORAGE_KEY_PREFIX + this.todayStr;
        const legacyToday = localStorage.getItem(legacyTodayKey);
        if (legacyToday && !localStorage.getItem(this.getDailyStateKey('multiplication'))) {
            localStorage.setItem(this.getDailyStateKey('multiplication'), legacyToday);
        }
    }

    getDailyStateKey(stage) {
        return `${this.STORAGE_KEY_PREFIX}${stage}_${this.todayStr}`;
    }

    getHistoryKey(stage) {
        return `${this.HISTORY_KEY_PREFIX}${stage}`;
    }

    /**
     * Load today's practice state from localStorage or initialize a new one
     */
    loadTodayState() {
        const key = this.getDailyStateKey(this.selectedStage);
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && Array.isArray(parsed.questions) && parsed.questions.length === this.TOTAL_QUESTIONS) {
                    return parsed;
                }
            } catch (e) {
                console.error("Error parsing saved state", e);
            }
        }
        
        // Initialize new state for today
        const questions = this.generateDailyQuestions(this.selectedStage);
        const newState = {
            date: this.todayStr,
            stage: this.selectedStage,
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
        const key = this.getDailyStateKey(this.selectedStage);
        localStorage.setItem(key, JSON.stringify(this.state));
    }

    /**
     * Generate 10 tailored questions for the given stage (multiplication or division).
     * Difficulty ramps the same way for both: division questions are built as the
     * inverse of a multiplication fact, so the numbers stay at the same level she's
     * already comfortable with from multiplication. Division is long division:
     * a larger dividend divided by a smaller (1-2 digit) divisor, often leaving
     * a remainder, mirroring how she's practicing it at school.
     */
    generateDailyQuestions(stage) {
        const questions = [];
        for (let i = 0; i < this.TOTAL_QUESTIONS; i++) {
            questions.push(this.generateQuestionForDifficulty(stage, i));
        }
        return questions;
    }

    rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Build a single question for a stage at a given difficulty tier (0-9, easiest
     * to hardest). Shared by the daily challenge (which ramps through all tiers)
     * and the Speed Quiz (which picks a random tier each time).
     */
    generateQuestionForDifficulty(stage, i) {
        if (stage === 'division') {
            let divisor, quotient;
            if (i < 2) {
                divisor = this.rand(2, 9); quotient = this.rand(10, 20);
            } else if (i < 5) {
                divisor = this.rand(2, 9); quotient = this.rand(20, 50);
            } else if (i < 8) {
                divisor = this.rand(10, 20); quotient = this.rand(15, 40);
            } else {
                divisor = this.rand(10, 25); quotient = this.rand(30, 60);
            }

            const remainder = this.rand(0, divisor - 1);
            const dividend = divisor * quotient + remainder;

            return {
                num1: dividend, num2: divisor, answer: quotient, remainder: remainder, correct: null, attempts: 0, timeSeconds: null
            };
        }

        let num1, num2;
        if (i < 2) {
            num1 = this.rand(10, 15); num2 = this.rand(10, 15);
        } else if (i < 5) {
            num1 = this.rand(2, 5) * 10; num2 = this.rand(11, 25);
        } else if (i < 8) {
            num1 = this.rand(12, 25); num2 = this.rand(12, 25);
        } else {
            num1 = this.rand(25, 45); num2 = this.rand(25, 45);
        }

        if (Math.random() > 0.5) {
            const temp = num1; num1 = num2; num2 = temp;
        }

        return {
            num1: num1, num2: num2, answer: num1 * num2, correct: null, attempts: 0, timeSeconds: null
        };
    }

    /**
     * Initialize DOM elements and event listeners
     */
    initDOM() {
        this.answerInput = document.getElementById('answer-input');
        this.remainderInput = document.getElementById('remainder-input');
        this.remainderLabel = document.getElementById('remainder-label');
        this.checkBtn = document.getElementById('check-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.feedbackMsg = document.getElementById('feedback-message');
        this.petModal = document.getElementById('pet-selector-modal');

        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                if (!this.checkBtn.classList.contains('hidden')) {
                    this.checkAnswer();
                } else if (!this.nextBtn.classList.contains('hidden')) {
                    this.nextQuestion();
                }
            }
        };
        this.answerInput.addEventListener('keyup', handleEnter);
        this.remainderInput.addEventListener('keyup', handleEnter);

        this.quizAnswerInput = document.getElementById('quiz-answer-input');
        this.quizRemainderInput = document.getElementById('quiz-remainder-input');
        this.quizRemainderLabel = document.getElementById('quiz-remainder-label');
        this.quizFeedbackMsg = document.getElementById('quiz-feedback-message');

        const handleQuizEnter = (e) => {
            if (e.key === 'Enter') {
                this.checkQuizAnswer();
            }
        };
        this.quizAnswerInput.addEventListener('keyup', handleQuizEnter);
        this.quizRemainderInput.addEventListener('keyup', handleQuizEnter);
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

        // Populate Trophy Shelf
        const stageInfo = this.STAGES[this.selectedStage];
        const shelfTitleEl = document.getElementById('shelf-title-display');
        if (shelfTitleEl) {
            shelfTitleEl.textContent = `🏆 ${pet.actionName}'s ${stageInfo.name} Trophy Shelf 🏆`;
        }
        const shelfTrophiesEl = document.getElementById('shelf-trophies-display');
        if (shelfTrophiesEl) {
            shelfTrophiesEl.innerHTML = '';
            let history = this.getHistory(this.selectedStage);
            if (history.length === 0) {
                shelfTrophiesEl.innerHTML = `<span style="font-size: 0.9rem; color: var(--color-text-muted);">No trophies yet. Finish today's challenge to earn one!</span>`;
            } else {
                history.forEach((item, idx) => {
                    let trophyIcon = "🎖️";
                    if (item.successRate === 100) trophyIcon = "🏆";
                    else if (item.successRate >= 80) trophyIcon = "🌟";
                    
                    const span = document.createElement('span');
                    span.className = 'shelf-trophy';
                    span.textContent = trophyIcon;
                    span.title = `${this.formatDate(item.date)}: ${item.successRate}% Success (${item.stars} ⭐)`;
                    shelfTrophiesEl.appendChild(span);
                });
            }
        }
    }

    /**
     * Switch between practice, summary, and quiz tabs
     */
    switchTab(tabId) {
        if (tabId !== 'quiz' && this.quizActive) {
            this.abortQuiz();
        }

        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('active');
        });

        const activeBtn = document.getElementById(`tab-${tabId}`);
        const activeView = document.getElementById(`view-${tabId}`);

        if (activeBtn) activeBtn.classList.add('active');
        if (activeView) {
            activeView.classList.remove('hidden');
            activeView.classList.add('active');
        }

        if (tabId === 'summary') {
            this.renderSummary();
        } else if (tabId === 'practice') {
            this.render();
            if (this.answerInput && !this.state.completed) {
                this.answerInput.focus();
            }
        } else if (tabId === 'quiz') {
            this.resetQuizView();
        }
    }

    /**
     * Switch between multiplication and division stages
     */
    switchStage(stage) {
        if (!this.STAGES[stage] || stage === this.selectedStage) {
            return;
        }
        if (this.nextTimer) {
            clearTimeout(this.nextTimer);
            this.nextTimer = null;
        }
        if (this.quizActive) {
            this.abortQuiz();
        }
        this.selectedStage = stage;
        localStorage.setItem(this.STAGE_STORAGE_KEY, stage);

        this.state = this.loadTodayState();
        this._timerQuestionIndex = null;
        this.render();
        if (document.getElementById('view-summary').classList.contains('active')) {
            this.renderSummary();
        }
        if (document.getElementById('view-quiz').classList.contains('active')) {
            this.resetQuizView();
        }
        if (this.answerInput && !this.state.completed) {
            this.answerInput.focus();
        }
    }

    /**
     * Render practice view
     */
    render() {
        if (this.nextTimer) {
            clearTimeout(this.nextTimer);
            this.nextTimer = null;
        }
        this.renderPetArea();
        const stageInfo = this.STAGES[this.selectedStage];
        document.getElementById('math-operator').textContent = stageInfo.symbol;

        document.querySelectorAll('.stage-btn').forEach(btn => btn.classList.remove('active'));
        const activeStageBtn = document.getElementById(`stage-${this.selectedStage}`);
        if (activeStageBtn) activeStageBtn.classList.add('active');

        document.getElementById('current-date-display').textContent = `📅 ${this.formatDate(this.todayStr)}`;
        
        const progressPct = (this.state.currentIndex / this.TOTAL_QUESTIONS) * 100;
        document.getElementById('practice-progress').style.width = `${progressPct}%`;
        document.getElementById('practice-progress-text').textContent = `${this.state.currentIndex} / ${this.TOTAL_QUESTIONS}`;
        
        // Update Sidebar Stats
        document.getElementById('sidebar-stars').textContent = `${this.state.stars} ⭐`;
        
        let firstAttemptCorrect = 0;
        this.state.questions.slice(0, this.state.currentIndex).forEach(q => {
            if (q.correct && q.attempts === 1) {
                firstAttemptCorrect++;
            }
        });
        const currentSuccess = this.state.currentIndex > 0 ? Math.round((firstAttemptCorrect / this.state.currentIndex) * 100) : 100;
        document.getElementById('sidebar-success').textContent = `${currentSuccess}%`;

        const timedSoFar = this.state.questions.slice(0, this.state.currentIndex).filter(q => q.timeSeconds != null);
        const avgTimeSoFar = timedSoFar.length > 0
            ? Math.round(timedSoFar.reduce((sum, q) => sum + q.timeSeconds, 0) / timedSoFar.length)
            : null;
        document.getElementById('sidebar-avg-time').textContent = avgTimeSoFar != null ? this.formatSeconds(avgTimeSoFar) : '–';

        const practiceGridArea = document.getElementById('practice-grid-area');
        const dayCompleteArea = document.getElementById('day-complete-area');

        if (this.state.completed) {
            practiceGridArea.classList.add('hidden');
            dayCompleteArea.classList.remove('hidden');
            document.getElementById('today-success-rate').textContent = `${this.state.successRate}%`;
            document.getElementById('today-stars-earned').textContent = `${this.state.stars} ⭐`;
            document.getElementById('today-avg-time').textContent = this.state.avgTimeSeconds != null ? this.formatSeconds(this.state.avgTimeSeconds) : '–';
            return;
        }

        practiceGridArea.classList.remove('hidden');
        dayCompleteArea.classList.add('hidden');

        const q = this.state.questions[this.state.currentIndex];
        if (this._timerQuestionIndex !== this.state.currentIndex) {
            this.questionStartTime = Date.now();
            this._timerQuestionIndex = this.state.currentIndex;
        }
        document.getElementById('question-number-badge').textContent = `${stageInfo.icon} Question ${this.state.currentIndex + 1} of ${this.TOTAL_QUESTIONS}`;
        document.getElementById('stars-earned-display').textContent = `⭐ ${this.state.stars}`;

        document.getElementById('num1').textContent = q.num1;
        document.getElementById('num2').textContent = q.num2;

        this.answerInput.value = '';
        this.answerInput.disabled = false;
        this.answerInput.focus();

        this.remainderInput.value = '';
        this.remainderInput.disabled = false;
        this.remainderLabel.classList.toggle('hidden', !stageInfo.hasRemainder);
        this.remainderInput.classList.toggle('hidden', !stageInfo.hasRemainder);

        this.checkBtn.classList.remove('hidden');
        this.nextBtn.classList.add('hidden');
        
        this.feedbackMsg.className = 'feedback-area';
        this.feedbackMsg.textContent = '';
    }

    /**
     * Check answer and trigger pet feeding / reactions
     */
    checkAnswer() {
        const stageInfo = this.STAGES[this.selectedStage];
        const userAnswer = parseInt(this.answerInput.value, 10);
        const userRemainder = stageInfo.hasRemainder ? parseInt(this.remainderInput.value, 10) : 0;

        if (isNaN(userAnswer) || (stageInfo.hasRemainder && isNaN(userRemainder))) {
            this.showFeedback(
                stageInfo.hasRemainder ? "💡 Please enter both the answer and the remainder!" : "💡 Please enter a number first!",
                "warning"
            );
            return;
        }

        const q = this.state.questions[this.state.currentIndex];
        const pet = this.PETS[this.selectedPet];
        q.attempts++;

        const isCorrect = stageInfo.hasRemainder
            ? (userAnswer === q.answer && userRemainder === q.remainder)
            : (userAnswer === q.answer);

        if (isCorrect) {
            // Correct Answer!
            q.correct = true;
            q.timeSeconds = this.questionStartTime ? Math.max(1, Math.round((Date.now() - this.questionStartTime) / 1000)) : null;
            if (q.attempts === 1) {
                this.state.stars++;
            }
            
            this.answerInput.disabled = true;
            this.remainderInput.disabled = true;
            this.checkBtn.classList.add('hidden');
            this.nextBtn.classList.remove('hidden');
            this.nextBtn.focus();

            this.playChime(true);
            this.triggerConfetti();
            
            const flyingIcon = (pet.flyingFood && pet.flyingFood.length > 0) 
                ? pet.flyingFood[Math.floor(Math.random() * pet.flyingFood.length)] 
                : pet.food;

            // Trigger Flying Food Animation
            this.animateFlyingFood(flyingIcon);

            const praises = [
                `🎉 Wow! ${pet.actionName} loves the ${flyingIcon}! ⭐`,
                `✨ Amazing! ${pet.actionName} is so happy! 💖`,
                `🦄 Brilliant! That ${flyingIcon} looks delicious! 🌸`,
                `🌟 Incredible job! ${pet.actionName} is doing a happy dance! 🎈`
            ];
            const randomPraise = praises[Math.floor(Math.random() * praises.length)];
            this.showFeedback(randomPraise, "success");

            this.saveState();
            
            // Update sidebar stats immediately
            document.getElementById('sidebar-stars').textContent = `${this.state.stars} ⭐`;

            // Auto-advance to next question after 2.2 seconds
            this.nextTimer = setTimeout(() => {
                this.nextQuestion();
            }, 2200);
        } else {
            // Incorrect Answer
            this.playChime(false);
            
            // Pet gets sad
            const avatarEl = document.getElementById('pet-avatar');
            avatarEl.className = 'pet-avatar pet-sad';
            avatarEl.textContent = pet.sadAvatar || pet.avatar;
            document.getElementById('pet-mood-bubble').textContent = pet.sad;
            document.getElementById('pet-instruction').textContent = `Oh no, ${pet.actionName} is still hungry! Let's try again!`;
            
            setTimeout(() => {
                if (avatarEl.classList.contains('pet-sad')) {
                    avatarEl.className = 'pet-avatar';
                    avatarEl.textContent = pet.avatar;
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
            this.remainderInput.value = '';
            this.answerInput.focus();
            this.saveState();
        }
    }

    /**
     * Animate Food Flying from Input to Pet Avatar Mouth
     */
    animateFlyingFood(flyingIcon) {
        const pet = this.PETS[this.selectedPet];
        const startRect = this.answerInput.getBoundingClientRect();
        const avatarEl = document.getElementById('pet-avatar');
        const endRect = avatarEl.getBoundingClientRect();

        const foodEl = document.createElement('div');
        foodEl.className = 'flying-food';
        foodEl.textContent = flyingIcon || pet.food;
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
        document.getElementById('pet-instruction').textContent = `${pet.actionName} happily munches on the ${flyingIcon || pet.food}! Yum! 😋`;

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
        if (this.nextTimer) {
            clearTimeout(this.nextTimer);
            this.nextTimer = null;
        }
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
        let totalTime = 0, timedCount = 0;
        this.state.questions.forEach(q => {
            if (q.correct && q.attempts === 1) {
                firstAttemptCorrect++;
            }
            if (q.timeSeconds != null) {
                totalTime += q.timeSeconds;
                timedCount++;
            }
        });
        this.state.successRate = Math.round((firstAttemptCorrect / this.TOTAL_QUESTIONS) * 100);
        this.state.avgTimeSeconds = timedCount > 0 ? Math.round(totalTime / timedCount) : null;
        this.saveState();
        this.saveToHistory();
        this.render();
        this.triggerConfetti(true);
    }

    /**
     * Restart today's challenge with a brand new set of questions
     */
    restartDailyChallenge() {
        const questions = this.generateDailyQuestions(this.selectedStage);
        this.state = {
            date: this.todayStr,
            stage: this.selectedStage,
            questions: questions,
            currentIndex: 0,
            completed: false,
            stars: 0,
            successRate: 0
        };
        this._timerQuestionIndex = null;
        this.saveState();
        this.render();
        if (this.answerInput) {
            this.answerInput.focus();
        }
        this.showFeedback("✨ Challenge restarted! Let's feed your pet again! ✨", "success");
    }

    getQuizBestKey(stage) {
        return `${this.QUIZ_BEST_KEY_PREFIX}${stage}`;
    }

    getQuizBest(stage) {
        const saved = localStorage.getItem(this.getQuizBestKey(stage));
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    }

    /**
     * Reset the Speed Quiz view back to its idle "ready to start" screen,
     * showing the current stage's best score.
     */
    resetQuizView() {
        if (this.quizTimerInterval) {
            clearInterval(this.quizTimerInterval);
            this.quizTimerInterval = null;
        }
        this.quizActive = false;

        const stageInfo = this.STAGES[this.selectedStage];
        document.getElementById('quiz-idle-area').classList.remove('hidden');
        document.getElementById('quiz-active-area').classList.add('hidden');
        document.getElementById('quiz-results-area').classList.add('hidden');
        document.getElementById('quiz-idle-instruction').textContent =
            `Answer as many ${stageInfo.name} questions as you can in ${this.QUIZ_DURATION_SECONDS} seconds!`;

        const best = this.getQuizBest(this.selectedStage);
        document.getElementById('quiz-best-score-display').textContent = best
            ? `${best.correct} correct (${best.attempted} tried)`
            : 'Not played yet';
    }

    /**
     * Abort an in-progress quiz (e.g. because the player navigated away or
     * switched stage) without recording a score.
     */
    abortQuiz() {
        if (this.quizTimerInterval) {
            clearInterval(this.quizTimerInterval);
            this.quizTimerInterval = null;
        }
        this.quizActive = false;
    }

    startQuiz() {
        this.quizActive = true;
        this.quizAttempted = 0;
        this.quizCorrect = 0;
        this.quizTimeLeft = this.QUIZ_DURATION_SECONDS;

        document.getElementById('quiz-idle-area').classList.add('hidden');
        document.getElementById('quiz-results-area').classList.add('hidden');
        document.getElementById('quiz-active-area').classList.remove('hidden');

        this.updateQuizHud();
        this.showNextQuizQuestion();

        if (this.quizTimerInterval) {
            clearInterval(this.quizTimerInterval);
        }
        this.quizTimerInterval = setInterval(() => {
            this.quizTimeLeft--;
            this.updateQuizHud();
            if (this.quizTimeLeft <= 0) {
                this.endQuiz();
            }
        }, 1000);
    }

    updateQuizHud() {
        document.getElementById('quiz-timer-display').textContent = `⏱️ ${this.quizTimeLeft}s`;
        document.getElementById('quiz-live-score-display').textContent = `✅ ${this.quizCorrect} · 📝 ${this.quizAttempted}`;
        const pct = Math.max(0, (this.quizTimeLeft / this.QUIZ_DURATION_SECONDS) * 100);
        document.getElementById('quiz-timer-bar').style.width = `${pct}%`;
    }

    showNextQuizQuestion() {
        const stageInfo = this.STAGES[this.selectedStage];
        this.quizQuestion = this.generateQuestionForDifficulty(this.selectedStage, this.rand(0, this.TOTAL_QUESTIONS - 1));

        document.getElementById('quiz-operator').textContent = stageInfo.symbol;
        document.getElementById('quiz-num1').textContent = this.quizQuestion.num1;
        document.getElementById('quiz-num2').textContent = this.quizQuestion.num2;

        this.quizAnswerInput.value = '';
        this.quizRemainderInput.value = '';
        this.quizRemainderLabel.classList.toggle('hidden', !stageInfo.hasRemainder);
        this.quizRemainderInput.classList.toggle('hidden', !stageInfo.hasRemainder);
        this.quizAnswerInput.focus();

        this.quizFeedbackMsg.className = 'feedback-area';
        this.quizFeedbackMsg.textContent = '';
    }

    /**
     * Check the current quiz question. Unlike the daily challenge, each question
     * gets a single attempt - right or wrong, we immediately move on to keep the
     * sprint's pace up.
     */
    checkQuizAnswer() {
        if (!this.quizActive) return;

        const stageInfo = this.STAGES[this.selectedStage];
        const userAnswer = parseInt(this.quizAnswerInput.value, 10);
        const userRemainder = stageInfo.hasRemainder ? parseInt(this.quizRemainderInput.value, 10) : 0;

        if (isNaN(userAnswer) || (stageInfo.hasRemainder && isNaN(userRemainder))) {
            return;
        }

        const isCorrect = stageInfo.hasRemainder
            ? (userAnswer === this.quizQuestion.answer && userRemainder === this.quizQuestion.remainder)
            : (userAnswer === this.quizQuestion.answer);

        this.quizAttempted++;
        if (isCorrect) {
            this.quizCorrect++;
            this.playChime(true);
            this.quizFeedbackMsg.className = 'feedback-area success';
            this.quizFeedbackMsg.textContent = '✅ Correct!';
        } else {
            this.playChime(false);
            const correctAnswerText = stageInfo.hasRemainder
                ? `${this.quizQuestion.answer} R ${this.quizQuestion.remainder}`
                : this.quizQuestion.answer;
            this.quizFeedbackMsg.className = 'feedback-area error';
            this.quizFeedbackMsg.textContent = `❌ It was ${correctAnswerText}`;
        }

        this.updateQuizHud();
        if (this.quizActive) {
            this.showNextQuizQuestion();
        }
    }

    /**
     * End the quiz when time runs out and show the results screen.
     */
    endQuiz() {
        if (this.quizTimerInterval) {
            clearInterval(this.quizTimerInterval);
            this.quizTimerInterval = null;
        }
        this.quizActive = false;

        document.getElementById('quiz-active-area').classList.add('hidden');
        document.getElementById('quiz-results-area').classList.remove('hidden');

        const accuracy = this.quizAttempted > 0 ? Math.round((this.quizCorrect / this.quizAttempted) * 100) : 0;
        document.getElementById('quiz-result-attempted').textContent = this.quizAttempted;
        document.getElementById('quiz-result-correct').textContent = this.quizCorrect;
        document.getElementById('quiz-result-accuracy').textContent = `${accuracy}%`;

        const best = this.getQuizBest(this.selectedStage);
        const isNewBest = this.quizAttempted > 0 && (!best || this.quizCorrect > best.correct ||
            (this.quizCorrect === best.correct && this.quizAttempted > best.attempted));

        const newBestMsgEl = document.getElementById('quiz-new-best-message');
        if (isNewBest) {
            localStorage.setItem(this.getQuizBestKey(this.selectedStage), JSON.stringify({
                correct: this.quizCorrect, attempted: this.quizAttempted, date: this.todayStr
            }));
            newBestMsgEl.classList.remove('hidden');
        } else {
            newBestMsgEl.classList.add('hidden');
        }
        this.triggerConfetti(isNewBest);
    }

    /**
     * Get practice history for a stage, seeding starter data for multiplication if empty
     */
    getHistory(stage = this.selectedStage) {
        const savedHistory = localStorage.getItem(this.getHistoryKey(stage));
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                if (parsed && parsed.length > 0) return parsed;
            } catch (e) { console.error(e); }
        }

        if (stage !== 'multiplication') {
            return [];
        }

        // Seed initial starter history so the Trophy Shelf and Pet Room look beautiful immediately!
        const starterHistory = [
            { date: '2026-05-16', totalQuestions: 10, stars: 10, successRate: 100, avgTimeSeconds: 9 },
            { date: '2026-05-15', totalQuestions: 10, stars: 9, successRate: 90, avgTimeSeconds: 11 },
            { date: '2026-05-14', totalQuestions: 10, stars: 10, successRate: 100, avgTimeSeconds: 12 }
        ];
        localStorage.setItem(this.getHistoryKey(stage), JSON.stringify(starterHistory));
        return starterHistory;
    }

    /**
     * Save today's results to history
     */
    saveToHistory() {
        let history = this.getHistory(this.selectedStage);
        history = history.filter(item => item.date !== this.todayStr);
        history.push({
            date: this.todayStr,
            totalQuestions: this.TOTAL_QUESTIONS,
            stars: this.state.stars,
            successRate: this.state.successRate,
            avgTimeSeconds: this.state.avgTimeSeconds
        });
        history.sort((a, b) => b.date.localeCompare(a.date));
        localStorage.setItem(this.getHistoryKey(this.selectedStage), JSON.stringify(history));
    }

    /**
     * Render Pet Room summary
     */
    renderSummary() {
        let history = this.getHistory(this.selectedStage);
        const stageInfo = this.STAGES[this.selectedStage];

        const totalDays = history.length;
        const totalStars = history.reduce((sum, item) => sum + (item.stars || 0), 0);
        const avgSuccess = totalDays > 0
            ? Math.round(history.reduce((sum, item) => sum + (item.successRate || 0), 0) / totalDays)
            : 0;
        const timedDays = history.filter(item => item.avgTimeSeconds != null);
        const avgTimeOverall = timedDays.length > 0
            ? Math.round(timedDays.reduce((sum, item) => sum + item.avgTimeSeconds, 0) / timedDays.length)
            : null;

        document.getElementById('total-days-practiced').textContent = totalDays;
        document.getElementById('total-stars-collected').textContent = totalStars;
        document.getElementById('average-success-rate').textContent = `${avgSuccess}%`;
        document.getElementById('average-time-per-question').textContent = avgTimeOverall != null ? this.formatSeconds(avgTimeOverall) : '–';

        const trophyAreaTitleEl = document.getElementById('trophy-area-title');
        if (trophyAreaTitleEl) trophyAreaTitleEl.textContent = `🏆 Grand ${stageInfo.name} Trophy Shelf 🏆`;

        const historyTitleEl = document.getElementById('history-table-title');
        if (historyTitleEl) historyTitleEl.textContent = `📜 ${stageInfo.name} Adventure Log 📜`;

        // Populate Pet Room Living Area
        const pet = this.PETS[this.selectedPet];
        const roomPetNameEl = document.getElementById('room-pet-name');
        if (roomPetNameEl) roomPetNameEl.textContent = pet.name;
        
        const roomPetAvatarEl = document.getElementById('room-pet-avatar');
        if (roomPetAvatarEl) roomPetAvatarEl.textContent = pet.avatar;

        const roomPetStatusEl = document.getElementById('room-pet-status');
        if (roomPetStatusEl) roomPetStatusEl.textContent = `${pet.actionName} is resting happily in her magical room! ✨`;

        // Populate Grand Trophy Shelf
        const grandShelfEl = document.getElementById('grand-trophy-shelf-display');
        if (grandShelfEl) {
            grandShelfEl.innerHTML = '';
            if (history.length === 0) {
                grandShelfEl.innerHTML = `<div class="empty-shelf-msg">No trophies collected yet. Complete today's challenge to place your first trophy on the shelf! 🏆</div>`;
            } else {
                history.forEach(item => {
                    let trophyIcon = "🎖️";
                    let tierClass = "bronze-trophy";
                    if (item.successRate === 100) { trophyIcon = "🏆"; tierClass = "gold-trophy"; }
                    else if (item.successRate >= 80) { trophyIcon = "🌟"; tierClass = "silver-trophy"; }
                    
                    const trophyBox = document.createElement('div');
                    trophyBox.className = `grand-trophy-box ${tierClass}`;
                    trophyBox.innerHTML = `
                        <div class="grand-trophy-icon">${trophyIcon}</div>
                        <div class="grand-trophy-date">${this.formatDate(item.date)}</div>
                        <div class="grand-trophy-stars">${item.stars || 0} ⭐</div>
                    `;
                    grandShelfEl.appendChild(trophyBox);
                });
            }
        }

        const tbody = document.getElementById('history-table-body');
        if (tbody) {
            tbody.innerHTML = '';

            if (history.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="5">No practice records found yet. Complete today's challenge to earn your first trophy! 🏆</td>`;
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
                    <td>${item.totalQuestions || 10}</td>
                    <td><strong>${item.successRate || 0}%</strong></td>
                    <td>${item.avgTimeSeconds != null ? this.formatSeconds(item.avgTimeSeconds) : '–'}</td>
                    <td>${badge}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    showFeedback(msg, type) {
        this.feedbackMsg.className = `feedback-area ${type}`;
        this.feedbackMsg.textContent = msg;
    }

    formatDate(dateStr) {
        if (!dateStr) return 'Today';
        if (typeof dateStr !== 'string') {
            try { return String(dateStr); } catch(e) { return 'Today'; }
        }
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    formatSeconds(seconds) {
        return `${seconds}s`;
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
