// Éléments DOM
const loginScreen = document.getElementById('login-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const welcomeUsername = document.getElementById('welcome-username');
const createGameBtn = document.getElementById('create-game-btn');
const joinGameBtn = document.getElementById('join-game-btn');
const easyBtn = document.getElementById('easy-btn');
const mediumBtn = document.getElementById('medium-btn');
const hardBtn = document.getElementById('hard-btn');
const gameBoard = document.getElementById('game-board');
const player1Display = document.getElementById('player1-name');
const player2Display = document.getElementById('player2-name');
const turnIndicator = document.getElementById('turn-indicator');
const restartBtn = document.getElementById('restart-btn');
const quitBtn = document.getElementById('quit-btn');
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message');
const stickers = document.querySelectorAll('.sticker');
const symbolBtns = document.querySelectorAll('.symbol-btn');
const timeSection = document.getElementById('time-section');
const timeButtons = document.querySelectorAll('.btn-time');
const timerDisplay = document.getElementById('timer-display');
const playerScoreEl = document.getElementById('player-score');
const computerScoreEl = document.getElementById('computer-score');
const abandonScoreEl = document.getElementById('abandon-score');
const resultOverlay = document.getElementById('result-overlay');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const resultButton = document.getElementById('result-button');

// Variables du jeu
let currentPlayer = 'X';
let gameState = ['', '', '', '', '', '', '', '', ''];
let isGameActive = true;
let playerName = '';
let playerSymbol = 'X';
let isSoloGame = false;
let difficulty = 'easy';
let isPlayerTurn = true;
let scores = {
    player: 0,
    computer: 0,
    abandon: 0
};
let gameTime = 300; // 5 minutes par défaut (en secondes)
let timerInterval;
let gameEndTime;

// Initialisation du jeu
function initGame() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', handleCellClick);
        gameBoard.appendChild(cell);
    }
    
    gameState = ['', '', '', '', '', '', '', '', ''];
    isGameActive = true;
    currentPlayer = 'X';
    isPlayerTurn = playerSymbol === 'X';
    
    // Configurer les noms des joueurs
    if (isSoloGame) {
        player1Display.textContent = playerName;
        player2Display.textContent = "Ordinateur";
        turnIndicator.textContent = playerSymbol === 'X' ? "À votre tour !" : "L'ordinateur réfléchit...";
        
        if (playerSymbol === 'O') {
            isPlayerTurn = false;
            setTimeout(computerMove, 800);
        }
    } else {
        player1Display.textContent = playerName;
        player2Display.textContent = 'Adversaire';
        turnIndicator.textContent = 'À toi de jouer !';
    }
    
    // Démarrer le timer
    startTimer();
    
    // Réinitialiser le chat
    chatContainer.innerHTML = '';
    addSystemMessage("La partie a commencé !");
}

// Démarrer le timer
function startTimer() {
    clearInterval(timerInterval);
    gameEndTime = Date.now() + gameTime * 1000;
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        const remaining = Math.max(0, Math.round((gameEndTime - Date.now()) / 1000));
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            endGame('timeout');
            showResult(
                "Temps écoulé !", 
                scores.player > scores.computer ? "Vous avez caillé !" : "Vous avez perdu...", 
                scores.player > scores.computer ? "win-result" : "lose-result"
            );
            return;
        }
        
        updateTimerDisplay();
    }, 1000);
}

