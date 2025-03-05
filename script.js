// --- Constants and Variables ---

const WORD_LENGTHS = [3, 4, 5]; // Allowed word lengths
let selectedWordLength = null; // The word length chosen by the user
let targetWord = ""; // The secret word to guess
let currentGuess = []; // Array to store the current guess letters
let guessCount = 0; // Number of guesses made
const MAX_GUESSES = 6;
let words = {}; // This will hold the loaded JSON word list
// --- DOM Element References ---
const keyboard = document.getElementById('keyboard');
const suggestionArea = document.getElementById('suggestion-area');
const grid = document.getElementById('wordle-grid');
const messageDisplay = document.getElementById('message');
const lengthSelection = document.getElementById('length-selection');
const newGameButton = document.getElementById('new-game-button');
const deleteButton = document.getElementById('delete-button');
const container = document.getElementById('hint-container');

// --- DOMContentLoaded Event ---

document.addEventListener('DOMContentLoaded', () => {

    loadWords().then(() => {
      createAmharicKeyboard(); // Create keyboard *after* loading words (important for letter families)
      setupLengthSelection();

    });

    newGameButton.addEventListener('click', startNewGame);
    //Removed hint button
    setupRulesModal();
    setupShareButton();

});
// --- Function Definitions ---

// Load Word List (from cleaned.json)
async function loadWords() {
    try {
        const response = await fetch(config.wordListPath); // Use config.wordListPath
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        words = await response.json();
        if (Object.keys(words).length === 0 || Object.values(words).every(arr => arr.length === 0)) {
          throw new Error("Word list is empty or invalidly formatted!");
        }
    } catch (error) {
        console.error("Error loading word list:", error);
        // Use Telegram Web App's showAlert for error messages
        Telegram.WebApp.showAlert(`Error loading word list: ${error.message}`);
    }
}

// Start New Game
function startNewGame() {
    if (!selectedWordLength) {
        // If no length is selected, show length selection and prompt.
        lengthSelection.style.display = 'flex';
        messageDisplay.textContent = "የሚፈልጉትን የፊደላት መጠን ይምረጡ።"; // "Select your desired word length."
        return; // Stop here, don't proceed with game setup.
    }

    targetWord = getRandomWord(selectedWordLength); // Select word *after* length is known
    currentGuess = [];
    guessCount = 0;
    guesses = [];
    clearGrid(); // Clear any previous grid
    createGrid(); // Create the grid with the correct dimensions
    resetKeyboard();
    animateBirdToButtons() // Bird animation for length selection.

     lengthSelection.style.display = 'none'; // Hide length selection
    newGameButton.style.display = 'block';
    keyboard.style.display = 'flex'; // Show the keyboard
    messageDisplay.textContent = ""; // Clear any previous messages
}

function resetGame(){
    selectedWordLength = null;
    targetWord = "";
    currentGuess = [];
    guessCount = 0;

    // Clear the grid
    clearGrid();
    // Reset keyboard button states
    resetKeyboard();
    // Clear any messages
    messageDisplay.textContent = '';
    // Hide the new game button until the next game starts
    newGameButton.style.display = 'none';
    lengthSelection.style.display = 'flex';
}


// Get Random Word (of specified length)
function getRandomWord(length) {
    if (!words[length]) {
        console.error(`No words of length ${length} found.`);
        Telegram.WebApp.showAlert(`No words of length ${length} found.`);
        return null; // Return null if no words of that length
    }
    const wordList = words[length];
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
}

