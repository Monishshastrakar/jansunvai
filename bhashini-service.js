// ============================================
// Bhashini Voice Recognition Service
// Speech-to-Text for 22+ Indian Languages
// ============================================

class BhashiniService {
    constructor() {
        // API Configuration (to be set from .env)
        this.config = {
            userId: '',
            ulcaApiKey: '',
            inferenceApiKey: '',
            pipelineId: '', // Will be fetched dynamically
        };

        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.selectedLanguage = 'hi'; // Default: Hindi

        // Supported languages
        this.languages = {
            'hi': 'Hindi',
            'en': 'English',
            'bn': 'Bengali',
            'ta': 'Tamil',
            'te': 'Telugu',
            'mr': 'Marathi',
            'gu': 'Gujarati',
            'kn': 'Kannada',
            'ml': 'Malayalam',
            'or': 'Oriya',
            'pa': 'Punjabi',
            'ur': 'Urdu'
        };
    }

    // Initialize service with API keys
    init(config) {
        this.config = { ...this.config, ...config };
        console.log('✓ Bhashini Service initialized');
    }

    // Set the language for speech recognition
    setLanguage(langCode) {
        if (this.languages[langCode]) {
            this.selectedLanguage = langCode;
            console.log(`Language set to: ${this.languages[langCode]}`);
        }
    }

    // Start voice recording
    async startRecording() {
        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                await this.processAudio(audioBlob);

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;

            console.log('🎤 Recording started...');
            return { success: true, message: 'Recording started' };
        } catch (error) {
            console.error('Microphone access denied:', error);
            return { success: false, message: 'Microphone access denied. Please grant permission.' };
        }
    }

    // Stop voice recording
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            console.log('⏹️ Recording stopped');
            return { success: true, message: 'Recording stopped. Processing...' };
        }
        return { success: false, message: 'No recording in progress' };
    }

    // Process audio and convert to text using Bhashini API
    async processAudio(audioBlob) {
        try {
            // OPTION 1: If Bhashini API keys are configured
            if (this.config.inferenceApiKey) {
                return await this.callBhashiniAPI(audioBlob);
            }

            // OPTION 2: Fallback to Web Speech API (for demo purposes)
            // This works for basic English but not for all Indian languages
            return await this.fallbackWebSpeechAPI();
        } catch (error) {
            console.error('Error processing audio:', error);
            return { success: false, text: '', error: error.message };
        }
    }

    // Call Bhashini API for speech-to-text
    async callBhashiniAPI(audioBlob) {
        try {
            // Step 1: Get pipeline configuration
            const pipelineConfig = await this.getPipelineConfig();

            if (!pipelineConfig.success) {
                throw new Error('Failed to get pipeline configuration');
            }

            // Step 2: Convert audio to base64
            const audioBase64 = await this.blobToBase64(audioBlob);

            // Step 3: Call ASR API
            const response = await fetch(pipelineConfig.serviceEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.config.inferenceApiKey
                },
                body: JSON.stringify({
                    pipelineTasks: [{
                        taskType: 'asr',
                        config: {
                            language: {
                                sourceLanguage: this.selectedLanguage
                            },
                            audioFormat: 'webm',
                            samplingRate: 16000
                        }
                    }],
                    inputData: {
                        audio: [{
                            audioContent: audioBase64
                        }]
                    }
                })
            });

            const data = await response.json();

            if (data.pipelineResponse && data.pipelineResponse[0]) {
                const transcript = data.pipelineResponse[0].output[0].source;
                console.log('✓ Transcription:', transcript);
                return { success: true, text: transcript, language: this.selectedLanguage };
            }

            throw new Error('No transcription received');
        } catch (error) {
            console.error('Bhashini API error:', error);
            // Fall back to Web Speech API
            return await this.fallbackWebSpeechAPI();
        }
    }

    // Get pipeline configuration from Bhashini
    async getPipelineConfig() {
        try {
            const response = await fetch('https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ulcaApiKey': this.config.ulcaApiKey,
                    'userID': this.config.userId
                },
                body: JSON.stringify({
                    pipelineTasks: [{
                        taskType: 'asr',
                        config: {
                            language: {
                                sourceLanguage: this.selectedLanguage
                            }
                        }
                    }],
                    pipelineRequestConfig: {
                        pipelineId: this.config.pipelineId || 'default'
                    }
                })
            });

            const data = await response.json();

            if (data.pipelineResponseConfig && data.pipelineResponseConfig[0]) {
                return {
                    success: true,
                    serviceEndpoint: data.pipelineResponseConfig[0].config[0].serviceId
                };
            }

            return { success: false };
        } catch (error) {
            console.error('Error fetching pipeline config:', error);
            return { success: false };
        }
    }

    // Fallback to Web Speech API (works for English, limited Indian language support)
    async fallbackWebSpeechAPI() {
        return new Promise((resolve) => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                resolve({
                    success: false,
                    text: '',
                    error: 'Speech recognition not supported. Please configure Bhashini API keys.'
                });
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            // Map language codes to BCP 47 format
            const bcp47Languages = {
                'hi': 'hi-IN',
                'en': 'en-IN',
                'bn': 'bn-IN',
                'ta': 'ta-IN',
                'te': 'te-IN',
                'mr': 'mr-IN',
                'gu': 'gu-IN',
                'kn': 'kn-IN',
                'ml': 'ml-IN',
                'pa': 'pa-IN',
                'ur': 'ur-IN'
            };

            recognition.lang = bcp47Languages[this.selectedLanguage] || 'hi-IN';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('✓ Web Speech API Transcription:', transcript);
                resolve({ success: true, text: transcript, language: this.selectedLanguage });
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                resolve({
                    success: false,
                    text: '',
                    error: `Speech recognition error: ${event.error}`
                });
            };

            recognition.start();
        });
    }

    // Helper: Convert blob to base64
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Get list of supported languages
    getSupportedLanguages() {
        return this.languages;
    }

    // Check if currently recording
    isCurrentlyRecording() {
        return this.isRecording;
    }
}

// Initialize Bhashini service
window.bhashiniService = new BhashiniService();

// Try to load API keys from environment (if available)
// In production, these should be loaded from server-side config
try {
    // If you have API keys, uncomment and set them here
    // window.bhashiniService.init({
    //     userId: 'your_user_id',
    //     ulcaApiKey: 'your_ulca_api_key',
    //     inferenceApiKey: 'your_inference_api_key'
    // });
    console.log('✓ Bhashini Service ready (using Web Speech API fallback)');
} catch (error) {
    console.warn('Bhashini API keys not configured, using Web Speech API fallback');
}
