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

// --- Configuration ---
const config = {
    wordListPaths: { 3: "ቃላት/clean_words3.txt", 4: "ቃላት/clean_words4.txt", 5: "ቃላት/clean_words5.txt" },
    hintFilePath: "ቃላት/cleaned.json",
    titlePath: "images/ቃላት.svg",
    adeyPath: "images/adey.png",
};

// --- Helper Functions ---
function showElement(element) { if (element) element.style.display = "block"; }
function hideElement(element) { if (element) element.style.display = "none"; }
function setElementText(element, text) { if (element) element.textContent = text; }

// --- Loading Screen Functions ---
function showLoadingScreen() { document.getElementById("loading-screen").style.display = "flex"; }
function hideLoadingScreen() { document.getElementById("loading-screen").style.display = "none"; }

// --- Sound Effects ---
const keyPressSound = new Audio("sounds/keypress.mp3");
const correctGuessSound = new Audio("sounds/correct.mp3");
const gameOverSound = new Audio("sounds/gameover.mp3");

function playSound(sound) {
    if (gameState.soundEnabled) {
        sound.currentTime = 0;
        sound.play();
    }
}

// --- Game Setup Functions ---
async function loadWords() {
    showLoadingScreen();
    try {
        const wordListPromises = Object.keys(config.wordListPaths).map(async (length) => {
            const response = await fetch(config.wordListPaths[length]);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            gameState.words[length] = (await response.text()).trim().split("\n").map(word => word.trim());
        });
        await Promise.all(wordListPromises);
        gameState.isLoading = false;
    } catch (error) {
        console.error("Error loading resources:", error);
        setElementText(messageDisplay, "የቃላት ዝርዝርን በመጫን ላይ ስህተት ተፈጥሯል።");
        gameState.isLoading = false;
        hideLoadingScreen();
        return false;
    }
    return true;
}

function startNewGame() {
    if (!gameState.selectedWordLength) {
        setElementText(messageDisplay, "እባክዎ የቃል ርዝመት ይምረጡ");
        showLengthSelection();
        return;
    }
    if (!gameState.words[gameState.selectedWordLength] || gameState.words[gameState.selectedWordLength].length === 0) {
        console.error(`No words of length ${gameState.selectedWordLength} found.`);
        setElementText(messageDisplay, `${gameState.selectedWordLength} ፊደል ያላቸው ቃላት የሉም።`);
        showLengthSelection();
        return;
    }

    if (!loadGameState()) {
        gameState.targetWord = getRandomWord(gameState.selectedWordLength);
        gameState.targetWord = normalizeWord(gameState.targetWord);
        if (!gameState.targetWord) {
            setElementText(messageDisplay, "ቃል በመምረጥ ላይ ስህተት ተፈጥሯል።");
            showLengthSelection();
            return;
        }
        gameState.currentGuess = [];
        gameState.guessCount = 0;
        gameState.guesses = [];
        gameState.letterHints = {};
        gameState.currentRow = 0;
    }

    clearGrid();
    createGrid();
    resetKeyboard();
    hideElement(lengthSelection);
    showElement(keyboard);
    showElement(hintButton);
    showElement(document.getElementById("game-container"));
    hideElement(gameOverButton);
    setElementText(messageDisplay, "");
    showElement(titleElement);
    hideElement(createdByElement);
    calculateAndSetTileSize();
    updateGrid();
    updateKeyboard();
    saveGameState();
}

function resetGame() {
    gameState.selectedWordLength = null;
    gameState.targetWord = "";
    gameState.currentGuess = [];
    gameState.guessCount = 0;
    gameState.guesses = [];
    gameState.letterHints = {};
    gameState.currentRow = 0;
    gameState.hintFileLoaded = false;

    clearGrid();
    resetKeyboard();
    setElementText(messageDisplay, "");
    hideElement(keyboard);
    hideElement(hintButton);
    hideElement(document.getElementById("game-container"));
    hideElement(gameOverButton);
    showLengthSelection();
    localStorage.removeItem("gameState");
}

