import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Video,
    Mic,
    MicOff,
    VideoOff,
    Play,
    Square,
    Clock,
    AlertTriangle
} from 'lucide-react';

const Interview: React.FC = () => {
    const { t } = useTranslation();
    const [isRecording, setIsRecording] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    // Initialize media stream
    useEffect(() => {
        const initializeMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                setMediaStream(stream);
                if (videoRef) {
                    videoRef.srcObject = stream;
                }
            } catch (err) {
                setError('Failed to access camera and microphone. Please check permissions.');
                console.error('Media access error:', err);
            }
        };

        initializeMedia();

        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [videoRef]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartInterview = () => {
        setIsRecording(true);
        setError(null);
    };

    const handleFinishInterview = () => {
        setIsRecording(false);
        // Here you would typically stop recording and process the data
        alert('Interview finished! Processing results...');
    };

    const toggleVideo = () => {
        if (mediaStream) {
            const videoTrack = mediaStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
            }
        }
    };

    const toggleAudio = () => {
        if (mediaStream) {
            const audioTrack = mediaStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t('interview.title')}
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

            {/* Video Container */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                    ref={setVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
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
                    >
                        <Video className="w-6 h-6 text-white" />
                    </button>
                    <button
                        onClick={toggleAudio}
                        className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
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
                        disabled={!mediaStream}
                    >
                        <Play className="w-5 h-5" />
                        <span>{t('interview.start')}</span>
                    </button>
                ) : (
                    <button
                        onClick={handleFinishInterview}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                        <Square className="w-5 h-5" />
                        <span>{t('interview.finishInterview')}</span>
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
        </div>
    );
};

export default Interview;




