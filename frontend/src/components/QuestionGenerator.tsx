import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import QuestionService, { QuestionGenerationRequest, GeneratedQuestion, QuestionCategory } from '../services/QuestionService';

interface QuestionGeneratorProps {
    onQuestionsGenerated: (questions: GeneratedQuestion[], sessionId: string) => void;
    onBack: () => void;
}

const QuestionGenerator: React.FC<QuestionGeneratorProps> = ({ onQuestionsGenerated, onBack }) => {
    const { user } = useAuth();
    const questionService = new QuestionService();

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<QuestionCategory[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(['Technical Skills', 'Problem Solving']);

    const [formData, setFormData] = useState<QuestionGenerationRequest>({
        position: '',
        experienceLevel: 'mid',
        categories: ['Technical Skills', 'Problem Solving'],
        numberOfQuestions: 5,
        difficulty: 'intermediate',
        customContext: ''
    });

    // Load categories on component mount
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await questionService.getCategories();
            if (response.success && response.data) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const handleInputChange = (field: keyof QuestionGenerationRequest, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCategoryToggle = (categoryName: string) => {
        setSelectedCategories(prev => {
            const newCategories = prev.includes(categoryName)
                ? prev.filter(c => c !== categoryName)
                : [...prev, categoryName];

            setFormData(prevForm => ({
                ...prevForm,
                categories: newCategories
            }));

            return newCategories;
        });
    };

    const handleGenerateQuestions = async () => {
        if (!user) {
            setError('Please log in to generate questions');
            return;
        }

        if (!formData.position.trim()) {
            setError('Please enter a position');
            return;
        }

        if (selectedCategories.length === 0) {
            setError('Please select at least one category');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const request: QuestionGenerationRequest = {
                ...formData,
                categories: selectedCategories
            };

            const response = await questionService.generateQuestions(request);

            if (response.success && response.data) {
                onQuestionsGenerated(response.data.questions, response.data.sessionId);
            } else {
                setError(response.message || 'Failed to generate questions');
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to generate questions');
            console.error('Error generating questions:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            {/* Authentication Check */}
            {!user && (
                <div style={{
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: '#856404', marginBottom: '10px' }}>Authentication Required</h3>
                    <p style={{ color: '#856404', marginBottom: '15px' }}>
                        You need to be logged in to generate AI questions.
                    </p>
                    <button
                        onClick={onBack}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Go Back to Login
                    </button>
                </div>
            )}

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>AI Question Generator</h1>
                <p style={{ color: '#666' }}>Generate intelligent, personalized interview questions using AI</p>
            </div>

            {/* Error Alert */}
            {error && (
                <div style={{
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '20px',
                    color: '#c33'
                }}>
                    {error}
                </div>
            )}

            {/* Form */}
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '30px',
                marginBottom: '20px'
            }}>
                <h2 style={{ marginBottom: '20px' }}>Interview Configuration</h2>

                {/* Position */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Position/Role *
                    </label>
                    <input
                        type="text"
                        placeholder="e.g., Frontend Developer, Data Scientist"
                        value={formData.position}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '16px'
                        }}
                        required
                    />
                </div>

                {/* Experience Level, Number of Questions, Difficulty */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Experience Level
                        </label>
                        <select
                            value={formData.experienceLevel}
                            onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                            }}
                        >
                            <option value="entry">Entry Level</option>
                            <option value="mid">Mid Level</option>
                            <option value="senior">Senior Level</option>
                        </select>
                    </div>

                    <div style={{ flex: '1', minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Number of Questions
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={formData.numberOfQuestions}
                            onChange={(e) => handleInputChange('numberOfQuestions', parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                            }}
                        />
                    </div>

                    <div style={{ flex: '1', minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Difficulty
                        </label>
                        <select
                            value={formData.difficulty}
                            onChange={(e) => handleInputChange('difficulty', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '16px'
                            }}
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                </div>

                {/* Custom Context */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Custom Context (Optional)
                    </label>
                    <textarea
                        placeholder="e.g., Focus on React and TypeScript experience, startup environment"
                        rows={3}
                        value={formData.customContext}
                        onChange={(e) => handleInputChange('customContext', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '16px',
                            resize: 'vertical'
                        }}
                    />
                </div>

                {/* Categories */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '10px' }}>Question Categories</h3>
                    <p style={{ color: '#666', marginBottom: '15px' }}>
                        Select the types of questions you want to include:
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryToggle(category.name)}
                                style={{
                                    padding: '8px 16px',
                                    border: selectedCategories.includes(category.name)
                                        ? '2px solid #007bff'
                                        : '2px solid #ddd',
                                    borderRadius: '20px',
                                    backgroundColor: selectedCategories.includes(category.name)
                                        ? '#007bff'
                                        : 'white',
                                    color: selectedCategories.includes(category.name)
                                        ? 'white'
                                        : '#333',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
                        Back to Interview
                    </button>
                    <button
                        onClick={handleGenerateQuestions}
                        disabled={loading || !formData.position.trim() || selectedCategories.length === 0}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: loading ? '#ccc' : '#007bff',
                            color: 'white',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            minWidth: '200px'
                        }}
                    >
                        {loading ? 'Generating...' : 'Generate Questions'}
                    </button>
                </div>
            </div>

            {/* Preview */}
            <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px'
            }}>
                <h3 style={{ marginBottom: '15px' }}>Configuration Preview</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <strong>Position:</strong> {formData.position || 'Not specified'}
                    </div>
                    <div>
                        <strong>Experience:</strong> {formData.experienceLevel}
                    </div>
                    <div>
                        <strong>Difficulty:</strong> {formData.difficulty}
                    </div>
                    <div>
                        <strong>Questions:</strong> {formData.numberOfQuestions}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionGenerator;