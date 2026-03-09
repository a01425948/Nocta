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
// AUTHENTICATION MANAGER (Firebase)
// ============================================
class AuthManager {
    constructor() {
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDB;
        this.modules = window.firebaseModules;
        this.currentUser = null;
    }

    // Register new user with Firebase
    async register(name, email, password) {
        try {
            const userCredential = await this.modules.createUserWithEmailAndPassword(
                this.auth, 
                email, 
                password
            );
            
            // Update profile with display name
            await this.modules.updateProfile(userCredential.user, {
                displayName: name
            });

            // Create user document in Firestore
            await this.modules.setDoc(
                this.modules.doc(this.db, 'users', userCredential.user.uid),
                {
                    name: name,
                    email: email,
                    sleepGoal: 8,
                    createdAt: new Date().toISOString()
                }
            );

            return userCredential.user;
        } catch (error) {
            console.error('Registration error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    // Login user with Firebase
    async login(email, password) {
        try {
            const userCredential = await this.modules.signInWithEmailAndPassword(
                this.auth,
                email,
                password
            );
            return userCredential.user;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    // Logout
    async logout() {
        try {
            await this.modules.signOut(this.auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw new Error('Failed to logout');
        }
    }

    // Get current user
    getCurrentUser() {
        return this.auth.currentUser;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.auth.currentUser !== null;
    }

    // Listen to auth state changes
    onAuthStateChanged(callback) {
        return this.modules.onAuthStateChanged(this.auth, callback);
    }

    // Update user profile in Firestore
    async updateProfile(updates) {
        try {
            const user = this.getCurrentUser();
            if (!user) throw new Error('No user logged in');

            const userRef = this.modules.doc(this.db, 'users', user.uid);
            await this.modules.updateDoc(userRef, updates);

            // Update display name if name changed
            if (updates.name) {
                await this.modules.updateProfile(user, {
                    displayName: updates.name
                });
            }
        } catch (error) {
            console.error('Profile update error:', error);
            throw new Error('Failed to update profile');
        }
    }

    // Get user data from Firestore
    async getUserData(userId) {
        try {
            const userRef = this.modules.doc(this.db, 'users', userId);
            const userDoc = await this.modules.getDoc(userRef);
            
            if (userDoc.exists()) {
                return userDoc.data();
            } else {
                // Create default user data if doesn't exist
                const defaultData = {
                    name: this.auth.currentUser?.displayName || 'User',
                    email: this.auth.currentUser?.email || '',
                    sleepGoal: 8,
                    createdAt: new Date().toISOString()
                };
                await this.modules.setDoc(userRef, defaultData);
                return defaultData;
            }
        } catch (error) {
            console.error('Get user data error:', error);
            return {
                name: 'User',
                sleepGoal: 8
            };
        }
    }

    // Helper: Get user-friendly error messages
    getErrorMessage(errorCode) {
        const messages = {
            'auth/email-already-in-use': 'Email already registered',
            'auth/invalid-email': 'Invalid email address',
            'auth/operation-not-allowed': 'Operation not allowed',
            'auth/weak-password': 'Password should be at least 6 characters',
            'auth/user-disabled': 'This account has been disabled',
            'auth/user-not-found': 'User not found',
            'auth/wrong-password': 'Incorrect password',
            'auth/invalid-credential': 'Invalid email or password',
            'auth/too-many-requests': 'Too many attempts. Try again later',
            'auth/network-request-failed': 'Network error. Check your connection'
        };
        return messages[errorCode] || 'An error occurred. Please try again.';
    }
}

// ============================================
// DATA MANAGER (Firebase Firestore)
// ============================================
class DataManager {
    constructor(userId) {
        this.userId = userId;
        this.db = window.firebaseDB;
        this.modules = window.firebaseModules;
    }

    // Get sleep entries from Firestore
    async getSleepEntries() {
        try {
            const entriesRef = this.modules.collection(this.db, 'users', this.userId, 'sleepEntries');
            const q = this.modules.query(entriesRef, this.modules.orderBy('timestamp', 'desc'));
            const querySnapshot = await this.modules.getDocs(q);
            
            const entries = [];
            querySnapshot.forEach((doc) => {
                entries.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return entries;
        } catch (error) {
            console.error('Error getting sleep entries:', error);
            return [];
        }
    }

    // Add new sleep entry to Firestore
    async addSleepEntry(entry) {
        try {
            const entriesRef = this.modules.collection(this.db, 'users', this.userId, 'sleepEntries');
            await this.modules.addDoc(entriesRef, {
                ...entry,
                timestamp: new Date().getTime()
            });
        } catch (error) {
            console.error('Error adding sleep entry:', error);
            throw new Error('Failed to save sleep entry');
        }
    }

    // Delete sleep entry from Firestore
    async deleteSleepEntry(entryId) {
        try {
            const entryRef = this.modules.doc(this.db, 'users', this.userId, 'sleepEntries', entryId);
            await this.modules.deleteDoc(entryRef);
        } catch (error) {
            console.error('Error deleting sleep entry:', error);
            throw new Error('Failed to delete sleep entry');
        }
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
        // Wait for Firebase to be ready
        const checkFirebase = setInterval(() => {
            if (window.firebaseAuth && window.firebaseDB) {
                clearInterval(checkFirebase);
                this.setupAuthForms();
                this.setupInstallPrompt();
                
                // Listen to auth state changes
                this.authManager.onAuthStateChanged((user) => {
                    if (user) {
                        this.showApp();
                    } else {
                        this.showLogin();
                    }
                });
            }
        }, 100);
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

    async showApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('registerScreen').style.display = 'none';
        document.getElementById('appContainer').classList.add('show');
        document.getElementById('bottomNav').style.display = 'flex';

        const user = this.authManager.getCurrentUser();
        if (!user) return;
        
        this.dataManager = new DataManager(user.uid);
        
        this.setupNavigation();
        this.setupSleepForm();
        this.setupProfileForm();
        this.setupTips();
        await this.renderSleepHistory();
        await this.updateStats();
        await this.loadUserProfile();
    }

    // ============================================
    // AUTH FORMS
    // ============================================
    setupAuthForms() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const submitBtn = e.target.querySelector('button[type="submit"]');
            
            submitBtn.disabled = true;
            submitBtn.textContent = '🔄 Logging in...';

            try {
                await this.authManager.login(email, password);
                this.showNotification('✅ Welcome back!');
            } catch (error) {
                this.showError('loginError', error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '🔐 Login';
            }
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
            const submitBtn = e.target.querySelector('button[type="submit"]');

            if (password !== passwordConfirm) {
                this.showError('registerError', 'Passwords do not match');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = '🔄 Creating account...';

            try {
                await this.authManager.register(name, email, password);
                this.showNotification('✅ Account created successfully!');
            } catch (error) {
                this.showError('registerError', error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '✨ Create Account';
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
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            if (confirm('Are you sure you want to logout?')) {
                try {
                    await this.authManager.logout();
                    this.showNotification('👋 See you soon!');
                } catch (error) {
                    this.showNotification('❌ Failed to logout');
                }
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
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const bedtime = document.getElementById('bedtime').value;
            const waketime = document.getElementById('waketime').value;
            const quality = document.querySelector('input[name="quality"]:checked').value;
            const notes = document.getElementById('notes').value;
            const submitBtn = form.querySelector('button[type="submit"]');

            const entry = {
                date: new Date().toLocaleDateString('en-US'),
                bedtime,
                waketime,
                quality,
                notes
            };

            submitBtn.disabled = true;
            submitBtn.textContent = '💾 Saving...';

            try {
                await this.dataManager.addSleepEntry(entry);
                await this.renderSleepHistory();
                await this.updateStats();
                
                form.reset();
                document.getElementById('quality-good').checked = true;

                this.showNotification('✅ Record saved successfully');
            } catch (error) {
                this.showNotification('❌ Failed to save record');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '💾 Save Record';
            }
        });
    }

    // ============================================
    // RENDER HISTORY
    // ============================================
    async renderSleepHistory() {
        const container = document.getElementById('sleepHistoryContainer');
        const entries = await this.dataManager.getSleepEntries();

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
                    <button class="delete-btn" onclick="app.deleteSleepEntry('${entry.id}')">×</button>
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

    async deleteSleepEntry(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            try {
                await this.dataManager.deleteSleepEntry(id);
                await this.renderSleepHistory();
                await this.updateStats();
                this.showNotification('🗑️ Record deleted');
            } catch (error) {
                this.showNotification('❌ Failed to delete record');
            }
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
    async updateStats() {
        const entries = await this.dataManager.getSleepEntries();
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
        
        saveBtn.addEventListener('click', async () => {
            const name = document.getElementById('userName').value.trim();
            const goal = parseFloat(document.getElementById('sleepGoal').value);

            if (!name) {
                this.showNotification('⚠️ Please enter your name');
                return;
            }

            saveBtn.disabled = true;
            saveBtn.textContent = '💾 Saving...';

            try {
                await this.authManager.updateProfile({ name, sleepGoal: goal });
                await this.loadUserProfile();
                this.showNotification('✅ Profile updated');
            } catch (error) {
                this.showNotification('❌ Failed to update profile');
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = '💾 Save Changes';
            }
        });
    }

    async loadUserProfile() {
        const user = this.authManager.getCurrentUser();
        if (!user) return;
        
        const userData = await this.authManager.getUserData(user.uid);
        
        document.getElementById('profileName').textContent = userData.name;
        document.getElementById('profileGoal').textContent = userData.sleepGoal;
        document.getElementById('userName').value = userData.name;
        document.getElementById('sleepGoal').value = userData.sleepGoal;
        document.getElementById('userWelcome').textContent = `Welcome back, ${userData.name}!`;

        await this.updateProfileStats();
    }

    async updateProfileStats() {
        const entries = await this.dataManager.getSleepEntries();
        const user = this.authManager.getCurrentUser();
        if (!user) return;
        
        const userData = await this.authManager.getUserData(user.uid);
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
