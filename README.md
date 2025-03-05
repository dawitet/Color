# ቃላት (Kalat) - Amharic Wordle Game (Telegram Web App)

This is a Wordle-like word guessing game implemented as a Telegram Web App, using Amharic letters (Fidel).

## Features

*   Amharic keyboard with all seven orders of letters.
*   Five-color feedback system (green, yellow, gray, purple, blue).
*   Random word selection from a curated word list.
*   Integration with Telegram Web Apps (runs inside Telegram).
*   Bird animation for hints and feedback.
*   Daily word change.
*    Share results to Telegram.

## Setup and Installation (for Developers)

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
    (Replace `<repository-url>` with the actual URL of your repository).

2.  **Open `index.html`:** You can open the `index.html` file directly in a web browser to test the basic game functionality (without Telegram integration).

3.  **Telegram Bot Setup:**
    *   Create a Telegram bot using BotFather.
    *   Get the bot token.
    *   Set up a Google Cloud Function to handle webhook events from Telegram.  (Instructions for this will be provided later.)
    *   Configure the web app URL in your bot settings to point to your deployed Cloud Function.

4.  **Deployment (Google Cloud Functions):**
    *   Deploy the Google Cloud Function.
    *   Deploy the `index.html`, `style.css`, and `script.js` files to a web server (e.g., Firebase Hosting, Netlify, GitHub Pages).  The Telegram Web App needs to be served over HTTPS.

## Dependencies
*   [Telegram Web App JS](https://telegram.org/js/telegram-web-app.js)

## Contributing

Contributions are welcome!  Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature/fix.
3.  Make your changes.
4.  Commit your changes with clear commit messages.
5.  Push your branch to your fork.
6.  Submit a pull request to the main repository.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.