 
 // Éléments DOM
const loginScreen = document.getElementById('login-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const configScreen = document.getElementById('config-screen');
const gameScreen = document.getElementById('game-screen');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const welcomeUsername = document.getElementById('welcome-username');
const createGameBtn = document.getElementById('create-game-btn');
const joinGameBtn = document.getElementById('join-game-btn');
const easyBtn = document.getElementById('easy-btn');
const mediumBtn = document.getElementById('medium-btn');
const hardBtn = document.getElementById('hard-btn');
const backBtn = document.getElementById('back-btn');
const startGameBtn = document.getElementById('start-game-btn');
const shareSection = document.getElementById('share-section');
const gameLink = document.getElementById('game-link');
const copyLink = document.getElementById('copy-link');
const gameBoard = document.getElementById('game-board');
const player1Display = document.getElementById('player1-name');
const player2Display = document.getElementById('player2-name');
const player1Symbol = document.getElementById('player1-symbol');
const player2Symbol = document.getElementById('player2-symbol');
const turnIndicator = document.getElementById('turn-indicator');
const player1ScoreEl = document.getElementById('player1-score');
const player2ScoreEl = document.getElementById('player2-score');
const restartBtn = document.getElementById('restart-btn');
const quitBtn = document.getElementById('quit-btn');
const timeButtons = document.querySelectorAll('.btn-time');
const timerDisplay = document.getElementById('timer-display');
const resultOverlay = document.getElementById('result-overlay');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const continueBtn = document.getElementById('continue-btn');
const finalResultBtn = document.getElementById('final-result-btn');
const symbolBtns = document.querySelectorAll('.symbol-btn');

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
    player1: 0,
    player2: 0
};
let totalTime = 300; // 5 minutes par défaut (en secondes)
let timeRemaining;
let timerInterval;
let gameEndTime;
let gameCount = 0;

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
    gameCount++;
    
    // Configurer les noms des joueurs
    if (isSoloGame) {
        player1Display.textContent = playerName;
        player2Display.textContent = "Ordinateur";
        player1Symbol.textContent = playerSymbol;
        player2Symbol.textContent = playerSymbol === 'X' ? 'O' : 'X';
        turnIndicator.textContent = playerSymbol === 'X' ? "À votre tour !" : "L'ordinateur réfléchit...";
        
        if (playerSymbol === 'O') {
            isPlayerTurn = false;
            setTimeout(computerMove, 800);
        }
    } else {
        player1Display.textContent = playerName;
        player2Display.textContent = 'Adversaire';
        player1Symbol.textContent = 'X';
        player2Symbol.textContent = 'O';
        turnIndicator.textContent = 'À toi de jouer !';
    }
    
    updateScoresDisplay();
}

// Démarrer le timer global
function startGlobalTimer() {
    clearInterval(timerInterval);
    timeRemaining = totalTime;
    gameEndTime = Date.now() + timeRemaining * 1000;
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining = Math.max(0, Math.round((gameEndTime - Date.now()) / 1000));
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            endMatch();
            return;
        }
        
        updateTimerDisplay();
    }, 1000);
}

// Mettre à jour l'affichage du timer
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Changement de couleur quand il reste peu de temps
    if (timeRemaining <= 30) {
        timerDisplay.style.color = '#FF5252';
        if (timeRemaining <= 10) {
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
                scores.player1++;
                showGameResult("Victoire !", "Vous avez gagné ce jeu !", "win-result");
            } else {
                scores.player2++;
                showGameResult("Défaite", "L'ordinateur a gagné ce jeu", "lose-result");
            }
        } else {
            scores.player2++;
            showGameResult("Victoire !", "Joueur O a gagné ce jeu !", "win-result");
        }
    } else if (result === -10) {
        // X a gagné
        endGame('X', winningCells);
        if (isSoloGame) {
            if (playerSymbol === 'X') {
                scores.player1++;
                showGameResult("Victoire !", "Vous avez gagné ce jeu !", "win-result");
            } else {
                scores.player2++;
                showGameResult("Défaite", "L'ordinateur a gagné ce jeu", "lose-result");
            }
        } else {
            scores.player1++;
            showGameResult("Victoire !", "Joueur X a gagné ce jeu !", "win-result");
        }
    } else if (result === 0) {
        // Match nul
        endGame(null);
        showGameResult("Égalité", "Match nul pour ce jeu", "draw-result");
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
    
    // Mettre en évidence les cellules gagnantes
    winningCells.forEach(index => {
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        if (cell) cell.classList.add('winning-cell');
    });
}

