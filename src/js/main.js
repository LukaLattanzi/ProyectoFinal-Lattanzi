let words = [];
let targetWord = "";
let targetDefinition = "";
let targetExample = "";
let currentGuess = [];
let guessCount = 0;
let gamesPlayed = 0;
let points = 0;

// Elementos del DOM
const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const newGameBtn = document.getElementById("new-game-btn");
const themeToggle = document.getElementById("theme-toggle");
const gamesPlayedElement = document.getElementById("games-played");
const pointsElement = document.getElementById("points");
const deletePointsBtn = document.getElementById("delete-points-btn");

// Retorna la configuracion de colores para SweetAlert2 segun el tema actual
function getSwalThemeConfig() {
    return document.body.classList.contains("dark-theme")
        ? { background: "#1a1a1a", color: "#f0f0f0" }
        : { background: "#f0f0f0", color: "#1a1a1a" };
}

// Carga las estadisticas del juego desde el localStorage
function loadGameStats() {
    gamesPlayed = Number.parseInt(localStorage.getItem("gamesPlayed")) || 0;
    points = Number.parseInt(localStorage.getItem("points")) || 0;
    updateStatsDisplay();
}

// Guarda las estadisticas del juego en el localStorage
function saveGameStats() {
    localStorage.setItem("gamesPlayed", gamesPlayed);
    localStorage.setItem("points", points);
    updateStatsDisplay();
}

// Actualiza la visualización de las estadísticas en el DOM
function updateStatsDisplay() {
    gamesPlayedElement.textContent = gamesPlayed;
    pointsElement.textContent = points;
}

// Carga las palabras desde un archivo JSON
async function cargarPalabras() {
    try {
        const respuesta = await fetch('../data/wordlist.json');
        if (!respuesta.ok) throw new Error('Error al cargar palabras');
        const data = await respuesta.json();
        words = data;
        initializeGame();
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar las palabras',
            icon: 'error',
            confirmButtonColor: "#ff4d4d",
            ...getSwalThemeConfig()
        });
    }
}

// Inicializa una nueva partida
function initializeGame() {
    if (words.length === 0) return;

    // Seleccionar aleatoriamente la palabra y sus datos
    const targetObj = words[Math.floor(Math.random() * words.length)];
    targetWord = targetObj.word.toUpperCase();
    targetDefinition = targetObj.definition;
    targetExample = targetObj.example;

    currentGuess = [];
    userGuesses = [];
    guessCount = 0;
    board.innerHTML = "";
    keyboard.innerHTML = "";

    // Crear 30 celdas para los intentos
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

    // Generar teclado en filas (QWERTY)
    const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    keyboardRows.forEach(row => {
        const rowContainer = document.createElement("div");
        rowContainer.classList.add("keyboard-row");
        row.split("").forEach(letter => {
            const key = document.createElement("button");
            key.textContent = letter;
            key.classList.add("key");
            key.addEventListener("click", () => handleKeyPress(letter));
            rowContainer.appendChild(key);
        });
        keyboard.appendChild(rowContainer);
    });

    gamesPlayed++;
    saveGameStats();
}

// Maneja el evento de borrar puntos y partidas jugadas
deletePointsBtn.addEventListener("click", () => {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Deseas borrar todos los puntos y las partidas jugadas?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: "#ff4d4d",
        cancelButtonColor: "#6aaa64",
        confirmButtonText: 'Sí, borrar',
        cancelButtonText: 'Cancelar',
        ...getSwalThemeConfig()
    }).then((result) => {
        if (result.isConfirmed) {
            points = 0;
            gamesPlayed = 0;
            saveGameStats();
            Swal.fire({
                title: 'Borrado',
                text: 'Todos los puntos y las partidas jugadas han sido borrados.',
                icon: 'success',
                confirmButtonColor: "#6aaa64",
                ...getSwalThemeConfig()
            });
        }
    });
});

// Maneja la pulsación de una tecla del teclado virtual
function handleKeyPress(letter) {
    if (currentGuess.length < 5) {
        currentGuess.push(letter.toUpperCase());
        updateBoard();
    }
}

// Maneja la pulsación de la tecla de retroceso
function handleBackspace() {
    if (currentGuess.length > 0) {
        currentGuess.pop();
        updateBoard();
    }
}

// Maneja la pulsación de la tecla Enter
function handleEnter() {
    if (currentGuess.length === 5) checkGuess();
}

