// script.js

// --- Word List and Character Sets ---
// This is the default word list. It will be replaced if the user generates new words.
let words = [
    "apple", "banana", "galaxy", "ocean", "river", "mountain", "forest", "firefly", "dragon",
    "penguin", "keyboard", "guitar", "sunshine", "blossom", "waterfall", "breeze", "whisper",
    "shadow", "journey", "adventure", "wonder", "unicorn", "wizard", "castle", "treasure",
    "diamond", "emerald", "sapphire", "robot", "spaceship", "planet", "comet", "meteor",
    "nebula", "constellation", "sunrise", "sunset", "meadow", "crystal", "volcano", "tsunami",
    "hurricane", "tornado", "earthquake", "lightning", "thunder", "snowflake", "icicle",
    "avalanche", "tornado", "canyon", "desert", "jungle", "swamp", "glacier", "island"
];
const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

// --- DOM Elements ---
const passwordDisplay = document.getElementById('password-display');
const maxLengthSlider = document.getElementById('max-length');
const maxLengthValueSpan = document.getElementById('max-length-value');
const separatorSelect = document.getElementById('separator');
const includeNumbersCheckbox = document.getElementById('include-numbers');
const includeSymbolsCheckbox = document.getElementById('include-symbols');
const randomCaseCheckbox = document.getElementById('random-case');
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const messageBox = document.getElementById('message-box');
const wordThemeInput = document.getElementById('word-theme-input');
const generateWordsBtn = document.getElementById('generate-words-btn');
const wordGeneratorStatus = document.getElementById('word-generator-status');

// --- Event Listeners ---
maxLengthSlider.addEventListener('input', () => {
    maxLengthValueSpan.textContent = maxLengthSlider.value;
});

generateBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', copyToClipboard);
generateWordsBtn.addEventListener('click', generateWordsFromTheme);

// --- Gemini API Function ---

/**
 * Calls the Gemini API to generate a list of words based on a user-provided theme.
 */
async function generateWordsFromTheme() {
    const theme = wordThemeInput.value.trim();
    if (!theme) {
        wordGeneratorStatus.textContent = "Please enter a theme.";
        return;
    }

    wordGeneratorStatus.innerHTML = '<div class="loading-spinner mx-auto"></div>';
    generateWordsBtn.disabled = true;

    try {
        let chatHistory = [];
        const prompt = `Generate a comma-separated list of 10-15 single words related to the theme: "${theme}". The words should be lowercase. Do not include any other text or punctuation.`;
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // **YOUR API KEY HERE**
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const result = await response.json();
        const newWordsText = result.candidates[0].content.parts[0].text;
        words = newWordsText.split(',').map(word => word.trim());
        
        wordGeneratorStatus.textContent = `Word list updated with words from theme: "${theme}"!`;
        generatePassword(); // Generate a new password with the new words
    } catch (error) {
        console.error("Error generating words:", error);
        wordGeneratorStatus.textContent = "Failed to generate words. Please try again.";
    } finally {
        generateWordsBtn.disabled = false;
        setTimeout(() => wordGeneratorStatus.textContent = '', 5000); // Clear status after 5s
    }
}

// --- Core Functions ---

/**
 * Generates a single word with random capitalization if enabled.
 * @param {string} word The word to modify.
 * @returns {string} The modified word.
 */
function applyRandomCase(word) {
    if (!randomCaseCheckbox.checked) {
        return word;
    }
    let newWord = '';
    for (const char of word) {
        newWord += Math.random() < 0.5 ? char.toLowerCase() : char.toUpperCase();
    }
    return newWord;
}

/**
 * Generates a password based on user-selected criteria and max length.
 */
function generatePassword() {
    const maxLength = parseInt(maxLengthSlider.value, 10);
    const separator = separatorSelect.value;
    const includeNumbers = includeNumbersCheckbox.checked;
    const includeSymbols = includeSymbolsCheckbox.checked;
    
    // Randomize the words array
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    let password = '';
    let wordsUsed = [];
    
    // Build the password word by word until the max length is reached
    for (let i = 0; i < shuffledWords.length; i++) {
        const word = shuffledWords[i];
        const currentLength = password.length;
        let potentialPassword = wordsUsed.length > 0 ? password + separator + word : word;
        
        // Add a number and/or symbol to the final length calculation
        let finalLengthEstimate = potentialPassword.length;
        if (includeNumbers) finalLengthEstimate += Math.floor(Math.random() * 2) + 1; // +1 or +2 for a digit
        if (includeSymbols) finalLengthEstimate += 1;

        if (finalLengthEstimate <= maxLength) {
            wordsUsed.push(word);
            password = potentialPassword;
        } else {
            break; // Stop adding words if the length would exceed the max
        }
    }

    // Apply random capitalization to the selected words
    const modifiedWords = wordsUsed.map(word => applyRandomCase(word));
    password = modifiedWords.join(separator);

    // Add a random number if enabled
    if (includeNumbers) {
        const number = Math.floor(Math.random() * 100).toString();
        // Check if adding the number will exceed the max length
        if (password.length + number.length <= maxLength) {
             password += number;
        }
    }

    // Add a random symbol if enabled
    if (includeSymbols && password.length < maxLength) {
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        password += randomSymbol;
    }

    passwordDisplay.textContent = password;
}

/**
 * Copies the generated password to the clipboard and shows a success message.
 */
function copyToClipboard() {
    const password = passwordDisplay.textContent;
    if (password === 'Click Generate' || password.length === 0) {
        return;
    }
    
    // Use document.execCommand for better compatibility in iframes
    const tempInput = document.createElement('textarea');
    tempInput.value = password;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    // Show and hide the message box
    messageBox.classList.remove('hidden');
    messageBox.offsetHeight; // Trigger reflow to enable transition
    messageBox.classList.remove('opacity-0');
    setTimeout(() => {
        messageBox.classList.add('opacity-0');
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 300); // Wait for fade-out to complete before hiding
    }, 1500);
}

// Generate an initial password on page load
generatePassword();
