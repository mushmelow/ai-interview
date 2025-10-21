import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip
} from '@mui/material';
import {
    VideoCall,
    Mic,
    MicOff,
    VideoOff,
    PlayArrow,
    Stop,
    Upload,
    CheckCircle,
    PlayCircle,
    Visibility
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import InterviewService from '../services/InterviewService';

const InterviewRecording = () => {
    const { user } = useAuth();
    const interviewService = new InterviewService();

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [mediaStream, setMediaStream] = useState(null);
    const [videoRef, setVideoRef] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Interview state
    const [currentInterview, setCurrentInterview] = useState(null);
    const [recordingBlob, setRecordingBlob] = useState(null);
    const [showStartDialog, setShowStartDialog] = useState(false);
    const [interviewTitle, setInterviewTitle] = useState('');
    const [interviewDescription, setInterviewDescription] = useState('');
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [completedInterview, setCompletedInterview] = useState(null);

    // Media recorder
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    // Timer effect
    useEffect(() => {
        let interval;
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

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartInterview = async () => {
        if (!interviewTitle.trim()) {
            setError('Please enter an interview title');
            return;
        }

        setLoading(true);
        try {
            const response = await interviewService.startInterview(
                user.id,
                interviewTitle,
                interviewDescription
            );

            setCurrentInterview(response.data.interview);
            setShowStartDialog(false);
            setError(null);
        } catch (error) {
            setError('Failed to start interview session');
            console.error('Start interview error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartRecording = () => {
        if (!mediaStream || !currentInterview) return;

        try {
            const mediaRecorder = new MediaRecorder(mediaStream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setRecordingBlob(blob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setTimeElapsed(0);
            setError(null);
        } catch (err) {
            setError('Failed to start recording');
            console.error('Recording error:', err);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleEndInterview = async () => {
        if (!currentInterview) return;

        setLoading(true);
        try {
            // End the interview session
            const endResponse = await interviewService.endInterview(currentInterview.id);
            
            // Upload recording if available
            if (recordingBlob) {
                const file = new File([recordingBlob], `interview-${currentInterview.id}.webm`, {
                    type: 'video/webm'
                });
                await interviewService.uploadRecording(currentInterview.id, file);
            }

            // Store the completed interview data
            setCompletedInterview(endResponse.data.interview);
            
            // Clear current interview state
            setCurrentInterview(null);
            setRecordingBlob(null);
            setTimeElapsed(0);
            setError(null);
            
            // Show review dialog
            setShowReviewDialog(true);
        } catch (error) {
            setError('Failed to end interview');
            console.error('End interview error:', error);
        } finally {
            setLoading(false);
        }
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

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">Please log in to access the interview system.</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom align="center">
                    AI Interview Recording
                </Typography>

                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                    Welcome, {user.email} ({user.role})
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {!currentInterview ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            Ready to start your interview?
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<VideoCall />}
                            onClick={() => setShowStartDialog(true)}
                            sx={{ mt: 2 }}
                        >
                            Start New Interview
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        {/* Interview Info */}
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="h6" gutterBottom>
                                {currentInterview.title}
                            </Typography>
                            {currentInterview.description && (
                                <Typography variant="body2" color="text.secondary">
                                    {currentInterview.description}
                                </Typography>
                            )}
                            <Box sx={{ mt: 1 }}>
                                <Chip
                                    label={`Status: ${currentInterview.status}`}
                                    color={currentInterview.status === 'started' ? 'primary' : 'success'}
                                    size="small"
                                />
                            </Box>
                        </Box>

                        {/* Video Container */}
                        <Box sx={{
                            position: 'relative',
                            bgcolor: 'black',
                            borderRadius: 2,
                            overflow: 'hidden',
                            aspectRatio: '16/9',
                            mb: 3
                        }}>
                            <video
                                ref={setVideoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />

                            {/* Recording Indicator */}
                            {isRecording && (
                                <Box sx={{
                                    position: 'absolute',
                                    top: 16,
                                    left: 16,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    bgcolor: 'error.main',
                                    color: 'white',
                                    px: 2,
                                    py: 1,
                                    borderRadius: 2
                                }}>
                                    <Box sx={{
                                        width: 8,
                                        height: 8,
                                        bgcolor: 'white',
                                        borderRadius: '50%',
                                        animation: 'pulse 1s infinite'
                                    }} />
                                    <Typography variant="body2" fontWeight="medium">
                                        Recording
                                    </Typography>
                                </Box>
                            )}

                            {/* Timer */}
                            {isRecording && (
                                <Box sx={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 16,
                                    bgcolor: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    px: 2,
                                    py: 1,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <Typography variant="body2" fontFamily="monospace">
                                        {formatTime(timeElapsed)}
                                    </Typography>
                                </Box>
                            )}

                            {/* Video Controls Overlay */}
                            <Box sx={{
                                position: 'absolute',
                                bottom: 16,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: 2
                            }}>
                                <Button
                                    onClick={toggleVideo}
                                    sx={{
                                        minWidth: 'auto',
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                    }}
                                >
                                    <VideoCall />
                                </Button>
                                <Button
                                    onClick={toggleAudio}
                                    sx={{
                                        minWidth: 'auto',
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                    }}
                                >
                                    <Mic />
                                </Button>
                            </Box>
                        </Box>

                        {/* Interview Controls */}
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {!isRecording ? (
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<PlayArrow />}
                                    onClick={handleStartRecording}
                                    disabled={loading}
                                    color="success"
                                >
                                    Start Recording
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<Stop />}
                                    onClick={handleStopRecording}
                                    disabled={loading}
                                    color="error"
                                >
                                    Stop Recording
                                </Button>
                            )}

                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<CheckCircle />}
                                onClick={handleEndInterview}
                                disabled={loading || isRecording}
                            >
                                {loading ? <CircularProgress size={24} /> : 'End Interview'}
                            </Button>
                        </Box>

                        {recordingBlob && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                Recording completed! Click "End Interview" to save.
                            </Alert>
                        )}
                    </Box>
                )}

                {/* Start Interview Dialog */}
                <Dialog open={showStartDialog} onClose={() => setShowStartDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Start New Interview</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Interview Title"
                            fullWidth
                            variant="outlined"
                            value={interviewTitle}
                            onChange={(e) => setInterviewTitle(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="dense"
                            label="Description (Optional)"
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            value={interviewDescription}
                            onChange={(e) => setInterviewDescription(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowStartDialog(false)}>Cancel</Button>
                        <Button
                            onClick={handleStartInterview}
                            variant="contained"
                            disabled={loading || !interviewTitle.trim()}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Start Interview'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Review Interview Dialog */}
                <Dialog open={showReviewDialog} onClose={() => setShowReviewDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircle color="success" />
                            Interview Completed Successfully!
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        {completedInterview && (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    {completedInterview.title}
                                </Typography>
                                
                                {completedInterview.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {completedInterview.description}
                                    </Typography>
                                )}

                                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                    <Chip 
                                        label={`Duration: ${Math.floor(completedInterview.duration / 60)}:${(completedInterview.duration % 60).toString().padStart(2, '0')}`}
                                        color="primary"
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Status: ${completedInterview.status}`}
                                        color="success"
                                        variant="outlined"
                                    />
                                    {completedInterview.videoFile && (
                                        <Chip 
                                            label="Video Recorded"
                                            color="info"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    <strong>Start Time:</strong> {new Date(completedInterview.startTime).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    <strong>End Time:</strong> {new Date(completedInterview.endTime).toLocaleString()}
                                </Typography>

                                {completedInterview.videoFile && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Recording Details
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Video File:</strong> {completedInterview.videoFile}
                                        </Typography>
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            Your interview recording has been saved and is ready for AI analysis.
                                        </Alert>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowReviewDialog(false)}>
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Visibility />}
                            onClick={() => {
                                setShowReviewDialog(false);
                                // Here you could navigate to a detailed review page
                                alert('Review functionality coming soon!');
                            }}
                        >
                            Review Interview
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </Container>
    );
};

export default InterviewRecording;
