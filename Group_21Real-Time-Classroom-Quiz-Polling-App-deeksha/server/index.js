        const express = require('express');
        const http = require('http');
        const socketIo = require('socket.io');
        const cors = require('cors');
        const QuizManager = require('./quizManager');

        const app = express();
        const server = http.createServer(app);
        const io = socketIo(server, {
            cors: {
                origin: ["http://localhost:3000", "http://localhost:3001"],
                methods: ["GET", "POST"]
            }
        });

        app.use(cors());
        app.use(express.json());

        const quizManager = new QuizManager();
        const socketToPlayer = new Map(); // socketId -> { sessionCode, playerId }

        // Socket.io connection handling
        io.on('connection', (socket) => {
            console.log('New client connected:', socket.id);

            // Create a new quiz
            socket.on('create_quiz', (quizData, callback) => {
                try {
                    const quizId = quizManager.createQuiz(quizData);
                    const sessionCode = quizManager.startSession(quizId);

                    // Host joins their own session room
                    socket.join(sessionCode);
                    socketToPlayer.set(socket.id, { sessionCode, isHost: true });

                    callback({ success: true, sessionCode, quizId });
                    console.log(`Quiz created with session code: ${sessionCode}`);
                } catch (error) {
                    callback({ success: false, error: error.message });
                }
            });

            // Player joins a session
            socket.on('join_session', ({ sessionCode, playerName }, callback) => {
                try {
                    const { playerId, session } = quizManager.joinSession(sessionCode, playerName, socket.id);

                    socket.join(sessionCode);
                    socketToPlayer.set(socket.id, { sessionCode, playerId });

                    // Notify host and other players
                    const players = Array.from(session.players.values()).map(p => ({
                        id: p.id,
                        name: p.name,
                        score: p.score
                    }));

                    io.to(sessionCode).emit('player_joined', { players });

                    callback({ success: true, playerId, sessionCode });
                    console.log(`Player ${playerName} joined session ${sessionCode}`);
                } catch (error) {
                    callback({ success: false, error: error.message });
                }
            });

            // Host starts the quiz
            socket.on('start_quiz', ({ sessionCode }, callback) => {
                try {
                    const session = quizManager.startQuiz(sessionCode);
                    const currentQuestion = session.quiz.questions[session.currentQuestionIndex];

                    // Send question to all players (without correct answer)
                    const questionForPlayers = {
                        index: session.currentQuestionIndex,
                        question: currentQuestion.question,
                        options: currentQuestion.options,
                        totalQuestions: session.quiz.questions.length
                    };

                    io.to(sessionCode).emit('quiz_started', { question: questionForPlayers });
                    callback({ success: true });
                    console.log(`Quiz started for session ${sessionCode}`);
                } catch (error) {
                    callback({ success: false, error: error.message });
                }
            });

            // Player submits an answer
            socket.on('submit_answer', ({ sessionCode, playerId, questionIndex, answer, timeToAnswer }, callback) => {
                try {
                    const result = quizManager.submitAnswer(sessionCode, playerId, questionIndex, answer, timeToAnswer);

                    // Send result back to the player
                    callback({
                        success: true,
                        isCorrect: result.isCorrect,
                        points: result.points,
                        newScore: result.player.score
                    });

                    // Update host with live stats
                    const stats = quizManager.getQuestionStats(sessionCode, questionIndex);
                    const session = quizManager.getSession(sessionCode);
                    const totalPlayers = session.players.size;

                    io.to(sessionCode).emit('answer_submitted', {
                        playerId,
                        playerName: result.player.name,
                        answered: stats.totalAnswers,
                        total: totalPlayers
                    });

                    console.log(`Player ${result.player.name} answered question ${questionIndex}`);
                } catch (error) {
                    callback({ success: false, error: error.message });
                }
            });

            // Host moves to next question
            socket.on('next_question', ({ sessionCode }, callback) => {
                try {
                    const session = quizManager.getSession(sessionCode);
                    const currentQuestionIndex = session.currentQuestionIndex;

                    // Get stats for current question
                    const stats = quizManager.getQuestionStats(sessionCode, currentQuestionIndex);
                    const currentQuestion = session.quiz.questions[currentQuestionIndex];

                    // Send results to everyone
                    io.to(sessionCode).emit('question_results', {
                        questionIndex: currentQuestionIndex,
                        correctAnswer: currentQuestion.correctAnswer,
                        stats: stats,
                        leaderboard: quizManager.getLeaderboard(sessionCode)
                    });

                    // Move to next question
                    setTimeout(() => {
                        const { finished, session: updatedSession } = quizManager.nextQuestion(sessionCode);

                        if (finished) {
                            // Quiz finished
                            const finalLeaderboard = quizManager.getLeaderboard(sessionCode);
                            io.to(sessionCode).emit('quiz_finished', { leaderboard: finalLeaderboard });
                            callback({ success: true, finished: true });
                        } else {
                            // Send next question
                            const nextQuestion = updatedSession.quiz.questions[updatedSession.currentQuestionIndex];
                            const questionForPlayers = {
                                index: updatedSession.currentQuestionIndex,
                                question: nextQuestion.question,
                                options: nextQuestion.options,
                                totalQuestions: updatedSession.quiz.questions.length
                            };

                            io.to(sessionCode).emit('new_question', { question: questionForPlayers });
                            callback({ success: true, finished: false });
                        }
                    }, 3000); // 3 second delay to show results

                } catch (error) {
                    callback({ success: false, error: error.message });
                }
            });

            // Get current session state
            socket.on('get_session_state', ({ sessionCode }, callback) => {
                try {
                    const session = quizManager.getSession(sessionCode);
                    if (!session) {
                        callback({ success: false, error: 'Session not found' });
                        return;
                    }

                    const players = Array.from(session.players.values()).map(p => ({
                        id: p.id,
                        name: p.name,
                        score: p.score
                    }));

                    callback({
                        success: true,
                        session: {
                            code: session.code,
                            status: session.status,
                            currentQuestionIndex: session.currentQuestionIndex,
                            players: players,
                            quizTitle: session.quiz.title,
                            quiz: session.quiz
                        }
                    });
                } catch (error) {
                    callback({ success: false, error: error.message });
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                const playerData = socketToPlayer.get(socket.id);
                if (playerData && !playerData.isHost) {
                    const { sessionCode, playerId } = playerData;
                    quizManager.removePlayer(sessionCode, playerId);

                    const session = quizManager.getSession(sessionCode);
                    if (session) {
                        const players = Array.from(session.players.values()).map(p => ({
                            id: p.id,
                            name: p.name,
                            score: p.score
                        }));
                        io.to(sessionCode).emit('player_left', { players });
                    }
                }
                socketToPlayer.delete(socket.id);
                console.log('Client disconnected:', socket.id);
            });
        });

        const PORT = process.env.PORT || 4000;
        server.listen(PORT, () => {
            console.log(`Server running ${PORT}`);
        });