// Mettre à jour l'affichage du timer
function updateTimerDisplay() {
    const remaining = Math.max(0, Math.round((gameEndTime - Date.now()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Changement de couleur quand il reste peu de temps
    if (remaining <= 30) {
        timerDisplay.style.color = '#FF5252';
        if (remaining <= 10) {
            timerDisplay.style.animation = 'pulse-win 0.5s infinite alternate';
        }
    } else {
        timerDisplay.style.color = 'var(--accent)';
        timerDisplay.style.animation = 'none';
    }
}

// Gestion du clic sur une cellule
function handleCellClick(e) {
    if (!isPlayerTurn && isSoloGame) return;
    
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
    
    if (gameState[clickedCellIndex] !== '' || !isGameActive) return;
    
    makeMove(clickedCell, clickedCellIndex);
    
    if (isSoloGame && isGameActive) {
        isPlayerTurn = false;
        setTimeout(computerMove, 800);
    }
}

function makeMove(cell, index) {
    gameState[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
    
    // Animation
    cell.style.transform = 'scale(0)';
    setTimeout(() => {
        cell.style.transform = 'scale(1)';
    }, 150);
    
    checkGameResult();
}

// Mouvement de l'ordinateur
function computerMove() {
    if (!isGameActive) return;
    
    let moveIndex;
    const availableMoves = gameState.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    
    if (difficulty === 'easy') {
        // Aléatoire
        moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else if (difficulty === 'medium') {
        // 50% de chance de jouer optimal, 50% aléatoire
        if (Math.random() > 0.5) {
            moveIndex = findBestMove();
        } else {
            moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
    } else {
        // Difficile - presque toujours optimal
        moveIndex = findBestMove();
    }
    
    if (moveIndex !== undefined) {
        const cell = document.querySelector(`.cell[data-index="${moveIndex}"]`);
        makeMove(cell, moveIndex);
    }
    
    isPlayerTurn = true;
    turnIndicator.textContent = "À votre tour !";
}

// Algorithme minimax pour le niveau difficile
function findBestMove() {
    let bestScore = -Infinity;
    let bestMove;
    
    for (let i = 0; i < 9; i++) {
        if (gameState[i] === '') {
            gameState[i] = 'O';
            let score = minimax(gameState, 0, false);
            gameState[i] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    const result = checkGameResultForAI();
    
    if (result !== null) {
        return result;
    }
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkGameResultForAI() {
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // lignes
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // colonnes
        [0, 4, 8], [2, 4, 6]             // diagonales
    ];
    
    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            return gameState[a] === 'O' ? 10 : -10;
        }
    }
    
    if (!gameState.includes('')) {
        return 0;
    }
    
    return null;
}

// Vérifier le résultat du jeu
function checkGameResult() {
    const result = checkGameResultForAI();
    let winningCells = [];
    
    if (result !== null) {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // lignes
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // colonnes
            [0, 4, 8], [2, 4, 6]             // diagonales
        ];
        
        // Trouver les cellules gagnantes
        for (let i = 0; i < winConditions.length; i++) {
            const [a, b, c] = winConditions[i];
            if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
                winningCells = [a, b, c];
                break;
            }
        }
    }
    
    if (result === 10) {
        // O a gagné
        endGame('O', winningCells);
        if (isSoloGame) {
            if (playerSymbol === 'O') {
                scores.player++;
                showResult("Caillé !", "Vous avez gagné !", "win-result");
            } else {
                scores.computer++;
                showResult("Perdu...", "L'ordinateur a gagné", "lose-result");
            }
        } else {
            addSystemMessage("Joueur O a gagné !");
        }
    } else if (result === -10) {
        // X a gagné
        endGame('X', winningCells);
        if (isSoloGame) {
            if (playerSymbol === 'X') {
                scores.player++;
                showResult("Caillé !", "Vous avez gagné !", "win-result");
            } else {
                scores.computer++;
                showResult("Perdu...", "L'ordinateur a gagné", "lose-result");
            }
        } else {
            addSystemMessage("Joueur X a gagné !");
        }
    } else if (result === 0) {
        // Match nul
        endGame(null);
        scores.abandon++;
        showResult("Élu", "Match nul !", "draw-result");
    } else {
        // Le jeu continue
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        if (isSoloGame) {
            turnIndicator.textContent = currentPlayer === playerSymbol 
                ? "À votre tour !" 
                : "L'ordinateur réfléchit...";
        } else {
            turnIndicator.textContent = `Tour de ${currentPlayer}`;
        }
    }
    
    updateScoresDisplay();
}

function endGame(winner, winningCells = []) {
    isGameActive = false;
    clearInterval(timerInterval);
    
    // Mettre en évidence les cellules gagnantes
    winningCells.forEach(index => {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        if (cell) cell.classList.add('winning-cell');
    });
    
    if (isSoloGame) {
        if (winner === playerSymbol) {
            turnIndicator.textContent = "Vous avez caillé !";
        } else if (winner) {
            turnIndicator.textContent = "Vous avez perdu...";
        } else {
            turnIndicator.textContent = "Élu - Match nul !";
        }
    } else {
        if (winner) {
            turnIndicator.textContent = `Joueur ${winner} a gagné !`;
        } else {
            turnIndicator.textContent = "Match nul !";
        }
    }
}

// Afficher le résultat final
function showResult(title, message, className) {
    resultTitle.textContent = title;
    resultTitle.className = `result-title ${className}`;
    resultMessage.textContent = message;
    resultOverlay.classList.remove('hidden');
}

// Gestion du chat
function addMessage(sender, content, isSticker = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    const senderSpan = document.createElement('span');
    senderSpan.classList.add('message-sender');
    senderSpan.classList.add(sender === playerName ? 'sender-x' : 'sender-o');
    senderSpan.textContent = sender + ": ";
    
    messageDiv.appendChild(senderSpan);
    
    if (isSticker) {
        const stickerSpan = document.createElement('span');
        stickerSpan.style.fontSize = '1.5rem';
        stickerSpan.textContent = content;
        messageDiv.appendChild(stickerSpan);
    } else {
        messageDiv.appendChild(document.createTextNode(content));
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addSystemMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'system-message');
    messageDiv.textContent = content;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Scores
function updateScoresDisplay() {
    playerScoreEl.textContent = scores.player;
    computerScoreEl.textContent = scores.computer;
    abandonScoreEl.textContent = scores.abandon;
}

// Gestion de la connexion
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username.length < 2) {
        alert('Choisis un pseudo d\'au moins 2 caractères');
        return;
    }
    
    playerName = username;
    welcomeUsername.textContent = username;
    loginScreen.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');
});

// Sélection du symbole
symbolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        playerSymbol = btn.dataset.symbol;
        symbolBtns.forEach(b => b.classList.toggle('active', b === btn));
    });
});

