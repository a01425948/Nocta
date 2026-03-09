// ============================================
// SLEEP TIPS DATA
// ============================================
const SLEEP_TIPS = [
    {
        icon: '📱',
        text: 'Avoid screens at least 30 minutes before bed. Blue light affects your melatonin production.',
        category: 'Technology'
    },
    {
        icon: '⏰',
        text: 'Keep regular sleep and wake times, even on weekends.',
        category: 'Routine'
    },
    {
        icon: '☕',
        text: 'Avoid caffeine after 4 PM. Its effects can last up to 6 hours.',
        category: 'Diet'
    },
    {
        icon: '🌡️',
        text: 'Keep your room cool, between 60-67°F (15-19°C) is the ideal temperature for sleep.',
        category: 'Environment'
    },
    {
        icon: '🌑',
        text: 'Use blackout curtains or an eye mask. Complete darkness improves sleep quality.',
        category: 'Environment'
    },
    {
        icon: '🧘',
        text: 'Practice relaxation techniques like meditation or deep breathing before bed.',
        category: 'Wellness'
    },
    {
        icon: '🏃',
        text: 'Exercise regularly, but avoid intense workouts 3 hours before bedtime.',
        category: 'Activity'
    },
    {
        icon: '🍷',
        text: 'Avoid alcohol before bed. It can disrupt deep sleep phases.',
        category: 'Diet'
    },
    {
        icon: '🛏️',
        text: 'Use your bed only for sleep. Avoid working or watching TV in it.',
        category: 'Habits'
    },
    {
        icon: '🎵',
        text: 'Try relaxing sounds or white noise if it helps you fall asleep.',
        category: 'Environment'
    },
    {
        icon: '🍽️',
        text: 'Avoid heavy meals 2-3 hours before bed. You can have a light snack if hungry.',
        category: 'Diet'
    },
    {
        icon: '📖',
        text: 'Reading a book can help you relax. Choose something light and pleasant.',
        category: 'Routine'
    },
    {
        icon: '🚿',
        text: 'A warm bath 1-2 hours before bed can improve sleep quality.',
        category: 'Routine'
    },
    {
        icon: '☀️',
        text: 'Exposure to natural light during the day helps regulate your sleep cycle.',
        category: 'Habits'
    },
    {
        icon: '😴',
        text: 'If you can\'t sleep within 20 minutes, get up and do something relaxing until you feel sleepy.',
        category: 'Habits'
    }
];

// ============================================
// AUTHENTICATION MANAGER
// ============================================
class AuthManager {
    constructor() {
        this.USERS_KEY = 'nocta_users';
        this.CURRENT_USER_KEY = 'nocta_current_user';
    }

    // Get all users
    getUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    }

    // Save users
    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }

    // Register new user
    register(name, email, password) {
        const users = this.getUsers();
        
        // Check if email already exists
        if (users.find(u => u.email === email)) {
            throw new Error('Email already registered');
        }

        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            sleepGoal: 8
        };

        users.push(newUser);
        this.saveUsers(users);
        return newUser;
    }

    // Login user
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            throw new Error('User not found');
        }

        if (user.password !== this.hashPassword(password)) {
            throw new Error('Incorrect password');
        }

        // Save current user
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email
        }));

        return user;
    }

    // Logout
    logout() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    }

    // Get current user
    getCurrentUser() {
        const user = localStorage.getItem(this.CURRENT_USER_KEY);
        return user ? JSON.parse(user) : null;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    // Simple password hashing (for demo purposes)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // Update user profile
    updateProfile(updates) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            this.saveUsers(users);
            
            // Update current user in localStorage
            const updatedCurrentUser = {
                id: users[userIndex].id,
                name: users[userIndex].name,
                email: users[userIndex].email
            };
            localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedCurrentUser));
        }
    }

    // Get user data
    getUserData(userId) {
        const users = this.getUsers();
        return users.find(u => u.id === userId);
    }
}

// ============================================
// DATA MANAGER (per user)
// ============================================
class DataManager {
    constructor(userId) {
        this.userId = userId;
        this.SLEEP_ENTRIES_KEY = `nocta_sleep_entries_${userId}`;
    }

    // Get sleep entries
    getSleepEntries() {
        const data = localStorage.getItem(this.SLEEP_ENTRIES_KEY);
        return data ? JSON.parse(data) : [];
    }

    // Save sleep entries
    saveSleepEntries(entries) {
        localStorage.setItem(this.SLEEP_ENTRIES_KEY, JSON.stringify(entries));
    }

