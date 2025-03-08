// script.js

// --- Part 1: Initialization, Constants, and Helper Functions ---
const config = {
    wordListPaths: {
        "3": 'clean_words3.txt',
        "4": 'clean_words4.txt',
        "5": 'clean_words5.txt'
    },
    hintFilePath: 'cleaned.json'
};

// DOM Element References
const messageDisplay = document.getElementById('message');
const grid = document.getElementById('wordle-grid');
const keyboard = document.getElementById('keyboard');
const newGameButton = document.getElementById('new-game-button');
const rulesButton = document.getElementById('rules-button');
const rulesSelectionButton = document.getElementById('rules-selection-button'); // Corrected ID
const shareButton = document.getElementById('share-button');
const hintButton = document.getElementById('hint-button');
const rulesModal = document.getElementById('rules-modal');
const closeButton = document.querySelector('.close-button');
const initialLoadingScreen = document.getElementById('initial-loading-screen');
const secondaryLoadingOverlay = document.getElementById('secondary-loading-overlay');
const largeTitleContainer = document.getElementById('large-title-container'); // For initial screen
const gameTitle = document.getElementById('game-title'); // For second screen
const titleContainer = document.getElementById('title-container'); // Container
const lengthSelection = document.getElementById('length-selection');
const logoPlaceholder = document.getElementById('logo-placeholder'); // Corrected ID
const credits = document.getElementById('credits');
const jumbledWordsContainer = document.getElementById('jumbled-words-container'); // For initial screen animation
const returnToMainButton = document.getElementById('return-to-main-button'); // Corrected ID
const suggestionArea = document.getElementById('suggestion-area');

let currentGuess = "";
let guesses = [];
let targetWord = "";
let selectedWordLength = null;
let gameOver = false;
let letterHints = {};
let allWords = {}; //Store all word lists

// --- Letter Family Mapping (Corrected and Efficient) ---
const letterFamilies = {
    'ሀ': ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ', 'ሐ', 'ሑ', 'ሒ', 'ሓ', 'ሔ', 'ሕ', 'ሖ', 'ኀ', 'ኁ', 'ኂ', 'ኃ', 'ኄ', 'ኅ', 'ኆ'],
    'ለ': ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ'],
    'መ': ['መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ'],
    'ረ': ['ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ'],
    'ሰ': ['ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ', 'ሠ', 'ሡ', 'ሢ', 'ሣ', 'ሤ', 'ሥ', 'ሦ'],
    'ሸ': ['ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ', 'ሽ', 'ሾ'],
    'ቀ': ['ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ'],
    'በ': ['በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ'],
    'ተ': ['ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ'],
    'ቸ': ['ቸ', 'ቹ', 'ቺ', 'ቻ', 'ቼ', 'ች', 'ቾ'],
    'ነ': ['ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ'],
    'ኘ': ['ኘ', 'ኙ', 'ኚ', 'ኛ', 'ኜ', 'ኝ', 'ኞ'],
    'አ': ['አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ', 'ዐ', 'ዑ', 'ዒ', 'ዓ', 'ዔ', 'ዕ', 'ዖ'],
    'ከ': ['ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ'],
    'ወ': ['ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ'],
    'ዘ': ['ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ'],
    'ዠ': ['ዠ', 'ዡ', 'ዢ', 'ዣ', 'ዤ', 'ዥ', 'ዦ'],
    'የ': ['የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ'],
    'ደ': ['ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ'],
    'ጀ': ['ጀ', 'ጁ', 'ጂ', 'ጃ', 'ጄ', 'ጅ', 'ጆ'],
    'ገ': ['ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ'],
    'ጠ': ['ጠ', 'ጡ', 'ጢ', 'ጣ', 'ጤ', 'ጥ', 'ጦ'],
    'ጨ': ['ጨ', 'ጩ', 'ጪ', 'ጫ', 'ጬ', 'ጭ', 'ጮ'],
    'ፈ': ['ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ'],
    'ፐ': ['ፐ', 'ፑ', 'ፒ', 'ፓ', 'ፔ', 'ፕ', 'ፖ'],
    'ቨ': ['ቨ', 'ቩ', 'ቪ', 'ቫ', 'ቬ', 'ቭ', 'ቮ'],
    'ጸ': ['ጸ', 'ጹ', 'ጺ', 'ጻ', 'ጼ', 'ጽ', 'ጾ', 'ፀ', 'ፁ', 'ፂ', 'ፃ', 'ፄ', 'ፅ', 'ፆ'],
};

