import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuizProvider } from './context/QuizContext';
import Home from './components/Home';
import CreateQuiz from './components/Host/CreateQuiz';
import Lobby from './components/Host/Lobby';
import LiveDashboard from './components/Host/LiveDashboard';
import Results from './components/Host/Results';
import JoinGame from './components/Player/JoinGame';
import GameView from './components/Player/GameView';
import './App.css';

function App() {
  return (
    <QuizProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateQuiz />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/host-dashboard" element={<LiveDashboard />} />
            <Route path="/results" element={<Results />} />
            <Route path="/join" element={<JoinGame />} />
            <Route path="/play" element={<GameView />} />
          </Routes>
        </div>
      </Router>
    </QuizProvider>
  );
}

export default App;
