import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import socketService from '../../socket';

function GameView() {
    const navigate = useNavigate();
    const {
        sessionCode,
        playerId,
        playerName,
        currentQuestion,
        setCurrentQuestion,
        score,
        setScore,
        quizStatus,
        setQuizStatus,
        leaderboard,
        setLeaderboard
    } = useQuiz();

    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [answerResult, setAnswerResult] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
        if (!sessionCode || !playerId) {
            navigate('/join');
            return;
        }

        const socket = socketService.getSocket();

        // Listen for quiz start
        socket.on('quiz_started', (data) => {
            setCurrentQuestion(data.question);
            setQuizStatus('active');
            setHasAnswered(false);
            setSelectedAnswer(null);
            setShowResult(false);
            setStartTime(Date.now());
        });

        // Listen for new questions
        socket.on('new_question', (data) => {
            setCurrentQuestion(data.question);
            setHasAnswered(false);
            setSelectedAnswer(null);
            setShowResult(false);
            setAnswerResult(null);
            setStartTime(Date.now());
        });

        // Listen for question results
        socket.on('question_results', (data) => {
            setLeaderboard(data.leaderboard);
            setShowResult(true);

            // Update score from leaderboard
            const myScore = data.leaderboard.find(p => p.id === playerId);
            if (myScore) {
                setScore(myScore.score);
            }
        });

        // Listen for quiz finished
        socket.on('quiz_finished', (data) => {
            setLeaderboard(data.leaderboard);
            setQuizStatus('finished');
        });

        return () => {
            socket.off('quiz_started');
            socket.off('new_question');
            socket.off('question_results');
            socket.off('quiz_finished');
        };
    }, [sessionCode, playerId, navigate, setCurrentQuestion, setQuizStatus, setLeaderboard, setScore]);

    const handleAnswerSelect = async (answerIndex) => {
        if (hasAnswered || !currentQuestion) return;

        setSelectedAnswer(answerIndex);
        setHasAnswered(true);

        const timeToAnswer = Math.floor((Date.now() - startTime) / 1000);

        try {
            const response = await socketService.submitAnswer(
                sessionCode,
                playerId,
                currentQuestion.index,
                answerIndex,
                timeToAnswer
            );

            setAnswerResult(response);
            setScore(response.newScore);
        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('Failed to submit answer: ' + error.message);
            setHasAnswered(false);
            setSelectedAnswer(null);
        }
    };

    if (quizStatus === 'finished') {
        return (
            <div className="leaderboard-container fade-in">
                <h1 className="leaderboard-title gradient-text">
                    🏆 Final Results
                </h1>

                <div className="leaderboard-list">
                    {leaderboard.map((player, index) => (
                        <div
                            key={player.id}
                            className={`leaderboard-item ${index < 3 ? `rank-${index + 1}` : ''} ${player.id === playerId ? 'highlight' : ''}`}
                            style={player.id === playerId ? { border: '2px solid var(--primary)' } : {}}
                        >
                            <div className="leaderboard-rank">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </div>
                            <div className="leaderboard-name">
                                {player.name} {player.id === playerId && '(You)'}
                            </div>
                            <div className="leaderboard-score">{player.score}</div>
                        </div>
                    ))}
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => {
                        socketService.disconnect();
                        navigate('/');
                    }}
                    style={{ marginTop: '2rem', minWidth: '200px' }}
                >
                    Back to Home
                </button>
            </div>
        );
    }

    if (quizStatus === 'lobby' || !currentQuestion) {
        return (
            <div className="waiting-container fade-in">
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    Welcome, {playerName}!
                </h1>
                <div className="waiting-spinner"></div>
                <p className="waiting-text">Waiting for host to start the quiz...</p>
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
                    <div className="score-display">
                        Score: {score}
                    </div>
                </div>

                <h2 className="question-text">{currentQuestion.question}</h2>

                {!showResult ? (
                    <>
                        <div className="answers-grid">
                            {currentQuestion.options.map((option, index) => (
                                option && (
                                    <button
                                        key={index}
                                        className={`answer-option ${selectedAnswer === index ? 'selected' : ''} ${hasAnswered ? 'disabled' : ''}`}
                                        onClick={() => handleAnswerSelect(index)}
                                        disabled={hasAnswered}
                                    >
                                        {option}
                                    </button>
                                )
                            ))}
                        </div>

                        {hasAnswered && answerResult && (
                            <div className="result-feedback">
                                <div className="result-icon">
                                    {answerResult.isCorrect ? '✅' : '❌'}
                                </div>
                                <div className="result-text">
                                    {answerResult.isCorrect ? 'Correct!' : 'Incorrect'}
                                </div>
                                {answerResult.isCorrect && (
                                    <div className="result-points">
                                        +{answerResult.points} points
                                    </div>
                                )}
                                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                                    Waiting for other players...
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                            Your Score: {score}
                        </h3>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                            Get ready for the next question...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GameView;
