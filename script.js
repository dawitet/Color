// --- Game State ---
let gameState = {
    selectedWordLength: null,
    targetWord: "",
    currentGuess: [],
    guessCount: 0,
    MAX_GUESSES: 6,
    words: {},
    hints: null,
    guesses: [],
    letterHints: {},
    currentRow: 0,
    hintFileLoaded: false,
    isLoading: true,
    hintsEnabled: true,
    soundEnabled: true,
    gameStats: {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
    },
};

// --- DOM Element References ---
let keyboard, grid, messageDisplay, lengthSelection, newGameButton, hintButton,
    titleElement, createdByElement, gameOverButton, suggestionArea;

function initializeDOMReferences() {
    keyboard = document.getElementById("keyboard");
    grid = document.getElementById("wordle-grid");
    messageDisplay = document.getElementById("message");
    lengthSelection = document.getElementById("length-selection");
    newGameButton = document.getElementById("return-to-main-menu-button");
    hintButton = document.getElementById("hint-button");
    titleElement = document.getElementById("game-title");
    createdByElement = document.getElementById("created-by");
    gameOverButton = document.getElementById("return-to-main-menu-button2");
    suggestionArea = document.getElementById("suggestion-area");
}

const config = {
    wordListPaths: {
        3: "words/3.json",
        4: "words/4.json",
        5: "words/5.json",
    },
    hintFilePath: "hints.json",
};

let gameState = {
    words: {},
    targetWord: "",
    selectedWordLength: 5,
    guesses: [],
    currentRow: 0,
    MAX_GUESSES: 6,
    currentGuess: [],
    letterHints: {},
    hints: null,
    hintFileLoaded: false,
    hintsEnabled: true,
    soundEnabled: true,
    gameStats: {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
    },
};

let grid, keyboard, messageDisplay, lengthSelection, newGameButton, hintButton, gameOverButton, keyPressSound, correctGuessSound, gameOverSound;

function initializeDOMReferences() {
    grid = document.getElementById("wordle-grid");
    keyboard = document.getElementById("keyboard");
    messageDisplay = document.getElementById("message");
    lengthSelection = document.getElementById("length-selection");
    newGameButton = document.getElementById("new-game-button");
    hintButton = document.getElementById("hint-button");
    gameOverButton = document.getElementById("game-over-buttons");

    keyPressSound = new Audio("sounds/keypress.mp3");
    correctGuessSound = new Audio("sounds/correct.mp3");
    gameOverSound = new Audio("sounds/gameover.mp3");
}

async function loadWords() {
    try {
        for (const length in config.wordListPaths) {
            const response = await fetch(config.wordListPaths[length]);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            gameState.words[length] = await response.json();
        }
        return true;
    } catch (error) {
        console.error("Error loading words:", error);
        return false;
    }
}

function selectWord() {
    const words = gameState.words[gameState.selectedWordLength];
    gameState.targetWord = words[Math.floor(Math.random() * words.length)];
}

function createAmharicKeyboard() {
    const keyboardLayout = [
        ["ቀ", "ረ", "ተ", "የ", "ወ", "ዑ", "ኢ", "ፓ", "አ", "ሰ"],
        ["ደ", "ፈ", "ገ", "ሀ", "ጀ", "ከ", "ለ", "ዘ", "ቨ", "ኘ"],
        ["Enter", "ሸ", "ነ", "መ", "ጨ", "ቐ", "በ", "ተ", "Backspace"],
    ];

    keyboardLayout.forEach(row => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "keyboard-row";
        row.forEach(key => {
            const keyButton = document.createElement("button");
            keyButton.className = "key";
            keyButton.textContent = key;
            keyButton.dataset.letter = key;
            keyButton.addEventListener("click", () => handleKeyPress(key));
            rowDiv.appendChild(keyButton);
        });
        keyboard.appendChild(rowDiv);
    });
}