// Boutons du lobby
createGameBtn.addEventListener('click', () => {
    player1Display.textContent = playerName;
    player2Display.textContent = 'Adversaire';
    isSoloGame = false;
    timeSection.classList.add('hidden');
    
    lobbyScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    initGame();
});

joinGameBtn.addEventListener('click', () => {
    alert('Fonctionnalité multijoueur à venir avec Firebase');
});

// Boutons mode solo
easyBtn.addEventListener('click', () => {
    difficulty = 'easy';
    timeSection.classList.remove('hidden');
});

mediumBtn.addEventListener('click', () => {
    difficulty = 'medium';
    timeSection.classList.remove('hidden');
});

hardBtn.addEventListener('click', () => {
    difficulty = 'hard';
    timeSection.classList.remove('hidden');
});

// Sélection du temps
timeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        gameTime = parseInt(btn.dataset.time) * 60;
        startSoloGame();
    });
});

function startSoloGame() {
    isSoloGame = true;
    
    lobbyScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    initGame();
}

// Boutons du jeu
restartBtn.addEventListener('click', initGame);
quitBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    scores.abandon++;
    updateScoresDisplay();
    showResult("Élu", "Vous avez quitté la partie", "draw-result");
});

// Gestion du chat
sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        addMessage(playerName, message);
        messageInput.value = '';
        
        if (isSoloGame) {
            // Réponse automatique de l'ordinateur
            setTimeout(() => {
                const responses = [
                    "Bien joué !",
                    "Hmm... intéressant",
                    "Tu es fort !",
                    "Je vais gagner !",
                    "Essaie encore !"
                ];
                addMessage("Ordinateur", responses[Math.floor(Math.random() * responses.length)]);
            }, 1000);
        }
    }
}

// Gestion des stickers
stickers.forEach(sticker => {
    sticker.addEventListener('click', () => {
        addMessage(playerName, sticker.textContent, true);
        
        if (isSoloGame) {
            setTimeout(() => {
                const stickerResponses = ["😎", "👍", "🤔", "👏", "🎯"];
                addMessage("Ordinateur", stickerResponses[Math.floor(Math.random() * stickerResponses.length)], true);
            }, 800);
        }
    });
});

// Bouton résultat
resultButton.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
    if (!isGameActive) {
        initGame();
    }
});