// Create the Wordle Grid (dynamically)
function createGrid() {
    const grid = document.getElementById('wordle-grid');
    grid.innerHTML = ''; // Clear any existing grid

    grid.style.gridTemplateColumns = `repeat(${selectedWordLength}, 60px)`;

    for (let i = 0; i < MAX_GUESSES; i++) {
        for (let j = 0; j < selectedWordLength; j++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.id = `tile-${i}-${j}`;
            grid.appendChild(tile);
        }
    }
}
function clearGrid(){

    grid.innerHTML = ''
}
// Setup Length Selection Buttons
function setupLengthSelection() {
    document.querySelectorAll('#length-selection button').forEach(button => {
        button.addEventListener('click', (event) => {
            selectedWordLength = parseInt(event.target.dataset.length);
            document.getElementById("length-selection").style.display = "none";
            startNewGame(); // Start game after length selection

        });
    });
}

// --- Amharic Keyboard ---

const keys = [
    ["ህ","ል","ሕ","ም","ስ","ር","ስ","ሽ","ቅ","ብ","ት","ን","እ"]
    ,["ክ","ው","ዕ","ዝ","ይ","ድ","ጅ","ግ","ጥ","ጭ","ጵ","ጽ","ፍ"] //
    ,["ቈ","ኈ","ጐ","ኰ","ጾ","ጸ","ፐ","ቸ","ኀ","ነ","ኘ","አ","ከ","ዠ","የ","ደ","ዸ","ገ","ጠ","ጨ","ጰ","ፈ"] //
];

