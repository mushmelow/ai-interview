import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import InterviewService from '../services/InterviewService';
import QuestionGenerator from './QuestionGenerator';
import QuestionDisplay from './QuestionDisplay';
import VoiceInteraction from './VoiceInteraction';
import type { Interview as InterviewType } from '../types';
import { GeneratedQuestion } from '../services/QuestionService';
import {
    Video,
    Mic,
    Play,
    Square,
    Clock,
    AlertTriangle,
    Brain,
    HelpCircle
} from 'lucide-react';

const Interview: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const interviewService = new InterviewService();

    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [timeElapsed, setTimeElapsed] = useState<number>(0);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentInterview, setCurrentInterview] = useState<InterviewType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [videoReady, setVideoReady] = useState<boolean>(false);

    // AI Question states
    const [currentView, setCurrentView] = useState<'generator' | 'display' | 'recording' | 'voice'>('generator');
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
    const [questionSessionId, setQuestionSessionId] = useState<string>('');

    // Voice interaction states
    const [voiceResponses, setVoiceResponses] = useState<{ [questionId: string]: string }>({});
    const [isVoiceInterviewActive, setIsVoiceInterviewActive] = useState<boolean>(false);

    // Refs for media
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Initialize media stream when switching to recording view
    useEffect(() => {
        let stream: MediaStream | null = null;

        const initializeMedia = async (): Promise<void> => {
            try {
                console.log('Initializing media stream...');

                // Check permissions first
                const hasPermission = await testCameraPermissions();
                if (!hasPermission) {
                    setError('Camera permission denied. Please allow camera access and refresh the page.');
                    return;
                }

                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                    audio: true
                });
                console.log('Media stream obtained:', stream);
                setMediaStream(stream);
                setVideoReady(false); // Reset video ready state

                // Set video source after stream is ready
                if (videoRef.current && stream) {
                    console.log('Setting video srcObject...');
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error('Media access error:', err);
                setError('Failed to access camera and microphone. Please check permissions.');
                setVideoReady(false);
            }
        };

        // Initialize media when switching to recording view
        if (currentView === 'recording') {
            // Always try to initialize, even if we have a stream (in case it's stale)
            initializeMedia();
        } else if (mediaStream) {
            // Clean up stream when leaving recording view
            console.log('Cleaning up media stream...');
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
            setVideoReady(false);
        }

        return () => {
            if (stream) {
                console.log('Cleaning up media stream...');
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [currentView]); // Run when currentView changes

    // Handle manual camera initialization
    useEffect(() => {
        const handleForceCameraInit = () => {
            if (currentView === 'recording') {
                console.log('Force camera initialization triggered');
                setMediaStream(null);
                setVideoReady(false);
                setError(null);
            }
        };

        window.addEventListener('forceCameraInit', handleForceCameraInit);
        return () => window.removeEventListener('forceCameraInit', handleForceCameraInit);
    }, [currentView]);

    // Set video source when mediaStream is available
    useEffect(() => {
        if (mediaStream && videoRef.current) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream]);

    // Handle video events
    const handleVideoLoadedMetadata = () => {
        console.log('Video metadata loaded, video is ready');
        setVideoReady(true);
    };

    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        console.error('Video error:', e);
        setError('Failed to load video stream');
        setVideoReady(false);
    };

    const handleVideoCanPlay = () => {
        console.log('Video can play');
        setVideoReady(true);
    };

    // Test camera permissions
    const testCameraPermissions = async () => {
        try {
            const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
            console.log('Camera permission status:', result.state);
            return result.state === 'granted';
        } catch (err) {
            console.log('Could not check camera permissions:', err);
            return true; // Assume granted if we can't check
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartInterview = async (): Promise<void> => {
        if (!user) {
            setError('Please log in to start an interview');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Start interview session on backend
            const interviewData = await interviewService.startInterview(
                user.id,
                'AI Interview Session',
                'Automated interview with AI analysis'
            );

            setCurrentInterview(interviewData.data?.interview || null);

            // Start recording
            if (mediaStream) {
                const mediaRecorder = new MediaRecorder(mediaStream, {
                    mimeType: 'video/webm;codecs=vp9'
                });

                mediaRecorderRef.current = mediaRecorder;
                recordedChunksRef.current = [];

                mediaRecorder.ondataavailable = (event: BlobEvent) => {
                    if (event.data.size > 0) {
                        recordedChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.start(1000); // Record in 1-second chunks
            }

            setIsRecording(true);
        } catch (err: any) {
            setError(err.message || 'Failed to start interview');
            console.error('Start interview error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFinishInterview = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            // Stop recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }

            setIsRecording(false);

            // Upload recording if we have one
            if (recordedChunksRef.current.length > 0 && currentInterview) {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const file = new File([blob], 'interview-recording.webm', { type: 'video/webm' });

                await interviewService.uploadRecording(currentInterview.id, file);
            }

            // End interview session
            if (currentInterview) {
                await interviewService.endInterview(currentInterview.id);
            }

            alert('Interview completed! Your recording has been saved and will be analyzed.');

            // Reset state
            setCurrentInterview(null);
            setTimeElapsed(0);
            recordedChunksRef.current = [];
        } catch (err: any) {
            setError(err.message || 'Failed to finish interview');
            console.error('Finish interview error:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleVideo = (): void => {
        if (mediaStream) {
            const videoTrack = mediaStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
            }
        }
    };

    const toggleAudio = (): void => {
        if (mediaStream) {
            const audioTrack = mediaStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
            }
        }
    };

    // AI Question handlers
    const handleQuestionsGenerated = (questions: GeneratedQuestion[], sessionId: string): void => {
        setGeneratedQuestions(questions);
        setQuestionSessionId(sessionId);
        setCurrentView('display');
    };

    const handleBackToGenerator = (): void => {
        setCurrentView('generator');
        setGeneratedQuestions([]);
        setQuestionSessionId('');
    };

    const handleStartInterviewWithQuestions = (): void => {
        setCurrentView('recording');
    };

    const handleStartVoiceInterview = (): void => {
        setIsVoiceInterviewActive(true);
        setCurrentView('voice');
    };

    const handleQuestionComplete = (questionId: string, response: string): void => {
        setVoiceResponses(prev => ({
            ...prev,
            [questionId]: response
        }));
        console.log(`Question ${questionId} completed with response:`, response);
    };

    const handleVoiceInterviewComplete = (): void => {
        setIsVoiceInterviewActive(false);
        console.log('Voice interview completed. Responses:', voiceResponses);

        // You can process the voice responses here
        // For example, save them to the backend or show a summary

        // Go back to display view to show results
        setCurrentView('display');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Render different views based on current state */}
            {currentView === 'generator' && (
                <QuestionGenerator
                    onQuestionsGenerated={handleQuestionsGenerated}
                    onBack={() => window.history.back()}
                />
            )}

            {currentView === 'display' && (
                <QuestionDisplay
                    questions={generatedQuestions}
                    sessionId={questionSessionId}
                    onStartInterview={handleStartInterviewWithQuestions}
                    onStartVoiceInterview={handleStartVoiceInterview}
                    onBack={handleBackToGenerator}
                />
            )}

            {currentView === 'voice' && (
                <VoiceInteraction
                    questions={generatedQuestions}
                    onQuestionComplete={handleQuestionComplete}
                    onInterviewComplete={handleVoiceInterviewComplete}
                    isActive={isVoiceInterviewActive}
                />
            )}

            {currentView === 'recording' && (
                <>
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {t('interview.title')} - AI Generated Questions
                        </h1>
                        <p className="text-gray-600">
                            {isRecording ? t('interview.inProgress') : t('interview.preparation')}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Questions Display */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-blue-900 mb-2">
                                    AI Generated Questions ({generatedQuestions.length} questions)
                                </h3>
                                <div className="space-y-2">
                                    {generatedQuestions.slice(0, 3).map((question, index) => (
                                        <div key={question.id} className="text-sm text-blue-800">
                                            <strong>{index + 1}.</strong> {question.question}
                                        </div>
                                    ))}
                                    {generatedQuestions.length > 3 && (
                                        <div className="text-sm text-blue-600 font-medium">
                                            ... and {generatedQuestions.length - 3} more questions
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Video Container */}
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                        {/* Video Loading Indicator */}
                        {!videoReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                <div className="text-center text-white">
                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-sm">Loading camera...</p>
                                    <button
                                        onClick={() => {
                                            console.log('=== Camera Debug Info ===');
                                            console.log('Current view:', currentView);
                                            console.log('Media stream:', mediaStream);
                                            console.log('Video ready:', videoReady);
                                            console.log('Video ref:', videoRef.current);
                                            console.log('Error:', error);
                                            console.log('========================');

                                            setError(null);
                                            setVideoReady(false);
                                            setMediaStream(null);
                                            // Force re-initialization
                                            const event = new Event('forceCameraInit');
                                            window.dispatchEvent(event);
                                        }}
                                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        {error ? 'Retry Camera' : 'Initialize Camera'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                backgroundColor: '#000'
                            }}
                            onLoadedMetadata={handleVideoLoadedMetadata}
                            onError={handleVideoError}
                            onCanPlay={handleVideoCanPlay}
                        />

                        {/* Recording Indicator */}
                        {isRecording && (
                            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium">{t('interview.recording')}</span>
                            </div>
                        )}

                        {/* Timer */}
                        {isRecording && (
                            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono">{formatTime(timeElapsed)}</span>
                            </div>
                        )}

                        {/* Video Controls Overlay */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                            <button
                                onClick={toggleVideo}
                                className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
                                aria-label="Toggle video"
                            >
                                <Video className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={toggleAudio}
                                className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
                                aria-label="Toggle audio"
                            >
                                <Mic className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Interview Controls */}
                    <div className="flex justify-center space-x-4">
                        {!isRecording ? (
                            <button
                                onClick={handleStartInterview}
                                className="btn-primary flex items-center space-x-2 px-8 py-3"
                                disabled={!mediaStream || loading}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Play className="w-5 h-5" />
                                )}
                                <span>{loading ? 'Starting...' : t('interview.start')}</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleFinishInterview}
                                className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                                <span>{loading ? 'Finishing...' : t('interview.finishInterview')}</span>
                            </button>
                        )}
                    </div>

                    {/* Interview Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-blue-900 mb-1">
                                    Interview Guidelines
                                </h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• {t('interview.cannotPause')}</li>
                                    <li>• Ensure good lighting and clear audio</li>
                                    <li>• Look directly at the camera when speaking</li>
                                    <li>• Speak clearly and at a moderate pace</li>
                                    <li>• Take your time to think before answering</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Sample Questions (for demo) */}
                    {!isRecording && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Sample Interview Questions
                            </h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="font-medium text-gray-900">Question 1:</p>
                                    <p className="text-gray-700">Tell me about yourself and your background.</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="font-medium text-gray-900">Question 2:</p>
                                    <p className="text-gray-700">What interests you most about this position?</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="font-medium text-gray-900">Question 3:</p>
                                    <p className="text-gray-700">Describe a challenging project you worked on recently.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Interview;
