import React, { useState, useEffect, useRef } from 'react';
import VoiceInteractionService, { VoiceSettings, ConversationTurn } from '../services/VoiceInteractionService';
import { GeneratedQuestion } from '../services/QuestionService';
import {
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    Play,
    Pause,
    RotateCcw,
    Settings,
    MessageCircle,
    Clock
} from 'lucide-react';

interface VoiceInteractionProps {
    questions: GeneratedQuestion[];
    onQuestionComplete: (questionId: string, response: string) => void;
    onInterviewComplete: () => void;
    isActive: boolean;
}

const VoiceInteraction: React.FC<VoiceInteractionProps> = ({
    questions,
    onQuestionComplete,
    onInterviewComplete,
    isActive
}) => {
    const voiceService = useRef(new VoiceInteractionService());
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [userResponse, setUserResponse] = useState('');
    const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
        voice: 'default',
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0,
        language: 'en-US'
    });
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        const supportInfo = voiceService.current.getSupportInfo();
        setIsSupported(supportInfo.tts && supportInfo.stt);

        if (!supportInfo.tts || !supportInfo.stt) {
            setError('Voice interaction is not supported in this browser. Please use Chrome, Edge, or Safari.');
        }
    }, []);

    useEffect(() => {
        if (isActive && questions.length > 0 && currentQuestionIndex < questions.length) {
            askCurrentQuestion();
        }
    }, [isActive, currentQuestionIndex]);

    const askCurrentQuestion = async () => {
        if (currentQuestionIndex >= questions.length) {
            onInterviewComplete();
            return;
        }

        const question = questions[currentQuestionIndex];
        setError(null);

        try {
            setIsSpeaking(true);
            await voiceService.current.speakQuestion(question);
            setIsSpeaking(false);

            // Start listening for user response
            setTimeout(() => {
                startListening();
            }, 500); // Small delay after question is spoken
        } catch (err: any) {
            setError(`Failed to speak question: ${err.message}`);
            setIsSpeaking(false);
        }
    };

    const startListening = async () => {
        try {
            setIsListening(true);
            setUserResponse('');
            setError(null);

            const response = await voiceService.current.startListening();
            setUserResponse(response);
            setIsListening(false);

            // Complete the question
            onQuestionComplete(questions[currentQuestionIndex].id.toString(), response);

            // Move to next question after a short delay
            setTimeout(() => {
                setCurrentQuestionIndex(prev => prev + 1);
            }, 1000);
        } catch (err: any) {
            setError(`Failed to listen: ${err.message}`);
            setIsListening(false);
        }
    };

    const stopListening = () => {
        voiceService.current.stopListening();
        setIsListening(false);
    };

    const stopSpeaking = () => {
        voiceService.current.stopSpeaking();
        setIsSpeaking(false);
    };

    const pauseSpeaking = () => {
        voiceService.current.pauseSpeaking();
    };

    const resumeSpeaking = () => {
        voiceService.current.resumeSpeaking();
    };

    const repeatQuestion = () => {
        if (currentQuestionIndex < questions.length) {
            askCurrentQuestion();
        }
    };

    const handleVoiceSettingsChange = (newSettings: Partial<VoiceSettings>) => {
        const updatedSettings = { ...voiceSettings, ...newSettings };
        setVoiceSettings(updatedSettings);
        voiceService.current.setVoiceSettings(updatedSettings);
    };

    const getCurrentQuestion = (): GeneratedQuestion | null => {
        return currentQuestionIndex < questions.length ? questions[currentQuestionIndex] : null;
    };

    const getProgressPercentage = (): number => {
        return questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
    };

    if (!isSupported) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <VolumeX className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Voice Interaction Not Supported
                </h3>
                <p className="text-yellow-700 mb-4">
                    Your browser doesn't support voice interaction. Please use Chrome, Edge, or Safari for the best experience.
                </p>
                <div className="text-sm text-yellow-600">
                    <p>Supported features:</p>
                    <ul className="list-disc list-inside mt-2">
                        <li>Text-to-Speech: {voiceService.current.getSupportInfo().tts ? '✅' : '❌'}</li>
                        <li>Speech-to-Text: {voiceService.current.getSupportInfo().stt ? '✅' : '❌'}</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">AI Voice Interview</h2>
                    <p className="text-gray-600">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </p>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(getProgressPercentage())}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage()}%` }}
                    />
                </div>
            </div>

            {/* Current Question */}
            {getCurrentQuestion() && (
                <div className="mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-medium text-blue-900 mb-2">
                                    Question {currentQuestionIndex + 1}
                                </h3>
                                <p className="text-blue-800 mb-2">{getCurrentQuestion()?.question}</p>
                                <div className="flex items-center space-x-4 text-sm text-blue-600">
                                    <span className="flex items-center space-x-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{getCurrentQuestion()?.category}</span>
                                    </span>
                                    <span className="px-2 py-1 bg-blue-100 rounded-full text-xs">
                                        {getCurrentQuestion()?.difficulty}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Voice Controls */}
            <div className="flex justify-center space-x-4 mb-6">
                {/* Speaking Controls */}
                {isSpeaking && (
                    <>
                        <button
                            onClick={pauseSpeaking}
                            className="p-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
                        >
                            <Pause className="w-6 h-6" />
                        </button>
                        <button
                            onClick={stopSpeaking}
                            className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                            <VolumeX className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Listening Controls */}
                {isListening && (
                    <button
                        onClick={stopListening}
                        className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors animate-pulse"
                    >
                        <MicOff className="w-6 h-6" />
                    </button>
                )}

                {/* Idle Controls */}
                {!isSpeaking && !isListening && (
                    <>
                        <button
                            onClick={repeatQuestion}
                            className="p-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                        >
                            <RotateCcw className="w-6 h-6" />
                        </button>
                        <button
                            onClick={startListening}
                            className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                        >
                            <Mic className="w-6 h-6" />
                        </button>
                    </>
                )}
            </div>

            {/* Status Indicators */}
            <div className="flex justify-center space-x-6 mb-6">
                <div className={`flex items-center space-x-2 ${isSpeaking ? 'text-blue-600' : 'text-gray-400'}`}>
                    <Volume2 className="w-5 h-5" />
                    <span className="text-sm font-medium">
                        {isSpeaking ? 'AI Speaking...' : 'AI Ready'}
                    </span>
                </div>
                <div className={`flex items-center space-x-2 ${isListening ? 'text-green-600' : 'text-gray-400'}`}>
                    <Mic className="w-5 h-5" />
                    <span className="text-sm font-medium">
                        {isListening ? 'Listening...' : 'Ready to Listen'}
                    </span>
                </div>
            </div>

            {/* User Response */}
            {userResponse && (
                <div className="mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-2">Your Response:</h4>
                        <p className="text-green-800">{userResponse}</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Voice Settings */}
            {showSettings && (
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Voice Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Speech Rate
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={voiceSettings.rate}
                                onChange={(e) => handleVoiceSettingsChange({ rate: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                            <span className="text-sm text-gray-600">{voiceSettings.rate}</span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pitch
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={voiceSettings.pitch}
                                onChange={(e) => handleVoiceSettingsChange({ pitch: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                            <span className="text-sm text-gray-600">{voiceSettings.pitch}</span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Volume
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={voiceSettings.volume}
                                onChange={(e) => handleVoiceSettingsChange({ volume: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                            <span className="text-sm text-gray-600">{Math.round(voiceSettings.volume * 100)}%</span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Language
                            </label>
                            <select
                                value={voiceSettings.language}
                                onChange={(e) => handleVoiceSettingsChange({ language: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                            >
                                <option value="en-US">English (US)</option>
                                <option value="en-GB">English (UK)</option>
                                <option value="es-ES">Spanish</option>
                                <option value="fr-FR">French</option>
                                <option value="de-DE">German</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                    <li>• The AI will ask each question using voice</li>
                    <li>• Listen carefully and respond when prompted</li>
                    <li>• Speak clearly and at a normal pace</li>
                    <li>• Use the controls to pause, repeat, or adjust settings</li>
                    <li>• The interview will automatically progress through all questions</li>
                </ul>
            </div>
        </div>
    );
};

export default VoiceInteraction;