function setupLengthSelection() {
    document.querySelectorAll(".length-button").forEach(button => {
        button.addEventListener("click", () => {
            gameState.selectedWordLength = parseInt(button.dataset.length);
            resetGame();
            showElement(document.getElementById("game-container"));
            hideElement(lengthSelection);
            calculateAndSetTileSize();
        });
    });
}

function showLengthSelection() {
    hideElement(document.getElementById("game-container"));
    showElement(lengthSelection);
}

function hideElement(element) {
    if (element) element.style.display = "none";
}

function showElement(element) {
    if (element) element.style.display = "flex";
}

function setElementText(element, text) {
    if (element) element.textContent = text;
}

function hideLoadingScreen() {
    document.getElementById("loading-screen").style.display = "none";
}

function playSound(sound) {
    if (gameState.soundEnabled && sound) sound.play();
}

function resetGame() {
    gameState.guesses = [];
    gameState.currentRow = 0;
    gameState.currentGuess = [];
    gameState.letterHints = {};
    selectWord();
    updateGrid();
    updateKeyboard();
    messageDisplay.textContent = "";
    document.querySelectorAll(".key").forEach(key => key.disabled = false);
    hideElement(gameOverButton);
    showElement(hintButton);
    showElement(newGameButton);
    document.getElementById("game-over-buttons").classList.remove("animate");
    saveGameState();
}

function getRandomWord(length) {
    if (!gameState.words[length]) { console.error(`No words of length ${length} found.`); return null; }
    return gameState.words[length][Math.floor(Math.random() * gameState.words[length].length)];
}

function createGrid() {
    grid.innerHTML = "";
    for (let i = 0; i < gameState.MAX_GUESSES; i++) {
        for (let j = 0; j < gameState.selectedWordLength; j++) {
            const tile = document.createElement("div");
            tile.className = "tile";
            tile.id = `tile-<span class="math-inline">\{i\}\-</span>{j}`;
            grid.style.gridTemplateColumns = `repeat(${gameState.selectedWordLength}, 1fr)`;
            grid.appendChild(tile);
        }
    }
}

