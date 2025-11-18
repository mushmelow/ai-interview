import React, { useState } from 'react';
import { GeneratedQuestion } from '../services/QuestionService';

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