// Function to get the representative character for a family.
function getRepresentative(char) {
    for (const representative in letterFamilies) {
        if (letterFamilies[representative].includes(char)) {
            return representative;
        }
    }
    return char; // If not found in any family, return itself
}

// Modified normalizeWord function
function normalizeWord(word) {
    let normalized = "";
    for (const char of word) {
        normalized += getRepresentative(char);
    }
    return normalized;
}

// For suggestions, you can still use a simplified char_to_family:
const char_to_family = {
    'ሀ': 'ሀሁሂሃሄህሆ',
    'ለ': 'ለሉሊላሌልሎ',
    'መ': 'መሙሚማሜምሞ',
    'ረ': 'ረሩሪራሬርሮ',
    'ሰ': 'ሰሱሲሳሴስሶ',
    'ሸ': 'ሸሹሺሻሼሽሾ',
    'ቀ': 'ቀቁቂቃቄቅቆ',
    'በ': 'በቡቢባቤብቦ',
    'ተ': 'ተቱቲታቴትቶ',
    'ቸ': 'ቸቹቺቻቼችቾ',
    'ነ': 'ነኑኒናኔንኖ',
    'ኘ': 'ኘኙኚኛኜኝኞ',
    'አ': 'አኡኢኣኤእኦ',
    'ከ': 'ከኩኪካኬክኮ',
    'ወ': 'ወዉዊዋዌውዎ',
    'ዘ': 'ዘዙዚዛዜዝዞ',
    'ዠ': 'ዠዡዢዣዤዥዦ',
    'የ': 'የዩዪያዬይዮ',
    'ደ': 'ደዱዲዳዴድዶ',
    'ጀ': 'ጀጁጂጃጄጅጆ',
    'ገ': 'ገጉጊጋጌግጎ',
    'ጠ': 'ጠጡጢጣጤጥጦ',
    'ጨ': 'ጨጩጪጫጬጭጮ',
    'ፈ': 'ፈፉፊፋፌፍፎ',
    'ፐ': 'ፐፑፒፓፔፕፖ',
    'ቨ': 'ቨቩቪቫቬቭቮ',
    'ጸ': 'ጸጹጺጻጼጽጾ',
    ' ':' '

};

// --- Helper Functions ---
async function loadWords(length) {
    const path = config.wordListPaths[length];
    if (!path) {
        throw new Error(`No word list path defined for length: ${length}`);
    }
    messageDisplay.textContent = ` በመጫን ላይ... ${length} ፊደል`;
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to fetch word list: ${response.status}`);
        }
        const text = await response.text();
        messageDisplay.textContent = "";
        return text.trim().split('\n').map(word => word.trim());
    } catch (error) {
        console.error("Error loading words:", error);
        messageDisplay.textContent = `የቃላት ዝርዝርን በመጫን ላይ ስህተት አለ።: ${error.message}`;
        if (typeof tg !== 'undefined') {
            tg.showAlert(`የቃላት ዝርዝርን በመጫን ላይ ስህተት አለ።: ${error.message}`);
        }
        throw error;
    }
}

async function loadHints() {
    try {
        const response = await fetch(config.hintFilePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch hints: ${response.status}`);
        }
        const hints = await response.json();
        return hints;
    } catch (error) {
        console.error("Error loading hints:", error);
        messageDisplay.textContent = `ፍንጮችን በመጫን ላይ ስህተት አለ።: ${error.message}`;
        if (typeof tg !== 'undefined') {
            tg.showAlert(`ፍንጮችን በመጫን ላይ ስህተት አለ።: ${error.message}`);
        }
        return {};
    }
}
async function loadSelectedWordList(length) {
    try{
      showSecondaryLoadingScreen();

        await Promise.all([
            loadWords(length),
            new Promise(resolve => setTimeout(resolve, 3000))
        ]);
          allWords[length] = await loadWords(length);
    }
    catch(error){
      console.error("Error loading selected word list: ", error);
    }
    finally{
      hideSecondaryLoadingScreen();
    }
}

