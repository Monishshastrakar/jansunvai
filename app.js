// ============================================
// Data Storage & State Management
// ============================================
class GrievanceSystem {
    constructor() {
        this.complaints = this.loadComplaints();
        this.currentView = 'submit';
        this.uploadedPhotos = []; // For temp storage during form filling
        this.init();
    }

    init() {
        if (typeof authManager !== 'undefined' && authManager.hasRole()) {
            authManager.applyRoleRestrictions();
        }
        this.setupEventListeners();
        this.renderDashboard();
        this.renderAnalytics();
    }

    loadComplaints() {
        const stored = localStorage.getItem('complaints');
        return stored ? JSON.parse(stored) : [];
    }

    saveComplaints() {
        localStorage.setItem('complaints', JSON.stringify(this.complaints));
    }

    // ============================================
    // NLP & AI Analysis Engine
    // ============================================

    analyzeComplaint(text) {
        const analysis = {
            category: this.detectCategory(text),
            department: '',
            priority: this.calculatePriority(text),
            sentiment: this.analyzeSentiment(text),
            language: this.detectLanguage(text),
            keywords: this.extractKeywords(text),
            urgency: this.detectUrgency(text)
        };

        analysis.department = this.routeToDepartment(analysis.category, text);

        return analysis;
    }

    detectCategory(text) {
        const lowerText = text.toLowerCase();

        const categories = {
            infrastructure: ['road', 'bridge', 'building', 'construction', 'footpath', 'pavement', 'pothole', 'crack', 'repair', 'broken', 'damaged', 'infrastructure'],
            sanitation: ['garbage', 'waste', 'trash', 'dirty', 'clean', 'drainage', 'sewer', 'smell', 'odor', 'sanitation', 'toilet', 'dump', 'litter'],
            safety: ['crime', 'theft', 'robbery', 'assault', 'violence', 'danger', 'unsafe', 'security', 'police', 'emergency', 'accident', 'fire'],
            utilities: ['water', 'electricity', 'power', 'supply', 'outage', 'shortage', 'gas', 'leak', 'meter', 'connection', 'voltage'],
            healthcare: ['hospital', 'health', 'medical', 'doctor', 'medicine', 'treatment', 'emergency', 'ambulance', 'clinic', 'disease', 'epidemic'],
            education: ['school', 'teacher', 'education', 'student', 'class', 'exam', 'college', 'university', 'learning', 'fee'],
            administration: ['document', 'certificate', 'permit', 'license', 'approval', 'application', 'office', 'official', 'staff', 'delay', 'corruption']
        };

        let maxScore = 0;
        let detectedCategory = 'administration';

        for (const [category, keywords] of Object.entries(categories)) {
            let score = 0;
            keywords.forEach(keyword => {
                if (lowerText.includes(keyword)) {
                    score++;
                }
            });

            if (score > maxScore) {
                maxScore = score;
                detectedCategory = category;
            }
        }

        return detectedCategory;
    }

    routeToDepartment(category, text) {
        const departmentMap = {
            infrastructure: 'Public Works Department',
            sanitation: 'Sanitation & Hygiene Department',
            safety: 'Police & Public Safety',
            utilities: 'Utilities & Services',
            healthcare: 'Health Department',
            education: 'Education Department',
            administration: 'General Administration'
        };

        return departmentMap[category] || 'General Administration';
    }

    calculatePriority(text) {
        const lowerText = text.toLowerCase();

        let urgencyScore = 0;
        let severityScore = 0;
        let impactScore = 0;

        // Urgency detection
        const urgencyKeywords = {
            critical: ['emergency', 'urgent', 'immediate', 'asap', 'critical', 'life-threatening', 'danger', 'fatal'],
            high: ['soon', 'quickly', 'important', 'serious', 'severe', 'major'],
            medium: ['needed', 'required', 'problem', 'issue'],
            low: ['request', 'suggestion', 'feedback', 'inquiry']
        };

        if (urgencyKeywords.critical.some(word => lowerText.includes(word))) {
            urgencyScore = 10;
        } else if (urgencyKeywords.high.some(word => lowerText.includes(word))) {
            urgencyScore = 7;
        } else if (urgencyKeywords.medium.some(word => lowerText.includes(word))) {
            urgencyScore = 5;
        } else {
            urgencyScore = 3;
        }

        // Severity detection
        const severityKeywords = ['broken', 'damaged', 'collapsed', 'leaking', 'overflow', 'blocked', 'failure', 'outage', 'crisis'];
        severityScore = severityKeywords.filter(word => lowerText.includes(word)).length * 1.5;
        severityScore = Math.min(severityScore, 10);

        // Impact detection (community vs individual)
        const communityKeywords = ['community', 'neighborhood', 'area', 'street', 'public', 'everyone', 'all', 'entire', 'whole'];
        if (communityKeywords.some(word => lowerText.includes(word))) {
            impactScore = 8;
        } else {
            impactScore = 4;
        }

        // Calculate weighted priority score
        const priorityScore = (urgencyScore * 0.5) + (severityScore * 0.3) + (impactScore * 0.2);

        return {
            score: Math.min(Math.round(priorityScore * 10) / 10, 10),
            level: this.getPriorityLevel(priorityScore),
            urgency: urgencyScore,
            severity: severityScore,
            impact: impactScore
        };
    }

    getPriorityLevel(score) {
        if (score >= 9) return 'P0';  // Critical emergency
        if (score >= 7) return 'P1';  // High priority
        if (score >= 5) return 'P2';  // Medium priority
        if (score >= 3) return 'P3';  // Low priority
        return 'P4';  // Very low priority
    }

    detectUrgency(text) {
        const lowerText = text.toLowerCase();
        const urgentWords = ['emergency', 'urgent', 'immediate', 'critical', 'asap'];
        return urgentWords.some(word => lowerText.includes(word)) ? 'high' : 'normal';
    }