const char_to_family = {
    "ሀ": "ሀ",
    "ሁ": "ሀ",
    "ሂ": "ሀ",
    "ሃ": "ሀ",
    "ሄ": "ሀ",
    "ህ": "ሀ",
    "ሆ": "ሀ",
    "ለ": "ለ",
    "ሉ": "ለ",
    "ሊ": "ለ",
    "ላ": "ለ",
    "ሌ": "ለ",
    "ል": "ለ",
    "ሎ": "ለ",
    "ሏ": "ለ",
    "ሐ": "ሐ",
    "ሑ": "ሐ",
    "ሒ": "ሐ",
    "ሓ": "ሐ",
    "ሔ": "ሐ",
    "ሕ": "ሐ",
    "ሖ": "ሐ",
    "ሗ": "ሐ",
    "መ": "መ",
    "ሙ": "መ",
    "ሚ": "መ",
    "ማ": "መ",
    "ሜ": "መ",
    "ም": "መ",
    "ሞ": "መ",
    "ሟ": "መ",
    "ሠ": "ሠ",
    "ሡ": "ሠ",
    "ሢ": "ሠ",
    "ሣ": "ሠ",
    "ሤ": "ሠ",
    "ሥ": "ሠ",
    "ሦ": "ሠ",
    "ሧ": "ሠ",
    "ረ": "ረ",
    "ሩ": "ረ",
    "ሪ": "ረ",
    "ራ": "ረ",
    "ሬ": "ረ",
    "ር": "ረ",
    "ሮ": "ረ",
    "ሯ": "ረ",
    "ሰ": "ሰ",
    "ሱ": "ሰ",
    "ሲ": "ሰ",
    "ሳ": "ሰ",
    "ሴ": "ሰ",
    "ስ": "ሰ",
    "ሶ": "ሰ",
    "ሷ": "ሰ",
    "ሸ": "ሸ",
    "ሹ": "ሸ",
    "ሺ": "ሸ",
    "ሻ": "ሸ",
    "ሼ": "ሸ",
    "ሽ": "ሸ",
    "ሾ": "ሸ",
    "ሿ": "ሸ",
    "ቀ": "ቀ",
    "ቁ": "ቀ",
    "ቂ": "ቀ",
    "ቃ": "ቀ",
    "ቄ": "ቀ",
    "ቅ": "ቀ",
    "ቆ": "ቀ",
    "ቋ": "ቀ",
    "በ": "በ",
    "ቡ": "በ",
    "ቢ": "በ",
    "ባ": "በ",
    "ቤ": "በ",
    "ብ": "በ",
    "ቦ": "በ",
    "ቧ": "በ",
    "ተ": "ተ",
    "ቱ": "ተ",
    "ቲ": "ተ",
    "ታ": "ተ",
    "ቴ": "ተ",
    "ት": "ተ",
    "ቶ": "ተ",
    "ቷ": "ተ",
    "ቸ": "ቸ",
    "ቹ": "ቸ",
    "ቺ": "ቸ",
    "ቻ": "ቸ",
    "ቼ": "ቸ",
    "ች": "ቸ",
    "ቾ": "ቸ",
    "ቿ": "ቸ",
    "ኀ": "ኀ",
    "ኁ": "ኀ",
    "ኂ": "ኀ",
    "ኃ": "ኀ",
    "ኄ": "ኀ",
    "ኅ": "ኀ",
    "ኆ": "ኀ",
    "ኋ": "ኀ",
    "ነ": "ነ",
    "ኑ": "ነ",
    "ኒ": "ነ",
    "ና": "ነ",
    "ኔ": "ነ",
    "ን": "ነ",
    "ኖ": "ነ",
    "ኗ": "ነ",
    "ኘ": "ኘ",
    "ኙ": "ኘ",
    "ኚ": "ኘ",
    "ኛ": "ኘ",
    "ኜ": "ኘ",
    "ኝ": "ኘ",
    "ኞ": "ኘ",
    "ኟ": "ኘ",
    "አ": "አ",
    "ኡ": "አ",
    "ኢ": "አ",
    "ኣ": "አ",
    "ኤ": "አ",
    "እ": "አ",
    "ኦ": "አ",
    "ኧ": "አ",
    "ከ": "ከ",
    "ኩ": "ከ",
    "ኪ": "ከ",
    "ካ": "ከ",
    "ኬ": "ከ",
    "ክ": "ከ",
    "ኮ": "ከ",
    "ኳ": "ከ",
    "ወ": "ወ",
    "ዉ": "ወ",
    "ዊ": "ወ",
    "ዋ": "ወ",
    "ዌ": "ወ",
    "ው": "ወ",
    "ዎ": "ወ",
    "ዏ": "ወ",
    "ዐ": "ዐ",
    "ዑ": "ዐ",
    "ዒ": "ዐ",
    "ዓ": "ዐ",
    "ዔ": "ዐ",
    "ዕ": "ዐ",
    "ዖ": "ዐ",
    "ዕዋ": "ዐ",
    "ዘ": "ዘ",
    "ዙ": "ዘ",
    "ዚ": "ዘ",
    "ዛ": "ዘ",
    "ዜ": "ዘ",
    "ዝ": "ዘ",
    "ዞ": "ዘ",
    "ዟ": "ዘ",
    "ዠ": "ዠ",
    "ዡ": "ዠ",
    "ዢ": "ዠ",
    "ዣ": "ዠ",
    "ዤ": "ዠ",
    "ዥ": "ዠ",
    "ዦ": "ዠ",
    "ዧ": "ዠ",
    "የ": "የ",
    "ዩ": "የ",
    "ዪ": "የ",
    "ያ": "የ",
    "ዬ": "የ",
    "ይ": "የ",
    "ዮ": "የ",
    "ዯ": "የ",
    "ደ": "ደ",
    "ዱ": "ደ",
    "ዲ": "ደ",
    "ዳ": "ደ",
    "ዴ": "ደ",
    "ድ": "ደ",
    "ዶ": "ደ",
    "ዷ": "ደ",
    "ጀ": "ጀ",
    "ጁ": "ጀ",
    "ጂ": "ጀ",
    "ጃ": "ጀ",
    "ጄ": "ጀ",
    "ጅ": "ጀ",
    "ጆ": "ጀ",
    "ጇ": "ጀ",
    "ገ": "ገ",
    "ጉ": "ገ",
    "ጊ": "ገ",
    "ጋ": "ገ",
    "ጌ": "ገ",
    "ግ": "ገ",
    "ጎ": "ገ",
    "ጓ": "ገ",
    "ጠ": "ጠ",
    "ጡ": "ጠ",
    "ጢ": "ጠ",
    "ጣ": "ጠ",
    "ጤ": "ጠ",
    "ጥ": "ጠ",
    "ጦ": "ጠ",
    "ጧ": "ጠ",
    "ጨ": "ጨ",
    "ጩ": "ጨ",
    "ጪ": "ጨ",
    "ጫ": "ጨ",
    "ጬ": "ጨ",
    "ጭ": "ጨ",
    "ጮ": "ጨ",
    "ጯ": "ጨ",
    "ጰ": "ጰ",
    "ጱ": "ጰ",
    "ጲ": "ጰ",
    "ጳ": "ጰ",
    "ጴ": "ጰ",
    "ጵ": "ጰ",
    "ጶ": "ጰ",
    "ጷ": "ጰ",
    "ጸ": "ጸ",
    "ጹ": "ጸ",
    "ጺ": "ጸ",
    "ጻ": "ጸ",
    "ጼ": "ጸ",
    "ጽ": "ጸ",
    "ጾ": "ጸ",
    "ጿ": "ጸ",
    "ፀ": "ፀ",
    "ፁ": "ፀ",
    "ፂ": "ፀ",
    "ፃ": "ፀ",
    "ፄ": "ፀ",
    "ፅ": "ፀ",
    "ፆ": "ፀ",
    "ፇ": "ፀ",
    "ፈ": "ፈ",
    "ፉ": "ፈ",
    "ፊ": "ፈ",
    "ፋ": "ፈ",
    "ፌ": "ፈ",
    "ፍ": "ፈ",
    "ፎ": "ፈ",
    "ፏ": "ፈ",
    "ፐ": "ፐ",
    "ፑ": "ፐ",
    "ፒ": "ፐ",
    "ፓ": "ፐ",
    "ፔ": "ፐ",
    "ፕ": "ፐ",
    "ፖ": "ፐ",
    "ፗ": "ፐ",
    "ቨ": "ቨ",
    "ቩ": "ቨ",
    "ቪ": "ቨ",
    "ቫ": "ቨ",
    "ቬ": "ቨ",
    "ቭ": "ቨ",
    "ቮ": "ቨ",
    "ቯ": "ቨ",
    "ቈ": "ቈ",
    "ቊ": "ቈ",
    "ቋ": "ቈ",
    "ቌ": "ቈ",
    "ቍ": "ቈ",
    "ኈ": "ኈ",
    "ኊ": "ኈ",
    "ኋ": "ኈ",
    "ኌ": "ኈ",
    "ኍ": "ኈ",
    "ኰ": "ኰ",
    "ኲ": "ኰ",
    "ኳ": "ኰ",
    "ኴ": "ኰ",
    "ኵ": "ኰ",
    "ጐ": "ጐ",
    "ጒ": "ጐ",
    "ጓ": "ጐ",
    "ጔ": "ጐ",
    "ጕ": "ጐ",
   "ጾ": "ጾ"
};

