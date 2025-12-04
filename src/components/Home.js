import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-container fade-in">
            <h1 className="home-title">
                <span className="gradient-text">QuizMaster</span>
            </h1>
            <p className="home-subtitle">
                Real-time interactive quizzes for classrooms and teams
            </p>
            <div className="home-buttons">
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/create')}
                >
                    🎯 Host a Quiz
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/join')}
                >
                    🎮 Join Quiz
                </button>
            </div>
        </div>
    );
}

export default Home;