function getRandomWord(words) {
    if (!words || words.length === 0) {
        console.error("No words to choose from.");
        messageDisplay.textContent = "ለዚህ ርዝመት ምንም ቃላት አልተገኙም።";
          if (typeof tg !== 'undefined') {
            tg.showAlert("ለዚህ ርዝመት ምንም ቃላት አልተገኙም።");
           }
        return null;
    }
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}

function showSecondaryLoadingScreen(){
 secondaryLoadingOverlay.style.display = "flex";
}

function hideSecondaryLoadingScreen(){
  secondaryLoadingOverlay.style.display = "none";
}
function showInitialLoadingScreen() {
    return new Promise(resolve => {
        initialLoadingScreen.style.display = "flex";
        largeTitleContainer.style.display = 'block'; // Show the title container
        largeTitleContainer.textContent = "ቃላት";
        largeTitleContainer.style.fontSize = "8em";  // Make it VERY large
        const flower = document.createElement('div');
        flower.textContent = '🌼';
        flower.style.fontSize = '4em';
        flower.style.animation = 'spin 2s linear infinite';
        largeTitleContainer.appendChild(flower);


      Promise.all([
          loadWords("3"),
          loadWords("4"),
          loadWords("5"),
          loadHints(),
          new Promise(res => setTimeout(res, 5000)) //Increased delay for not found error

      ]).then((results) => {
          allWords["3"] = results[0];
          allWords["4"] = results[1];
          allWords["5"] = results[2];

          // Transition to the next screen
          initialLoadingScreen.style.display = "none";
          largeTitleContainer.style.display = 'none';
          titleContainer.style.display = "flex"
          lengthSelection.style.display = "flex";
          rulesSelectionButton.style.display = 'inline-block';
          logoPlaceholder.style.display = "flex";
          credits.style.display = 'block';
          resolve();

        }).catch(error => {
          console.error("Error during initial load:", error);
      });

    });
}
// --- Part 2: Game Setup and Management ---

function resetGame(){
    currentGuess = "";
    guesses = [];
    targetWord = "";
    selectedWordLength = null;
    gameOver = false;
    letterHints = {};
    clearGrid();
    resetKeyboard();
    messageDisplay.textContent = "";
    shareButton.style.display = "none";
    newGameButton.style.display = 'none';
    lengthSelection.style.display = "flex";
    rulesButton.style.display = 'none'; //Hide on game page.
    rulesSelectionButton.style.display = "inline-block"; //Show on home page.
    logoPlaceholder.style.display = 'flex';
    credits.style.display = 'block';
    hintButton.style.display = 'none'; //Hide hint button.
    returnToMainButton.style.display = 'none'; //Hide return button

    titleContainer.classList.remove("ready-to-transition");
}

function startNewGame() {
    if (!selectedWordLength) {
        console.error("Word length not selected.");
        messageDisplay.textContent = "እባክዎ የቃሉን ርዝመት ይምረጡ።";
         if (typeof tg !== 'undefined') {
            tg.showAlert("እባክዎ የቃሉን ርዝመት ይምረጡ።");
          }
        return;
    }

     if (!allWords[selectedWordLength] || allWords[selectedWordLength].length === 0) {
        console.error(`No words loaded for length ${selectedWordLength}`);
        messageDisplay.textContent = `No words loaded for length ${selectedWordLength}`;
         if (typeof tg !== 'undefined') {
            tg.showAlert( `No words loaded for length ${selectedWordLength}`);
          }
        return;
    }

    targetWord = getRandomWord(allWords[selectedWordLength]);

    if (!targetWord) return;

    guesses = [];
    currentGuess = "";
    letterHints = {};
    gameOver = false;

    clearGrid();
    createGrid();
    resetKeyboard();
    messageDisplay.textContent = "";
    shareButton.style.display = "none";
    hintButton.style.display = 'inline-block';
    returnToMainButton.style.display = 'inline-block';

    lengthSelection.style.display = "none";
    rulesSelectionButton.style.display = 'none';// Hide on game page.
    logoPlaceholder.style.display = 'none';
    credits.style.display = 'none';
    newGameButton.style.display = 'inline-block';
}

