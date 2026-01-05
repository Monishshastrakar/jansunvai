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

    submitComplaint(formData) {
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

        this.complaints.unshift(complaint);
        this.saveComplaints();

        // Clear uploaded photos
        this.uploadedPhotos = [];
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
        const total = this.complaints.length;
        const pending = this.complaints.filter(c => c.status === 'pending').length;
        const inProgress = this.complaints.filter(c => c.status === 'in-progress').length;
        const resolved = this.complaints.filter(c => c.status === 'resolved').length;

        const priorityCounts = {
            critical: this.complaints.filter(c => c.priority.level === 'critical').length,
            high: this.complaints.filter(c => c.priority.level === 'high').length,
            medium: this.complaints.filter(c => c.priority.level === 'medium').length,
            low: this.complaints.filter(c => c.priority.level === 'low').length
        };

        const categoryData = {};
        this.complaints.forEach(c => {
            categoryData[c.category] = (categoryData[c.category] || 0) + 1;
        });

        const departmentData = {};
        this.complaints.forEach(c => {
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
        const stats = this.getStatistics();

        // Render stats cards
        const statsGrid = document.getElementById('stats-grid');
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

    renderComplaintsList(filters = {}) {
        let complaints = [...this.complaints];

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
            const date = new Date(complaint.timestamp).toLocaleString();
            const priorityClass = `badge-${complaint.priority.level}`;
            const statusClass = `badge-${complaint.status}`;

            return `
                <div class="complaint-card" data-id="${complaint.id}">
                    <div class="complaint-header">
                        <h3 class="complaint-title">${complaint.citizen.name} - ${complaint.citizen.location}</h3>
                        <div class="complaint-meta">
                            <span class="badge ${priorityClass}">${complaint.priority.level}</span>
                            <span class="badge ${statusClass}">${complaint.status}</span>
                        </div>
                    </div>
                    <div class="complaint-meta">
                        <span class="badge">${complaint.category}</span>
                        <span class="badge">${complaint.department}</span>
                    </div>
                    <p class="complaint-description">${complaint.description}</p>
                    <div class="complaint-footer">
                        <span>📅 ${date}</span>
                        <span>Priority Score: ${complaint.priority.score}/10</span>
                    </div>
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
        {
            name: "Rajesh Kumar",
            contact: "9876543210",
            email: "rajesh@example.com",
            location: "MG Road, Bangalore",
            description: "Urgent! The main road near MG Road Metro has a massive pothole causing accidents. Multiple vehicles damaged. Needs immediate repair before someone gets seriously injured."
        },
        {
            name: "Priya Sharma",
            contact: "9876543211",
            location: "Koramangala, Bangalore",
            description: "Garbage has not been collected from our street for the past week. The smell is terrible and it's becoming a health hazard for the entire community."
        },
        {
            name: "Amit Patel",
            contact: "9876543212",
            location: "Whitefield, Bangalore",
            description: "Water supply has been irregular for the past month. We receive water only 2-3 hours per day. This is affecting the entire neighborhood."
        },
        {
            name: "Sunita Reddy",
            contact: "9876543213",
            location: "Jayanagar, Bangalore",
            description: "Request for installation of street lights in our area. The road gets very dark at night making it unsafe, especially for women and children."
        },
        {
            name: "Mohammed Ali",
            contact: "9876543214",
            location: "Indiranagar, Bangalore",
            description: "Emergency! Sewage overflow on main street. The entire road is flooded with sewage water. Immediate action required as it's a serious health crisis."
        }
    ];

    demoComplaints.forEach(demo => {
        app.submitComplaint(demo);
    });

    app.renderDashboard();
}