    // Add new entry
    addSleepEntry(entry) {
        const entries = this.getSleepEntries();
        entries.unshift(entry);
        this.saveSleepEntries(entries);
    }

    // Delete entry
    deleteSleepEntry(id) {
        const entries = this.getSleepEntries();
        const filtered = entries.filter(entry => entry.id !== id);
        this.saveSleepEntries(filtered);
    }
}

// ============================================
// MAIN APP CLASS
// ============================================
class NoctaApp {
    constructor() {
        this.authManager = new AuthManager();
        this.dataManager = null;
        this.currentTipIndex = 0;
        this.init();
    }

    init() {
        // Check if user is logged in
        if (this.authManager.isLoggedIn()) {
            this.showApp();
        } else {
            this.showLogin();
        }

        this.setupAuthForms();
        this.setupInstallPrompt();
    }

    // ============================================
    // AUTH UI
    // ============================================
    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('registerScreen').style.display = 'none';
        document.getElementById('appContainer').classList.remove('show');
        document.getElementById('bottomNav').style.display = 'none';
    }

    showRegister() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('registerScreen').style.display = 'flex';
        document.getElementById('appContainer').classList.remove('show');
        document.getElementById('bottomNav').style.display = 'none';
    }

    showApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('registerScreen').style.display = 'none';
        document.getElementById('appContainer').classList.add('show');
        document.getElementById('bottomNav').style.display = 'flex';

        const user = this.authManager.getCurrentUser();
        this.dataManager = new DataManager(user.id);
        
        this.setupNavigation();
        this.setupSleepForm();
        this.setupProfileForm();
        this.setupTips();
        this.renderSleepHistory();
        this.updateStats();
        this.loadUserProfile();
    }

    // ============================================
    // AUTH FORMS
    // ============================================
    setupAuthForms() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                this.authManager.login(email, password);
                this.showApp();
                this.showNotification('✅ Welcome back!');
            } catch (error) {
                this.showError('loginError', error.message);
            }
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

            if (password !== passwordConfirm) {
                this.showError('registerError', 'Passwords do not match');
                return;
            }

            try {
                this.authManager.register(name, email, password);
                this.authManager.login(email, password);
                this.showApp();
                this.showNotification('✅ Account created successfully!');
            } catch (error) {
                this.showError('registerError', error.message);
            }
        });

        // Toggle between login and register
        document.getElementById('showRegister').addEventListener('click', () => {
            this.showRegister();
        });

        document.getElementById('showLogin').addEventListener('click', () => {
            this.showLogin();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                this.authManager.logout();
                this.showLogin();
                this.showNotification('👋 See you soon!');
            }
        });
    }

    showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        errorEl.textContent = message;
        errorEl.classList.add('show');
        setTimeout(() => {
            errorEl.classList.remove('show');
        }, 5000);
    }

    // ============================================
    // NAVIGATION
    // ============================================
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetSection = btn.dataset.section;

                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === targetSection) {
                        section.classList.add('active');
                    }
                });

                if (targetSection === 'profile') {
                    this.updateProfileStats();
                }
            });
        });
    }

    // ============================================
    // SLEEP FORM
    // ============================================
    setupSleepForm() {
        const form = document.getElementById('sleepForm');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const bedtime = document.getElementById('bedtime').value;
            const waketime = document.getElementById('waketime').value;
            const quality = document.querySelector('input[name="quality"]:checked').value;
            const notes = document.getElementById('notes').value;

            const entry = {
                id: Date.now(),
                date: new Date().toLocaleDateString('en-US'),
                bedtime,
                waketime,
                quality,
                notes
            };

            this.dataManager.addSleepEntry(entry);
            this.renderSleepHistory();
            this.updateStats();
            
            form.reset();
            document.getElementById('quality-good').checked = true;

            this.showNotification('✅ Record saved successfully');
        });
    }

    // ============================================
    // RENDER HISTORY
    // ============================================
    renderSleepHistory() {
        const container = document.getElementById('sleepHistoryContainer');
        const entries = this.dataManager.getSleepEntries();

        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">😴</div>
                    <p>No records yet.<br>Start tracking your sleep!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = entries.map(entry => {
            const duration = this.calculateDuration(entry.bedtime, entry.waketime);
            const qualityClass = `quality-${entry.quality === 'poor' ? 'bad' : entry.quality === 'fair' ? 'regular' : 'good'}`;
            const qualityEmoji = entry.quality === 'poor' ? '😣' : entry.quality === 'fair' ? '😐' : '😊';
            const qualityText = entry.quality.charAt(0).toUpperCase() + entry.quality.slice(1);

            return `
                <div class="sleep-entry">
                    <button class="delete-btn" onclick="app.deleteSleepEntry(${entry.id})">×</button>
                    <div class="entry-date">📅 ${entry.date}</div>
                    <div class="entry-main">
                        <div class="entry-times">
                            <div class="entry-time">🌙 Bedtime: ${entry.bedtime}</div>
                            <div class="entry-time">☀️ Wake up: ${entry.waketime}</div>
                        </div>
                        <div class="entry-quality">
                            <span class="quality-badge ${qualityClass}">
                                ${qualityEmoji} ${qualityText}
                            </span>
                        </div>
                    </div>
                    <div class="entry-duration">⏱️ ${duration}</div>
                    ${entry.notes ? `<div class="entry-notes">💭 ${entry.notes}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    deleteSleepEntry(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            this.dataManager.deleteSleepEntry(id);
            this.renderSleepHistory();
            this.updateStats();
            this.showNotification('🗑️ Record deleted');
        }
    }

    // ============================================
    // CALCULATIONS
    // ============================================
    calculateDuration(bedtime, waketime) {
        const [bedHour, bedMin] = bedtime.split(':').map(Number);
        const [wakeHour, wakeMin] = waketime.split(':').map(Number);

        let bedMinutes = bedHour * 60 + bedMin;
        let wakeMinutes = wakeHour * 60 + wakeMin;

        if (wakeMinutes < bedMinutes) {
            wakeMinutes += 24 * 60;
        }

        const totalMinutes = wakeMinutes - bedMinutes;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours}h ${minutes}m`;
    }

    calculateDurationInHours(bedtime, waketime) {
        const [bedHour, bedMin] = bedtime.split(':').map(Number);
        const [wakeHour, wakeMin] = waketime.split(':').map(Number);

        let bedMinutes = bedHour * 60 + bedMin;
        let wakeMinutes = wakeHour * 60 + wakeMin;

        if (wakeMinutes < bedMinutes) {
            wakeMinutes += 24 * 60;
        }

        const totalMinutes = wakeMinutes - bedMinutes;
        return totalMinutes / 60;
    }

    // ============================================
    // STATISTICS
    // ============================================
    updateStats() {
        const entries = this.dataManager.getSleepEntries();
        const totalEntries = entries.length;

        let avgSleep = 0;
        if (totalEntries > 0) {
            const totalHours = entries.reduce((sum, entry) => {
                return sum + this.calculateDurationInHours(entry.bedtime, entry.waketime);
            }, 0);
            avgSleep = totalHours / totalEntries;
        }

        const avgHours = Math.floor(avgSleep);
        const avgMinutes = Math.round((avgSleep - avgHours) * 60);

        document.getElementById('totalEntries').textContent = totalEntries;
        document.getElementById('avgSleep').textContent = `${avgHours}h ${avgMinutes}m`;
    }

    // ============================================
    // TIPS SYSTEM
    // ============================================
    setupTips() {
        this.showRandomTip();

        document.getElementById('newTipBtn').addEventListener('click', () => {
            this.showRandomTip();
        });

        this.renderAllTips();
    }

    showRandomTip() {
        const randomIndex = Math.floor(Math.random() * SLEEP_TIPS.length);
        const tip = SLEEP_TIPS[randomIndex];

        document.getElementById('tipIcon').textContent = tip.icon;
        document.getElementById('tipText').textContent = tip.text;
        document.getElementById('tipCategory').textContent = tip.category;

        this.currentTipIndex = randomIndex;
    }

    renderAllTips() {
        const container = document.getElementById('allTipsContainer');
        
        container.innerHTML = SLEEP_TIPS.map(tip => `
            <div class="card">
                <div style="display: flex; align-items: start; gap: 16px;">
                    <div style="font-size: 2rem; flex-shrink: 0;">${tip.icon}</div>
                    <div style="flex: 1;">
                        <div class="tip-category" style="margin-bottom: 8px;">${tip.category}</div>
                        <p style="color: #e5e7eb; line-height: 1.5;">${tip.text}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // PROFILE
    // ============================================
    setupProfileForm() {
        const saveBtn = document.getElementById('saveProfileBtn');
        
        saveBtn.addEventListener('click', () => {
            const name = document.getElementById('userName').value.trim();
            const goal = parseFloat(document.getElementById('sleepGoal').value);

            if (!name) {
                this.showNotification('⚠️ Please enter your name');
                return;
            }

            this.authManager.updateProfile({ name, sleepGoal: goal });
            this.loadUserProfile();
            this.showNotification('✅ Profile updated');
        });
    }

    loadUserProfile() {
        const user = this.authManager.getCurrentUser();
        const userData = this.authManager.getUserData(user.id);
        
        document.getElementById('profileName').textContent = userData.name;
        document.getElementById('profileGoal').textContent = userData.sleepGoal;
        document.getElementById('userName').value = userData.name;
        document.getElementById('sleepGoal').value = userData.sleepGoal;
        document.getElementById('userWelcome').textContent = `Welcome back, ${userData.name}!`;

        this.updateProfileStats();
    }

    updateProfileStats() {
        const entries = this.dataManager.getSleepEntries();
        const user = this.authManager.getCurrentUser();
        const userData = this.authManager.getUserData(user.id);
        const totalEntries = entries.length;

        let avgSleep = 0;
        if (totalEntries > 0) {
            const totalHours = entries.reduce((sum, entry) => {
                return sum + this.calculateDurationInHours(entry.bedtime, entry.waketime);
            }, 0);
            avgSleep = totalHours / totalEntries;
        }

        const avgHours = Math.floor(avgSleep);
        const avgMinutes = Math.round((avgSleep - avgHours) * 60);

        const goalAchieved = totalEntries > 0 
            ? Math.round((avgSleep / userData.sleepGoal) * 100) 
            : 0;

        let qualityScore = 0;
        if (totalEntries > 0) {
            const qualityValues = { 'poor': 1, 'fair': 2, 'good': 3 };
            const totalQuality = entries.reduce((sum, entry) => {
                return sum + qualityValues[entry.quality];
            }, 0);
            qualityScore = (totalQuality / totalEntries).toFixed(1);
        }

        document.getElementById('profileAvgSleep').textContent = `${avgHours}h ${avgMinutes}m`;
        document.getElementById('profileTotalEntries').textContent = totalEntries;
        document.getElementById('profileGoalAchieved').textContent = `${goalAchieved}%`;
        document.getElementById('profileQualityScore').textContent = qualityScore;

        this.updateMotivationalMessage(avgSleep, userData.sleepGoal, goalAchieved);
    }

    updateMotivationalMessage(avgSleep, goal, percentage) {
        const messages = {
            excellent: [
                '🌟 Amazing! You\'re sleeping excellently.',
                '✨ You\'re a sleep champion! Keep it up.',
                '🏆 Your sleep routine is exemplary.'
            ],
            good: [
                '😊 Very good! You\'re on the right track.',
                '👍 Great work with your sleep. Keep going.',
                '🌙 Your rest is improving every day.'
            ],
            needsImprovement: [
                '💪 You can improve. Try sleeping a bit more.',
                '🎯 Almost at your goal. You can do it!',
                '🌱 Every small change counts. Keep trying.'
            ],
            poor: [
                '😴 Your body needs more rest.',
                '💙 Prioritize your sleep. Your health will thank you.',
                '🌜 Try adjusting your nighttime routine.'
            ]
        };

        let category;
        if (percentage >= 90) category = 'excellent';
        else if (percentage >= 75) category = 'good';
        else if (percentage >= 50) category = 'needsImprovement';
        else category = 'poor';

        const messageArray = messages[category];
        const randomMessage = messageArray[Math.floor(Math.random() * messageArray.length)];

        document.getElementById('motivationText').textContent = randomMessage;
    }

    // ============================================
    // NOTIFICATIONS
    // ============================================
    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(139, 92, 246, 0.4);
            z-index: 10000;
            animation: slideDown 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ============================================
    // PWA INSTALL PROMPT
    // ============================================
    setupInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;

            // Show custom install prompt
            const installPrompt = document.getElementById('installPrompt');
            installPrompt.classList.add('show');

            document.getElementById('installBtn').addEventListener('click', async () => {
                installPrompt.classList.remove('show');
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response: ${outcome}`);
                deferredPrompt = null;
            });

            document.getElementById('dismissInstall').addEventListener('click', () => {
                installPrompt.classList.remove('show');
            });
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA installed');
            this.showNotification('🎉 Nocta installed successfully!');
        });
    }
}

// ============================================
// ANIMATIONS
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// ============================================
// INITIALIZE APP
// ============================================
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NoctaApp();
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed'));
}