// Create Amharic Keyboard
function createAmharicKeyboard() {
    const keyboardContainer = document.getElementById('keyboard');
     keyboardContainer.innerHTML = ''; // Clear any existing keyboard

    keys.forEach(rowKeys => {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('keyboard-row');
    rowKeys.forEach(keyChar => {
        const keyButton = document.createElement('button');
        keyButton.textContent = keyChar;
        keyButton.classList.add('key');
        keyButton.dataset.letter = keyChar; // Store the character
        keyButton.addEventListener('click', () => handleKeyPress(keyChar));
        rowDiv.appendChild(keyButton);
    });
    keyboardContainer.appendChild(rowDiv);
    });
//adding the suggestion area
    const suggestionArea = document.createElement('div');
    suggestionArea.id = 'suggestion-area';
    keyboardContainer.appendChild(suggestionArea);

      // Add Delete Button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'ሰርዝ';
    deleteButton.classList.add('key');
    deleteButton.id = 'delete-button';
    deleteButton.addEventListener('click', () => handleKeyPress('Backspace'));
    keyboardContainer.appendChild(deleteButton);
}

// Display Letter Family
function displayLetterFamily(letter) {
   const suggestionArea = document.getElementById('suggestion-area');
    suggestionArea.innerHTML = '';

    const family = getLetterFamily(letter);
    if (family) {
        family.forEach(char => {
            const suggestionButton = document.createElement('button');
            suggestionButton.textContent = char;
            suggestionButton.classList.add('key'); // Use the same styling as keyboard keys
            suggestionButton.dataset.letter = char; // Store for later use
            suggestionButton.addEventListener('click', () => {
               addLetterToGuess(char);
                suggestionArea.innerHTML = ''; // Clear suggestions after selection
                resetKeyboard()
            });
            suggestionArea.appendChild(suggestionButton);
        });
    }
    //Disable the main keyboard
    document.querySelectorAll('.key').forEach(key => key.disabled = true)
    deleteButton.disabled = false;
}