function getBaseLetter(letter) {
    const letterMap = {
        "ቻ": "ቻ", "ቼ": "ቼ", "ች": "ች", "ቾ": "ቾ", "ቿ": "ቿ",
        "ነ": "ነ", "ኑ": "ኑ", "ኒ": "ኒ", "ና": "ና", "ኔ": "ኔ", "ን": "ን", "ኖ": "ኖ", "ኗ": "ኗ",
        "ኘ": "ኘ", "ኙ": "ኙ", "ኚ": "ኚ", "ኛ": "ኛ", "ኜ": "ኜ", "ኝ": "ኝ", "ኞ": "ኞ", "ኟ": "ኟ",
        "አ": "አ", "ኡ": "ኡ", "ኢ": "ኢ", "ኣ": "ኣ", "ኤ": "ኤ", "እ": "እ", "ኦ": "ኦ", "ኧ": "ኧ",
        "ከ": "ከ", "ኩ": "ኩ", "ኪ": "ኪ", "ካ": "ካ", "ኬ": "ኬ", "ክ": "ክ", "ኮ": "ኮ", "ኳ": "ኳ",
        "ወ": "ወ", "ዉ": "ዉ", "ዊ": "ዊ", "ዋ": "ዋ", "ዌ": "ዌ", "ው": "ው", "ዎ": "ዎ",
        "ዘ": "ዘ", "ዙ": "ዙ", "ዚ": "ዚ", "ዛ": "ዛ", "ዜ": "ዜ", "ዝ": "ዝ", "ዞ": "ዞ", "ዟ": "ዟ",
        "ዠ": "ዠ", "ዡ": "ዡ", "ዢ": "ዢ", "ዣ": "ዣ", "ዤ": "ዤ", "ዥ": "ዥ", "ዦ": "ዦ", "ዧ": "ዧ",
        "የ": "የ", "ዩ": "ዩ", "ዪ": "ዪ", "ያ": "ያ", "ዬ": "ዬ", "ይ": "ይ", "ዮ": "ዮ",
        "ደ": "ደ", "ዱ": "ዱ", "ዲ": "ዲ", "ዳ": "ዳ", "ዴ": "ዴ", "ድ": "ድ", "ዶ": "ዶ", "ዷ": "ዷ",
        "ጀ": "ጀ", "ጁ": "ጁ", "ጂ": "ጂ", "ጃ": "ጃ", "ጄ": "ጄ", "ጅ": "ጅ", "ጆ": "ጆ", "ጇ": "ጇ",
        "ገ": "ገ", "ጉ": "ጉ", "ጊ": "ጊ", "ጋ": "ጋ", "ጌ": "ጌ", "ግ": "ግ", "ጎ": "ጎ", "ጓ": "ጓ",
        "ጠ": "ጠ", "ጡ": "ጡ", "ጢ": "ጢ", "ጣ": "ጣ", "ጤ": "ጤ", "ጥ": "ጥ", "ጦ": "ጦ", "ጧ": "ጧ",
        "ጨ": "ጨ", "ጩ": "ጩ", "ጪ": "ጪ", "ጫ": "ጫ", "ጬ": "ጬ", "ጭ": "ጭ", "ጮ": "ጮ", "ጯ": "ጯ",
        "ፈ": "ፈ", "ፉ": "ፉ", "ፊ": "ፊ", "ፋ": "ፋ", "ፌ": "ፌ", "ፍ": "ፍ", "ፎ": "ፎ", "ፏ": "ፏ",
        "ፐ": "ፐ", "ፑ": "ፑ", "ፒ": "ፒ", "ፓ": "ፓ", "ፔ": "ፔ", "ፕ": "ፕ", "ፖ": "ፖ", "ፗ": "ፗ",
        "ኸ": "ኸ", "ኹ": "ኹ", "ኺ": "ኺ", "ኻ": "ኻ", "ኼ": "ኼ", "ኽ": "ኽ", "ኾ": "ኾ", "ዃ": "ዃ",
        // Redundant letters mapping to base letters - KEEP THESE for normalization
        "ሰ": "ሰ", "ሠ": "ሰ", "ጸ": "ፀ", "ፀ": "ፀ", "ዐ": "አ", "አ": "አ", "ኀ": "ሀ", "ሐ": "ሀ", "ሀ": "ሀ", "ጸ": "ፀ",
        "ፀ": "ፀ", "ጹ": "ፁ", "ጺ": "ፂ", "ፃ": "ፃ", "ጼ": "ፄ", "ጽ": "ፅ", "ጾ": "ፆ", "ሠ": "ሰ", "ሡ": "ሱ", "ሢ": "ሲ",
        "ሣ": "ሳ", "ሤ": "ሴ", "ሥ": "ስ", "ሦ": "ሶ", "ሧ": "ሷ", "ዐ": "አ", "ዑ": "ኡ", "ዒ": "ኢ", "ዓ": "ኣ", "ዔ": "ኤ",
        "ዕ": "እ", "ዖ": "ኦ", "ሐ": "ሀ", "ሑ": "ሁ", "ሒ": "ሂ", "ሓ": "ሃ", "ሔ": "ሄ", "ሕ": "ህ", "ሖ": "ሆ",
        "ሗ": "ዃ", "ቨ": "ቨ", "ቩ": "ቩ", "ቪ": "ቪ", "ቫ": "ቫ", "ቬ": "ቬ", "ቭ": "ቭ", "ቮ": "ቮ", "ቯ": "ቯ", "ጰ": "ጰ",
        "ጱ": "ጱ", "ጲ": "ጲ", "ጳ": "ጳ", "ጴ": "ጴ", "ጵ": "ጵ", "ጶ": "ጶ", "ጷ": "ጷ", "ኸ": "ኸ", "ኹ": "ኹ", "ኺ": "ኺ",
        "ኻ": "ኻ", "ኼ": "ኼ", "ኽ": "ኽ", "ኾ": "ኾ", "ዃ": "ዃ",
    };
    return letterMap[letter] || letter;
}

