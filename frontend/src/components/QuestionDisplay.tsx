import React, { useState, useEffect } from 'react';
import { GeneratedQuestion } from '../services/QuestionService';
import AnswerService from '../services/AnswerService';

interface QuestionDisplayProps {
    questions: GeneratedQuestion[];
    sessionId: string;
    onStartInterview: () => void;
    onStartVoiceInterview: () => void;
    onBack: () => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
    questions,
    sessionId,
    onStartInterview,
    onStartVoiceInterview,
    onBack
}) => {
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [answers, setAnswers] = useState<{ [questionId: number]: string }>({});
    const [submitting, setSubmitting] = useState<{ [questionId: number]: boolean }>({});
    const [submitted, setSubmitted] = useState<{ [questionId: number]: boolean }>({});
    const [errors, setErrors] = useState<{ [questionId: number]: string | null }>({});
    const answerService = new AnswerService();

    // Load existing answers on mount
    useEffect(() => {
        const loadAnswers = async () => {
            try {
                const response = await answerService.getSessionAnswers(sessionId);
                if (response.success && response.data) {
                    const answersMap: { [questionId: number]: string } = {};
                    const submittedMap: { [questionId: number]: boolean } = {};
                    response.data.forEach((answer: any) => {
                        // Find the question ID from the questions array
                        const question = questions.find(q => q.id === answer.questionId);
                        if (question) {
                            answersMap[question.id] = answer.answer;
                            submittedMap[question.id] = true;
                        }
                    });
                    setAnswers(answersMap);
                    setSubmitted(submittedMap);
                }
            } catch (error) {
                console.error('Error loading answers:', error);
            }
        };
        loadAnswers();
    }, [sessionId]);

    const toggleQuestionExpansion = (questionId: number) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(questionId)) {
            newExpanded.delete(questionId);
        } else {
            newExpanded.add(questionId);
        }
        setExpandedQuestions(newExpanded);
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return '#28a745';
            case 'intermediate': return '#ffc107';
            case 'advanced': return '#dc3545';
            default: return '#6c757d';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'behavioral': return '#007bff';
            case 'technical': return '#6f42c1';
            case 'situational': return '#28a745';
            case 'cultural': return '#fd7e14';
            default: return '#6c757d';
        }
    };

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        setErrors(prev => ({ ...prev, [questionId]: null }));
    };

    const handleSubmitAnswer = async (questionId: number) => {
        const answer = answers[questionId]?.trim();
        if (!answer) {
            setErrors(prev => ({ ...prev, [questionId]: 'Please enter an answer' }));
            return;
        }

        setSubmitting(prev => ({ ...prev, [questionId]: true }));
        setErrors(prev => ({ ...prev, [questionId]: null }));

        try {
            const response = await answerService.submitAnswer({
                questionId: questionId,
                sessionId: sessionId,
                answer: answer,
                answerType: 'text'
            });

            if (response.success) {
                setSubmitted(prev => ({ ...prev, [questionId]: true }));
            } else {
                setErrors(prev => ({ ...prev, [questionId]: response.message || 'Failed to submit answer' }));
            }
        } catch (error: any) {
            setErrors(prev => ({ ...prev, [questionId]: error.response?.data?.message || 'Failed to submit answer' }));
        } finally {
            setSubmitting(prev => ({ ...prev, [questionId]: false }));
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            {/* Header */}
            <div style={{
                textAlign: 'center',
                marginBottom: '30px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '30px'
            }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Generated Questions</h1>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    Session ID: {sessionId}
                </p>

                <div style={{
                    backgroundColor: '#d1ecf1',
                    border: '1px solid #bee5eb',
                    borderRadius: '4px',
                    padding: '15px',
                    marginBottom: '20px'
                }}>
                    <strong>Instructions:</strong> Review the generated questions below.
                    You can expand each question to see follow-up questions and expected keywords.
                    When ready, click "Start Interview" to begin recording your responses.
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                        onClick={onBack}
                        style={{
                            padding: '10px 20px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Generate New
                    </button>
                    <button
                        onClick={onStartInterview}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '16px',
                            marginRight: '10px'
                        }}
                    >
                        Start Video Interview
                    </button>
                    <button
                        onClick={onStartVoiceInterview}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Start Voice Interview
                    </button>
                </div>
            </div>

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {questions.map((question, index) => (
                    <div key={question.id} style={{
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '20px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                                    <h3 style={{ margin: 0, marginRight: '20px' }}>
                                        Question {index + 1}
                                    </h3>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: getTypeColor(question.type),
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {question.type}
                                    </span>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: getDifficultyColor(question.difficulty),
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {question.difficulty}
                                    </span>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: '#e9ecef',
                                        color: '#495057',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {question.category}
                                    </span>
                                </div>

                                <p style={{ marginBottom: '15px', lineHeight: '1.6', fontSize: '16px' }}>
                                    {question.question}
                                </p>

                                {question.context && (
                                    <div style={{
                                        backgroundColor: '#d1ecf1',
                                        border: '1px solid #bee5eb',
                                        borderRadius: '4px',
                                        padding: '10px',
                                        marginBottom: '15px'
                                    }}>
                                        <strong>Context:</strong> {question.context}
                                    </div>
                                )}

                                {/* Answer Input Section */}
                                <div style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    backgroundColor: '#f8f9fa',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '4px'
                                }}>
                                    <label style={{
                                        display: 'block',
                                        fontWeight: 'bold',
                                        marginBottom: '10px',
                                        color: '#495057'
                                    }}>
                                        Your Answer:
                                    </label>
                                    <textarea
                                        value={answers[question.id] || ''}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        placeholder="Type your answer here..."
                                        rows={4}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: errors[question.id] ? '2px solid #dc3545' : '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            fontFamily: 'inherit',
                                            resize: 'vertical',
                                            marginBottom: '10px'
                                        }}
                                        disabled={submitting[question.id] || submitted[question.id]}
                                    />
                                    {errors[question.id] && (
                                        <div style={{
                                            color: '#dc3545',
                                            fontSize: '14px',
                                            marginBottom: '10px'
                                        }}>
                                            {errors[question.id]}
                                        </div>
                                    )}
                                    {submitted[question.id] && (
                                        <div style={{
                                            color: '#28a745',
                                            fontSize: '14px',
                                            marginBottom: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}>
                                            ✓ Answer submitted successfully
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleSubmitAnswer(question.id)}
                                        disabled={submitting[question.id] || submitted[question.id] || !answers[question.id]?.trim()}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            backgroundColor: submitted[question.id] ? '#6c757d' : submitting[question.id] ? '#6c757d' : '#007bff',
                                            color: 'white',
                                            cursor: (submitting[question.id] || submitted[question.id] || !answers[question.id]?.trim()) ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            opacity: (submitting[question.id] || submitted[question.id] || !answers[question.id]?.trim()) ? 0.6 : 1
                                        }}
                                    >
                                        {submitting[question.id] ? 'Submitting...' : submitted[question.id] ? 'Submitted' : 'Submit Answer'}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleQuestionExpansion(question.id)}
                                style={{
                                    padding: '5px 10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    marginLeft: '10px'
                                }}
                            >
                                {expandedQuestions.has(question.id) ? '▼' : '▶'}
                            </button>
                        </div>

                        {expandedQuestions.has(question.id) && (
                            <div style={{
                                borderTop: '1px solid #eee',
                                paddingTop: '15px',
                                marginTop: '15px'
                            }}>
                                {/* Follow-up Questions */}
                                {question.followUpQuestions && question.followUpQuestions.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ color: '#007bff', marginBottom: '10px' }}>
                                            Follow-up Questions:
                                        </h4>
                                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                            {question.followUpQuestions.map((followUp, idx) => (
                                                <li key={idx} style={{ marginBottom: '5px', fontSize: '14px' }}>
                                                    {followUp}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Expected Keywords */}
                                {question.expectedKeywords && question.expectedKeywords.length > 0 && (
                                    <div>
                                        <h4 style={{ color: '#6f42c1', marginBottom: '10px' }}>
                                            Expected Keywords:
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                            {question.expectedKeywords.map((keyword, idx) => (
                                                <span
                                                    key={idx}
                                                    style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: '#e9ecef',
                                                        border: '1px solid #dee2e6',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        color: '#495057'
                                                    }}
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '30px'
            }}>
                <h3 style={{ marginBottom: '15px' }}>Interview Summary</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <strong>Total Questions:</strong> {questions.length}
                    </div>
                    <div>
                        <strong>Categories:</strong> {new Set(questions.map(q => q.category)).size}
                    </div>
                    <div>
                        <strong>Types:</strong> {new Set(questions.map(q => q.type)).size}
                    </div>
                    <div>
                        <strong>Difficulty:</strong> {questions[0]?.difficulty || 'N/A'}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
                <button
                    onClick={onBack}
                    style={{
                        padding: '12px 24px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Generate New Questions
                </button>
                <button
                    onClick={onStartInterview}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px',
                        minWidth: '200px',
                        marginRight: '10px'
                    }}
                >
                    Start Video Interview
                </button>
                <button
                    onClick={onStartVoiceInterview}
                    style={{
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px',
                        minWidth: '200px'
                    }}
                >
                    Start Voice Interview
                </button>
            </div>
        </div>
    );
};

export default QuestionDisplay;