// Actualiza el tablero con las letras ingresadas
function updateBoard() {
    const tiles = board.getElementsByClassName("tile");
    for (let i = 0; i < 30; i++) {
        const tileFront = tiles[i].querySelector(".tile-front");
        const tileBack = tiles[i].querySelector(".tile-back");

        // Mostrar intentos anteriores
        if (i < userGuesses.length * 5) {
            const attemptIndex = Math.floor(i / 5);
            const letterIndex = i % 5;
            const letter = userGuesses[attemptIndex][letterIndex];
            tileFront.textContent = letter;
            tileBack.textContent = letter;
        }
        // Mostrar intento actual
        else if (i < (userGuesses.length * 5) + currentGuess.length) {
            const letter = currentGuess[i - (userGuesses.length * 5)];
            tileFront.textContent = letter;
            tileBack.textContent = letter;
        }
        // Limpiar celdas restantes
        else {
            tileFront.textContent = "";
            tileBack.textContent = "";
        }
    }
}

function checkGuess() {
    const guess = currentGuess.join("");
    userGuesses.push([...currentGuess]);

    const tiles = board.getElementsByClassName("tile");
    const startIndex = guessCount * 5;

    const targetLetters = targetWord.split('');
    const frequency = {};
    targetLetters.forEach(letter => frequency[letter] = (frequency[letter] || 0) + 1);

    const statuses = Array(5).fill(null);

    // Primera pasada: marcar correctos
    for (let i = 0; i < 5; i++) {
        if (guess[i] === targetWord[i]) {
            statuses[i] = 'correct';
            frequency[guess[i]]--;
        }
    }

    // Segunda pasada: marcar presentes/ausentes
    for (let i = 0; i < 5; i++) {
        if (statuses[i] === 'correct') continue;

        if (frequency[guess[i]] > 0 && targetWord.includes(guess[i])) {
            statuses[i] = 'present';
            frequency[guess[i]]--;
        } else {
            statuses[i] = 'absent';
        }
    }

    // Aplicar estilos a las celdas y actualizar teclas
    for (let i = 0; i < 5; i++) {
        const tile = tiles[startIndex + i];
        const key = Array.from(document.querySelectorAll('#keyboard button.key')).find(k => k.textContent === guess[i]);

        setTimeout(() => {
            tile.classList.add(statuses[i]);
            if (key && !key.classList.contains('correct')) {
                key.classList.add(statuses[i]);
            }
            tile.classList.add("flip");
        }, i * 300);
    }

    setTimeout(() => {
        if (guess === targetWord) {
            points += 10 - guessCount;
            saveGameStats();
            Swal.fire({
                title: '¡Correcto!',
                html: `<p>Ganaste ${10 - guessCount} puntos.</p>
                       <p>La palabra era: <strong>${targetWord}</strong></p>
                       <p><em>Definición:</em> ${targetDefinition}</p>
                       <p><em>Ejemplo:</em> ${targetExample}</p>`,
                icon: 'success',
                confirmButtonColor: "#6aaa64",
                ...getSwalThemeConfig()
            }).then(() => initializeGame());
        } else {
            guessCount++;
            currentGuess = [];
            if (guessCount === 6) {
                Swal.fire({
                    title: '¡Perdiste!',
                    html: `<p>La palabra era: <strong>${targetWord}</strong></p>
                           <p><em>Definición:</em> ${targetDefinition}</p>
                           <p><em>Ejemplo:</em> ${targetExample}</p>`,
                    icon: 'error',
                    confirmButtonColor: "#ff4d4d",
                    ...getSwalThemeConfig()
                }).then(() => initializeGame());
            }
        }
        updateBoard();
    }, 1500);
}

// Alterna el tema entre claro y oscuro
function toggleTheme() {
    document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light");
}

// Maneja los eventos de teclado
document.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") handleBackspace();
    else if (e.key === "Enter") handleEnter();
    else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
});

// Inicializa una nueva partida al hacer clic en el botón
newGameBtn.addEventListener("click", initializeGame);

// Alterna el tema al hacer clic en el botón
themeToggle.addEventListener("click", toggleTheme);

// Aplica el tema guardado en el localStorage o el tema preferido del sistema
if (localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.body.classList.add("dark-theme");
}

// Carga las estadísticas del juego y las palabras al iniciar
loadGameStats();
cargarPalabras();