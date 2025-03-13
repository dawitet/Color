 // --- Constants and Variables ---

const WORD_LENGTHS = [3, 4, 5];
let selectedWordLength = null;
let targetWord = "";
let currentGuess = [];
let guessCount = 0;
const MAX_GUESSES = 6;
let words = {};
let hints = null; // Hints are initially null, loaded on demand
let guesses = [];
let letterHints = {};
let currentRow = 0;
const ENTER_KEY = "Enter";
let hintFileLoaded = false; // Track hint file loading state

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

// --- Game Setup Functions ---

async function loadWords() {
    showLoadingScreen();
    try {
        const wordListPromises = WORD_LENGTHS.map(async (length) => {
            const response = await fetch(config.wordListPaths[length]);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            words[length] = (await response.text()).trim().split("\n").map(word => word.trim());
        });
        await Promise.all(wordListPromises); // Only load word lists initially
    } catch (error) {
        console.error("Error loading resources:", error);
        setElementText(messageDisplay, "የቃላት ዝርዝርን በመጫን ላይ ስህተት ተፈጥሯል።");
        hideLoadingScreen();
        return false;
    }
    return true;
}

function startNewGame() {
    if (!selectedWordLength) {
        setElementText(messageDisplay, "እባክዎ የቃል ርዝመት ይምረጡ");
        showLengthSelection();
        return;
    }
    if (!words[selectedWordLength] || words[selectedWordLength].length === 0) {
        console.error(`No words of length ${selectedWordLength} found.`);
        setElementText(messageDisplay, `${selectedWordLength} ፊደል ያላቸው ቃላት የሉም።`);
        showLengthSelection();
        return;
    }

    // Load or initialize game state
    if (!loadGameState()) { // Try to load, and if it fails, *then* initialize
        targetWord = getRandomWord(selectedWordLength);
        // Normalize the target word *immediately* after getting it.
        targetWord = normalizeWord(targetWord); // *** IMPORTANT ***

        if (!targetWord) {
            setElementText(messageDisplay, "ቃል በመምረጥ ላይ ስህተት ተፈጥሯል።");
            showLengthSelection();
            return;
        }
        currentGuess = [];
        guessCount = 0;
        guesses = [];       // Reset guesses on new game
        letterHints = {};
        currentRow = 0;
    }


    clearGrid();
    createGrid(); // Create grid structure first
    resetKeyboard();
    hideElement(lengthSelection);
    showElement(keyboard);
    showElement(hintButton);
    showElement(document.getElementById("game-container"));
    hideElement(gameOverButton);
    setElementText(messageDisplay, "");
    showElement(titleElement);
    hideElement(createdByElement);
    calculateAndSetTileSize(); // Calculate tile size after layout is rendered
    updateGrid();       // Update grid AFTER loading game state
    updateKeyboard();   // Update keyboard AFTER loading
    saveGameState();  // Save after loading or initializing
}

// Reset (clear) the game state.  Called when returning to the main menu.
function resetGame() {
    selectedWordLength = null;
    targetWord = "";  // Clear target word
    currentGuess = [];
    guessCount = 0;
    guesses = [];     // Clear guesses
    letterHints = {};
    currentRow = 0;
    hintFileLoaded = false; // Reset hint file loading state

    clearGrid();
    resetKeyboard();
    setElementText(messageDisplay, "");
    hideElement(keyboard);
    hideElement(hintButton);
    hideElement(document.getElementById("game-container"));
    hideElement(gameOverButton);
    showLengthSelection();
    localStorage.removeItem("gameState");  // Clear on reset
}
//Gets random word
function getRandomWord(length) {
    if (!words[length]) { console.error(`No words of length ${length} found.`); return null; }
    return words[length][Math.floor(Math.random() * words[length].length)];
}

