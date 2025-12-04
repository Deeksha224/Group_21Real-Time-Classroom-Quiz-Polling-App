import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000';

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            this.socket.on('connect', () => {
                console.log('Connected to server');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
            });
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        if (!this.socket) {
            return this.connect();
        }
        return this.socket;
    }

    // Quiz creation
    createQuiz(quizData) {
        return new Promise((resolve, reject) => {
            this.getSocket().emit('create_quiz', quizData, (response) => {
                if (response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    // Join session
    joinSession(sessionCode, playerName) {
        return new Promise((resolve, reject) => {
            this.getSocket().emit('join_session', { sessionCode, playerName }, (response) => {
                if (response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    // Start quiz
    startQuiz(sessionCode) {
        return new Promise((resolve, reject) => {
            this.getSocket().emit('start_quiz', { sessionCode }, (response) => {
                if (response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    // Submit answer
    submitAnswer(sessionCode, playerId, questionIndex, answer, timeToAnswer) {
        return new Promise((resolve, reject) => {
            this.getSocket().emit('submit_answer',
                { sessionCode, playerId, questionIndex, answer, timeToAnswer },
                (response) => {
                    if (response.success) {
                        resolve(response);
                    } else {
                        reject(new Error(response.error));
                    }
                }
            );
        });
    }

    // Next question
    nextQuestion(sessionCode) {
        return new Promise((resolve, reject) => {
            this.getSocket().emit('next_question', { sessionCode }, (response) => {
                if (response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    // Get session state
    getSessionState(sessionCode) {
        return new Promise((resolve, reject) => {
            this.getSocket().emit('get_session_state', { sessionCode }, (response) => {
                if (response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    // Event listeners
    on(event, callback) {
        this.getSocket().on(event, callback);
    }

    off(event, callback) {
        this.getSocket().off(event, callback);
    }
}

const socketService = new SocketService();
export default socketService;
