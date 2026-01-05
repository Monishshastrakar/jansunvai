// ============================================
// Theme Toggle System for jan-sunvai
// Vibrant, Modern Theme System
// ============================================

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        // Apply theme immediately
        this.applyTheme(this.currentTheme);

        // Create toggle button (works for both auth.html and index.html)
        this.createToggleButton();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
        this.updateToggleButton();
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    createToggleButton() {
        // Try to find existing button first (for auth.html which has it in HTML)
        let btn = document.getElementById('theme-toggle');

        if (btn) {
            // Button exists in HTML, just add event listener
            btn.onclick = () => this.toggleTheme();
            this.updateToggleButton();
            return;
        }

        // For index.html, create and append button to navbar
        const navContainer = document.querySelector('.nav-container');
        if (!navContainer) {
            console.warn('Nav container not found, theme toggle not created');
            return;
        }

        btn = document.createElement('button');
        btn.id = 'theme-toggle';
        btn.className = 'theme-toggle-btn';
        btn.setAttribute('aria-label', 'Toggle theme');
        btn.onclick = () => this.toggleTheme();

        navContainer.appendChild(btn);
        this.updateToggleButton();
    }

    updateToggleButton() {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;

        if (this.currentTheme === 'dark') {
            btn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
            `;
            btn.title = 'Switch to Light Mode';
        } else {
            btn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
            `;
            btn.title = 'Switch to Dark Mode';
        }
    }
}

// Initialize theme manager immediately when DOM is ready (no delay!)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
        console.log('✓ Theme toggle initialized');
    });
} else {
    // DOM already loaded
    window.themeManager = new ThemeManager();
    console.log('✓ Theme toggle initialized');
}
