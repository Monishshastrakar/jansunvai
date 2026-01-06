// ============================================
// Role-Based Access Control Manager
// ============================================

class AuthManager {
    constructor() {
        this.currentRole = this.loadRole();
        this.currentUser = this.loadUser();
    }

    loadRole() {
        return localStorage.getItem('userRole') || null;
    }

    loadUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    saveRole(role) {
        localStorage.setItem('userRole', role);
        this.currentRole = role;
    }

    saveUser(userData) {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        this.currentUser = userData;
    }

    getRole() {
        return this.currentRole;
    }

    getUser() {
        return this.currentUser;
    }

    isCitizen() {
        return this.currentRole === 'citizen';
    }

    isAdmin() {
        return this.currentRole === 'admin';
    }

    hasRole() {
        return this.currentRole !== null;
    }

    switchRole(newRole) {
        this.saveRole(newRole);
        window.location.reload(); // Reload to apply new permissions
    }

    logout() {
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentUser');
        this.currentRole = null;
        this.currentUser = null;
        window.location.reload();
    }

    // Role selection modal
    showRoleSelection() {
        const modal = document.createElement('div');
        modal.className = 'role-modal';
        modal.innerHTML = `
            <div class="role-modal-overlay"></div>
            <div class="role-modal-content">
                <div class="role-modal-header">
                    <h1>Welcome to Jan Sunvai</h1>
                    <p>Select your role to continue</p>
                </div>
                <div class="role-options">
                    <button class="role-option" data-role="citizen">
                        <div class="role-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <h3>Citizen</h3>
                        <p>Submit and track your grievances</p>
                        <ul class="role-features">
                            <li>Submit new complaints</li>
                            <li>Track your complaint status</li>
                            <li>Get real-time updates</li>
                        </ul>
                    </button>
                    <button class="role-option" data-role="admin">
                        <div class="role-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                <path d="M2 17l10 5 10-5"></path>
                                <path d="M2 12l10 5 10-5"></path>
                            </svg>
                        </div>
                        <h3>Admin / Official</h3>
                        <p>Manage and resolve complaints</p>
                        <ul class="role-features">
                            <li>View all complaints</li>
                            <li>Analytics dashboard</li>
                            <li>Update complaint status</li>
                        </ul>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle role selection
        modal.querySelectorAll('.role-option').forEach(option => {
            option.addEventListener('click', () => {
                const role = option.dataset.role;
                if (role === 'citizen') {
                    // For citizens, prompt for contact number
                    this.showCitizenLogin(modal);
                } else {
                    // For admins, prompt for credentials
                    this.showAdminLogin(modal);
                }
            });
        });
    }

    showAdminLogin(roleModal) {
        const loginModal = document.createElement('div');
        loginModal.className = 'role-modal';
        loginModal.innerHTML = `
            <div class="role-modal-overlay"></div>
            <div class="role-modal-content" style="max-width: 500px;">
                <div class="role-modal-header">
                    <h2>Official Login</h2>
                    <p>Enter your details to access the dashboard</p>
                </div>
                <div style="padding: 2rem;">
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label for="admin-name">Full Name</label>
                        <input type="text" id="admin-name" placeholder="e.g. Officer Sharma" style="font-size: 1rem; padding: 0.75rem;">
                    </div>
                    <div class="form-group">
                        <label for="admin-dept">Department</label>
                        <select id="admin-dept" style="font-size: 1rem; padding: 0.75rem;">
                            <option value="General">General Administration</option>
                            <option value="Roads">Roads & Infrastructure</option>
                            <option value="Sanitation">Sanitation & Waste</option>
                            <option value="Water">Water Supply</option>
                            <option value="Electricity">Electricity</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" id="admin-login-btn" style="width: 100%; margin-top: 1.5rem;">
                        Login to Dashboard
                    </button>
                    <button class="btn btn-secondary" id="back-to-role-btn-admin" style="width: 100%; margin-top: 0.5rem;">
                        Back
                    </button>
                </div>
            </div>
        `;

        roleModal.remove();
        document.body.appendChild(loginModal);

        const nameInput = loginModal.querySelector('#admin-name');
        const deptInput = loginModal.querySelector('#admin-dept');
        const loginBtn = loginModal.querySelector('#admin-login-btn');
        const backBtn = loginModal.querySelector('#back-to-role-btn-admin');

        loginBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            const dept = deptInput.value;

            if (name.length > 2) {
                this.saveRole('admin');
                this.saveUser({
                    name: name,
                    department: dept,
                    id: 'ADM-' + Math.floor(Math.random() * 1000)
                });
                loginModal.remove();
                this.applyRoleRestrictions();
                // Reload to trigger dashboard re-render with new user assigned tasks
                window.location.reload();
            } else {
                alert('Please enter a valid name');
            }
        });

        backBtn.addEventListener('click', () => {
            loginModal.remove();
            this.showRoleSelection();
        });

        setTimeout(() => nameInput.focus(), 100);
    }

    showCitizenLogin(roleModal) {
        const loginModal = document.createElement('div');
        loginModal.className = 'role-modal';
        loginModal.innerHTML = `
            <div class="role-modal-overlay"></div>
            <div class="role-modal-content" style="max-width: 500px;">
                <div class="role-modal-header">
                    <h2>Citizen Login</h2>
                    <p>Enter your contact number to continue</p>
                </div>
                <div style="padding: 2rem;">
                    <div class="form-group">
                        <label for="citizen-login-contact">Mobile Number</label>
                        <input type="tel" id="citizen-login-contact" placeholder="Enter 10-digit mobile number" maxlength="10" style="font-size: 1.125rem; padding: 0.875rem;">
                    </div>
                    <button class="btn btn-primary" id="citizen-login-btn" style="width: 100%; margin-top: 1rem;">
                        Continue as Citizen
                    </button>
                    <button class="btn btn-secondary" id="back-to-role-btn" style="width: 100%; margin-top: 0.5rem;">
                        Back
                    </button>
                </div>
            </div>
        `;

        roleModal.remove();
        document.body.appendChild(loginModal);

        const contactInput = loginModal.querySelector('#citizen-login-contact');
        const loginBtn = loginModal.querySelector('#citizen-login-btn');
        const backBtn = loginModal.querySelector('#back-to-role-btn');

        loginBtn.addEventListener('click', () => {
            const contact = contactInput.value.trim();
            if (contact.length === 10 && /^[0-9]+$/.test(contact)) {
                this.saveRole('citizen');
                this.saveUser({ contact: contact });
                loginModal.remove();
                this.applyRoleRestrictions();
            } else {
                alert('Please enter a valid 10-digit mobile number');
            }
        });

        backBtn.addEventListener('click', () => {
            loginModal.remove();
            this.showRoleSelection();
        });

        contactInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });

        // Focus on input
        setTimeout(() => contactInput.focus(), 100);
    }

    // Apply role-based UI restrictions
    applyRoleRestrictions() {
        const navLinks = document.querySelectorAll('.nav-link');
        const submitView = document.getElementById('submit-view');
        const dashboardView = document.getElementById('dashboard-view');

        if (this.isCitizen()) {
            // Hide admin tabs for citizens
            navLinks.forEach(link => {
                const view = link.dataset.view;
                if (view !== 'submit') {
                    link.style.display = 'none';
                }
            });

            // Add role badge
            this.addRoleBadge('Citizen');

            // Modify submit form for citizen
            this.setupCitizenForm();

        } else if (this.isAdmin()) {
            // Show all tabs for admin
            navLinks.forEach(link => {
                link.style.display = 'flex';
            });

            // Add role badge
            this.addRoleBadge('Admin');
        }
    }

    addRoleBadge(roleText) {
        const navContainer = document.querySelector('.nav-container');

        // Remove existing badge if any
        const existingBadge = document.querySelector('.role-badge');
        if (existingBadge) existingBadge.remove();

        const badge = document.createElement('div');
        badge.className = 'role-badge';
        badge.innerHTML = `
            <span>${roleText}</span>
            <button class="role-switch-btn" title="Switch Role">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
            </button>
        `;

        navContainer.appendChild(badge);

        // Add switch functionality
        badge.querySelector('.role-switch-btn').addEventListener('click', () => {
            if (confirm('Switch to a different role?')) {
                this.logout();
            }
        });
    }

    setupCitizenForm() {
        const nameInput = document.getElementById('citizen-name');
        const contactInput = document.getElementById('citizen-contact');

        if (this.currentUser && this.currentUser.contact) {
            // Pre-fill contact for citizen
            if (contactInput) {
                contactInput.value = this.currentUser.contact;
                contactInput.readOnly = true;
                contactInput.style.backgroundColor = 'var(--color-surface-elevated)';
            }
        }
    }

    // Filter complaints for citizens - only show their own
    filterCitizenComplaints(complaints) {
        if (!this.isCitizen() || !this.currentUser) {
            return complaints;
        }

        return complaints.filter(c => c.citizen.contact === this.currentUser.contact);
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Check if user needs to select role
if (!authManager.hasRole()) {
    // Show role selection on page load
    window.addEventListener('DOMContentLoaded', () => {
        authManager.showRoleSelection();
    });
} else {
    // Apply restrictions if role already set
    window.addEventListener('DOMContentLoaded', () => {
        authManager.applyRoleRestrictions();
    });
}