function addLetterToGuess(letter) {
    if (gameState.currentGuess.length < gameState.selectedWordLength) {
        gameState.currentGuess.push(letter);
        updateGrid();
    }
}

function updateGrid() {
    for (let i = 0; i < gameState.MAX_GUESSES; i++) {
        for (let j = 0; j < gameState.selectedWordLength; j++) {
            const tile = document.getElementById(`tile-<span class="math-inline">\{i\}\-</span>{j}`);
            if (!tile) continue;
            tile.textContent = (i < gameState.guesses.length) ? (gameState.guesses[i][j] || "") : (i === gameState.currentRow && j < gameState.currentGuess.length) ? gameState.currentGuess[j] : "";
            tile.className = "tile";
            if (i < gameState.guesses.length && gameState.guesses[i][j]) {
                tile.classList.add("filled");
                const letter = gameState.guesses[i][j];
                if (letter && gameState.letterHints[letter]) tile.classList.add(gameState.letterHints[letter]);
            } else if (i === gameState.currentRow && j < gameState.currentGuess.length) {
                tile.classList.add("filled");
            }
        }
    }
}

function handleKeyPress(key) {
    playSound(keyPressSound);
    if (key === "Backspace" || key === "ሰርዝ") {
        gameState.currentGuess.pop();
        updateGrid();
        resetKeyboard();
    } else if (key === "ENTER" || key === "Enter" || key === "ገምት") {
        if (gameState.currentGuess.length === gameState.selectedWordLength) {
            submitGuess();
        }
    } else {
        displayLetterFamily(key);
        const keyButton = document.querySelector(`.key[data-letter="${key}"]`);
        if (keyButton) {
            keyButton.classList.add("pressed");
            keyButton.addEventListener("animationend", () => {
                keyButton.classList.remove("pressed");
            }, { once: true });
        }
    }
}

function normalizeWord(word) {
    if (!word) return "";


    const replacements = {
        "ሰ": "ሰ", "ሠ": "ሰ", "ሱ": "ሱ", "ሡ": "ሱ", "ሲ": "ሲ", "ሢ": "ሲ", "ሳ": "ሳ", "ሣ": "ሳ", "ሴ": "ሴ", "ሤ": "ሴ", "ስ": "ስ", "ሥ": "ስ", "ሶ": "ሶ", "ሦ": "ሶ", "ሷ": "ሷ", "ሧ": "ሷ",
        "ጸ": "ጸ", "ፀ": "ጸ", "ጹ": "ፁ", "ፁ": "ፁ", "ጺ": "ፂ", "ፂ": "ፂ", "ጻ": "ፃ", "ፃ": "ፃ", "ጼ": "ፄ", "ፄ": "ፄ", "ጽ": "ፅ", "ፅ": "ፅ", "ጾ": "ፆ", "ፆ": "ፆ",
        "ዐ": "አ", "ዑ": "ኡ", "ዒ": "ኢ", "ዓ": "ኣ", "ዔ": "ኤ", "ዕ": "እ", "ዖ": "ኦ",
        "ሐ": "ሀ", "ሑ": "ሁ", "ሒ": "ሂ", "ሓ": "ሃ", "ሔ": "ሄ", "ሕ": "ህ", "ሖ": "ሆ",
        "ኀ": "ሀ",
        "ኁ": "ሁ",
        "ኂ": "ሂ",
        "ኃ": "ሃ",
        "ኄ": "ሄ",
        "ኅ": "ህ",
        "ኆ": "ሆ",
        "ኧ": "ኧ",
        "ቨ": "ቨ",
        "ቩ": "ቩ",
        "ቪ": "ቪ",
        "ቫ": "ቫ",
        "ቬ": "ቬ",
        "ቭ": "ቭ",
        "ቮ": "ቮ",
        "ቯ": "ቯ",
        "ጰ": "ጰ",
        "ጱ": "ጱ",
        "ጲ": "ጲ",
        "ጳ": "ጳ",
        "ጴ": "ጴ",
        "ጵ": "ጵ",
        "ጶ": "ጶ",
        "ጷ": "ጷ",
        "ኸ": "ኸ",
        "ኹ": "ኹ",
        "ኺ": "ኺ",
        "ኻ": "ኻ",
        "ኼ": "ኼ",
        "ኽ": "ኽ",
        "ኾ": "ኾ",
        "ዃ": "ዃ",
    };

let normalized = "";
    for (const char of word) {
        normalized += replacements[char] || char;
    }
    return normalized;
}