function getRandomWord(length) {
    if (!gameState.words[length]) { console.error(`No words of length ${length} found.`); return null; }
    return gameState.words[length][Math.floor(Math.random() * gameState.words[length].length)];
}

function createGrid() {
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${gameState.selectedWordLength}, 1fr)`;
    for (let i = 0; i < gameState.MAX_GUESSES; i++) {
        for (let j = 0; j < gameState.selectedWordLength; j++) {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            tile.id = `tile-<span class="math-inline">\{i\}\-</span>{j}`;
            grid.appendChild(tile);
        }
    }
}

function clearGrid() { grid.innerHTML = ""; }

function setupLengthSelection() {
    lengthSelection.addEventListener("click", (event) => {
        if (event.target.classList.contains("length-button")) {
            gameState.selectedWordLength = parseInt(event.target.dataset.length);
            const today = new Date().toLocaleDateString();

            if (localStorage.getItem(`<span class="math-inline">\{gameState\.selectedWordLength\}\-letter\-completed\-</span>{today}`) === "true") {
                messageDisplay.textContent = `የ ${gameState.selectedWordLength} ፊደል ቃላት ጨዋታ ዛሬ ተጫውተው ጨርሰዋል።`;
                return;
            }

            if (!gameState.words[gameState.selectedWordLength] || gameState.words[gameState.selectedWordLength].length === 0) {
                console.error(`No words of length ${gameState.selectedWordLength} found.`);
                setElementText(messageDisplay, "የቃላት ዝርዝር አልተጫነም ወይም ባዶ ነው።");
                return;
            }
            startNewGame();
        }
    });
}

function showLengthSelection() {
    const today = new Date().toLocaleDateString();
    hideElement(keyboard);
    hideElement(document.getElementById("game-container"));
    showElement(lengthSelection);
}


// --- Amharic Keyboard ---
const keys = [
    ["ሀ", "ለ", "መ", "ሰ", "ረ", "ሸ", "ቀ", "በ"],
    ["ተ", "ቸ", "ነ", "ኘ", "አ", "ከ", "ኸ", "ወ"],
    ["ዘ", "ዠ", "የ", "ደ", "ጀ", "ገ", "ጠ", "ፀ", "ጰ"],
    ["ሰርዝ", "ጨ", "ፈ", "ቨ", "ፐ", "ገምት"]
];


function createAmharicKeyboard() {
    keyboard.innerHTML = "";
    keys.forEach(rowKeys => {
        const rowDiv = document.createElement("div");
        rowDiv.classList.add("keyboard-row");
        rowKeys.forEach(keyChar => {
            if (keyChar !== "ሰርዝ" && keyChar !== "ገምት") {
                const keyButton = document.createElement("button");
                keyButton.textContent = keyChar;
                keyButton.classList.add("key");
                keyButton.dataset.letter = keyChar;
                keyButton.dataset.key = keyChar;
                keyButton.addEventListener("click", () => {
                    if (!keyButton.disabled) {
                        handleKeyPress(keyChar);
                        keyButton.classList.add("active");
                        setTimeout(() => keyButton.classList.remove("active"), 100);
                    }
                });
                rowDiv.appendChild(keyButton);
            }
        });
        keyboard.appendChild(rowDiv);
    });

    const lastRow = document.createElement("div");
    lastRow.classList.add("keyboard-row");

    const combinedButton = document.createElement("div");
    combinedButton.classList.add("combined-button");

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "ሰርዝ";
    deleteButton.dataset.key = "Backspace";
    deleteButton.addEventListener("click", () => {
        handleKeyPress("Backspace");
        deleteButton.classList.add("active");
        setTimeout(() => deleteButton.classList.remove("active"), 100);
    });
    combinedButton.appendChild(deleteButton);

    const guessButton = document.createElement("button");
    guessButton.textContent = "ገምት";
    guessButton.dataset.key = "Enter";
    guessButton.addEventListener("click", () => {
        handleKeyPress(ENTER_KEY);
        guessButton.classList.add("active");
        setTimeout(() => guessButton.classList.remove("active"), 100);
    });
    combinedButton.appendChild(guessButton);

    lastRow.appendChild(combinedButton);
    keyboard.appendChild(lastRow);
}

function displayLetterFamily(letter) {
    suggestionArea.innerHTML = "";
    const family = getLetterFamily(letter);

    if (family) {
        family.forEach(char => {
            const suggestionButton = document.createElement("button");
            suggestionButton.textContent = char;
            suggestionButton.classList.add("key");
            suggestionButton.dataset.letter = char;
            suggestionButton.addEventListener("click", () => {
                addLetterToGuess(char);
                suggestionButton.classList.add("active");
                setTimeout(() => suggestionButton.classList.remove("active"), 100);
            });
            suggestionArea.appendChild(suggestionButton);
        });
    }
}

function resetKeyboard() {
    keyboard.querySelectorAll(".key").forEach(button => {
        button.classList.remove("correct", "present", "absent", "family", "blue", "active");
        button.disabled = false;
    });
}

function getLetterFamily(letter) {
    const families = [
        ["ሀ", "ሁ", "ሂ", "ሃ", "ሄ", "ህ", "ሆ"],
        ["ለ", "ሉ", "ሊ", "ላ", "ሌ", "ል", "ሎ", "ሏ"],
        ["መ", "ሙ", "ሚ", "ማ", "ሜ", "ም", "ሞ", "ሟ"],
        ["ረ", "ሩ", "ሪ", "ራ", "ሬ", "ር", "ሮ", "ሯ"],
        ["ሰ", "ሱ", "ሲ", "ሳ", "ሴ", "ስ", "ሶ", "ሷ"],
        ["ሸ", "ሹ", "ሺ", "ሻ", "ሼ", "ሽ", "ሾ", "ሿ"],
        ["ቀ", "ቁ", "ቂ", "ቃ", "ቄ", "ቅ", "ቆ", "ቋ"],
        ["በ", "ቡ", "ቢ", "ባ", "ቤ", "ብ", "ቦ", "ቧ"],
        ["ተ", "ቱ", "ቲ", "ታ", "ቴ", "ት", "ቶ", "ቷ"],
        ["ቸ", "ቹ", "ቺ", "ቻ", "ቼ", "ች", "ቾ", "ቿ"],
        ["ነ", "ኑ", "ኒ", "ና", "ኔ", "ን", "ኖ", "ኗ"],
        ["ኘ", "ኙ", "ኚ", "ኛ", "ኜ", "ኝ", "ኞ", "ኟ"],
        ["አ", "ኡ", "ኢ", "ኣ", "ኤ", "እ", "ኦ", "ኧ"],
        ["ከ", "ኩ", "ኪ", "ካ", "ኬ", "ክ", "ኮ", "ኳ"],
        ["ወ", "ዉ", "ዊ", "ዋ", "ዌ", "ው", "ዎ"],
        ["ዘ", "ዙ", "ዚ", "ዛ", "ዜ", "ዝ", "ዞ", "ዟ"],
        ["ዠ", "ዡ", "ዢ", "ዣ", "ዤ", "ዥ", "ዦ", "ዧ"],
        ["የ", "ዩ", "ዪ", "ያ", "ዬ", "ይ", "ዮ"],
        ["ደ", "ዱ", "ዲ", "ዳ", "ዴ", "ድ", "ዶ", "ዷ"],
        ["ጀ", "ጁ", "ጂ", "ጃ", "ጄ", "ጅ", "ጆ", "ጇ"],
        ["ገ", "ጉ", "ጊ", "ጋ", "ጌ", "ግ", "ጎ", "ጓ"],
        ["ጠ", "ጡ", "ጢ", "ጣ", "ጤ", "ጥ", "ጦ", "ጧ"],
        ["ጨ", "ጩ", "ጪ", "ጫ", "ጬ", "ጭ", "ጮ", "ጯ"],
        ["ፈ", "ፉ", "ፊ", "ፋ", "ፌ", "ፌ", "ፍ", "ፎ", "ፏ"],
        ["ፐ", "ፑ", "ፒ", "ፓ", "ፔ", "ፕ", "ፖ", "ፗ"],
        ["ኸ", "ኹ", "ኺ", "ኻ", "ኼ", "ኽ", "ኾ", "ዃ"],
        ["ጰ", "ጱ", "ጲ", "ጳ", "ጴ", "ጵ", "ጶ", "ጷ"],
        ["ፀ", "ፁ", "ፂ", "ፃ", "ፄ", "ፅ", "ፆ"],
        ["ቨ", "ቩ", "ቪ", "ቫ", "ቬ", "ቭ", "ቮ", "ቯ"]
    ];

    for (const family of families) {
        if (family.includes(letter)) return family;
    }
    return null;
}

function getBaseLetter(letter) {
    const letterMap = {
        "ሀ": "ሀ", "ሁ": "ሁ", "ሂ": "ሂ", "ሃ": "ሃ", "ሄ": "ሄ", "ህ": "ህ", "ሆ": "ሆ",
        "ለ": "ለ", "ሉ": "ሉ", "ሊ": "ሊ", "ላ": "ላ", "ሌ": "ሌ", "ል": "ል", "ሎ": "ሎ", "ሏ": "ሏ",
        "መ": "መ", "ሙ": "ሙ", "ሚ": "ሚ", "ማ": "ማ", "ሜ": "ሜ", "ም": "ም", "ሞ": "ሞ", "ሟ": "ሟ",
        "ረ": "ረ", "ሩ": "ሩ", "ሪ": "ሪ", "ራ": "ራ", "ሬ": "ሬ", "ር": "ር", "ሮ": "ሮ", "ሯ": "ሯ",
        "ሰ": "ሰ", "ሱ": "ሱ", "ሲ": "ሲ", "ሳ": "ሳ", "ሴ": "ሴ", "ስ": "ስ", "ሶ": "ሶ", "ሷ": "ሷ",
        "ሸ": "ሸ", "ሹ": "ሹ", "ሺ": "ሺ", "ሻ": "ሻ", "ሼ": "ሼ", "ሽ": "ሽ", "ሾ": "ሾ", "ሿ": "ሿ",
        "ቀ": "ቀ", "ቁ": "ቁ", "ቂ": "ቂ", "ቃ": "ቃ", "ቄ": "ቄ", "ቅ": "ቅ", "ቆ": "ቆ", "ቋ": "ቋ",
        "በ": "በ", "ቡ": "ቡ", "ቢ": "ቢ", "ባ": "ባ", "ቤ": "ቤ", "ብ": "ብ", "ቦ": "ቦ", "ቧ": "ቧ",
        "ተ": "ተ", "ቱ": "ቱ", "ቲ": "ቲ", "ታ": "ታ", "ቴ": "ቴ", "ት": "ት", "ቶ": "ቶ", "ቷ": "ቷ",
        "ቸ": "ቸ", "ቹ": "ቹ", "ቺ": "ቺ", "ቻ": "ቻ", "ቼ": "ቼ", "ች": "ች", "ቾ": "ቾ", "ቿ": "ቿ",
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
        "ሰ": "ሰ",
        "ሠ": "ሰ",
        "ጸ": "ፀ",
        "ፀ": "ፀ",
        "ዐ": "አ",
        "አ": "አ",
        "ኀ": "ሀ",
        "ሐ": "ሀ",
        "ሀ": "ሀ",
        "ጸ": "ፀ",
        "ፀ": "ፀ",
        "ጹ": "ፁ",
        "ጺ": "ፂ",
        "ፃ": "ፃ",
        "ጼ": "ፄ",
        "ጽ": "ፅ",
        "ጾ": "ፆ",
        "ሠ": "ሰ",
        "ሡ": "ሱ",
        "ሢ": "ሲ",
        "ሣ": "ሳ",
        "ሤ": "ሴ",
        "ሥ": "ስ",
        "ሦ": "ሶ",
        "ሧ": "ሷ",
        "ዐ": "አ",
        "ዑ": "ኡ",
        "ዒ": "ኢ",
        "ዓ": "ኣ",
        "ዔ": "ኤ",
        "ዕ": "እ",
        "ዖ": "ኦ",
        "ሐ": "ሀ",
        "ሑ": "ሁ",
        "ሒ": "ሂ",
        "ሓ": "ሃ",
        "ሔ": "ሄ",
        "ሕ": "ህ",
        "ሖ": "ሆ",
        "ሗ": "ዃ",
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

    if (guessWord === gameState.targetWord || gameState.currentRow === gameState.MAX_GUESSES) {
        animateTiles(); // Animate tiles before win/loss logic
    } else {
        checkGuess();
        gameState.currentRow++;
        gameState.currentGuess = [];
        updateGrid();
        updateKeyboard();
    }
        return;
    }

    gameState.guesses.push([...gameState.currentGuess]);
    checkGuess();
    gameState.currentRow++;

    if (guessWord === gameState.targetWord) {
        playSound(correctGuessSound);
        const today = new Date().toLocaleDateString();
        messageDisplay.textContent = "እንኳን ደስ አለዎት! በትክክለኛው ቃል ገምተዋል!";
        localStorage.setItem(`<span class="math-inline">\{gameState\.selectedWordLength\}\-letter\-completed\-</span>{today}`, "true");
        disableKeyboard();
        showGameOverButtons();
        updateGameStats(true);
    } else if (gameState.currentRow === gameState.MAX_GUESSES) {
        playSound(gameOverSound);
        const today = new Date().toLocaleDateString();
        messageDisplay.textContent = `ጨዋታው አልቋል። ትክክለኛው ቃል ${gameState.targetWord} ነበር።`;
        localStorage.setItem(`<span class="math-inline">\{gameState\.selectedWordLength\}\-letter\-completed\-</span>{today}`, "true");
        disableKeyboard();
        showGameOverButtons();
        updateGameStats(false);
    } else {
        gameState.currentGuess = [];
        updateGrid();
        updateKeyboard();
    }
    saveGameState();
}

function disableKeyboard() {
    document.querySelectorAll(".key").forEach(key => key.disabled = true);
}

function showGameOverButtons() {
    hideElement(hintButton); hideElement(newGameButton);
    showElement(gameOverButton); showElement(document.getElementById("game-over-buttons"));
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
                    if(gameState.currentRow === gameState.MAX_GUESSES) {
                        document.getElementById("game-over-buttons").classList.add("animate");
                    }
                }
            }, { once: true });
        }
    }
}

function handleKeyPress(key) {
    playSound(keyPressSound);
    if (key === "Backspace" || key === "ሰርዝ") {
        // ... existing code ...
    } else if (key === "ENTER" || key === "Enter" || key === "ገምት") {
        // ... existing code ...
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

function showGameOverButtons() {
    hideElement(hintButton);
    hideElement(newGameButton);
    showElement(gameOverButton);
    showElement(document.getElementById("game-over-buttons"));
    if (gameState.currentRow === gameState.MAX_GUESSES) {
        document.getElementById("game-over-buttons").classList.add("animate");
    }
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
        const tile = document.getElementById(`tile-<span class="math-inline">\{gameState\.currentRow\}\-</span>{i}`);
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

function shareResults() { let resultText = `ቃላት (${gameState.selectedWordLength} ፊደላት) - ${gameState.currentRow}/${gameState.MAX_GUESSES}\n`;
    for (let i = 0; i < gameState.currentRow; i++) {
        let rowText = "";
        for (let j = 0; j < gameState.selectedWordLength; j++) {
            const letter = gameState.guesses[i][j];
            const tile = document.getElementById(`tile-${i}-${j}`);
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

        if (localStorage.getItem(`${gameStateFromStorage.selectedWordLength}-letter-completed-${today}`) === "true") {
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
        gameState.gameStats.maxStreak = Math.max(gameState.gameStats.maxStreak, gameState.gameStats.currentStreak);
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
