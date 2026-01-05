// ============================================
// Role-Based Access Control for jan-sunvai
// ============================================

class RoleManager {
    constructor() {
        this.currentRole = null;
        this.init();
    }

    init() {
        // Check if role is set
        this.currentRole = sessionStorage.getItem('userRole');

        if (!this.currentRole) {
            // Redirect to role selection
            if (!window.location.pathname.includes('auth.html')) {
                window.location.href = 'auth.html';
            }
            return;
        }

        // Setup UI based on role
        this.setupRoleBasedUI();
        this.addRoleIndicator();
    }

    setupRoleBasedUI() {
        if (this.currentRole === 'citizen') {
            this.setupCitizenView();
        } else if (this.currentRole === 'official') {
            this.setupOfficialView();
        }
    }

    setupCitizenView() {
        // Hide analytics and full dashboard for citizens
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        // Keep only: Submit Complaint, My Complaints, Track Status
        navLinks.innerHTML = `
            <button class="nav-link active" data-view="submit">Submit Complaint</button>
            <button class="nav-link" data-view="my-complaints">My Complaints</button>
            <button class="nav-link" data-view="track">Track Status</button>
            <button class="nav-link" data-view="public-stats">Public Stats</button>
        `;

        // Create My Complaints View (show user's own complaints)
        this.createMyComplaintsView();

        // Create Track Status View
        this.createTrackStatusView();

        // Create Public Stats View (limited analytics)
        this.createPublicStatsView();

        // Re-attach event listeners
        this.attachNavListeners();
    }

    setupOfficialView() {
        // Full access to all features
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        navLinks.innerHTML = `
            <button class="nav-link active" data-view="dashboard">Dashboard</button>
            <button class="nav-link" data-view="map">Map View</button>
            <button class="nav-link" data-view="analytics">Analytics</button>
            <button class="nav-link" data-view="departments">Departments</button>
        `;

        // Create Departments View
        this.createDepartmentsView();

        // Re-attach event listeners
        this.attachNavListeners();
    }

    createMyComplaintsView() {
        const mainContainer = document.querySelector('.main-container');
        if (!mainContainer) return;

        // Check if view already exists
        if (document.getElementById('my-complaints-view')) return;

        const myComplaintsView = document.createElement('section');
        myComplaintsView.id = 'my-complaints-view';
        myComplaintsView.className = 'view';
        myComplaintsView.innerHTML = `
            <div class="page-header">
                <h1>My Complaints</h1>
                <p class="header-subtitle">Track all your submitted grievances</p>
            </div>

            <div class="dashboard-content">
                <div class="section-header">
                    <h2>Your Complaints</h2>
                    <select id="my-status-filter" class="filter-select">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>

                <div class="complaints-list" id="my-complaints-list">
                    <!-- User's complaints will be displayed here -->
                </div>
            </div>
        `;

        mainContainer.appendChild(myComplaintsView);
    }

    createTrackStatusView() {
        const mainContainer = document.querySelector('.main-container');
        if (!mainContainer) return;

        if (document.getElementById('track-view')) return;

        const trackView = document.createElement('section');
        trackView.id = 'track-view';
        trackView.className = 'view';
        trackView.innerHTML = `
            <div class="page-header">
                <h1>Track Complaint</h1>
                <p class="header-subtitle">Search for your complaint using ID or contact number</p>
            </div>

            <div class="form-container">
                <div class="complaint-form" style="padding: 2rem;">
                    <div class="form-group">
                        <label for="track-contact">Your Contact Number</label>
                        <input type="tel" id="track-contact" placeholder="Enter your registered mobile number">
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-primary" onclick="roleManager.searchComplaints()">
                            <span class="btn-text">Search My Complaints</span>
                        </button>
                    </div>

                    <div id="track-results" style="margin-top: 2rem;">
                        <!-- Search results will appear here -->
                    </div>
                </div>
            </div>
        `;

        mainContainer.appendChild(trackView);
    }

    createPublicStatsView() {
        const mainContainer = document.querySelector('.main-container');
        if (!mainContainer) return;

        if (document.getElementById('public-stats-view')) return;

        const statsView = document.createElement('section');
        statsView.id = 'public-stats-view';
        statsView.className = 'view';
        statsView.innerHTML = `
            <div class="page-header">
                <h1>Public Statistics</h1>
                <p class="header-subtitle">Transparency in governance</p>
            </div>

            <div class="stats-grid" id="public-stats-grid">
                <!-- Public stats will be displayed here -->
            </div>

            <div class="analytics-grid" style="margin-top: 2rem;">
                <div class="analytics-card">
                    <h3>Category Distribution</h3>
                    <div class="chart-container">
                        <canvas id="public-category-chart"></canvas>
                    </div>
                </div>

                <div class="analytics-card">
                    <h3>Resolution Rate</h3>
                    <div class="chart-container">
                        <canvas id="public-resolution-chart"></canvas>
                    </div>
                </div>
            </div>
        `;

        mainContainer.appendChild(statsView);
    }