    analyzeSentiment(text) {
        const lowerText = text.toLowerCase();

        const negativeWords = ['bad', 'terrible', 'horrible', 'worst', 'angry', 'frustrated', 'disappointed', 'poor', 'awful', 'disgusting'];
        const positiveWords = ['good', 'great', 'excellent', 'thank', 'appreciate', 'happy', 'satisfied'];

        let sentiment = 0;
        negativeWords.forEach(word => {
            if (lowerText.includes(word)) sentiment--;
        });
        positiveWords.forEach(word => {
            if (lowerText.includes(word)) sentiment++;
        });

        if (sentiment < -2) return 'negative';
        if (sentiment > 2) return 'positive';
        return 'neutral';
    }

    detectLanguage(text) {
        // Enhanced language detection for Indian languages
        const scripts = {
            hindi: /[\u0900-\u097F]/,  // Devanagari (Hindi, Marathi, Sanskrit)
            tamil: /[\u0B80-\u0BFF]/,  // Tamil
            telugu: /[\u0C00-\u0C7F]/, // Telugu
            bengali: /[\u0980-\u09FF]/, // Bengali
            gujarati: /[\u0A80-\u0AFF]/, // Gujarati
            kannada: /[\u0C80-\u0CFF]/, // Kannada
            malayalam: /[\u0D00-\u0D7F]/, // Malayalam
            punjabi: /[\u0A00-\u0A7F]/, // Gurmukhi (Punjabi)
            urdu: /[\u0600-\u06FF]/, // Arabic script (Urdu)
        };

        const hasEnglish = /[a-zA-Z]/.test(text);
        let detectedScripts = [];

        for (const [lang, pattern] of Object.entries(scripts)) {
            if (pattern.test(text)) {
                detectedScripts.push(lang);
            }
        }

        if (detectedScripts.length > 0 && hasEnglish) {
            return 'mixed'; // Hinglish or other code-mixed text
        } else if (detectedScripts.length > 0) {
            return detectedScripts[0]; // Primary Indian language
        } else if (hasEnglish) {
            return 'english';
        }

        return 'unknown';
    }

    extractKeywords(text) {
        const lowerText = text.toLowerCase();
        const words = lowerText.split(/\s+/);

        // Remove common stop words
        const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by'];
        const keywords = words.filter(word =>
            word.length > 3 && !stopWords.includes(word)
        ).slice(0, 10);

        return keywords;
    }

    // ============================================
    // Photo Management
    // ============================================

    handlePhotoUpload(files) {
        const maxPhotos = 5;
        const maxSize = 5 * 1024 * 1024; // 5MB

        for (const file of files) {
            if (this.uploadedPhotos.length >= maxPhotos) {
                this.showToast('Maximum 5 photos allowed');
                break;
            }

            if (file.size > maxSize) {
                this.showToast(`${file.name} is too large. Max 5MB per photo`);
                continue;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.uploadedPhotos.push({
                    data: e.target.result,
                    name: file.name,
                    size: file.size
                });
                this.renderPhotoPreview();
            };
            reader.readAsDataURL(file);
        }
    }

    renderPhotoPreview() {
        const container = document.getElementById('photo-preview-container');
        container.innerHTML = this.uploadedPhotos.map((photo, index) => `
            <div class="photo-preview-item">
                <img src="${photo.data}" alt="${photo.name}">
                <button class="photo-remove-btn" onclick="app.removePhoto(${index})" type="button">&times;</button>
            </div>
        `).join('');
    }

    removePhoto(index) {
        this.uploadedPhotos.splice(index, 1);
        this.renderPhotoPreview();
    }

    // ============================================
    // SLA Management
    // ============================================

    calculateSLA(priorityLevel) {
        const slaHours = {
            'P0': 4,      // 4 hours for critical emergencies
            'P1': 24,     // 24 hours for high priority
            'P2': 72,     // 3 days for medium priority
            'P3': 168,    // 7 days for low priority
            'P4': 336     // 14 days for very low priority
        };

        const hours = slaHours[priorityLevel] || 168;
        const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);