function submitGuess() {
    if (gameState.currentGuess.length !== gameState.selectedWordLength) return;

    const guessWord = normalizeWord(gameState.currentGuess.join(""));

    if (!gameState.words[gameState.selectedWordLength].includes(guessWord)) {
        Telegram.WebApp.showAlert("ያልታወቀ ቃል!");
        return;
    }

    gameState.guesses.push([...gameState.currentGuess]);

    animateTiles(); // Animate tiles before win/loss logic

    // ... rest of submitGuess() code is moved to animateTiles() animation end event listener
}

function animateTiles() {
    for (let i = 0; i < gameState.selectedWordLength; i++) {
        const tile = document.getElementById(`tile-${gameState.currentRow}-${i}`);
        if (tile) {
            tile.classList.add("flip");
            tile.addEventListener("animationend", () => {
                tile.classList.remove("flip");
                if (i === gameState.selectedWordLength -1) {
                    checkGuess();
                    gameState.currentRow++;

                    if (normalizeWord(gameState.guesses[gameState.currentRow -1].join("")) === gameState.targetWord) {
                        playSound(correctGuessSound);
                        const today = new Date().toLocaleDateString();
                        messageDisplay.textContent = "እንኳን ደስ አለዎት! በትክክለኛው ቃል ገምተዋል!";
                        localStorage.setItem(`${gameState.selectedWordLength}-letter-completed-${today}`, "true");
                        disableKeyboard();
                        showGameOverButtons();
                        updateGameStats(true);
                    } else if (gameState.currentRow === gameState.MAX_GUESSES) {
                        playSound(gameOverSound);
                        const today = new Date().toLocaleDateString();
                        messageDisplay.textContent = `ጨዋታው አልቋል። ትክክለኛው ቃል ${gameState.targetWord} ነበር።`;
                        localStorage.setItem(`${gameState.selectedWordLength}-letter-completed-${today}`, "true");
                        disableKeyboard();
                        showGameOverButtons();
                        updateGameStats(false);
                        document.getElementById("game-over-buttons").classList.add("animate");
                    } else {
                        gameState.currentGuess = [];
                        updateGrid();
                        updateKeyboard();
                    }
                    saveGameState();
                }
            }, { once: true });
        }
    }
}

function disableKeyboard() {
    document.querySelectorAll(".key").forEach(key => key.disabled = true);
}

function showGameOverButtons() {
    hideElement(hintButton); hideElement(newGameButton);
    showElement(gameOverButton); showElement(document.getElementById("game-over-buttons"));
}