function resetKeyboard() {
    keyboard.querySelectorAll('.key').forEach(button => {
        // Remove any color classes
        button.classList.remove('correct', 'present', 'absent', 'family', 'blue');
        // Enable all buttons
        button.disabled = false;
    });
        // Clear suggestion area
        suggestionArea.innerHTML = '';

}

// Get Letter Family
function getLetterFamily(letter) {
     for (let family in char_to_family) {
        if (char_to_family[letter] == family) {
          let family_letters = []
          for( let char in char_to_family){
            if(char_to_family[char] == family){
                family_letters.push(char)
            }
          }
            return family_letters;
        }
    }
    return [];
}

// Add Letter to Guess
function addLetterToGuess(letter) {
    if (currentGuess.length < selectedWordLength) {
        currentGuess += letter;
        updateGrid();
    }
}
// Update the Grid Display
function updateGrid() {
    for (let i = 0; i < MAX_GUESSES; i++) {
        for (let j = 0; j < selectedWordLength; j++) {
            const tile = document.getElementById(`tile-${i}-${j}`);
            tile.textContent = ''; // Clear the tile first
            tile.className = 'tile'; // Reset classes
            if (guesses[i] && guesses[i][j]) {
                tile.textContent = guesses[i][j];
                tile.classList.add('filled');
                // Apply color hints (if available)
                if (letterHints[guesses[i][j]]) {
                   tile.classList.add(letterHints[guesses[i][j]]);
                }
            }
        }
    }
}

// Handle Key Press
function handleKeyPress(key) {
    if (key === 'Backspace') {
        currentGuess = currentGuess.slice(0, -1);
        updateGrid();
    } else if (key === 'Enter') {
        if (currentGuess.length === selectedWordLength) {
            submitGuess();
        }
    } else {

        displayLetterFamily(key)
    }
}

// Submit a Guess
function submitGuess() {
   if (currentGuess.length !== selectedWordLength) {
        return; // Should not happen, but just in case
    }

    if (!words[selectedWordLength].includes(currentGuess)) {
        tg.showAlert("ያልታወቀ ቃል!", () => {});
        return;
    }

    guesses[currentRow] = currentGuess;
    checkGuess();
    currentRow++;

    if (currentGuess === secretWord) {
        messageDisplay.textContent = "እንኳን ደስ አለዎት! በትክክለኛው ቃል ገምተዋል!";
        disableKeyboard();
         showShareButton();
         animateBirdDance()
        return;
    } else if (currentRow === MAX_GUESSES) {
        messageDisplay.textContent = `ጨዋታው አልቋል። ትክክለኛው ቃል ${secretWord} ነበር።`;
        disableKeyboard();
        showShareButton()
        animateBirdSad()
        return;
    }
    // Reset for the next guess
    currentGuess = "";

    updateGrid();
    updateKeyboard(); // Update keyboard colors
}