function createGrid() {
    grid.innerHTML = '';
    grid.classList.remove('wordle-grid-3', 'wordle-grid-4', 'wordle-grid-5');
    grid.classList.add(`wordle-grid-${selectedWordLength}`);
    grid.style.gridTemplateColumns = `repeat(${selectedWordLength}, 1fr)`;

    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < selectedWordLength; j++) {
            const tile = document.createElement('div');
            tile.id = `tile-${i}-${j}`;
            tile.classList.add('tile');
            tile.classList.add('unguessed');
            grid.appendChild(tile);
        }
    }
     adjustTileSize();
}

function clearGrid() {
    grid.innerHTML = '';
}

function setupLengthSelection() {
    const lengthButtons = document.querySelectorAll('#length-selection button');
    lengthButtons.forEach(button => {
        button.addEventListener('click', async function() {
            selectedWordLength = parseInt(this.dataset.length, 10);
             await loadSelectedWordList(selectedWordLength);
            startNewGame();
        });
    });
}
//Creates the keyboard
function createAmharicKeyboard() {
    const keyboardRows = [
        ['ሀ', 'ለ', 'መ', 'ረ', 'ሰ', 'ሸ', 'ቀ', 'በ', 'ተ', 'ቸ'],
        ['ነ', 'ኘ', 'አ', 'ከ', 'ወ', 'ዘ', 'ዠ', 'የ', 'ደ', 'ጀ', 'ገ'],
        ['ጠ', 'ጨ','ፈ', 'ፐ', 'ቨ', 'ገምት', 'ሰርዝ'] // Enter and Delete
    ];

    keyboard.innerHTML = '';

    keyboardRows.forEach((rowLetters, rowIndex) => { // Added rowIndex
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('keyboard-row');
        keyboard.appendChild(rowDiv);

        rowLetters.forEach(letter => {
            const key = document.createElement('button');
            key.classList.add('key');
            key.textContent = letter;
             if (letter.trim() !== '') {
                key.dataset.letter = letter; // Set data-letter for all except space
            }

            if(letter != "ሰርዝ" && letter != "ገምት" && letter != " " ){ //Changed Enter to guess
               key.classList.add("fidel");
            }
             // Put Delete and Enter keys at the bottom.
            if (letter === 'ሰርዝ') {
                key.id = 'delete-button';
            } else if (letter === 'ገምት') {
                key.id = 'enter-button';
            }
            key.addEventListener('click', () => handleKeyPress(letter));
            rowDiv.appendChild(key);
        });
    });

     displayLetterFamily(''); // Show empty suggestion area
}

function displayLetterFamily(baseLetter) {
    suggestionArea.innerHTML = ''; // Clear previous suggestions

   if (!baseLetter) {
        // Display only the flower when no letter is selected
        suggestionArea.textContent = '🌼';
        return;
    }
    const family = char_to_family[baseLetter] || '';
    if(family){
        for (let char of family) {
                const suggestionKey = document.createElement('button');
                suggestionKey.classList.add('key');
                suggestionKey.classList.add('fidel'); // Consistent styling
                suggestionKey.textContent = char;
                suggestionKey.dataset.letter = char;
                suggestionKey.addEventListener('click', () => handleKeyPress(char)); // Call handleKeyPress
                suggestionArea.appendChild(suggestionKey);
            }
    }

}

function getLetterFamily(char) {
    return char_to_family[char] || '';
}

function resetKeyboard() {
    const keys = keyboard.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.remove('correct', 'present', 'absent','family', 'blue');
        key.disabled = false; // Re-enable all keys
    });
}

// --- Part 3: Game Logic and Event Handling ---

function addLetterToGuess(letter) {
    // No change needed here, adding letter works the same.
    if (currentGuess.length < selectedWordLength) {
        currentGuess += letter;
        updateGrid();
    }
}