function endMatch() {
    let winner;
    if (isSoloGame) {
        if (scores.player1 > scores.player2) {
            winner = "Vous avez gagné le match !";
        } else if (scores.player2 > scores.player1) {
            winner = "L'ordinateur a gagné le match !";
        } else {
            winner = "Match nul !";
        }
    } else {
        if (scores.player1 > scores.player2) {
            winner = "Joueur X a gagné le match !";
        } else if (scores.player2 > scores.player1) {
            winner = "Joueur O a gagné le match !";
        } else {
            winner = "Match nul !";
        }
    }
    
    showFinalResult(
        "Match terminé !",
        `${winner}<br>Score final: ${scores.player1} - ${scores.player2}`,
        isSoloGame ? 
            (scores.player1 > scores.player2 ? "win-result" : 
             scores.player2 > scores.player1 ? "lose-result" : "draw-result") :
            (scores.player1 > scores.player2 ? "win-result" : 
             scores.player2 > scores.player1 ? "lose-result" : "draw-result")
    );
}

// Afficher le résultat d'un jeu
function showGameResult(title, message, className) {
    resultTitle.textContent = title;
    resultTitle.className = `result-title ${className}`;
    resultMessage.innerHTML = message;
    continueBtn.classList.remove('hidden');
    finalResultBtn.classList.add('hidden');
    resultOverlay.classList.remove('hidden');
}

// Afficher le résultat final du match
function showFinalResult(title, message, className) {
    resultTitle.textContent = title;
    resultTitle.className = `result-title ${className}`;
    resultMessage.innerHTML = message;
    continueBtn.classList.add('hidden');
    finalResultBtn.classList.remove('hidden');
    resultOverlay.classList.remove('hidden');
}

// Scores
function updateScoresDisplay() {
    player1ScoreEl.textContent = scores.player1;
    player2ScoreEl.textContent = scores.player2;
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
    isSoloGame = false;
    lobbyScreen.classList.add('hidden');
    configScreen.classList.remove('hidden');
    shareSection.classList.remove('hidden');
    // Générer un lien de partage (simulé)
    gameLink.value = `${window.location.href}?game=12345`;
});

joinGameBtn.addEventListener('click', () => {
    alert('Fonctionnalité multijoueur à venir avec Firebase');
});

// Boutons mode solo
easyBtn.addEventListener('click', () => {
    difficulty = 'easy';
    isSoloGame = true;
    lobbyScreen.classList.add('hidden');
    configScreen.classList.remove('hidden');
    shareSection.classList.add('hidden');
});

mediumBtn.addEventListener('click', () => {
    difficulty = 'medium';
    isSoloGame = true;
    lobbyScreen.classList.add('hidden');
    configScreen.classList.remove('hidden');
    shareSection.classList.add('hidden');
});

hardBtn.addEventListener('click', () => {
    difficulty = 'hard';
    isSoloGame = true;
    lobbyScreen.classList.add('hidden');
    configScreen.classList.remove('hidden');
    shareSection.classList.add('hidden');
});

// Bouton retour
backBtn.addEventListener('click', () => {
    configScreen.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');
});

// Copier le lien
copyLink.addEventListener('click', () => {
    gameLink.select();
    document.execCommand('copy');
    alert('Lien copié dans le presse-papier !');
});

// Sélection du temps
timeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        totalTime = parseInt(btn.dataset.time) * 60;
        startGameBtn.textContent = `Commencer (${btn.dataset.time} min)`;
    });
});

// Démarrer la partie
startGameBtn.addEventListener('click', () => {
    configScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // Réinitialiser les scores
    scores = {
        player1: 0,
        player2: 0
    };
    gameCount = 0;
    
    startGlobalTimer();
    initGame();
});

// Boutons du jeu
restartBtn.addEventListener('click', () => {
    initGame();
});

quitBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    gameScreen.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');
});

// Bouton continuer
continueBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
    initGame();
});

// Bouton résultat final
finalResultBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
    gameScreen.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');
});