// Disable Keyboard
function disableKeyboard() {
    document.querySelectorAll('.key').forEach(key => {
        key.disabled = true;
    });
}


// Check the Guess (Core Logic)
function checkGuess() {
    const guess = guesses[currentRow] || ''; // Ensure guess exists
    const secretLetters = secretWord.split('');
    const guessLetters = guess.split('');
    const feedback = [];

    // First, mark 'correct' letters (green)
    for (let i = 0; i < selectedWordLength; i++) {
        if (guessLetters[i] === secretLetters[i]) {
            feedback[i] = 'correct';
            letterHints[guessLetters[i]] = 'correct';//update the letter hint
            secretLetters[i] = null; // Mark as used
            guessLetters[i] = null;
        }
    }
    //Next mark all family
    for (let i = 0; i < selectedWordLength; i++) {
        if (feedback[i]) continue; // Skip already marked letters

        const currentBase = getBaseLetter(guessLetters[i]);
        const targetBase = getBaseLetter(secretLetters[i]);

        if(currentBase === targetBase && guessLetters[i]!==secretLetters[i] ){
            feedback[i] = 'family';
            letterHints[guessLetters[i]] = 'family';//update the letter hint
        }
    }

    // Then, mark 'present' letters (yellow)
    for (let i = 0; i < selectedWordLength; i++) {
        if (feedback[i]) continue; // Skip already marked letters

        for (let j = 0; j < selectedWordLength; j++) {
            if (i !== j && guessLetters[i] === secretLetters[j] && !feedback[j]) {
                feedback[i] = 'present';
                letterHints[guessLetters[i]] = 'present';//update the letter hint
                secretLetters[j] = null;
                break; // Important: Only mark as 'present' once
            }
        }
    }
// Mark blue letters
    for (let i = 0; i < selectedWordLength; i++) {
        if (feedback[i]) continue; // Skip already marked letters

        for (let j = 0; j < selectedWordLength; j++) {
            if (i !== j && getBaseLetter(guessLetters[i]) === getBaseLetter(secretLetters[j])&& !feedback[j]) {
                feedback[i] = 'blue';
                letterHints[guessLetters[i]] = 'blue'; //update the letter hint
                break; // Important: Only mark as 'present' once
            }
        }
    }
    // Finally, mark 'absent' letters (gray)
    for (let i = 0; i < selectedWordLength; i++) {
        if (!feedback[i]) {
            feedback[i] = 'absent';
            letterHints[guessLetters[i]] = 'absent';//update the letter hint

        }
    }

    // Update the grid with feedback colors -- MOVED to updateGrid()
    for (let i = 0; i < selectedWordLength; i++) {
        const tile = document.getElementById(`tile-${currentRow}-${i}`);
        tile.classList.add(feedback[i]); // Apply the correct class
    }
}

// Update Keyboard (Color-Coding) - STILL NEEDS WORK
function updateKeyboard() {
  const keyboardKeys = document.querySelectorAll('.key');

  keyboardKeys.forEach(keyButton => {
    const letter = keyButton.dataset.letter; // Get the letter from data-letter
    if (letter && letterHints[letter]) {
        const hintClass = letterHints[letter];
        keyButton.classList.add(hintClass); // Add the hint class
        if (hintClass == 'absent'){
          keyButton.disabled = true;
        }
    }
  });
}

