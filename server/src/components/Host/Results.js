import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import socketService from '../../socket';

function Results() {
    const navigate = useNavigate();
    const { sessionCode, leaderboard, setLeaderboard, resetQuiz } = useQuiz();
    const [quizTitle, setQuizTitle] = useState('');

    useEffect(() => {
        if (!sessionCode) {
            navigate('/');
            return;
        }

        const socket = socketService.getSocket();

        // Listen for quiz finished event
        socket.on('quiz_finished', (data) => {
            setLeaderboard(data.leaderboard);
        });

        // Get session state to fetch leaderboard and quiz title
        socketService.getSessionState(sessionCode).then((response) => {
            if (response.session) {
                setQuizTitle(response.session.quizTitle);

                // Get current leaderboard
                const players = response.session.players;
                const sortedPlayers = players.sort((a, b) => b.score - a.score);
                setLeaderboard(sortedPlayers);
            }
        }).catch(error => {
            console.error('Error fetching session state:', error);
        });

        return () => {
            socket.off('quiz_finished');
        };
    }, [sessionCode, navigate, setLeaderboard]);

    const handleNewQuiz = () => {
        socketService.disconnect();
        resetQuiz();
        navigate('/');
    };

    const handleBackToLobby = () => {
        navigate('/lobby');
    };

    return (
        <div className="results-page-container fade-in">
            <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 className="gradient-text" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                        🏆 Quiz Complete!
                    </h1>
                    {quizTitle && (
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            {quizTitle}
                        </h2>
                    )}
                </div>

                <div className="leaderboard-container">
                    <h3 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
                        Final Leaderboard
                    </h3>

                    {leaderboard.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                                No players participated in this quiz.
                            </p>
                        </div>
                    ) : (
                        <div className="leaderboard-list">
                            {leaderboard.map((player, index) => (
                                <div
                                    key={player.id}
                                    className={`leaderboard-item ${index < 3 ? `rank-${index + 1}` : ''}`}
                                    style={{ animation: `slideIn ${0.3 + index * 0.1}s ease-out` }}
                                >
                                    <div className="leaderboard-rank">
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                    </div>
                                    <div className="leaderboard-name">{player.name}</div>
                                    <div className="leaderboard-score">{player.score}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '3rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <button
                        className="btn btn-outline"
                        onClick={handleBackToLobby}
                        style={{ minWidth: '200px' }}
                    >
                        Back to Lobby
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleNewQuiz}
                        style={{ minWidth: '200px' }}
                    >
                        Create New Quiz
                    </button>
                </div>

                {leaderboard.length > 0 && (
                    <div style={{
                        marginTop: '3rem',
                        padding: '2rem',
                        background: 'var(--bg-glass)',
                        borderRadius: 'var(--border-radius)',
                        textAlign: 'center'
                    }}>
                        <h4 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Quiz Statistics</h4>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '1.5rem',
                            marginTop: '1.5rem'
                        }}>
                            <div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--primary-light)' }}>
                                    {leaderboard.length}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    Total Players
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success)' }}>
                                    {Math.max(...leaderboard.map(p => p.score))}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    Highest Score
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                                    {Math.round(leaderboard.reduce((sum, p) => sum + p.score, 0) / leaderboard.length)}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    Average Score
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Results;
