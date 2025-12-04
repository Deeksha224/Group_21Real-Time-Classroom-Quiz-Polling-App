import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import socketService from '../../socket';

function LiveDashboard() {
    const navigate = useNavigate();
    const { sessionCode, currentQuestion, setCurrentQuestion, leaderboard, setLeaderboard } = useQuiz();
    const [answeredCount, setAnsweredCount] = useState(0);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [questionStats, setQuestionStats] = useState(null);
    const [isMovingNext, setIsMovingNext] = useState(false);

    useEffect(() => {
        if (!sessionCode) {
            navigate('/');
            return;
        }

        const socket = socketService.getSocket();

        // Listen for quiz start
        socket.on('quiz_started', (data) => {
            setCurrentQuestion(data.question);
            setAnsweredCount(0);
            setShowResults(false);
        });

        // Listen for new questions
        socket.on('new_question', (data) => {
            setCurrentQuestion(data.question);
            setAnsweredCount(0);
            setShowResults(false);
            setIsMovingNext(false);
        });

        // Listen for answer submissions
        socket.on('answer_submitted', (data) => {
            setAnsweredCount(data.answered);
            setTotalPlayers(data.total);
        });

        // Listen for question results
        socket.on('question_results', (data) => {
            setQuestionStats(data.stats);
            setLeaderboard(data.leaderboard);
            setShowResults(true);
        });

        // Listen for quiz finished
        socket.on('quiz_finished', (data) => {
            setLeaderboard(data.leaderboard);
            navigate('/results');
        });

        // Get session state and set current question
        socketService.getSessionState(sessionCode).then((response) => {
            if (response.session) {
                setTotalPlayers(response.session.players.length);

                // If quiz is active, set the current question
                if (response.session.status === 'active' && response.session.currentQuestionIndex >= 0) {
                    const quiz = response.session.quiz;
                    const questionIndex = response.session.currentQuestionIndex;
                    const question = quiz.questions[questionIndex];

                    setCurrentQuestion({
                        index: questionIndex,
                        question: question.question,
                        options: question.options,
                        totalQuestions: quiz.questions.length
                    });
                }
            }
        }).catch(error => {
            console.error('Error fetching session state:', error);
        });

        return () => {
            socket.off('quiz_started');
            socket.off('new_question');
            socket.off('answer_submitted');
            socket.off('question_results');
            socket.off('quiz_finished');
        };
    }, [sessionCode, navigate, setCurrentQuestion, setLeaderboard]);

    const handleNextQuestion = async () => {
        setIsMovingNext(true);
        try {
            await socketService.nextQuestion(sessionCode);
        } catch (error) {
            console.error('Error moving to next question:', error);
            alert('Failed to move to next question: ' + error.message);
            setIsMovingNext(false);
        }
    };

    if (!currentQuestion) {
        return (
            <div className="waiting-container">
                <div className="waiting-spinner"></div>
                <p className="waiting-text">Loading quiz...</p>
            </div>
        );
    }

    return (
        <div className="game-container fade-in">
            <div className="glass-card">
                <div className="question-header-bar">
                    <div className="question-counter">
                        Question {currentQuestion.index + 1} of {currentQuestion.totalQuestions}
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                        Answered: {answeredCount} / {totalPlayers}
                    </div>
                </div>

                {!showResults ? (
                    <>
                        <h2 className="question-text">{currentQuestion.question}</h2>

                        <div className="answers-grid">
                            {currentQuestion.options.map((option, index) => (
                                option && (
                                    <div key={index} className="answer-option disabled">
                                        {option}
                                    </div>
                                )
                            ))}
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                                Waiting for players to answer...
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={handleNextQuestion}
                                disabled={isMovingNext}
                                style={{ marginTop: '1rem', minWidth: '200px' }}
                            >
                                {isMovingNext ? 'Moving...' : 'Show Results & Next'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="question-text">Results</h2>

                        {questionStats && (
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <p style={{ fontSize: '1.5rem', color: 'var(--success)' }}>
                                    ✅ {questionStats.correctAnswers} / {questionStats.totalAnswers} correct
                                </p>
                            </div>
                        )}

                        <div className="leaderboard-container">
                            <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Leaderboard</h3>
                            <div className="leaderboard-list">
                                {leaderboard.slice(0, 5).map((player, index) => (
                                    <div
                                        key={player.id}
                                        className={`leaderboard-item rank-${index + 1}`}
                                    >
                                        <div className="leaderboard-rank">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                        </div>
                                        <div className="leaderboard-name">{player.name}</div>
                                        <div className="leaderboard-score">{player.score}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default LiveDashboard;
