import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import socketService from '../../socket';

function JoinGame() {
    const navigate = useNavigate();
    const { setSessionCode, setPlayerId, setPlayerName, setQuizStatus } = useQuiz();

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!code.trim() || !name.trim()) {
            alert('Please enter both game code and your name');
            return;
        }

        setIsJoining(true);
        try {
            socketService.connect();
            const response = await socketService.joinSession(code.toUpperCase(), name);

            setSessionCode(response.sessionCode);
            setPlayerId(response.playerId);
            setPlayerName(name);
            setQuizStatus('lobby');

            navigate('/play');
        } catch (error) {
            console.error('Error joining game:', error);
            alert('Failed to join game: ' + error.message);
            setIsJoining(false);
        }
    };

    return (
        <div className="join-container fade-in">
            <div className="glass-card">
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
                    Join Quiz
                </h1>

                <form onSubmit={handleSubmit} className="join-form">
                    <div className="form-group">
                        <label>Game Code</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Enter 6-digit code..."
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Your Name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Enter your name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={20}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => navigate('/')}
                            style={{ flex: 1 }}
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isJoining}
                            style={{ flex: 1 }}
                        >
                            {isJoining ? 'Joining...' : 'Join Game'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default JoinGame;
