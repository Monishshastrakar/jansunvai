// ============================================
// Gemini AI Assistant Module
// ============================================

class GeminiAssistant {
    constructor() {
        this.apiKey = null;
        this.modal = document.getElementById('ai-chat-modal');
        this.messagesContainer = document.getElementById('ai-chat-messages');
        this.input = document.getElementById('ai-chat-input');
        this.sendBtn = document.getElementById('ai-chat-send');
        this.floatingBtn = document.getElementById('ai-assistant-btn');
        this.closeBtn = document.getElementById('ai-chat-close');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadApiKey();
    }

    loadApiKey() {
        // In production, fetch from env or server
        // For now, users can set it via browser console: window.setGeminiAPIKey('your-key')
        this.apiKey = localStorage.getItem('gemini_api_key');

        if (!this.apiKey) {
            console.warn('Gemini API key not set. Set it via: window.setGeminiAPIKey("your-key")');
        }
    }

    setupEventListeners() {
        // Toggle modal
        this.floatingBtn.addEventListener('click', () => this.toggleModal());
        this.closeBtn.addEventListener('click', () => this.toggleModal());

        // Send message
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    toggleModal() {
        this.modal.classList.toggle('active');
        if (this.modal.classList.contains('active')) {
            this.input.focus();
        }
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(message);
            this.removeTypingIndicator();
            this.addMessage(response, 'ai');
        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage(
                'Sorry, I encountered an error. Please make sure your API key is set correctly. ' +
                'Use: window.setGeminiAPIKey("your-key")',
                'ai'
            );
            console.error('Gemini API Error:', error);
        }
    }

    async callGeminiAPI(userMessage) {
        if (!this.apiKey) {
            return 'Please set your Gemini API key first. Use: window.setGeminiAPIKey("your-key")';
        }

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.apiKey}`;

        const systemContext = `You are a helpful AI assistant for jan-sunvai, a multilingual grievance redressal platform in India. 
Your role is to:
1. Help citizens file complaints in ANY Indian language (Hindi, Tamil, Telugu, Marathi, Bengali, Etc.) or English
2. Understand and respond to Hinglish (code-mixed Hindi-English) naturally
3. Explain the AI categorization and priority system
4. Help users describe their problems clearly in their preferred language
5. Provide estimates on what priority their issue might receive

🌏 MULTILINGUAL SUPPORT:
- You can understand complaints in Hindi (हिंदी), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), Bengali (বাংলা), and more
- You understand Hinglish: "Road par bahut bada pothole hai, urgent repair chahiye"
- Respond in the same language as the user's question

📊 Priority levels:
- P0 (Critical/आपातकालीन): Emergency, life-threatening - SLA: 4 hours
  Example: "गैस लीक हो रहा है पूरे इलाके में" (Gas leak in entire area)
- P1 (High/उच्च): Serious issues affecting many - SLA: 24 hours
  Example: "मुख्य सड़क पर बड़ा गड्ढा, एक्सीडेंट हो रहे हैं" (Big pothole on main road, accidents happening)
- P2 (Medium/मध्यम): Important but not urgent - SLA: 72 hours
  Example: "बिजली की समस्या है कुछ दिनों से" (Electricity problem for few days)
- P3 (Low/कम): Minor issues - SLA: 7 days
  Example: "Street light repair chahiye" (Street light needs repair)
- P4 (Very Low/बहुत कम): Suggestions, requests - SLA: 14 days

💡 CULTURAL CONTEXT:
- Understand Indian civic issues: potholes (गड्ढे), garbage (कचरा), water supply (पानी की सप्लाई), electricity cuts (बिजली कटौती)
- Be familiar with Indian administrative terms: Municipality, Panchayat, Ward, MLA, Collector
- Respect cultural nuances in communication

Be concise, helpful, empathetic, and multilingual!`;

        const body = {
            contents: [{
                parts: [{
                    text: `${systemContext}\n\nUser: ${userMessage}\n\nAssistant:`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'user' ? 'user-message' : 'ai-message';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = type === 'user' ? '👤' : '🤖';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = text;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'ai-message typing-indicator-container';
        indicator.id = 'typing-indicator';

        indicator.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;

        this.messagesContainer.appendChild(indicator);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Global function to set API key
window.setGeminiAPIKey = function (key) {
    localStorage.setItem('gemini_api_key', key);
    console.log('Gemini API key saved! Reload the page to activate.');
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.geminiAssistant = new GeminiAssistant();
    });
} else {
    window.geminiAssistant = new GeminiAssistant();
}