// Shows hints for the letters by triggering the bird animation.
function showHints() {
    // Find a colored tile from previous guesses
    container.style.display = 'block';
    const hintButtonElement = document.getElementById('hint-button');
    if (hintButtonElement) {
        const rect = hintButtonElement.getBoundingClientRect(); // 'rect' is defined HERE, inside showHints()

        // Now you can use 'rect' to position the 'container' (hint box)
        container.style.left = `${rect.left + rect.width / 2}px`; // Use rect.left and rect.width
        container.style.top = `${rect.top - 50}px`;             // Use rect.top

        // Simulate a "sad" animation (e.g., slow up and down)
        setTimeout(() => { container.style.top = `${rect.top - 40}px`; }, 500);
        setTimeout(() => { container.style.top = `${rect.top - 60}px`; }, 1000);
        setTimeout(() => { container.style.top = `${rect.top - 50}px`; }, 1500);
        setTimeout(() => { container.style.display = 'none'; }, 2000);
    } else {
        console.error("Error: 'hint-button' element not found. Cannot show hints.");
    }
}

// Share functionality
function shareResults() {
    let resultText = `ቃላት (${wordLength} ፊደላት) - ${currentRow}/6\n`;

    for (let i = 0; i < currentRow; i++) {
        let rowText = "";
        for (let j = 0; j < wordLength; j++) {
            const letter = guesses[i][j];
            if (secretWord[j] === letter) {
                rowText += "🟩"; // Green square
            } else if (secretWord.includes(letter)) {
                const correctFamily = getLetterFamily(secretWord[j]);
                const guessFamily = getLetterFamily(letter);
                if(correctFamily === guessFamily){
                     rowText += "🟪";
                }
                else{
                    rowText += "🟨"; // Yellow square
                }

            } else {
                const guessFamily = getLetterFamily(letter);

                if (secretWord.split("").some(letter => getLetterFamily(letter).length > 0 && getLetterFamily(letter) === guessFamily)) {
                     rowText += "🟦"
                }else{
                    rowText += "⬛"; // Black square
                }

            }
        }
        resultText += rowText + "\n";
    }


    if (Telegram.WebApp.isVersionAtLeast('6.9')) {
      console.log(resultText);
        Telegram.WebApp.showConfirm("Share your results?", (confirmed) => {
            if (confirmed) {
                Telegram.WebApp.shareLink(resultText);
            }
        });
    } else {
      Telegram.WebApp.showAlert("Please update the telegram app")
    }
}
// Bird animation functions (PLACEHOLDERS - animations need implementation)
function animateBirdToButtons() {
    console.log("animateBirdToButtons() - PLACEHOLDER ANIMATION");
    // Implement animation to move bird to length selection buttons if you have a bird element
}

function animateBirdDance() {
    console.log("animateBirdDance() - PLACEHOLDER ANIMATION - CELEBRATION");
    // Implement dance animation for bird when word is guessed correctly
}

function animateBirdSad() {
    console.log("animateBirdSad() - PLACEHOLDER ANIMATION - SAD");
    // Implement sad animation for bird when game is lost
}

function setupRulesModal() {
    const modal = document.getElementById('rules-modal');
    const btn = document.getElementById('rules-button');
    const span = document.getElementsByClassName('close-button')[0];

    if (btn) { // Check if 'btn' exists
        btn.onclick = function() {
            if (modal) modal.style.display = 'block';
        }
    }

    if (span) { // Check if 'span' exists
        span.onclick = function() {
            if (modal) modal.style.display = 'none';
        }
    }

    if (modal) { // Check if 'modal' exists
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
    }
}
//Utility function
function setupShareButton(){
    const shareButton = document.getElementById('share-button')
    if(shareButton){
        shareButton.addEventListener('click', shareResults);
    }
}
// Utility function to extract the base letter from any of its forms
function getBaseLetter(letter) {
    for (const base in char_to_family) {
        if (char_to_family[letter] === base) {
            return base;
        }
    }
    return null; // Should never happen if input is valid
}

// Initial setup (call this when the page loads)
function initializeGame() {
    loadWords().then(() => {
        createAmharicKeyboard();
        setupLengthSelection();
        // You might want to hide the keyboard initially, until a length is selected:
        document.getElementById('keyboard').style.display = 'none';

        // Show the initial bird animation (if you have that implemented)
        animateBirdToButtons();
    });
}