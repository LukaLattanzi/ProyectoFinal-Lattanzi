let words = [];
let targetWord = "";
let currentGuess = [];
let userGuesses = []; // Nuevo array para almacenar intentos
let guessCount = 0;
let gamesPlayed = 0;
let points = 0;

const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const newGameBtn = document.getElementById("new-game-btn");
const themeToggle = document.getElementById("theme-toggle");
const gamesPlayedElement = document.getElementById("games-played");
const pointsElement = document.getElementById("points");

function loadGameStats() {
    gamesPlayed = Number.parseInt(localStorage.getItem("gamesPlayed")) || 0;
    points = Number.parseInt(localStorage.getItem("points")) || 0;
    updateStatsDisplay();
}

function saveGameStats() {
    localStorage.setItem("gamesPlayed", gamesPlayed);
    localStorage.setItem("points", points);
    updateStatsDisplay();
}

function updateStatsDisplay() {
    gamesPlayedElement.textContent = gamesPlayed;
    pointsElement.textContent = points;
}

async function cargarPalabras() {
    try {
        const respuesta = await fetch('../data/wordlist.json');
        if (!respuesta.ok) throw new Error('Error al cargar palabras');
        const data = await respuesta.json();
        words = data.map(item => item.word);
        initializeGame();
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudieron cargar las palabras', 'error');
    }
}

function initializeGame() {
    if (words.length === 0) return;

    targetWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
    currentGuess = [];
    userGuesses = []; // Reiniciar intentos
    guessCount = 0;
    board.innerHTML = "";
    keyboard.innerHTML = "";

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

    "QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach(letter => {
        const key = document.createElement("button");
        key.textContent = letter;
        key.classList.add("key");
        key.addEventListener("click", () => handleKeyPress(letter));
        keyboard.appendChild(key);
    });

    gamesPlayed++;
    saveGameStats();
}

// Agrega esto al final del archivo, después de cargar las palabras
const deletePointsBtn = document.getElementById("delete-points-btn");

deletePointsBtn.addEventListener("click", () => {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Deseas borrar todos los puntos y las partidas jugadas?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, borrar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            points = 0;
            gamesPlayed = 0; // Reiniciar las partidas jugadas
            saveGameStats();
            Swal.fire(
                'Borrado',
                'Todos los puntos y las partidas jugadas han sido borrados.',
                'success'
            );
        }
    });
});

function handleKeyPress(letter) {
    if (currentGuess.length < 5) {
        currentGuess.push(letter.toUpperCase());
        updateBoard();
    }
}

function handleBackspace() {
    if (currentGuess.length > 0) {
        currentGuess.pop();
        updateBoard();
    }
}

function handleEnter() {
    if (currentGuess.length === 5) checkGuess();
}

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
    userGuesses.push([...currentGuess]); // Guardar intento
    
    const tiles = board.getElementsByClassName("tile");
    const startIndex = guessCount * 5;
    let correctCount = 0;

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

    // Aplicar estilos
    for (let i = 0; i < 5; i++) {
        const tile = tiles[startIndex + i];
        const key = Array.from(keyboard.children).find(k => k.textContent === guess[i]);

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
                text: `Ganaste ${10 - guessCount} puntos`,
                icon: 'success'
            }).then(() => initializeGame());
        } else {
            guessCount++;
            currentGuess = [];
            if (guessCount === 6) {
                Swal.fire({
                    title: '¡Perdiste!',
                    text: `La palabra era: ${targetWord}`,
                    icon: 'error'
                }).then(() => initializeGame());
            }
        }
        updateBoard(); // Actualizar después de procesar
    }, 1500);
}

function toggleTheme() {
    document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light");
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") handleBackspace();
    else if (e.key === "Enter") handleEnter();
    else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
});

newGameBtn.addEventListener("click", initializeGame);
themeToggle.addEventListener("click", toggleTheme);

if (localStorage.getItem("theme") === "dark" || 
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.body.classList.add("dark-theme");
}

loadGameStats();
cargarPalabras();