function updateGrid() {
    for (let i = 0; i < guesses.length; i++) {
        for (let j = 0; j < selectedWordLength; j++) {
            const tile = document.getElementById(`tile-${i}-${j}`);
            tile.textContent = guesses[i][j] || '';
             tile.classList.remove('unguessed','filled','correct', 'present', 'absent', 'family','blue');

            const hint = letterHints[guesses[i][j]];
            if (hint) {
                tile.classList.add(hint);

            } else{
                tile.classList.add('filled');
            }
        }
    }

    // Update the current guess row
    for (let j = 0; j < selectedWordLength; j++) {
        const tile = document.getElementById(`tile-${guesses.length}-${j}`);
        tile.textContent = currentGuess[j] || '';
         tile.classList.remove('unguessed', 'filled','correct', 'present', 'absent','family','blue');
        if(currentGuess[j]){
          tile.classList.add('filled')
        }
        else{
           tile.classList.add('unguessed')
        }

    }

    // Clear any remaining tiles
    for (let i = guesses.length + 1; i < 7; i++) {
        for (let j = 0; j < selectedWordLength; j++) {
            const tile = document.getElementById(`tile-${i}-${j}`);
            tile.textContent = '';
            tile.classList.remove('filled','correct', 'present', 'absent','family','blue');
             tile.classList.add('unguessed');
        }
    }
}

function handleKeyPress(key) {
    if (gameOver) return;

    if (key === 'ሰርዝ') {
        currentGuess = currentGuess.slice(0, -1);
        updateGrid();
        displayLetterFamily(''); // Clear suggestions
    } else if (key === 'ገምት') { // Changed to check for "ገምት"
        submitGuess();
    } else {
        // When a key is pressed, only show the family in the suggestion area
        displayLetterFamily(key);
    }
}

async function submitGuess() {
    if (currentGuess.length !== selectedWordLength) {
        messageDisplay.textContent = `ቃል ${selectedWordLength} ፊደላት ሊኖሩት ይገባል።`;
        return;
    }

  const normalizedGuess = normalizeWord(currentGuess);
    if (!allWords[selectedWordLength].map(normalizeWord).includes(normalizedGuess)) {
        messageDisplay.textContent = "ትክክለኛ ቃል አይደለም።";
        return;
    }

    guesses.push(currentGuess);
    checkGuess();
    updateGrid();

    if (normalizeWord(currentGuess) === normalizeWord(targetWord)) {
        messageDisplay.textContent = "እንኳን ደስ አለዎት! በትክክል ገምተዋል!";
        shareButton.style.display = "inline-block";
        gameOver = true;
         disableKeyboard();
        return;
    }

    if (guesses.length === 7) {
        messageDisplay.textContent = `ጨዋታው አልቋል። ትክክለኛው ቃል ${targetWord} ነበር።`;
        shareButton.style.display = "inline-block";
        gameOver = true;
        disableKeyboard();
        return;
    }

    currentGuess = "";
    displayLetterFamily(''); // Clear suggestions

}

function checkGuess() {
    const normalizedTarget = normalizeWord(targetWord);
    const secretLetters = normalizedTarget.split('');
    const guessLetters = normalizeWord(currentGuess).split('');
    const newLetterHints = {};

    // Check for correct letters
    for (let i = 0; i < selectedWordLength; i++) {
        if (guessLetters[i] === secretLetters[i]) {
            newLetterHints[currentGuess[i]] = 'correct';
            secretLetters[i] = null;
        }
    }

    // Check for present letters
     for (let i = 0; i < selectedWordLength; i++) {
        if (newLetterHints[currentGuess[i]]) continue;

        if (secretLetters.includes(guessLetters[i])) {
            newLetterHints[currentGuess[i]] = 'present';
            secretLetters[secretLetters.indexOf(guessLetters[i])] = null;
        }
    }

    //Check for blue letters
    for (let i = 0; i < selectedWordLength; i++) {
      if (newLetterHints[currentGuess[i]]) continue;
      const guessLetterFamily = getLetterFamily(guessLetters[i]);
      const targetLetterFamily = getLetterFamily(normalizedTarget[i]);

      if(guessLetterFamily && targetLetterFamily && guessLetterFamily.split('').some(char => targetLetterFamily.includes(char))){
          newLetterHints[currentGuess[i]] = "blue";
      }
    }

    //Check for Family letters
    for (let i = 0; i < selectedWordLength; i++) {
         if (newLetterHints[currentGuess[i]]) continue;
        const family = getLetterFamily(currentGuess[i]);
        if (family) {
            let foundInFamily = false;
            for (let j = 0; j < selectedWordLength; j++) {
                if (i !== j && family.includes(targetWord[j])) {
                    newLetterHints[currentGuess[i]] = 'family';
                    foundInFamily = true;
                    break;
                }
            }
             if (!foundInFamily && !newLetterHints[currentGuess[i]]) {
                newLetterHints[currentGuess[i]] = 'absent';
            }
        }
        else{
          newLetterHints[currentGuess[i]] = 'absent';
        }
    }

    // Merge hints
    for (const letter in newLetterHints) {
        if (!letterHints[letter] ||
            (newLetterHints[letter] === 'correct') ||
            (letterHints[letter] !== 'correct' && newLetterHints[letter] === 'present') ||
            (letterHints[letter] !== 'correct' && letterHints[letter] !== 'present' && newLetterHints[letter] === 'family') ||
            (letterHints[letter] !== 'correct' && letterHints[letter] !== 'present' && letterHints[letter] !== "family" && newLetterHints[letter] === 'blue')
            ) {
            letterHints[letter] = newLetterHints[letter];

        }
    }
     updateKeyboard();
}