function createGrid() {
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${selectedWordLength}, 1fr)`;
    for (let i = 0; i < MAX_GUESSES; i++) {
        for (let j = 0; j < selectedWordLength; j++) {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            tile.id = `tile-${i}-${j}`;
            grid.appendChild(tile);
        }
    }
}

function clearGrid() { grid.innerHTML = ""; }

function setupLengthSelection() {
    lengthSelection.addEventListener("click", (event) => {
        if (event.target.classList.contains("length-button")) {
            selectedWordLength = parseInt(event.target.dataset.length);
            const today = new Date().toLocaleDateString();

            // Check if the game has been *completed* today, not just played.
            if (localStorage.getItem(`${selectedWordLength}-letter-completed-${today}`) === "true") {
                messageDisplay.textContent = `የ ${selectedWordLength} ፊደል ቃላት ጨዋታ ዛሬ ተጫውተው ጨርሰዋል።`;
                 return; // Prevent starting
            }


            if (!words[selectedWordLength] || words[selectedWordLength].length === 0) {
                console.error(`No words of length ${selectedWordLength} found.`);
                setElementText(messageDisplay, "የቃላት ዝርዝር አልተጫነም ወይም ባዶ ነው።");
                return;
            }
            startNewGame(); // Always attempt to start
        }
    });
}

function showLengthSelection() {
    const today = new Date().toLocaleDateString();
    hideElement(keyboard); // Hide keyboard when showing length selection
    hideElement(document.getElementById("game-container"));
    showElement(lengthSelection);
}

// --- Amharic Keyboard ---
const keys = [
    ["ሀ", "ለ", "መ", "ሰ", "ረ", "ሸ", "ቀ", "በ"],
    ["ተ", "ቸ", "ነ", "ኘ", "አ", "ከ", "ኸ", "ወ"], // Added "ኸ" here
    ["ዘ", "ዠ", "የ", "ደ", "ጀ", "ገ", "ጠ", "ፀ", "ጰ"],
    ["ሰርዝ", "ጨ", "ፈ", "ቨ", "ፐ", "ገምት"] //"ቨ",
];


function createAmharicKeyboard() {
    keyboard.innerHTML = ""; // Clear existing keyboard

    // Create character rows
    keys.forEach(rowKeys => {
        const rowDiv = document.createElement("div");
        rowDiv.classList.add("keyboard-row");
        rowKeys.forEach(keyChar => {
          if (keyChar !== "ሰርዝ" && keyChar !== "ገምት"){ // Regular letter keys
            const keyButton = document.createElement("button");
            keyButton.textContent = keyChar;
            keyButton.classList.add("key");
            keyButton.dataset.letter = keyChar;  // Keep for letter input
            keyButton.dataset.key = keyChar; // Add data-key.  Good practice!
            keyButton.addEventListener("click", () => {
              if (!keyButton.disabled) { // Important check
                handleKeyPress(keyChar);
                  keyButton.classList.add("active"); // Add active class on press
                setTimeout(() => keyButton.classList.remove("active"), 100); // Remove after short delay
              }
            });
            rowDiv.appendChild(keyButton);
          }
        });
        keyboard.appendChild(rowDiv);
    });

    // Add Delete and Guess Buttons in the LAST row
      const lastRow = document.createElement("div");
    lastRow.classList.add("keyboard-row");

    // Combined Delete and Guess Button
    const combinedButton = document.createElement("div");
    combinedButton.classList.add("combined-button");

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "ሰርዝ";
    deleteButton.dataset.key = "Backspace";
    deleteButton.addEventListener("click", () => {
        handleKeyPress("Backspace");
        deleteButton.classList.add("active"); // Add active class on press
        setTimeout(() => deleteButton.classList.remove("active"), 100); // Remove after short delay
    });
    combinedButton.appendChild(deleteButton);

    const guessButton = document.createElement("button");
    guessButton.textContent = "ገምት";
    guessButton.dataset.key = "Enter";
    guessButton.addEventListener("click", () => {
        handleKeyPress(ENTER_KEY);
        guessButton.classList.add("active"); // Add active class on press
        setTimeout(() => guessButton.classList.remove("active"), 100); // Remove after short delay
    });
    combinedButton.appendChild(guessButton);

    lastRow.appendChild(combinedButton);
    keyboard.appendChild(lastRow);
}

// --- Keyboard and Suggestion Handling ---

function displayLetterFamily(letter) {
    suggestionArea.innerHTML = ""; // Clear previous suggestions
    const family = getLetterFamily(letter);

    if (family) { // Check if family exists
        family.forEach(char => {
            const suggestionButton = document.createElement("button");
            suggestionButton.textContent = char;
            suggestionButton.classList.add("key"); // Use existing key styles
            suggestionButton.dataset.letter = char; // Store the character
            suggestionButton.addEventListener("click", () => {
                addLetterToGuess(char);
                suggestionButton.classList.add("active"); // Add active class on press
                setTimeout(() => suggestionButton.classList.remove("active"), 100); // Remove after short delay
                // Don't clear suggestion area here
            });
            suggestionArea.appendChild(suggestionButton);
        });
    } else {
        // IMPORTANT: If no family is found (e.g., for special keys),
        // we should NOT clear the suggestion area.  It should remain empty.
        // So, we do NOTHING here.  The placeholder will show.
    }
}

function resetKeyboard() {
    keyboard.querySelectorAll(".key").forEach(button => {
        button.classList.remove("correct", "present", "absent", "family", "blue", "active"); // Added "active"
        button.disabled = false;
    });
}
//Gets letter family
function getLetterFamily(letter) {
//The families of the letters to be displayed on the suggestion area
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
      ["ፈ", "ፉ", "ፊ", "ፋ", "ፌ", "ፍ", "ፎ", "ፏ"],
      ["ፐ", "ፑ", "ፒ", "ፓ", "ፔ", "ፕ", "ፖ", "ፗ"],
      ["ኸ", "ኹ", "ኺ", "ኻ", "ኼ", "ኽ", "ኾ", "ዃ" ], // Added "ኸ" family
      ["ጰ", "ጱ", "ጲ", "ጳ", "ጴ", "ጵ", "ጶ", "ጷ"],
      ["ፀ", "ፁ", "ፂ", "ፃ", "ፄ", "ፅ", "ፆ"],
      ["ቨ", "ቩ", "ቪ", "ቫ", "ቬ", "ቭ", "ቮ", "ቯ" ]
    ];

    for (const family of families) {
        if (family.includes(letter)) return family;
    }
    return null; // Return null if not found
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
        "ኸ": "ኸ", "ኹ": "ኹ", "ኺ": "ኺ", "ኻ": "ኻ", "ኼ": "ኼ", "ኽ": "ኽ", "ኾ": "ኾ", "ዃ": "ዃ", // Added "ኸ" family
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


    };
    return letterMap[letter] || letter;
}

// Add Letter to Guess - No Changes Needed
function addLetterToGuess(letter) {
    if (currentGuess.length < selectedWordLength) {
        currentGuess.push(letter);
        updateGrid();
    }
}
//Update the Grid
function updateGrid() {
    for (let i = 0; i < MAX_GUESSES; i++) {
        for (let j = 0; j < selectedWordLength; j++) {
            const tile = document.getElementById(`tile-${i}-${j}`);
            if (!tile) continue;
            tile.textContent = (i < guesses.length) ? (guesses[i][j] || "") : (i === currentRow && j < currentGuess.length) ? currentGuess[j] : "";
            tile.className = "tile"; // Reset classes
            if (i < guesses.length && guesses[i][j]) {
                tile.classList.add("filled");
                const letter = guesses[i][j];
                if (letter && letterHints[letter]) tile.classList.add(letterHints[letter]);
            } else if (i === currentRow && j < currentGuess.length) {
                tile.classList.add("filled");
            }
        }
    }
}

// Handle Key Press - Modified for "ሰርዝ" and "ገምት"
function handleKeyPress(key) {
    if (key === "Backspace" || key === "ሰርዝ") {
        currentGuess.pop();
        updateGrid();
        // suggestionArea.innerHTML = ""; // Don't clear suggestions
        resetKeyboard();
    } else if (key === "ENTER" || key === "Enter" || key === "ገምት") {
        if (currentGuess.length === selectedWordLength) {
            submitGuess();
        }
    } else {
        // It's a regular letter key
        displayLetterFamily(key); // Always display family
    }
}
// Normalize the word *before* comparing - Keep normalization for word list consistency
function normalizeWord(word) {
    if (!word) return ""; // Handle null/undefined

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
        "ኧ": "ኧ", // Make sure this is included!
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
    if (currentGuess.length !== selectedWordLength) return;

    // Normalize the guess *before* checking if it's a valid word
    const guessWord = normalizeWord(currentGuess.join(""));

    if (!words[selectedWordLength].includes(guessWord)) {
        Telegram.WebApp.showAlert("ያልታወቀ ቃል!");
        return;
    }

    guesses.push([...currentGuess]); // Use original word
    checkGuess();
    currentRow++;

    if (guessWord === targetWord) {
      const today = new Date().toLocaleDateString();
      messageDisplay.textContent = "እንኳን ደስ አለዎት! በትክክለኛው ቃል ገምተዋል!";
      localStorage.setItem(`${selectedWordLength}-letter-completed-${today}`, "true"); // Mark as *completed*
      disableKeyboard();
      showGameOverButtons();
    } else if (currentRow === MAX_GUESSES) {
      const today = new Date().toLocaleDateString();
      messageDisplay.textContent = `ጨዋታው አልቋል። ትክክለኛው ቃል ${targetWord} ነበር።`;
      localStorage.setItem(`${selectedWordLength}-letter-completed-${today}`, "true"); // Mark as *completed*
      disableKeyboard();
      showGameOverButtons();
    } else {
        currentGuess = [];
        updateGrid();
        updateKeyboard();
        // suggestionArea.innerHTML = "🌼"; // No, keep suggestions until next input
    }
    saveGameState();
}

function disableKeyboard() { document.querySelectorAll(".key").forEach(key => key.disabled = true); }

function showGameOverButtons() {
    hideElement(hintButton); hideElement(newGameButton);
    showElement(gameOverButton); showElement(document.getElementById("game-over-buttons"));
}
// The letter checking logic - REVISED for detailed color rules
function checkGuess() {
    const guess = guesses[currentRow] || "";
    const targetLetters = targetWord.split("");
    const guessLetters = [...guess];
    const feedback = Array(selectedWordLength).fill(null);

    // 1. Green (Correct - Exact Match)
    for (let i = 0; i < selectedWordLength; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            feedback[i] = "correct";
            letterHints[guessLetters[i]] = "correct";
            targetLetters[i] = null;
            guessLetters[i] = null;
        }
    }

    // 2. Blue (Family Letter, Correct Position)
    for (let i = 0; i < selectedWordLength; i++) {
        if (feedback[i]) continue;
        if (!guessLetters[i]) continue;

        const guessBase = getBaseLetter(guessLetters[i]);
        const targetBase = targetLetters[i] ? getBaseLetter(targetLetters[i]) : null;

        if (guessBase && targetBase && guessBase === targetBase && guessLetters[i] !== targetLetters[i]) {
            feedback[i] = "blue";
            if (!letterHints[guessLetters[i]] || letterHints[guessLetters[i]] === "absent") {
                letterHints[guessLetters[i]] = "blue";
            }
            targetLetters[i] = null;
            guessLetters[i] = null;
        }
    }


    // 3. Yellow (Present - Exact Letter, Wrong Position)
    for (let i = 0; i < selectedWordLength; i++) {
        if (feedback[i]) continue;
        if (!guessLetters[i]) continue;

        const guessLetter = guessLetters[i];
        const targetIndex = targetLetters.findIndex(letter => letter === guessLetter);
        if (targetIndex !== -1) {
            feedback[i] = "present";
            if (!letterHints[guessLetter] || letterHints[guessLetter] === "absent") {
                letterHints[guessLetter] = "present";
            }
            targetLetters[targetIndex] = null;
            guessLetters[i] = null;
        }
    }

    // 4. Purple (Family - Family Letter, Wrong Position)
    for (let i = 0; i < selectedWordLength; i++) {
        if (feedback[i]) continue;
        if (!guessLetters[i]) continue;

        const guessBase = getBaseLetter(guessLetters[i]);
        if (!guessBase) continue;

        const targetIndex = targetLetters.findIndex(letter => letter && getBaseLetter(letter) === guessBase);
        if (targetIndex !== -1) {
            feedback[i] = "family";
            if (!letterHints[guessLetters[i]] || letterHints[guessLetters[i]] === "absent") {
                letterHints[guessLetters[i]] = "family";
            }
            targetLetters[targetIndex] = null;
            guessLetters[i] = null;
        }
    }


    // 5. Gray (Absent)
    for (let i = 0; i < selectedWordLength; i++) {
        if (!feedback[i]) {
            feedback[i] = "absent";
            letterHints[guess[i]] = "absent";
        }
    }

    // Apply feedback to grid tiles
    for (let i = 0; i < selectedWordLength; i++) {
        const tile = document.getElementById(`tile-${currentRow}-${i}`);
        if (tile && feedback[i]) {
            tile.classList.add(feedback[i]);
        }
    }
    updateGrid(); // Ensure grid is updated after applying classes
    updateKeyboard();
}


async function loadHintFile() {
    if (hints === null && !hintFileLoaded) { // Load only once and if not already loaded
        hintFileLoaded = true; // Mark loading as started
        try {
            const hintsResponse = await fetch(config.hintFilePath);
            if (!hintsResponse.ok) throw new Error(`HTTP error: ${hintsResponse.status}`);
            hints = await hintsResponse.json();
        } catch (error) {
            console.error("Error loading hints file:", error);
            hints = {}; // Ensure hints is at least an empty object to prevent further errors
            setElementText(messageDisplay, "ፍንጭ መረጃን በመጫን ላይ ስህተት ተፈጥሯል።");
        }
    }
}


async function showHint() {
    await loadHintFile(); // Load hint file if not already loaded
    Telegram.WebApp.showAlert(targetWord && hints && hints[targetWord] ? hints[targetWord] : "ለዚህ ቃል ፍንጭ የለም።");
}


function updateKeyboard() {
    document.querySelectorAll(".key").forEach(keyButton => {
        const letter = keyButton.dataset.letter;
        if (letter && letterHints[letter]) {
            keyButton.classList.add(letterHints[letter]);
            // Disable ONLY if absent
            if (letterHints[letter] === "absent") {
                keyButton.disabled = true;
            }
        }
    });
}

function shareResults() {
    let resultText = `ቃላት (${selectedWordLength} ፊደላት) - ${currentRow}/${MAX_GUESSES}\n`;
    for (let i = 0; i < currentRow; i++) {
        let rowText = "";
        for (let j = 0; j < selectedWordLength; j++) {
            const letter = guesses[i][j]; const tile = document.getElementById(`tile-${i}-${j}`);
            rowText += tile && tile.classList.contains("correct") ? "🟩" : tile && tile.classList.contains("present") ? "🟨" : tile && tile.classList.contains("family") ? "🟪" : tile && tile.classList.contains("blue") ? "🟦" : "⬛";
        }
        resultText += rowText + "\n";
    }
    try {
        if (Telegram.WebApp.isVersionAtLeast("6.9")) {
            Telegram.WebApp.showConfirm(resultText, (confirmed) => { if (confirmed) Telegram.WebApp.close(); });
        } else { Telegram.WebApp.showAlert("Please update the telegram app"); }
    } catch (e) { console.error("Error sharing:", e); alert(resultText); }
}

function setupRulesModal() {
    const modal = document.getElementById("rules-modal"), btn = document.getElementById("rules-button"), span = document.getElementsByClassName("close-button")[0];
    if (btn) btn.onclick = () => { if (modal) modal.style.display = "block"; };
    if (span) span.onclick = () => { if (modal) modal.style.display = "none"; };
    if (modal) window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };
}

function calculateAndSetTileSize() {
    const gridWidth = grid.offsetWidth;
    const tileSpacing = 3;

    const tileSize3 = (gridWidth - tileSpacing * 2) / 3;
    const tileSize4 = (gridWidth - tileSpacing * 3) / 4;
    const tileSize5 = (gridWidth - tileSpacing * 4) / 5;

    let tileSize = selectedWordLength === 3 ? tileSize3 :
                   selectedWordLength === 4 ? tileSize4 :
                   tileSize5;

    document.querySelectorAll(".tile").forEach(tile => {
        tile.style.width = `${tileSize}px`;
        tile.style.height = `${tileSize}px`;
    });
}
//Loading and saving game progress
function saveGameState() {
    const gameState = {
        targetWord,
        selectedWordLength,
        guesses,
        currentRow,
        letterHints, // Save letterHints for keyboard colors
        date: new Date().toLocaleDateString() //Store Date
    };
    localStorage.setItem("gameState", JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem("gameState");
    if (savedState) {
        const gameState = JSON.parse(savedState);
        // Check if the saved game is for today and the selected length
        const today = new Date().toLocaleDateString();

        // Check for *completed* games, not just played.
        if (localStorage.getItem(`${gameState.selectedWordLength}-letter-completed-${today}`) === "true") {
             return false; // Don't load if already completed
        }

        if (gameState.date === today && gameState.selectedWordLength) { // Check for date and selectedWordLength
            // Load game data
            targetWord = gameState.targetWord;
            selectedWordLength = gameState.selectedWordLength;
            guesses = gameState.guesses;
            currentRow = gameState.currentRow;
            letterHints = gameState.letterHints; // Restore letterHints
            return true;
        }
    }
     localStorage.removeItem("gameState"); // Remove if not the same date
    return false; // Indicate no relevant game state was found
}
// --- Event Listeners and Initialization ---

document.addEventListener("DOMContentLoaded", () => {
    initializeDOMReferences();

    loadWords().then(success => {
        if (success) {
            createAmharicKeyboard();
            setupLengthSelection();
            setupRulesModal();
            hideLoadingScreen();

            // Check for saved game state *before* showing length selection
             if (loadGameState()) {
                // If game state was loaded, go directly to the game
                hideElement(lengthSelection);
                showElement(document.getElementById("game-container")); // Make sure game container is visible
                calculateAndSetTileSize();// Ensure tiles are updated
                 updateGrid();       // Update grid AFTER loading game state
                updateKeyboard();   // Update keyboard AFTER loading

            } else {
                // No relevant saved state, show length selection
                showLengthSelection();
            }

            if (newGameButton) newGameButton.addEventListener("click", resetGame);
            if (hintButton) hintButton.addEventListener("click", showHint);
            if (gameOverButton) gameOverButton.addEventListener("click", resetGame);
            const shareButton = document.getElementById("share-button");
            if (shareButton) shareButton.addEventListener("click", shareResults);

            calculateAndSetTileSize(); // Call initially
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
