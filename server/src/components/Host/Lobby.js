import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import socketService from '../../socket';

function Lobby() {
    const navigate = useNavigate();
    const { sessionCode, players, setPlayers, setQuizStatus } = useQuiz();
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        if (!sessionCode) {
            navigate('/');
            return;
        }

        const socket = socketService.getSocket();

        // Listen for players joining
        socket.on('player_joined', (data) => {
            setPlayers(data.players);
        });

        // Listen for players leaving
        socket.on('player_left', (data) => {
            setPlayers(data.players);
        });

        // Get initial session state
        socketService.getSessionState(sessionCode).then((response) => {
            if (response.session) {
                setPlayers(response.session.players);
            }
        });

        return () => {
            socket.off('player_joined');
            socket.off('player_left');
        };
    }, [sessionCode, navigate, setPlayers]);

    const handleStartQuiz = async () => {
        setIsStarting(true);
        try {
            await socketService.startQuiz(sessionCode);
            setQuizStatus('active');
            navigate('/host-dashboard');
        } catch (error) {
            console.error('Error starting quiz:', error);
            alert('Failed to start quiz: ' + error.message);
            setIsStarting(false);
        }
    };

    return (
        <div className="lobby-container fade-in">
            <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                Quiz Lobby
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                Share this code with players to join
            </p>

            <div className="session-code-display">
                <div className="session-code">{sessionCode}</div>
            </div>

            <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
                    Players ({players.length})
                </h2>

                {players.length === 0 ? (
                    <div className="waiting-container">
                        <div className="waiting-spinner"></div>
                        <p className="waiting-text">Waiting for players to join...</p>
                    </div>
                ) : (
                    <div className="players-grid">
                        {players.map((player, index) => (
                            <div key={player.id} className="player-card">
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                    {index === 0 ? '👑' : '🎮'}
                                </div>
                                <div className="player-name">{player.name}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button
                className="btn btn-success"
                onClick={handleStartQuiz}
                disabled={isStarting}
                style={{
                    marginTop: '2rem',
                    padding: '16px 48px',
                    fontSize: '1.2rem',
                    minWidth: '300px'
                }}
            >
                {isStarting ? 'Starting...' : '🚀 Start Quiz'}
            </button>
        </div>
    );
}

export default Lobby;