function checkGuess() {
    const guess = gameState.guesses[gameState.currentRow] || "";
    const targetLetters = gameState.targetWord.split("");
    const guessLetters = [...guess];
    const feedback = Array(gameState.selectedWordLength).fill(null);

    for (let i = 0; i < gameState.selectedWordLength; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            feedback[i] = "correct";
            gameState.letterHints[guessLetters[i]] = "correct";
            targetLetters[i] = null;
            guessLetters[i] = null;
        }
    }

    for (let i = 0; i < gameState.selectedWordLength; i++) {
        if (feedback[i]) continue;
        if (!guessLetters[i]) continue;

        const guessBase = getBaseLetter(guessLetters[i]);
        const targetBase = targetLetters[i] ? getBaseLetter(targetLetters[i]) : null;

        if (guessBase && targetBase && guessBase === targetBase && guessLetters[i] !== targetLetters[i]) {
            feedback[i] = "blue";
            if (!gameState.letterHints[guessLetters[i]] || gameState.letterHints[guessLetters[i]] === "absent") {
                gameState.letterHints[guessLetters[i]] = "blue";
            }
            targetLetters[i] = null;
            guessLetters[i] = null;
        }
    }

    for (let i = 0; i < gameState.selectedWordLength; i++) {
        if (feedback[i]) continue;
        if (!guessLetters[i]) continue;

        const guessLetter = guessLetters[i];
        const targetIndex = targetLetters.findIndex(letter => letter === guessLetter);
        if (targetIndex !== -1) {
            feedback[i] = "present";
            if (!gameState.letterHints[guessLetter] || gameState.letterHints[guessLetter] === "absent") {
                gameState.letterHints[guessLetter] = "present";
            }
            targetLetters[targetIndex] = null;
            guessLetters[i] = null;
        }
    }

    for (let i = 0; i < gameState.selectedWordLength; i++) {
        if (feedback[i]) continue;
        if (!guessLetters[i]) continue;

        const guessBase = getBaseLetter(guessLetters[i]);
        if (!guessBase) continue;

        const targetIndex = targetLetters.findIndex(letter => letter && getBaseLetter(letter) === guessBase);
        if (targetIndex !== -1) {
            feedback[i] = "family";
            if (!gameState.letterHints[guessLetters[i]] || gameState.letterHints[guessLetters[i]] === "absent") {
                gameState.letterHints[guessLetters[i]] = "family";
            }
            targetLetters[targetIndex] = null;
            guessLetters[i] = null;
        }
    }

    for (let i = 0; i < gameState.selectedWordLength; i++) {
        if (!feedback[i]) {
            feedback[i] = "absent";
            gameState.letterHints[guess[i]] = "absent";
        }
    }

    for (let i = 0; i < gameState.selectedWordLength; i++) {
        const tile = document.getElementById(`tile-${gameState.currentRow}-${i}`);
        if (tile && feedback[i]) {
            tile.classList.add(feedback[i]);
        }
    }
    updateGrid();
    updateKeyboard();
}

async function loadHintFile() {
    if (gameState.hints === null && !gameState.hintFileLoaded) {
        gameState.hintFileLoaded = true;
        try {
            const hintsResponse = await fetch(config.hintFilePath);
            if (!hintsResponse.ok) throw new Error(`HTTP error: ${hintsResponse.status}`);
            gameState.hints = await hintsResponse.json();
        } catch (error) {
            console.error("Error loading hints file:", error);
            gameState.hints = {};
            setElementText(messageDisplay, "ፍንጭ መረጃን በመጫን ላይ ስህተት ተፈጥሯል።");
        }
    }
}

async function showHint() {
    if (!gameState.hintsEnabled) {
        Telegram.WebApp.showAlert("ፍንጮች ተሰናክለዋል።");
        return;
    }
    await loadHintFile();
    Telegram.WebApp.showAlert(gameState.targetWord && gameState.hints && gameState.hints[gameState.targetWord] ? gameState.hints[gameState.targetWord] : "ለዚህ ቃል ፍንጭ የለም።");
}

function updateKeyboard() {
    document.querySelectorAll(".key").forEach(keyButton => {
        const letter = keyButton.dataset.letter;
        if (letter && gameState.letterHints[letter]) {
            keyButton.classList.add(gameState.letterHints[letter]);
            if (gameState.letterHints[letter] === "absent") {
                keyButton.disabled = true;
            }
        }
    });
}

