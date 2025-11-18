import React, { useState, useEffect } from 'react';
import AnalysisService, { AnalysisResult, AnalysisStats } from '../services/AnalysisService';
import { useAuth } from '../contexts/AuthContext';

interface AnalysisResultsProps {
    interviewId?: number;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ interviewId }) => {
    const { user } = useAuth();
    const analysisService = new AnalysisService();

    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [analysisStats, setAnalysisStats] = useState<AnalysisStats | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadAnalysisData();
        }
    }, [user, interviewId]);

    const loadAnalysisData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (interviewId) {
                // Load specific interview analysis
                const response = await analysisService.getAnalysisResult(interviewId);
                if (response.success && response.data) {
                    setAnalysisResult(response.data);
                }
            } else {
                // Load user's analysis statistics
                const statsResponse = await analysisService.getAnalysisStats();
                if (statsResponse.success && statsResponse.data) {
                    setAnalysisStats(statsResponse.data);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load analysis data');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeInterview = async () => {
        if (!interviewId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await analysisService.analyzeInterview(interviewId);
            if (response.success && response.data) {
                setAnalysisResult(response.data);
                alert('Analysis completed successfully!');
            } else {
                setError(response.message || 'Analysis failed');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to analyze interview');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreLabel = (score: number): string => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 70) return 'Fair';
        if (score >= 60) return 'Needs Improvement';
        return 'Poor';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2">Loading analysis...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
                {interviewId && (
                    <button
                        onClick={handleAnalyzeInterview}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry Analysis
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Interview Analysis Results</h2>

            {/* Analysis Statistics */}
            {analysisStats && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Your Performance Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{analysisStats.totalInterviews}</div>
                            <div className="text-sm text-blue-800">Total Interviews</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{analysisStats.analyzedInterviews}</div>
                            <div className="text-sm text-blue-800">Analyzed</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${getScoreColor(analysisStats.averageScore)}`}>
                                {analysisStats.averageScore}%
                            </div>
                            <div className="text-sm text-blue-800">Average Score</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{analysisStats.averageWordCount}</div>
                            <div className="text-sm text-blue-800">Avg Words</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Specific Interview Analysis */}
            {analysisResult && (
                <div className="space-y-6">
                    {/* Overall Score */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Overall Performance</h3>
                            <div className={`text-3xl font-bold ${getScoreColor(analysisResult.answerQuality.overallScore)}`}>
                                {analysisResult.answerQuality.overallScore}%
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                            {getScoreLabel(analysisResult.answerQuality.overallScore)}
                        </div>

                        {/* Score Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className={`text-xl font-semibold ${getScoreColor(analysisResult.answerQuality.relevance)}`}>
                                    {analysisResult.answerQuality.relevance}%
                                </div>
                                <div className="text-sm text-gray-600">Relevance</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-xl font-semibold ${getScoreColor(analysisResult.answerQuality.completeness)}`}>
                                    {analysisResult.answerQuality.completeness}%
                                </div>
                                <div className="text-sm text-gray-600">Completeness</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-xl font-semibold ${getScoreColor(analysisResult.answerQuality.clarity)}`}>
                                    {analysisResult.answerQuality.clarity}%
                                </div>
                                <div className="text-sm text-gray-600">Clarity</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-xl font-semibold ${getScoreColor(analysisResult.answerQuality.technicalAccuracy)}`}>
                                    {analysisResult.answerQuality.technicalAccuracy}%
                                </div>
                                <div className="text-sm text-gray-600">Technical</div>
                            </div>
                        </div>
                    </div>

                    {/* Sentiment and Emotions */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Sentiment</h4>
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${analysisResult.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                        analysisResult.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {analysisResult.sentiment.charAt(0).toUpperCase() + analysisResult.sentiment.slice(1)}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    Confidence: {Math.round(analysisResult.confidence * 100)}%
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Emotions Detected</h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResult.emotions.map((emotion, index) => (
                                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                                            {emotion}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Keywords */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Topics Discussed</h3>
                        <div className="flex flex-wrap gap-2">
                            {analysisResult.keywords.map((keyword, index) => (
                                <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Transcript */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transcript</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700 leading-relaxed">{analysisResult.transcript}</p>
                        </div>
                    </div>

                    {/* Feedback */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Strengths */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-green-900 mb-4">Strengths</h3>
                            <ul className="space-y-2">
                                {analysisResult.feedback.strengths.map((strength, index) => (
                                    <li key={index} className="text-green-800 text-sm flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        {strength}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Improvements */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-yellow-900 mb-4">Areas for Improvement</h3>
                            <ul className="space-y-2">
                                {analysisResult.feedback.improvements.map((improvement, index) => (
                                    <li key={index} className="text-yellow-800 text-sm flex items-start">
                                        <span className="text-yellow-600 mr-2">•</span>
                                        {improvement}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Suggestions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4">Suggestions</h3>
                            <ul className="space-y-2">
                                {analysisResult.feedback.suggestions.map((suggestion, index) => (
                                    <li key={index} className="text-blue-800 text-sm flex items-start">
                                        <span className="text-blue-600 mr-2">💡</span>
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Analysis Metadata */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Details</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="font-medium text-gray-700">Duration</div>
                                <div className="text-gray-600">{Math.round(analysisResult.analysisMetadata.duration / 60)} min</div>
                            </div>
                            <div>
                                <div className="font-medium text-gray-700">Word Count</div>
                                <div className="text-gray-600">{analysisResult.analysisMetadata.wordCount}</div>
                            </div>
                            <div>
                                <div className="font-medium text-gray-700">Speaking Rate</div>
                                <div className="text-gray-600">{analysisResult.analysisMetadata.speakingRate} wpm</div>
                            </div>
                            <div>
                                <div className="font-medium text-gray-700">Analyzed</div>
                                <div className="text-gray-600">
                                    {new Date(analysisResult.analysisMetadata.analyzedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No Analysis Available */}
            {!analysisResult && !analysisStats && (
                <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Available</h3>
                    <p className="text-gray-600 mb-4">
                        {interviewId ? 'This interview has not been analyzed yet.' : 'You haven\'t completed any interviews yet.'}
                    </p>
                    {interviewId && (
                        <button
                            onClick={handleAnalyzeInterview}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Analyze Interview
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalysisResults;
