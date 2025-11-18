import { GeneratedQuestion } from './QuestionService';

export interface VoiceInteractionState {
    isListening: boolean;
    isSpeaking: boolean;
    currentQuestion: GeneratedQuestion | null;
    userResponse: string;
    conversationHistory: ConversationTurn[];
}

export interface ConversationTurn {
    id: string;
    type: 'question' | 'response' | 'followup';
    content: string;
    timestamp: Date;
    questionId?: string;
}

export interface VoiceSettings {
    voice: string;
    rate: number;
    pitch: number;
    volume: number;
    language: string;
}

class VoiceInteractionService {
    private speechSynthesis: SpeechSynthesis;
    private speechRecognition: SpeechRecognition | null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private isListening: boolean = false;
    private isSpeaking: boolean = false;
    private conversationHistory: ConversationTurn[] = [];
    private voiceSettings: VoiceSettings;

    constructor() {
        this.speechSynthesis = window.speechSynthesis;
        this.speechRecognition = this.initializeSpeechRecognition();
        this.voiceSettings = {
            voice: 'default',
            rate: 0.9,
            pitch: 1.0,
            volume: 1.0,
            language: 'en-US'
        };
    }

    private initializeSpeechRecognition(): SpeechRecognition | null {
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            return null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = this.voiceSettings.language;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            this.isListening = true;
            console.log('Speech recognition started');
        };

        recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            if (result.isFinal) {
                const transcript = result[0].transcript;
                console.log('Speech recognition result:', transcript);
                this.addToConversationHistory('response', transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
        };

        recognition.onend = () => {
            this.isListening = false;
            console.log('Speech recognition ended');
        };

        return recognition;
    }

    public async speakQuestion(question: GeneratedQuestion): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Stop any current speech
                this.stopSpeaking();

                const utterance = new SpeechSynthesisUtterance(question.question);

                // Configure voice settings
                utterance.rate = this.voiceSettings.rate;
                utterance.pitch = this.voiceSettings.pitch;
                utterance.volume = this.voiceSettings.volume;
                utterance.lang = this.voiceSettings.language;

                // Try to use a specific voice if available
                const voices = this.speechSynthesis.getVoices();
                const preferredVoice = voices.find(voice =>
                    voice.lang.startsWith('en') &&
                    (voice.name.includes('Google') || voice.name.includes('Microsoft'))
                );

                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }

                utterance.onstart = () => {
                    this.isSpeaking = true;
                    console.log('Started speaking question:', question.question);
                };

                utterance.onend = () => {
                    this.isSpeaking = false;
                    this.addToConversationHistory('question', question.question, question.id.toString());
                    console.log('Finished speaking question');
                    resolve();
                };

                utterance.onerror = (event) => {
                    this.isSpeaking = false;
                    console.error('Speech synthesis error:', event.error);
                    reject(new Error(`Speech synthesis failed: ${event.error}`));
                };

                this.currentUtterance = utterance;
                this.speechSynthesis.speak(utterance);
            } catch (error) {
                reject(error);
            }
        });
    }

    public async speakText(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.stopSpeaking();

                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = this.voiceSettings.rate;
                utterance.pitch = this.voiceSettings.pitch;
                utterance.volume = this.voiceSettings.volume;
                utterance.lang = this.voiceSettings.language;

                utterance.onstart = () => {
                    this.isSpeaking = true;
                };

                utterance.onend = () => {
                    this.isSpeaking = false;
                    resolve();
                };

                utterance.onerror = (event) => {
                    this.isSpeaking = false;
                    reject(new Error(`Speech synthesis failed: ${event.error}`));
                };

                this.currentUtterance = utterance;
                this.speechSynthesis.speak(utterance);
            } catch (error) {
                reject(error);
            }
        });
    }

    public startListening(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.speechRecognition) {
                reject(new Error('Speech recognition not supported'));
                return;
            }

            if (this.isListening) {
                reject(new Error('Already listening'));
                return;
            }

            this.speechRecognition.onresult = (event) => {
                const result = event.results[event.results.length - 1];
                if (result.isFinal) {
                    const transcript = result[0].transcript;
                    this.addToConversationHistory('response', transcript);
                    resolve(transcript);
                }
            };

            this.speechRecognition.onerror = (event) => {
                reject(new Error(`Speech recognition error: ${event.error}`));
            };

            try {
                this.speechRecognition.start();
            } catch (error) {
                reject(error);
            }
        });
    }

    public stopListening(): void {
        if (this.speechRecognition && this.isListening) {
            this.speechRecognition.stop();
        }
    }

    public stopSpeaking(): void {
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
        }
        this.isSpeaking = false;
    }

    public pauseSpeaking(): void {
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.pause();
        }
    }

    public resumeSpeaking(): void {
        if (this.speechSynthesis.paused) {
            this.speechSynthesis.resume();
        }
    }

    public setVoiceSettings(settings: Partial<VoiceSettings>): void {
        this.voiceSettings = { ...this.voiceSettings, ...settings };

        // Update speech recognition language if changed
        if (settings.language && this.speechRecognition) {
            this.speechRecognition.lang = settings.language;
        }
    }

    public getVoiceSettings(): VoiceSettings {
        return { ...this.voiceSettings };
    }

    public getAvailableVoices(): SpeechSynthesisVoice[] {
        return this.speechSynthesis.getVoices();
    }

    public addToConversationHistory(
        type: 'question' | 'response' | 'followup',
        content: string,
        questionId?: string
    ): void {
        const turn: ConversationTurn = {
            id: `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            content,
            timestamp: new Date(),
            questionId
        };

        this.conversationHistory.push(turn);
        console.log('Added to conversation history:', turn);
    }

    public getConversationHistory(): ConversationTurn[] {
        return [...this.conversationHistory];
    }

    public clearConversationHistory(): void {
        this.conversationHistory = [];
    }

    public getState(): VoiceInteractionState {
        return {
            isListening: this.isListening,
            isSpeaking: this.isSpeaking,
            currentQuestion: null, // This would be set by the parent component
            userResponse: '',
            conversationHistory: this.getConversationHistory()
        };
    }

    public isSupported(): boolean {
        return 'speechSynthesis' in window && this.speechRecognition !== null;
    }

    public getSupportInfo(): { tts: boolean; stt: boolean } {
        return {
            tts: 'speechSynthesis' in window,
            stt: this.speechRecognition !== null
        };
    }
}

export default VoiceInteractionService;