function shareResults() {
    let resultText = `ቃላት (${gameState.selectedWordLength} ፊደላት) - <span class="math-inline">\{gameState\.currentRow\}/</span>{gameState.MAX_GUESSES}\n`;
    for (let i = 0; i < gameState.currentRow; i++) {
        let rowText = "";
        for (let j = 0; j < gameState.selectedWordLength; j++) {
            const letter = gameState.guesses[i][j];
            const tile = document.getElementById(`tile-<span class="math-inline">\{i\}\-</span>{j}`);
            rowText += tile && tile.classList.contains("correct") ? "🟩" : tile && tile.classList.contains("present") ? "🟨" : tile && tile.classList.contains("family") ? "🟪" : tile && tile.classList.contains("blue") ? "🟦" : "⬛";
        }
        resultText += rowText + "\n";
    }
    try {
        if (Telegram.WebApp.isVersionAtLeast("6.9")) {
            Telegram.WebApp.showConfirm(resultText, (confirmed) => {
                if (confirmed) Telegram.WebApp.close();
            });
        } else {
            Telegram.WebApp.showAlert("Please update the telegram app");
        }
    } catch (e) {
        console.error("Error sharing:", e);
        alert(resultText);
    }
}

function setupRulesModal() {
    const modal = document.getElementById("rules-modal"),
        btn = document.getElementById("rules-button"),
        span = document.getElementsByClassName("close-button")[0];
    if (btn) btn.onclick = () => {
        if (modal) modal.style.display = "block";
    };
    if (span) span.onclick = () => {
        if (modal) modal.style.display = "none";
    };
    if (modal) window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
    };
}

function calculateAndSetTileSize() {
    const gridWidth = grid.offsetWidth;
    const tileSpacing = 3;

    const tileSize3 = (gridWidth - tileSpacing * 2) / 3;
    const tileSize4 = (gridWidth - tileSpacing * 3) / 4;
    const tileSize5 = (gridWidth - tileSpacing * 4) / 5;

    let tileSize = gameState.selectedWordLength === 3 ? tileSize3 :
        gameState.selectedWordLength === 4 ? tileSize4 :
        tileSize5;

    document.querySelectorAll(".tile").forEach(tile => {
        tile.style.width = `${tileSize}px`;
        tile.style.height = `${tileSize}px`;
    });
}

function saveGameState() {
    const gameStateToSave = {
        targetWord: gameState.targetWord,
        selectedWordLength: gameState.selectedWordLength,
        guesses: gameState.guesses,
        currentRow: gameState.currentRow,
        letterHints: gameState.letterHints,
        date: new Date().toLocaleDateString(),
        hintsEnabled: gameState.hintsEnabled,
        soundEnabled: gameState.soundEnabled,
        gameStats: gameState.gameStats,
    };
    localStorage.setItem("gameState", JSON.stringify(gameStateToSave));
}

function loadGameState() {
    const savedState = localStorage.getItem("gameState");
    if (savedState) {
        const gameStateFromStorage = JSON.parse(savedState);
        const today = new Date().toLocaleDateString();

        if (localStorage.getItem(`<span class="math-inline">\{gameStateFromStorage\.selectedWordLength\}\-letter\-completed\-</span>{today}`) === "true") {
            return false;
        }

        if (gameStateFromStorage.date === today && gameStateFromStorage.selectedWordLength) {
            gameState.targetWord = gameStateFromStorage.targetWord;
            gameState.selectedWordLength = gameStateFromStorage.selectedWordLength;
            gameState.guesses = gameStateFromStorage.guesses;
            gameState.currentRow = gameStateFromStorage.currentRow;
            gameState.letterHints = gameStateFromStorage.letterHints;
            gameState.hintsEnabled = gameStateFromStorage.hintsEnabled;
            gameState.soundEnabled = gameStateFromStorage.soundEnabled;
            gameState.gameStats = gameStateFromStorage.gameStats;
            return true;
        }
    }
    localStorage.removeItem("gameState");
    return false;
}

