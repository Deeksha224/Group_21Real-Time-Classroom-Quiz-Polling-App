import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import socketService from '../../socket';

function CreateQuiz() {
    const navigate = useNavigate();
    const { setSessionCode, setIsHost } = useQuiz();

    const [quizTitle, setQuizTitle] = useState('');
    const [questions, setQuestions] = useState([
        {
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0
        }
    ]);

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                question: '',
                options: ['', '', '', ''],
                correctAnswer: 0
            }
        ]);
    };

    const handleRemoveQuestion = (index) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (questionIndex, optionIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].options[optionIndex] = value;
        setQuestions(newQuestions);
    };

    const handleCorrectAnswerChange = (questionIndex, optionIndex) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].correctAnswer = optionIndex;
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!quizTitle.trim()) {
            alert('Please enter a quiz title');
            return;
        }

        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].question.trim()) {
                alert(`Please enter a question for Question ${i + 1}`);
                return;
            }

            const filledOptions = questions[i].options.filter(opt => opt.trim());
            if (filledOptions.length < 2) {
                alert(`Please provide at least 2 options for Question ${i + 1}`);
                return;
            }
        }

        try {
            socketService.connect();
            const response = await socketService.createQuiz({
                title: quizTitle,
                questions: questions
            });

            setSessionCode(response.sessionCode);
            setIsHost(true);
            navigate('/lobby');
        } catch (error) {
            console.error('Error creating quiz:', error);
            alert('Failed to create quiz: ' + error.message);
        }
    };

    return (
        <div className="create-quiz-container fade-in">
            <div className="glass-card">
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
                    Create Your Quiz
                </h1>

                <form onSubmit={handleSubmit} className="quiz-form">
                    <div className="form-group">
                        <label>Quiz Title</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Enter quiz title..."
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                        />
                    </div>

                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="question-card slide-in">
                            <div className="question-header">
                                <span className="question-number">Question {qIndex + 1}</span>
                                {questions.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn-remove"
                                        onClick={() => handleRemoveQuestion(qIndex)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Question Text</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Enter your question..."
                                    value={q.question}
                                    onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Answer Options (select the correct one)</label>
                                <div className="options-grid">
                                    {q.options.map((option, oIndex) => (
                                        <div key={oIndex} className="option-input-group">
                                            <input
                                                type="radio"
                                                name={`correct-${qIndex}`}
                                                checked={q.correctAnswer === oIndex}
                                                onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                                            />
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder={`Option ${oIndex + 1}`}
                                                value={option}
                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        className="btn-add"
                        onClick={handleAddQuestion}
                    >
                        ➕ Add Question
                    </button>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => navigate('/')}
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                        >
                            Create Quiz
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateQuiz;