function disableKeyboard(){
   const keys = keyboard.querySelectorAll('.key');
    keys.forEach(key => {
       if(key.textContent != "ሰርዝ" && key.textContent != "ገምት"){
         key.disabled = true;

       }
    });
}

function updateKeyboard() {
    const keys = keyboard.querySelectorAll('.key');
    keys.forEach(key => {
        const letter = key.dataset.letter;
        if (letter && letterHints[letter]) {
            key.classList.add(letterHints[letter]);
              if(letterHints[letter] === 'absent'){
                key.disabled = true;
              }
        }

    });
}
// --- Part 4: UI Interaction and Event Listeners ---
async function showHint() {
    try {
        const hints = await loadHints();
        if (hints && hints[targetWord]) {
             if (typeof tg !== 'undefined') {
               tg.showAlert(`ፍንጭ: ${hints[targetWord]}`);
              }
        } else {
             if (typeof tg !== 'undefined') {
               tg.showAlert("ለዚህ ቃል ምንም ፍንጭ የለም።");
              }
        }
    } catch (error) {
        console.error("Error showing hint:", error);
         if (typeof tg !== 'undefined') {
            tg.showAlert(`Error showing hint: ${error}`);
          }
    }
}

function shareResults() {
    let resultText = `ቃላት ${selectedWordLength} ${guesses.length}/7\n`;
    for (let i = 0; i < guesses.length; i++) {
        for (let j = 0; j < selectedWordLength; j++) {
            const hint = letterHints[guesses[i][j]];
            if (hint === 'correct') {
                resultText += '🟩';
            } else if (hint === 'present') {
                resultText += '🟨';
            }
             else if (hint === 'family'){
                resultText += "🟪";
            }
            else if(hint === 'blue'){
              resultText += '🟦';
            }
            else {
                resultText += '⬜';
            }
        }
        resultText += '\n';
    }

    const shareMessage = `ቃላትን ይጫወቱ: ${resultText}`;

    if (typeof tg !== 'undefined' && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9')) {
        tg.showConfirm('ውጤትዎን ማጋራት ይፈልጋሉ?', function(confirmed) {
            if (confirmed) {
                tg.sendData(shareMessage);
                tg.close();
            }
        });

    }
    else {
         if (typeof tg !== 'undefined') {
             tg.showAlert('ውጤቶችን ለማጋራት የቴሌግራም ስሪት 6.9 ወይም ከዚያ በላይ ያስፈልጋል።');
           }
  }

}

function setupRulesModal() {
    rulesSelectionButton.addEventListener('click', () => {
        rulesModal.style.display = 'block';
    });
    rulesButton.addEventListener('click', () => {
        rulesModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        rulesModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === rulesModal) {
            rulesModal.style.display = 'none';
        }
    });
}

function adjustTileSize() {
    grid.classList.remove('wordle-grid-3', 'wordle-grid-4', 'wordle-grid-5');

    if (selectedWordLength) {
        grid.classList.add(`wordle-grid-${selectedWordLength}`);
    }
}
// Event Listeners
newGameButton.addEventListener('click', resetGame);
shareButton.addEventListener('click', shareResults);
hintButton.addEventListener('click', showHint);
returnToMainButton.addEventListener('click', resetGame); // Go back to main menu



// --- Initialization ---

showInitialLoadingScreen().then(() => {
    setupLengthSelection();
    createAmharicKeyboard();
    setupRulesModal();
});

window.addEventListener('resize', adjustTileSize);


