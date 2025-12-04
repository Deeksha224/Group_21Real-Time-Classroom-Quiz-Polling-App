import React, { createContext, useContext, useState } from 'react';

const QuizContext = createContext();

export const useQuiz = () => {
    const context = useContext(QuizContext);
    if (!context) {
        throw new Error('useQuiz must be used within QuizProvider');
    }
    return context;
};

export const QuizProvider = ({ children }) => {
    const [sessionCode, setSessionCode] = useState('');
    const [playerId, setPlayerId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [score, setScore] = useState(0);
    const [players, setPlayers] = useState([]);
    const [quizStatus, setQuizStatus] = useState('idle'); // idle, lobby, active, finished
    const [leaderboard, setLeaderboard] = useState([]);
    const [questionResult, setQuestionResult] = useState(null);

    const resetQuiz = () => {
        setSessionCode('');
        setPlayerId('');
        setPlayerName('');
        setIsHost(false);
        setCurrentQuestion(null);
        setScore(0);
        setPlayers([]);
        setQuizStatus('idle');
        setLeaderboard([]);
        setQuestionResult(null);
    };

    const value = {
        sessionCode,
        setSessionCode,
        playerId,
        setPlayerId,
        playerName,
        setPlayerName,
        isHost,
        setIsHost,
        currentQuestion,
        setCurrentQuestion,
        score,
        setScore,
        players,
        setPlayers,
        quizStatus,
        setQuizStatus,
        leaderboard,
        setLeaderboard,
        questionResult,
        setQuestionResult,
        resetQuiz
    };

    return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};
