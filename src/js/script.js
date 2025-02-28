let words = []; // Array de palabras a adivinar (se cargará desde el JSON)
let targetWord = ""; // Palabra a adivinar
let currentGuess = []; // Letras ingresadas por el usuario
let guessCount = 0; // Cantidad de intentos
let gamesPlayed = 0; // Cantidad de partidas jugadas
let points = 0; // Puntos acumulados

// Elementos del DOM
const board = document.getElementById("board"); // Tablero de juego
const keyboard = document.getElementById("keyboard"); // Teclado de juego
const newGameBtn = document.getElementById("new-game-btn"); // Botón de nueva partida
const themeToggle = document.getElementById("theme-toggle"); // Botón de cambio de tema
const gamesPlayedElement = document.getElementById("games-played"); // Elemento de partidas jugadas
const pointsElement = document.getElementById("points"); // Elemento de puntos

// Cargar estadísticas del juego desde el localStorage
function loadGameStats() {
    gamesPlayed = Number.parseInt(localStorage.getItem("gamesPlayed")) || 0;
    points = Number.parseInt(localStorage.getItem("points")) || 0;
    updateStatsDisplay();
}

// Guardar estadísticas del juego en el localStorage
function saveGameStats() {
    localStorage.setItem("gamesPlayed", gamesPlayed);
    localStorage.setItem("points", points);
    updateStatsDisplay();
}

// Actualizar la visualización de las estadísticas
function updateStatsDisplay() {
    gamesPlayedElement.textContent = gamesPlayed;
    pointsElement.textContent = points;
}

// Cargar las palabras desde el archivo JSON
async function cargarPalabras() {
    try {
        const respuesta = await fetch('../data/wordlist.json'); // Ajusta la ruta según la ubicación de tu archivo
        if (!respuesta.ok) {
            throw new Error('No se pudo cargar el archivo JSON');
        }
        const data = await respuesta.json();
        words = data.map(item => item.word); // Asigna solo las palabras al array `words`
        initializeGame(); // Inicializa el juego una vez que las palabras estén cargadas
    } catch (error) {
        console.error('Error al cargar las palabras:', error);
        alert('Error al cargar las palabras. Por favor, recarga la página.');
    }
}

// Inicializar el juego
function initializeGame() {
    if (words.length === 0) {
        console.error('No hay palabras cargadas.');
        return;
    }

    targetWord = words[Math.floor(Math.random() * words.length)]; // Seleccionar una palabra aleatoria
    currentGuess = []; // Reiniciar la conjetura actual
    guessCount = 0; // Reiniciar el contador de intentos
    board.innerHTML = ""; // Limpiar el tablero
    keyboard.innerHTML = ""; // Limpiar el teclado

    // Crear las casillas del tablero
    for (let i = 0; i < 30; i++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        tile.innerHTML = `
      <div class="tile-inner">
        <div class="tile-front"></div>
        <div class="tile-back"></div>
      </div>
    `;
        board.appendChild(tile);
    }

    // Crear las teclas del teclado
    "QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach((letter) => {
        const key = document.createElement("button");
        key.textContent = letter;
        key.classList.add("key");
        key.addEventListener("click", () => handleKeyPress(letter));
        keyboard.appendChild(key);
    });

    gamesPlayed++; // Incrementar el contador de partidas jugadas
    saveGameStats(); // Guardar las estadísticas del juego
}

// Manejar la pulsación de una tecla
function handleKeyPress(letter) {
    if (currentGuess.length < 5) {
        currentGuess.push(letter); // Agregar la letra a la conjetura actual
        updateBoard(); // Actualizar el tablero
    }
}

// Manejar la pulsación de la tecla de retroceso
function handleBackspace() {
    if (currentGuess.length > 0) {
        currentGuess.pop(); // Eliminar la última letra de la conjetura actual
        updateBoard(); // Actualizar el tablero
    }
}

// Manejar la pulsación de la tecla Enter
function handleEnter() {
    if (currentGuess.length === 5) {
        checkGuess(); // Verificar la conjetura
    }
}

// Actualizar el tablero
function updateBoard() {
    const tiles = board.getElementsByClassName("tile");
    for (let i = 0; i < 30; i++) {
        const tileInner = tiles[i].querySelector(".tile-inner");
        const tileFront = tiles[i].querySelector(".tile-front");
        const tileBack = tiles[i].querySelector(".tile-back");

        if (i < guessCount * 5 + currentGuess.length) {
            const letter = i >= guessCount * 5 ? currentGuess[i - guessCount * 5] : tileFront.textContent;
            tileFront.textContent = letter;
            tileBack.textContent = letter;
        } else {
            tileFront.textContent = "";
            tileBack.textContent = "";
        }
    }
}

// Verificar la conjetura
function checkGuess() {
    const guess = currentGuess.join("");
    const tiles = board.getElementsByClassName("tile");
    const startIndex = guessCount * 5;
    let correctCount = 0;

    for (let i = 0; i < 5; i++) {
        const tile = tiles[startIndex + i];
        const letter = guess[i];
        const key = document.querySelector(`.key:nth-child(${letter.charCodeAt(0) - 64})`);

        setTimeout(() => {
            if (letter === targetWord[i]) {
                tile.classList.add("correct");
                key.classList.add("correct");
                correctCount++;
            } else if (targetWord.includes(letter)) {
                tile.classList.add("present");
                if (!key.classList.contains("correct")) {
                    key.classList.add("present");
                }
            } else {
                tile.classList.add("absent");
                key.classList.add("absent");
            }

            tile.classList.add("flip");
        }, i * 300);
    }

    setTimeout(() => {
        if (guess === targetWord) {
            points += 10 - guessCount;
            saveGameStats();
            alert(`Felicitaciones! Adivinaste la Palabra! Ganaste ${10 - guessCount} puntos.`);
            initializeGame();
        } else {
            guessCount++;
            currentGuess = [];
            if (guessCount === 6) {
                alert(`Perdiste! La Palabra era ${targetWord}`);
                initializeGame();
            }
        }
    }, 1500);
}

// Alternar el tema oscuro/claro
function toggleTheme() {
    document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light");
}

// Manejar eventos de teclado
document.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
        handleBackspace();
    } else if (e.key === "Enter") {
        handleEnter();
    } else if (e.key.match(/^[a-zA-Z]$/)) {
        handleKeyPress(e.key.toUpperCase());
    }
});

// Inicializar el juego y el tema
newGameBtn.addEventListener("click", initializeGame);
themeToggle.addEventListener("click", toggleTheme);

if (
    localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
    document.body.classList.add("dark-theme");
}

loadGameStats();
cargarPalabras(); // Cargar las palabras al iniciar la aplicación