function setupSettingsModal() {
    const modal = document.getElementById("settings-modal");
    const btn = document.getElementById("settings-button");
    const span = document.getElementById("settings-close-button");
    const hintsToggle = document.getElementById("hints-toggle");
    const soundToggle = document.getElementById("sound-toggle");
    const clearDataButton = document.getElementById("clear-data-button");

    hintsToggle.checked = gameState.hintsEnabled;
    soundToggle.checked = gameState.soundEnabled;
    updateGameStatsDisplay();

    if (btn) btn.onclick = () => {
        if (modal) modal.style.display = "block";
    };
    if (span) span.onclick = () => {
        if (modal) modal.style.display = "none";
    };
    if (modal) window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
    };

    hintsToggle.addEventListener("change", () => {
        gameState.hintsEnabled = hintsToggle.checked;
        saveGameState();
    });

    soundToggle.addEventListener("change", () => {
        gameState.soundEnabled = soundToggle.checked;
        saveGameState();
    });

    clearDataButton.addEventListener("click", () => {
        if (confirm("የጨዋታ ውሂብዎን ማጽዳት ይፈልጋሉ?")) {
            clearGameData();
            modal.style.display = "none";
        }
    });
}

function updateGameStatsDisplay() {
    const gamesPlayed = document.getElementById("games-played");
    const gamesWon = document.getElementById("games-won");
    const winPercentage = document.getElementById("win-percentage");
    const currentStreak = document.getElementById("current-streak");

    gamesPlayed.textContent = gameState.gameStats.gamesPlayed;
    gamesWon.textContent = gameState.gameStats.gamesWon;
    winPercentage.textContent = gameState.gameStats.gamesPlayed > 0 ? `${Math.round((gameState.gameStats.gamesWon / gameState.gameStats.gamesPlayed) * 100)}%` : "0%";
    currentStreak.textContent = gameState.gameStats.currentStreak;
}

function clearGameData() {
    gameState.gameStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
    };
    localStorage.removeItem("gameState");
    saveGameState();
    updateGameStatsDisplay();
    resetGame();
}

function updateGameStats(won) {
    gameState.gameStats.gamesPlayed++;
    if (won) {
        gameState.gameStats.gamesWon++;
        gameState.gameStats.currentStreak++;
        gameState.gameStats.maxStreak = Math.max(gameState.gameStats..maxStreak, gameState.gameStats.currentStreak);
    } else {
        gameState.gameStats.currentStreak = 0;
    }
    updateGameStatsDisplay();
    saveGameState();
}

document.addEventListener("DOMContentLoaded", () => {
    initializeDOMReferences();

    loadWords().then(success => {
        if (success) {
            createAmharicKeyboard();
            setupLengthSelection();
            setupRulesModal();
            setupSettingsModal();
            hideLoadingScreen();

            if (loadGameState()) {
                hideElement(lengthSelection);
                showElement(document.getElementById("game-container"));
                calculateAndSetTileSize();
                updateGrid();
                updateKeyboard();
            } else {
                showLengthSelection();
            }

            if (newGameButton) newGameButton.addEventListener("click", resetGame);
            if (hintButton) hintButton.addEventListener("click", showHint);
            if (gameOverButton) gameOverButton.addEventListener("click", resetGame);
            const shareButton = document.getElementById("share-button");
            if (shareButton) shareButton.addEventListener("click", shareResults);

            calculateAndSetTileSize();
            window.addEventListener("resize", calculateAndSetTileSize);
            updateFontSizes(); // Call updateFontSizes on resize
        } else {
            hideLoadingScreen();
            setElementText(messageDisplay, "የቃላት ዝርዝርን በመጫን ላይ ስህተት ተፈጥሯል።");
        }
    }).catch(err => {
        console.error("Critical error:", err);
        hideLoadingScreen();
        setElementText(messageDisplay, "ጨዋታውን በመጀመር ላይ ስህተት ተፈጥሯል።");
    });
});