    createDepartmentsView() {
        const mainContainer = document.querySelector('.main-container');
        if (!mainContainer) return;

        if (document.getElementById('departments-view')) return;

        const deptView = document.createElement('section');
        deptView.id = 'departments-view';
        deptView.className = 'view';
        deptView.innerHTML = `
            <div class="page-header">
                <h1>Department Overview</h1>
                <p class="header-subtitle">Workload distribution across departments</p>
            </div>

            <div class="stats-grid" id="department-stats">
                <!-- Department cards will be displayed here -->
            </div>

            <div class="dashboard-content" style="margin-top: 2rem;">
                <div class="section-header">
                    <h2>Department Performance</h2>
                </div>
                <div id="department-performance">
                    <!-- Performance metrics will be displayed here -->
                </div>
            </div>
        `;

        mainContainer.appendChild(deptView);
    }

    attachNavListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
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

            // Render view-specific content
            if (viewName === 'my-complaints') {
                this.renderMyComplaints();
            } else if (viewName === 'public-stats') {
                this.renderPublicStats();
            } else if (viewName === 'departments') {
                this.renderDepartments();
            } else if (viewName === 'dashboard' || viewName === 'analytics' || viewName === 'map') {
                // Use existing app functionality
                if (window.app && window.app.switchView) {
                    window.app.switchView(viewName);
                }
            }
        }
    }

    renderMyComplaints() {
        if (!window.app) return;

        // Get user's contact from session or prompt
        const userContact = sessionStorage.getItem('userContact');

        if (!userContact) {
            // Prompt user to enter contact
            const contact = prompt('Enter your contact number to view your complaints:');
            if (contact) {
                sessionStorage.setItem('userContact', contact);
                this.renderMyComplaints();
            }
            return;
        }

        // Filter complaints by user's contact
        const userComplaints = window.app.complaints.filter(
            c => c.citizen.contact === userContact
        );

        const listContainer = document.getElementById('my-complaints-list');
        if (!listContainer) return;

        if (userComplaints.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--color-text-secondary);">
                    <p>You haven't submitted any complaints yet.</p>
                    <button class="btn btn-primary" onclick="roleManager.switchView('submit')" style="margin-top: 1rem;">
                        Submit Your First Complaint
                    </button>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = userComplaints.map(complaint => {
            const date = new Date(complaint.timestamp).toLocaleString();
            const priorityClass = `badge-${complaint.priority.level}`;
            const statusClass = `badge-${complaint.status}`;

            return `
                <div class="complaint-card" onclick="app.showComplaintDetail('${complaint.id}')">
                    <div class="complaint-header">
                        <h3 class="complaint-title">Complaint #${complaint.id.substring(0, 8)}</h3>
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
                        <span>📍 ${complaint.citizen.location}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    searchComplaints() {
        const contactInput = document.getElementById('track-contact');
        const contact = contactInput.value.trim();

        if (!contact) {
            alert('Please enter your contact number');
            return;
        }

        sessionStorage.setItem('userContact', contact);

        const userComplaints = window.app.complaints.filter(
            c => c.citizen.contact === contact
        );

        const resultsDiv = document.getElementById('track-results');

        if (userComplaints.length === 0) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--color-text-secondary);">
                    <p>No complaints found with this contact number.</p>
                </div>
            `;
            return;
        }

        resultsDiv.innerHTML = `
            <h3 style="margin-bottom: 1rem;">Found ${userComplaints.length} complaint(s)</h3>
            <div class="complaints-list">
                ${userComplaints.map(c => this.renderComplaintCard(c)).join('')}
            </div>
        `;
    }

    renderComplaintCard(complaint) {
        const date = new Date(complaint.timestamp).toLocaleString();
        return `
            <div class="complaint-card" onclick="app.showComplaintDetail('${complaint.id}')">
                <div class="complaint-header">
                    <h3 class="complaint-title">ID: ${complaint.id.substring(0, 12)}</h3>
                    <span class="badge badge-${complaint.status}">${complaint.status}</span>
                </div>
                <p class="complaint-description">${complaint.description.substring(0, 100)}...</p>
                <div class="complaint-footer">
                    <span>📅 ${date}</span>
                    <span class="badge badge-${complaint.priority.level}">${complaint.priority.level}</span>
                </div>
            </div>
        `;
    }

    renderPublicStats() {
        if (!window.app) return;

        const stats = window.app.getStatistics();
        const statsGrid = document.getElementById('public-stats-grid');

        if (!statsGrid) return;

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
                    <span class="stat-title">Resolved</span>
                    <div class="stat-icon">✅</div>
                </div>
                <div class="stat-value">${stats.resolved}</div>
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
                    <span class="stat-title">Avg Resolution</span>
                    <div class="stat-icon">⏱️</div>
                </div>
                <div class="stat-value">${stats.avgResolutionTime}</div>
            </div>
        `;

        // Render charts if available
        if (window.app.renderCategoryChart) {
            setTimeout(() => {
                const canvas = document.getElementById('public-category-chart');
                if (canvas) {
                    window.app.renderCategoryChart(stats.categoryData);
                }
            }, 100);
        }
    }

    renderDepartments() {
        if (!window.app) return;

        const stats = window.app.getStatistics();
        const deptStats = document.getElementById('department-stats');
        const deptPerformance = document.getElementById('department-performance');

        if (!deptStats) return;

        // Department cards
        const departments = Object.entries(stats.departmentData);
        deptStats.innerHTML = departments.map(([dept, count]) => `
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">${dept}</span>
                    <div class="stat-icon">🏢</div>
                </div>
                <div class="stat-value">${count}</div>
                <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--color-text-secondary);">
                    ${((count / stats.total) * 100).toFixed(1)}% of total
                </div>
            </div>
        `).join('');

        // Department performance table
        if (deptPerformance) {
            deptPerformance.innerHTML = `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--color-border);">
                            <th style="padding: 1rem; text-align: left;">Department</th>
                            <th style="padding: 1rem; text-align: center;">Total</th>
                            <th style="padding: 1rem; text-align: center;">Pending</th>
                            <th style="padding: 1rem; text-align: center;">Resolved</th>
                            <th style="padding: 1rem; text-align: center;">Resolution Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${departments.map(([dept, count]) => {
                const deptComplaints = window.app.complaints.filter(c => c.department === dept);
                const resolved = deptComplaints.filter(c => c.status === 'resolved').length;
                const pending = deptComplaints.filter(c => c.status === 'pending').length;
                const rate = count > 0 ? ((resolved / count) * 100).toFixed(1) : 0;

                return `
                                <tr style="border-bottom: 1px solid var(--color-border);">
                                    <td style="padding: 1rem;">${dept}</td>
                                    <td style="padding: 1rem; text-align: center;">${count}</td>
                                    <td style="padding: 1rem; text-align: center;">${pending}</td>
                                    <td style="padding: 1rem; text-align: center;">${resolved}</td>
                                    <td style="padding: 1rem; text-align: center;">
                                        <span class="badge ${rate >= 70 ? 'badge-low' : rate >= 40 ? 'badge-medium' : 'badge-critical'}">
                                            ${rate}%
                                        </span>
                                    </td>
                                </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    addRoleIndicator() {
        const navContainer = document.querySelector('.nav-container');
        if (!navContainer) return;

        // Remove existing role indicator if any
        const existingIndicator = document.getElementById('role-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        const roleIndicator = document.createElement('div');
        roleIndicator.id = 'role-indicator';
        roleIndicator.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            color: var(--color-text-primary);
            cursor: pointer;
        `;

        const emoji = this.currentRole === 'citizen' ? '👤' : '🏛️';
        const roleName = this.currentRole === 'citizen' ? 'Citizen' : 'Official';

        roleIndicator.innerHTML = `
            <span>${emoji}</span>
            <span>${roleName}</span>
            <button onclick="roleManager.logout()" style="
                background: transparent;
                border: none;
                color: var(--color-text-secondary);
                cursor: pointer;
                padding: 0;
                margin-left: 0.5rem;
                font-size: 1.2rem;
            " title="Change Role">🔄</button>
        `;

        navContainer.appendChild(roleIndicator);
    }

    logout() {
        if (confirm('Switch to a different role?')) {
            sessionStorage.removeItem('userRole');
            sessionStorage.removeItem('userContact');
            window.location.href = 'auth.html';
        }
    }

    getRole() {
        return this.currentRole;
    }
}

// Initialize role manager when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    // Wait for original app to initialize
    setTimeout(() => {
        window.roleManager = new RoleManager();
        console.log('✓ Role-based access control initialized');
    }, 600);
});
