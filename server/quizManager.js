const { v4: uuidv4 } = require('uuid');

class QuizManager {
  constructor() {
    this.quizzes = new Map(); // quizId -> quiz data
    this.sessions = new Map(); // sessionCode -> session data
  }

  // Create a new quiz
  createQuiz(quizData) {
    const quizId = uuidv4();
    this.quizzes.set(quizId, {
      id: quizId,
      title: quizData.title,
      questions: quizData.questions,
      createdAt: new Date()
    });
    return quizId;
  }

  // Start a new session for a quiz
  startSession(quizId) {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const sessionCode = this.generateSessionCode();
    const session = {
      code: sessionCode,
      quizId: quizId,
      quiz: quiz,
      players: new Map(), // playerId -> player data
      currentQuestionIndex: -1,
      status: 'lobby', // lobby, active, finished
      startedAt: null,
      answers: new Map() // questionIndex -> Map(playerId -> answer)
    };

    this.sessions.set(sessionCode, session);
    return sessionCode;
  }

  // Generate a random 6-character session code
  generateSessionCode() {
    let code;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (this.sessions.has(code));
    return code;
  }

  // Player joins a session
  joinSession(sessionCode, playerName, socketId) {
    const session = this.sessions.get(sessionCode);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'lobby') {
      throw new Error('Session already started');
    }

    const playerId = uuidv4();
    session.players.set(playerId, {
      id: playerId,
      name: playerName,
      socketId: socketId,
      score: 0,
      answers: []
    });

    return { playerId, session };
  }

  // Start the quiz (move from lobby to active)
  startQuiz(sessionCode) {
    const session = this.sessions.get(sessionCode);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = 'active';
    session.startedAt = new Date();
    session.currentQuestionIndex = 0;

    return session;
  }

  // Move to next question
  nextQuestion(sessionCode) {
    const session = this.sessions.get(sessionCode);
    if (!session) {
      throw new Error('Session not found');
    }

    session.currentQuestionIndex++;
    
    if (session.currentQuestionIndex >= session.quiz.questions.length) {
      session.status = 'finished';
      return { finished: true, session };
    }

    return { finished: false, session };
  }

  // Submit an answer
  submitAnswer(sessionCode, playerId, questionIndex, answer, timeToAnswer) {
    const session = this.sessions.get(sessionCode);
    if (!session) {
      throw new Error('Session not found');
    }

    const player = session.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const question = session.quiz.questions[questionIndex];
    const isCorrect = answer === question.correctAnswer;

    // Calculate points (base 1000, reduced by time taken)
    let points = 0;
    if (isCorrect) {
      const basePoints = 1000;
      const timeBonus = Math.max(0, 1000 - (timeToAnswer * 10));
      points = Math.floor(basePoints + timeBonus);
      player.score += points;
    }

    // Store answer
    if (!session.answers.has(questionIndex)) {
      session.answers.set(questionIndex, new Map());
    }
    session.answers.get(questionIndex).set(playerId, {
      answer,
      isCorrect,
      points,
      timeToAnswer
    });

    player.answers.push({
      questionIndex,
      answer,
      isCorrect,
      points,
      timeToAnswer
    });

    return { isCorrect, points, player };
  }

  // Get session data
  getSession(sessionCode) {
    return this.sessions.get(sessionCode);
  }

  // Get leaderboard
  getLeaderboard(sessionCode) {
    const session = this.sessions.get(sessionCode);
    if (!session) {
      throw new Error('Session not found');
    }

    const leaderboard = Array.from(session.players.values())
      .map(player => ({
        id: player.id,
        name: player.name,
        score: player.score
      }))
      .sort((a, b) => b.score - a.score);

    return leaderboard;
  }

  // Get current question stats
  getQuestionStats(sessionCode, questionIndex) {
    const session = this.sessions.get(sessionCode);
    if (!session) {
      throw new Error('Session not found');
    }

    const questionAnswers = session.answers.get(questionIndex);
    if (!questionAnswers) {
      return { totalAnswers: 0, correctAnswers: 0, answerDistribution: {} };
    }

    const stats = {
      totalAnswers: questionAnswers.size,
      correctAnswers: 0,
      answerDistribution: {}
    };

    questionAnswers.forEach((answerData) => {
      if (answerData.isCorrect) {
        stats.correctAnswers++;
      }
      
      const answer = answerData.answer;
      stats.answerDistribution[answer] = (stats.answerDistribution[answer] || 0) + 1;
    });

    return stats;
  }

  // Remove player from session
  removePlayer(sessionCode, playerId) {
    const session = this.sessions.get(sessionCode);
    if (session) {
      session.players.delete(playerId);
    }
  }

  // Clean up finished sessions (optional, for memory management)
  cleanupSession(sessionCode) {
    this.sessions.delete(sessionCode);
  }
}

module.exports = QuizManager;