        return {
            hours,
            deadline: deadline.toISOString(),
            status: 'on-track' // on-track, warning, breached
        };
    }

    checkSLAStatus(complaint) {
        if (complaint.status === 'resolved') return 'completed';

        const now = new Date();
        const deadline = new Date(complaint.sla.deadline);
        const timeRemaining = deadline - now;
        const hoursRemaining = timeRemaining / (1000 * 60 * 60);

        if (timeRemaining < 0) return 'breached';
        if (hoursRemaining < complaint.sla.hours * 0.25) return 'warning'; // Last 25% of time
        return 'on-track';
    }

    formatTimeRemaining(deadline) {
        const now = new Date();
        const end = new Date(deadline);
        const diff = end - now;

        if (diff < 0) {
            const overdue = Math.abs(diff);
            const hours = Math.floor(overdue / (1000 * 60 * 60));
            return `Overdue by ${hours}h`;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h remaining`;
        return `${hours}h remaining`;
    }

    // ============================================
    // Escalation Logic
    // ============================================

    checkAndEscalate(complaint) {
        const slaStatus = this.checkSLAStatus(complaint);

        if (slaStatus === 'breached' && complaint.status !== 'resolved') {
            const currentLevel = complaint.escalationLevel || 1;
            const newLevel = Math.min(currentLevel + 1, 4);

            if (newLevel > currentLevel) {
                this.escalateComplaint(complaint, newLevel);
            }
        }
    }

    escalateComplaint(complaint, newLevel) {
        const authorities = {
            1: 'Local Department',
            2: 'District Officer/Municipal Commissioner',
            3: 'State Department Head',
            4: 'Chief Secretary/State Minister'
        };

        complaint.escalationLevel = newLevel;
        if (!complaint.escalationHistory) {
            complaint.escalationHistory = [];
        }

        complaint.escalationHistory.push({
            level: newLevel,
            authority: authorities[newLevel],
            timestamp: new Date().toISOString(),
            reason: 'SLA deadline breached'
        });

        this.saveComplaints();
        console.log(`Complaint ${complaint.id} escalated to Level ${newLevel}: ${authorities[newLevel]}`);
    }

    getCurrentAuthority(complaint) {
        const authorities = {
            1: 'Local Department',
            2: 'District Officer/Municipal Commissioner',
            3: 'State Department Head',
            4: 'Chief Secretary/State Minister'
        };

        const level = complaint.escalationLevel || 1;
        return authorities[level];
    }

    // ============================================
    // Complaint Management
    // ============================================

    async submitComplaint(formData) {
        const analysis = this.analyzeComplaint(formData.description);
        const sla = this.calculateSLA(analysis.priority.level);

        const complaint = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            citizen: {
                name: formData.name,
                contact: formData.contact,
                email: formData.email || '',
                location: formData.location
            },
            // Add current user info if available
            submittedBy: (typeof authManager !== 'undefined' && authManager.getCurrentUser()) ? authManager.getCurrentUser().contact : null,
            description: formData.description,
            photos: [...this.uploadedPhotos], // Add photos
            category: formData.category || analysis.category,
            department: analysis.department,
            priority: analysis.priority,
            sentiment: analysis.sentiment,
            language: analysis.language,
            keywords: analysis.keywords,
            urgency: analysis.urgency,
            status: 'pending',
            sla: sla, // Add SLA
            escalationLevel: 1, // Initial level
            escalationHistory: [{
                level: 1,
                authority: 'Local Department',
                timestamp: new Date().toISOString(),
                reason: 'Initial assignment'
            }],
            aiAnalysis: analysis,
            assignedTo: null,
            resolvedAt: null,
            notes: []
        };

        // Try to submit to backend
        try {
            const response = await fetch('/api/complaints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(complaint)
            });

            if (response.ok) {
                console.log('Backend submission successful');
            } else {
                console.warn('Backend submission failed, saving locally only');
            }
        } catch (error) {
            console.error('Backend connection check failed:', error);
            // Continue execution to save locally - graceful degradation
        }

        this.complaints.unshift(complaint);
        this.saveComplaints();

        // Clear uploaded photos
        this.uploadedPhotos = [];
        this.currentFilter = 'all';

        // Mock Officers for Assignment Workflow
        this.departmentOfficers = {
            'Roads': ['Officer Rajesh', 'Officer Suresh', 'Officer Anita'],
            'Sanitation': ['Officer Priya', 'Officer Amit', 'Officer Mahesh'],
            'Water': ['Officer Vijay', 'Officer Sunita', 'Officer Rahul'],
            'Electricity': ['Officer Vikram', 'Officer Meena', 'Officer Sanjay'],
            'Other': ['Officer General', 'Officer Admin']
        };
        this.renderPhotoPreview();

        return complaint;
    }

    updateComplaintStatus(id, status) {
        const complaint = this.complaints.find(c => c.id === id);
        if (complaint) {
            complaint.status = status;
            if (status === 'resolved') {
                complaint.resolvedAt = new Date().toISOString();
            }
            this.saveComplaints();
            this.renderDashboard();
            this.renderAnalytics();

            // Close modal
            const modal = document.getElementById('complaint-modal');
            if (modal) {
                modal.classList.remove('active');
            }

            // Show success message
            const statusText = status === 'in-progress' ? 'In Progress' : 'Resolved';
            this.showToast(`Complaint marked as ${statusText}!`);
        }
    }

    getComplaintById(id) {
        return this.complaints.find(c => c.id === id);
    }

    // ============================================
    // Analytics & Statistics
    // ============================================

    getStatistics() {
        // Filter complaints for citizens
        let relevantComplaints = this.complaints;
        if (typeof authManager !== 'undefined') {
            relevantComplaints = authManager.filterCitizenComplaints(this.complaints);
        }

        const total = relevantComplaints.length;
        const pending = relevantComplaints.filter(c => c.status === 'pending').length;
        const inProgress = relevantComplaints.filter(c => c.status === 'in-progress').length;
        const resolved = relevantComplaints.filter(c => c.status === 'resolved').length;

        const priorityCounts = {
            critical: relevantComplaints.filter(c => c.priority.level === 'critical').length,
            high: relevantComplaints.filter(c => c.priority.level === 'high').length,
            medium: relevantComplaints.filter(c => c.priority.level === 'medium').length,
            low: relevantComplaints.filter(c => c.priority.level === 'low').length
        };

        const categoryData = {};
        relevantComplaints.forEach(c => {
            categoryData[c.category] = (categoryData[c.category] || 0) + 1;
        });

        const departmentData = {};
        relevantComplaints.forEach(c => {
            departmentData[c.department] = (departmentData[c.department] || 0) + 1;
        });

        return {
            total,
            pending,
            inProgress,
            resolved,
            priorityCounts,
            categoryData,
            departmentData,
            avgResolutionTime: this.calculateAvgResolutionTime()
        };
    }

    calculateAvgResolutionTime() {
        const resolved = this.complaints.filter(c => c.status === 'resolved' && c.resolvedAt);
        if (resolved.length === 0) return 'N/A';

        const totalTime = resolved.reduce((sum, c) => {
            const created = new Date(c.timestamp);
            const resolved = new Date(c.resolvedAt);
            return sum + (resolved - created);
        }, 0);

        const avgMs = totalTime / resolved.length;
        const avgHours = Math.round(avgMs / (1000 * 60 * 60));
        return `${avgHours}h`;
    }

    generateInsights() {
        const stats = this.getStatistics();
        const insights = [];

        // Critical complaints insight
        if (stats.priorityCounts.critical > 0) {
            insights.push({
                type: 'warning',
                message: `⚠️ ${stats.priorityCounts.critical} critical complaint${stats.priorityCounts.critical > 1 ? 's' : ''} requiring immediate attention`
            });
        }

        // Most common category
        const topCategory = Object.entries(stats.categoryData).sort((a, b) => b[1] - a[1])[0];
        if (topCategory) {
            insights.push({
                type: 'info',
                message: `📊 ${topCategory[0]} issues are most common (${topCategory[1]} complaints)`
            });
        }

        // Pending backlog
        if (stats.pending > 10) {
            insights.push({
                type: 'alert',
                message: `📋 ${stats.pending} complaints pending review - consider increasing resources`
            });
        }

        // Resolution rate
        const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
        insights.push({
            type: 'success',
            message: `✅ ${resolutionRate}% resolution rate (${stats.resolved}/${stats.total} complaints resolved)`
        });

        return insights;
    }

    // ============================================
    // UI Rendering
    // ============================================

    renderDashboard() {
        // Force reload from storage to ensure data freshness
        this.complaints = this.loadComplaints();

        const stats = this.getStatistics();
        const statsGrid = document.getElementById('stats-grid');
        const container = document.getElementById('dashboard-view');

        // Clear previous custom dashboards (if any)
        const existingCustom = container.querySelector('.admin-dashboard-layout');
        if (existingCustom) existingCustom.remove();

        // Check if Admin AND has valid profile data
        if (typeof authManager !== 'undefined' && authManager.isAdmin()) {
            const user = authManager.getCurrentUser();

            // Render Admin Specific Dashboard
            statsGrid.style.display = 'none'; // Hide default grid

            let dashboardHTML = `
                <div class="admin-dashboard-layout" style="margin-top: -1rem;">
                    <!-- Welcome Section -->
                    <div class="welcome-banner" style="background: linear-gradient(135deg, var(--color-surface-elevated), var(--color-surface)); padding: 2rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="font-size: 1.75rem; color: var(--color-text-primary); margin-bottom: 0.5rem;">Welcome, ${user.name}</h2>
                            <p style="color: var(--color-text-secondary);">Department: <span style="color: var(--color-saffron); font-weight: 600;">${user.department}</span></p>
                        </div>
                        <button onclick="window.location.reload()" class="btn btn-secondary" style="font-size: 0.8rem;">
                            🔄 Refresh Data
                        </button>
                    </div>

                    <!-- 3-Column Stats -->
                    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                        <div class="stat-card" style="border-left: 4px solid var(--color-info);">
                            <div class="stat-header"><span class="stat-title">My Pending Tasks</span></div>
                            <div class="stat-value">${myTasks.length}</div>
                        </div>
                        <div class="stat-card" style="border-left: 4px solid var(--color-success);">
                            <div class="stat-header"><span class="stat-title">Team Resolved (${user.department})</span></div>
                            <div class="stat-value">${teamResolved}</div>
                        </div>
                        <div class="stat-card" style="border-left: 4px solid var(--color-warning);">
                            <div class="stat-header"><span class="stat-title">New Incomings</span></div>
                            <div class="stat-value">${newComplaints.length}</div>
                        </div>
                    </div>

                    <!-- Split Layout: My Tasks & New Complaints -->
                    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                        
                        <!-- Col 1: My Tasks -->
                        <div class="dashboard-section">
                            <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="background: var(--color-info); width: 8px; height: 8px; border-radius: 50%;"></span>
                                Work Allotted to Me
                            </h3>
                            <div class="complaints-list" id="my-tasks-list">
                                ${myTasks.length ? '' : '<div class="empty-state" style="padding: 2rem; text-align: center; color: var(--color-text-muted); background: var(--color-surface); border-radius: var(--radius-md);">No active tasks assigned to you.</div>'}
                            </div>
                        </div>

                        <!-- Col 2: New Complaints -->
                        <div class="dashboard-section">
                            <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="background: var(--color-warning); width: 8px; height: 8px; border-radius: 50%;"></span>
                                New & Recent Complaints
                            </h3>
                            <div class="complaints-list" id="new-complaints-list">
                                ${newComplaints.length ? '' : '<div class="empty-state" style="padding: 2rem; text-align: center; color: var(--color-text-muted);">No new complaints.</div>'}
                            </div>
                        </div>
                    </div>

                    <!-- Full List Access -->
                    <div class="dashboard-section" style="border-top: 1px solid var(--color-border); padding-top: 2rem;">
                        <h3 style="margin-bottom: 1rem; color: var(--color-text-secondary);">Organization Overview (Other Active Issues)</h3>
                        <div class="complaints-list" id="all-active-list">
                             ${allActive.length ? '' : '<div class="empty-state" style="padding: 1rem; color: var(--color-text-muted);">No other active issues.</div>'}
                        </div>
                    </div>
                </div>
            `;

            const adminContainer = document.createElement('div');
            adminContainer.innerHTML = dashboardHTML;
            statsGrid.parentNode.insertBefore(adminContainer, statsGrid.nextSibling);

            // Hide standard list
            const standardList = document.querySelector('.complaints-list');
            if (standardList) standardList.style.display = 'none';

            // Render Assignment Cards
            const myTasksList = document.getElementById('my-tasks-list');
            myTasks.forEach(complaint => {
                myTasksList.appendChild(this.createComplaintCard(complaint));
            });

            // Render New Complaints Cards
            const newTasksList = document.getElementById('new-complaints-list');
            newComplaints.slice(0, 5).forEach(complaint => { // Show top 5 newest
                const card = this.createComplaintCard(complaint);
                card.querySelector('.complaint-description').style.webkitLineClamp = '1';
                newTasksList.appendChild(card);
            });

            // Render All Active
            const allActiveList = document.getElementById('all-active-list');
            allActive.slice(0, 5).forEach(complaint => {
                const card = this.createComplaintCard(complaint);
                allActiveList.appendChild(card);
            });

            return; // EXIT EARLY FOR ADMIN
        }

        // --- STANDARD DASHBOARD (Citizen/Guest) ---
        statsGrid.style.display = 'grid'; // Show default grid
        const standardList = document.querySelector('.complaints-list');
        if (standardList) standardList.style.display = 'flex';

        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Total Complaints</span>
                    <div class="stat-icon">📊</div>
                </div>
                <div class="stat-value">${stats.total}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Pending Review</span>
                    <div class="stat-icon">⏳</div>
                </div>
                <div class="stat-value">${stats.pending}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">In Progress</span>
                    <div class="stat-icon">🔄</div>
                </div>
                <div class="stat-value">${stats.inProgress}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Resolved</span>
                    <div class="stat-icon">✅</div>
                </div>
                <div class="stat-value">${stats.resolved}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Critical Priority</span>
                    <div class="stat-icon">🚨</div>
                </div>
                <div class="stat-value">${stats.priorityCounts.critical}</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">Avg Resolution</span>
                    <div class="stat-icon">⏱️</div>
                </div>
                <div class="stat-value">${stats.avgResolutionTime}</div>
            </div>
        `;

        this.renderComplaintsList();
    }

    ensureDemoAssignments(user) {
        // Check if user has assignments
        const hasAssignments = this.complaints.some(c => c.assignedTo === user.name);

        if (!hasAssignments) {
            // Assign 2 random in-progress complaints to this user
            const tasks = this.complaints.filter(c => c.status === 'in-progress');
            tasks.slice(0, 2).forEach(task => {
                task.assignedTo = user.name;
            });
            this.saveComplaints();
        }
    }

    renderComplaintsList(filters = {}) {
        let complaints = [...this.complaints];

        // Apply Auth Filtering
        if (typeof authManager !== 'undefined') {
            complaints = authManager.filterCitizenComplaints(complaints);
        }

        // Apply filters
        if (filters.priority) {
            complaints = complaints.filter(c => c.priority.level === filters.priority);
        }
        if (filters.status) {
            complaints = complaints.filter(c => c.status === filters.status);
        }

        const listContainer = document.getElementById('complaints-list');

        if (complaints.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--color-text-secondary);">
                    <p>No complaints found${Object.keys(filters).length > 0 ? ' matching filters' : ''}.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = complaints.map(complaint => {
            // Check for Admin Role to add Actions
            let adminActions = '';
            if (typeof authManager !== 'undefined' && authManager.isAdmin()) {
                const currentUser = authManager.getCurrentUser();
                const deptOfficers = this.departmentOfficers[complaint.department || 'Other'] || this.departmentOfficers['Other'];

                // Build Options
                const options = deptOfficers.map(officer =>
                    `<option value="${officer}" ${complaint.assignedTo === officer ? 'selected' : ''}>${officer}</option>`
                ).join('');

                // Assign Button Logic
                const assignButton = `
                    <div class="assign-action" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border); display: flex; gap: 0.5rem; align-items: center;">
                        <span style="font-size: 0.85rem; color: var(--color-text-secondary);">Assign To:</span>
                        <select class="assign-select" onchange="app.assignComplaint('${complaint.id}', this.value)" style="padding: 0.25rem; font-size: 0.85rem; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-background); color: var(--color-text-primary);">
                            <option value="">Select Officer</option>
                            ${options}
                        </select>
                    </div>
                `;

                // Status Update Logic (for assigned items)
                const statusUpdate = `
                    <div class="status-action" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border); display: flex; gap: 0.5rem; justify-content: flex-end;">
                        ${complaint.status !== 'resolved' ?
                        `<button onclick="app.resolveComplaint('${complaint.id}')" class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;">Mark Resolved</button>` :
                        '<span class="badge badge-resolved">Resolved</span>'
                    }
                    </div>
                `;

                adminActions = assignButton + statusUpdate;
            }

            return `
                <div class="complaint-card" data-id="${complaint.id}">
                    <div class="complaint-header">
                        <div>
                            <h3 class="complaint-title">${complaint.category}</h3>
                            <span class="badge badge-${complaint.priority.level}">${complaint.priority.level} Priority</span>
                        </div>
                        <span class="badge badge-${complaint.status}">${complaint.status.replace('-', ' ')}</span>
                    </div>
                    <div class="complaint-meta">
                        <span>📍 ${complaint.citizen.location}</span>
                        <span>📅 ${new Date(complaint.timestamp).toLocaleDateString()}</span>
                        ${complaint.assignedTo ? `<span>👤 ${complaint.assignedTo}</span>` : ''}
                    </div>
                    <p class="complaint-description">${complaint.description}</p>
                    <div class="complaint-footer">
                        <span>ID: #${complaint.id.slice(-6)}</span>
                        <span>${complaint.department}</span>
                    </div>
                    ${adminActions}
                </div>
            `;
        }).join('');

        // Add click listeners
        document.querySelectorAll('.complaint-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showComplaintDetail(card.dataset.id);
            });
        });
    }

    renderAnalytics() {
        const stats = this.getStatistics();

        // Render simple bar charts (without external libraries)
        this.renderPriorityChart(stats.priorityCounts);
        this.renderDepartmentChart(stats.departmentData);
        this.renderCategoryChart(stats.categoryData);
        this.renderTrendChart();

        // Render insights
        const insights = this.generateInsights();
        const insightsList = document.getElementById('insights-list');
        insightsList.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <p>${insight.message}</p>
            </div>
        `).join('');
    }

    renderPriorityChart(data) {
        const canvas = document.getElementById('priority-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 250;

        const colors = {
            critical: '#ef4444',
            high: '#f59e0b',
            medium: '#3b82f6',
            low: '#10b981'
        };

        this.drawBarChart(ctx, data, colors, canvas.width, canvas.height);
    }

    renderDepartmentChart(data) {
        const canvas = document.getElementById('department-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 250;

        const colors = ['#6366f1', '#a855f7', '#06b6d4', '#ec4899', '#f97316', '#10b981', '#f59e0b'];
        const colorMap = {};
        Object.keys(data).forEach((key, i) => {
            colorMap[key] = colors[i % colors.length];
        });

        this.drawBarChart(ctx, data, colorMap, canvas.width, canvas.height);
    }

    renderCategoryChart(data) {
        const canvas = document.getElementById('category-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 250;

        const colors = ['#6366f1', '#a855f7', '#06b6d4', '#ec4899', '#f97316', '#10b981', '#f59e0b'];
        const colorMap = {};
        Object.keys(data).forEach((key, i) => {
            colorMap[key] = colors[i % colors.length];
        });

        this.drawPieChart(ctx, data, colorMap, canvas.width, canvas.height);
    }

    renderTrendChart() {
        const canvas = document.getElementById('trend-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 250;

        // Simple trend line
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Trend data available after 7 days', canvas.width / 2, canvas.height / 2);
    }

    drawBarChart(ctx, data, colors, width, height) {
        ctx.clearRect(0, 0, width, height);

        const entries = Object.entries(data);
        if (entries.length === 0) return;

        const maxValue = Math.max(...entries.map(e => e[1]));
        const barWidth = (width - 40) / entries.length;
        const chartHeight = height - 60;

        entries.forEach(([key, value], i) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = 20 + i * barWidth;
            const y = height - 40 - barHeight;

            // Draw bar
            ctx.fillStyle = colors[key] || '#6366f1';
            ctx.fillRect(x + 5, y, barWidth - 10, barHeight);

            // Draw value
            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(value, x + barWidth / 2, y - 5);

            // Draw label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px Inter';
            ctx.save();
            ctx.translate(x + barWidth / 2, height - 10);
            ctx.rotate(-Math.PI / 6);
            ctx.fillText(key, 0, 0);
            ctx.restore();
        });
    }

    drawPieChart(ctx, data, colors, width, height) {
        ctx.clearRect(0, 0, width, height);

        const entries = Object.entries(data);
        if (entries.length === 0) return;

        const total = entries.reduce((sum, e) => sum + e[1], 0);
        const centerX = width / 2;
        const centerY = height / 2 - 10;
        const radius = Math.min(width, height) / 2 - 50;

        let currentAngle = -Math.PI / 2;

        entries.forEach(([key, value]) => {
            const sliceAngle = (value / total) * 2 * Math.PI;

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[key] || '#6366f1';
            ctx.fill();

            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 30);

            ctx.fillStyle = '#f1f5f9';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`${key}: ${value}`, labelX, labelY);

            currentAngle += sliceAngle;
        });
    }

    showComplaintDetail(id) {
        const complaint = this.getComplaintById(id);
        if (!complaint) return;

        const modal = document.getElementById('complaint-modal');
        const detailContainer = document.getElementById('complaint-detail');

        const date = new Date(complaint.timestamp).toLocaleString();

        detailContainer.innerHTML = `
            <div class="detail-section">
                <h3>Citizen Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Name</div>
                        <div class="detail-value">${complaint.citizen.name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Contact</div>
                        <div class="detail-value">${complaint.citizen.contact}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Location</div>
                        <div class="detail-value">${complaint.citizen.location}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Submitted</div>
                        <div class="detail-value">${date}</div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>Complaint Details</h3>
                <div class="detail-item">
                    <div class="detail-label">Description</div>
                    <div class="detail-value">${complaint.description}</div>
                </div>
            </div>

            <div class="detail-section">
                <h3>AI Analysis Results</h3>
                <div class="ai-analysis">
                    <div class="analysis-item">
                        <div class="detail-label">Category</div>
                        <div class="detail-value">
                            <span class="badge">${complaint.category}</span>
                        </div>
                    </div>
                    
                    <div class="analysis-item">
                        <div class="detail-label">Routed To</div>
                        <div class="detail-value">
                            <span class="badge">${complaint.department}</span>
                        </div>
                    </div>
                    
                    <div class="analysis-item">
                        <div class="detail-label">Priority Level</div>
                        <div class="detail-value">
                            <span class="badge badge-${complaint.priority.level}">${complaint.priority.level.toUpperCase()}</span>
                            <span style="margin-left: 10px;">Score: ${complaint.priority.score}/10</span>
                        </div>
                    </div>
                    
                    <div class="analysis-item">
                        <div class="detail-label">Urgency Score</div>
                        <div class="detail-value">${complaint.priority.urgency}/10</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${complaint.priority.urgency * 10}%"></div>
                        </div>
                    </div>
                    
                    <div class="analysis-item">
                        <div class="detail-label">Severity Score</div>
                        <div class="detail-value">${complaint.priority.severity}/10</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${complaint.priority.severity * 10}%"></div>
                        </div>
                    </div>
                    
                    <div class="analysis-item">
                        <div class="detail-label">Impact Score</div>
                        <div class="detail-value">${complaint.priority.impact}/10</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${complaint.priority.impact * 10}%"></div>
                        </div>
                    </div>
                    
                    <div class="analysis-item">
                        <div class="detail-label">Sentiment</div>
                        <div class="detail-value">${complaint.sentiment}</div>
                    </div>
                    
                    <div class="analysis-item">
                        <div class="detail-label">Language</div>
                        <div class="detail-value">${complaint.language}</div>
                    </div>
                    
                    <div class="analysis-item">
                        <div class="detail-label">Keywords</div>
                        <div class="detail-value">${complaint.keywords.join(', ')}</div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>Status Management</h3>
                <div class="detail-item">
                    <div class="detail-label">Current Status</div>
                    <div class="detail-value">
                        <span class="badge badge-${complaint.status}">${complaint.status}</span>
                    </div>
                </div>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="app.updateComplaintStatus('${complaint.id}', 'in-progress')" ${complaint.status === 'in-progress' ? 'disabled' : ''}>
                        Mark In Progress
                    </button>
                    <button class="btn btn-primary" onclick="app.updateComplaintStatus('${complaint.id}', 'resolved')" ${complaint.status === 'resolved' ? 'disabled' : ''}>
                        Mark Resolved
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('complaint-modal');
        modal.classList.remove('active');
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        const messageEl = toast.querySelector('.toast-message');
        messageEl.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ============================================
    // Event Listeners
    // ============================================

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Form submission
        const form = document.getElementById('complaint-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById('citizen-name').value,
                contact: document.getElementById('citizen-contact').value,
                email: document.getElementById('citizen-email').value,
                location: document.getElementById('citizen-location').value,
                category: document.getElementById('complaint-category').value,
                description: document.getElementById('complaint-description').value
            };

            const complaint = this.submitComplaint(formData);

            form.reset();
            this.showToast('Complaint submitted successfully! AI analysis complete.');
            this.switchView('dashboard');
            this.renderDashboard();
            this.renderAnalytics();
        });

        // Photo upload
        const photoUploadBtn = document.getElementById('photo-upload-btn');
        const photoInput = document.getElementById('complaint-photos');

        photoUploadBtn.addEventListener('click', () => photoInput.click());
        photoInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handlePhotoUpload(e.target.files);
            }
        });

        // Voice input controls - FIXED WITH BETTER ERROR HANDLING
        const voiceInputBtn = document.getElementById('voice-input-btn');
        const voiceStatus = document.getElementById('voice-status');
        const voiceBtnText = document.getElementById('voice-btn-text');
        const micIcon = document.getElementById('mic-icon');
        const descriptionTextarea = document.getElementById('complaint-description');

        let isRecording = false;
        let recognition = null;

        // Initialize Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            function createRecognition() {
                recognition = new SpeechRecognition();

                // Configure for multi-language support
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                // Auto-detect language - supports Hindi and English
                recognition.lang = 'en-IN'; // English India - best for auto-detection

                recognition.onstart = () => {
                    isRecording = true;
                    voiceBtnText.textContent = 'Stop';
                    voiceInputBtn.style.background = 'var(--color-error)';
                    voiceStatus.style.display = 'inline';
                    voiceStatus.style.color = 'var(--color-success)';
                    voiceStatus.textContent = 'Listening...';
                    console.log('Voice recognition started');
                };

                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    const confidence = event.results[0][0].confidence;

                    console.log('✅ Transcription:', transcript, 'Confidence:', confidence);

                    // Append to textarea
                    const currentText = descriptionTextarea.value;
                    descriptionTextarea.value = currentText ? `${currentText} ${transcript}` : transcript;

                    voiceStatus.style.color = 'var(--color-success)';
                    voiceStatus.textContent = `Added to description`;

                    setTimeout(() => {
                        voiceStatus.style.display = 'none';
                    }, 3000);
                };

                recognition.onerror = (event) => {
                    console.error('❌ Speech recognition error:', event.error);
                    isRecording = false;
                    voiceBtnText.textContent = 'Voice Input';
                    voiceInputBtn.style.background = '';

                    let errorMessage = '';
                    let showError = true;

                    switch (event.error) {
                        case 'no-speech':
                            errorMessage = 'No speech detected. Try again.';
                            break;
                        case 'audio-capture':
                            errorMessage = 'Microphone not found.';
                            break;
                        case 'not-allowed':
                            errorMessage = 'Please allow microphone access in browser settings.';
                            break;
                        case 'network':
                            errorMessage = 'Internet required for voice input. Please check your connection or type your complaint instead.';
                            console.error('⚠️ Network error - Voice recognition requires internet connection');
                            // Don't auto-retry if offline
                            break;
                        case 'aborted':
                            // User stopped recording, don't show error
                            showError = false;
                            break;
                        default:
                            errorMessage = 'Voice input error. Please try again.';
                    }

                    if (showError && errorMessage) {
                        voiceStatus.style.color = 'var(--color-error)';
                        voiceStatus.textContent = errorMessage;
                        voiceStatus.style.display = 'inline';

                        setTimeout(() => {
                            voiceStatus.style.display = 'none';
                        }, 5000);
                    } else {
                        voiceStatus.style.display = 'none';
                    }
                };

                recognition.onend = () => {
                    isRecording = false;
                    voiceBtnText.textContent = 'Voice Input';
                    voiceInputBtn.style.background = '';
                    console.log('Voice recognition ended');
                };

                return recognition;
            }

            // Create initial recognition instance
            createRecognition();
        }

        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', () => {
                if (!recognition) {
                    voiceStatus.style.color = 'var(--color-critical)';
                    voiceStatus.textContent = 'Voice input not supported in this browser';
                    voiceStatus.style.display = 'inline';
                    setTimeout(() => {
                        voiceStatus.style.display = 'none';
                    }, 4000);
                    return;
                }

                if (!isRecording) {
                    // Start recording
                    try {
                        recognition.start();
                        console.log('🎤 Starting voice recognition...');
                    } catch (error) {
                        console.error('Error starting recognition:', error);

                        // Try to recreate recognition if it's in bad state
                        if (error.message && error.message.includes('already started')) {
                            recognition.stop();
                            setTimeout(() => {
                                createRecognition();
                                recognition.start();
                            }, 500);
                        } else {
                            voiceStatus.style.color = 'var(--color-critical)';
                            voiceStatus.textContent = '❌ Could not start. Please try again.';
                            voiceStatus.style.display = 'inline';
                            setTimeout(() => {
                                voiceStatus.style.display = 'none';
                            }, 3000);
                        }
                    }
                } else {
                    // Stop recording
                    recognition.stop();
                }
            });
        }

        // Filters
        document.getElementById('priority-filter').addEventListener('change', (e) => {
            const priority = e.target.value;
            const status = document.getElementById('status-filter').value;
            this.renderComplaintsList({ priority, status });
        });

        document.getElementById('status-filter').addEventListener('change', (e) => {
            const status = e.target.value;
            const priority = document.getElementById('priority-filter').value;
            this.renderComplaintsList({ priority, status });
        });

        // Modal close
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeModal();
        });
    }

    switchView(viewName) {
        // Update nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            }
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');

            // Refresh data when switching to dashboard or analytics
            if (viewName === 'dashboard') {
                this.renderDashboard();
            } else if (viewName === 'analytics') {
                this.renderAnalytics();
            }
        }
    }
}

// Initialize the application
const app = new GrievanceSystem();

// Add some demo data if no complaints exist
if (app.complaints.length === 0) {
    const demoComplaints = [
        // RESOLVED COMPLAINTS (4)
        {
            name: "Rajesh Patil",
            contact: "9876543210",
            email: "rajesh.patil@example.com",
            location: "Sitabuldi, Nagpur",
            description: "Street light not working on Main Road near Sitabuldi Garden. Multiple complaints from residents about safety concerns during night hours."
        },
        {
            name: "Priya Deshmukh",
            contact: "9876543211",
            location: "Dharampeth, Nagpur",
            description: "Garbage collection has been irregular in our society. Request for proper waste management and daily collection schedule."
        },
        {
            name: "Amit Kale",
            contact: "9876543212",
            location: "Sadar, Nagpur",
            description: "Water pipeline leak on Residency Road causing wastage. The road is waterlogged and creating traffic issues."
        },
        {
            name: "Sunita Bhosale",
            contact: "9876543213",
            location: "Civil Lines, Nagpur",
            description: "Potholes on Seminary Hills Road need urgent repair. Multiple two-wheeler accidents reported in the past week."
        },

        // IN-PROGRESS COMPLAINTS (3)
        {
            name: "Mohammed Ansari",
            contact: "9876543214",
            location: "Mominpura, Nagpur",
            description: "Urgent! Drainage overflow near Jama Masjid area. The entire street is flooded with sewage water during rains. Immediate action required as it's causing health issues."
        },
        {
            name: "Kavita Sharma",
            contact: "9876543215",
            location: "Manish Nagar, Nagpur",
            description: "Broken footpath tiles on Amravati Road. Senior citizens and children are facing difficulty. Several people have tripped and injured themselves."
        },
        {
            name: "Deepak Meshram",
            contact: "9876543216",
            location: "Laxmi Nagar, Nagpur",
            description: "Electricity supply interruption for past 3 days in our area. No transformer maintenance done despite multiple requests to MSEDCL."
        },

        // PENDING COMPLAINTS (5)
        {
            name: "Sneha Raut",
            contact: "9876543217",
            location: "Dharampeth, Nagpur",
            description: "Critical! Massive pothole near Kasturchand Park Metro Station causing severe accidents. Three bikes damaged yesterday. Needs immediate repair before monsoon."
        },
        {
            name: "Vikas Thakre",
            contact: "9876543218",
            location: "Nehru Nagar, Nagpur",
            description: "Illegal garbage dumping near Ambazari Lake. Environmental hazard affecting the lake water quality and causing foul smell in the entire neighborhood."
        },
        {
            name: "Anita Warrier",
            contact: "9876543219",
            email: "anita.w@example.com",
            location: "Pratap Nagar, Nagpur",
            description: "Request for installation of speed breakers near Hislop College. Students crossing the road face extreme danger due to speeding vehicles."
        },
        {
            name: "Ramesh Gawande",
            contact: "9876543220",
            location: "Khamla, Nagpur",
            description: "Water supply timing is very irregular - only 1 hour per day. The entire Khamla Square area is affected. Request for proper water distribution schedule."
        },
        {
            name: "Meena Bhagat",
            contact: "9876543221",
            location: "Gondwana Square, Nagpur",
            description: "Stray dog menace in our residential area. Multiple bite incidents reported. Request for NMC intervention and dog rescue operations."
        }
    ];

    // Submit all demo complaints
    demoComplaints.forEach((demo, index) => {
        const complaint = app.submitComplaint(demo);

        // Set different statuses and timestamps for realistic showcase
        if (index < 4) {
            // RESOLVED - complaints 0-3
            complaint.status = 'resolved';
            const daysAgo = 7 + index; // 7-10 days ago
            const submittedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            const resolvedDate = new Date(submittedDate.getTime() + (3 + index) * 24 * 60 * 60 * 1000);
            complaint.timestamp = submittedDate.toISOString();
            complaint.resolvedAt = resolvedDate.toISOString();
        } else if (index < 7) {
            // IN-PROGRESS - complaints 4-6
            complaint.status = 'in-progress';
            const daysAgo = 2 + (index - 4); // 2-4 days ago
            const submittedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            complaint.timestamp = submittedDate.toISOString();
        } else {
            // PENDING - complaints 7-11
            complaint.status = 'pending';
            const hoursAgo = (index - 7) * 6 + 2; // Stagger over past couple days
            const submittedDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
            complaint.timestamp = submittedDate.toISOString();
        }
    });

    // Save the modified complaints
    app.saveComplaints();
    app.renderDashboard();
}

