# Scribble_Writer
**Turn your handwriting into digital text, instantly.**

Scribble Writer is an innovative web application that bridges the gap between traditional handwriting and modern digital content. Write naturally on a digital canvas, and watch as your scribbles are transformed into editable, translatable, and format-able text, powered by advanced AI.

## ✨ Features

* Real-time Handwriting Recognition: Converts your handwritten input into digital text as you write, or on demand.
* Intelligent Suggestions: Offers plausible word or character suggestions for ambiguous handwriting.
* Text Translation: Translate recognized text into various languages (e.g., Spanish, French, Hindi, Telugu).
* Text Formatting: Reformat your text into bullet lists, numbered lists, or coherent paragraphs.
* Customizable Drawing Tools: Choose between a pen, brush, or eraser, with adjustable colors and sizes.
* History Tracking: Keep a record of your recognition events.
* Save & Copy: Save your drawings as PNG images or copy recognized text to your clipboard.

## 🚀 How It Works

Scribble Writer operates as a full-stack web application:

* Frontend: Built with HTML, CSS, and JavaScript, it provides the interactive drawing canvas and user interface. Your handwriting on the canvas is converted into an image data URL.
* Backend: A Node.js Express.js server receives the image data from the frontend. It then sends this data to a powerful Google AI model (via API) for handwriting recognition. For translation and formatting tasks, the recognized text is sent back to the same Google AI model. The results are then returned to the frontend for display.

## 🛠️ Technologies Used

Scribble Writer is built with:

Frontend:
* HTML5
* CSS3
* JavaScript (ES6+)

Backend:
* Node.js
* Express.js

APIs & Cloud Services:
* Google Generative AI API (via `@google/generative-ai` SDK): Powers all AI functionalities (handwriting recognition, translation, formatting, suggestions). This API leverages sophisticated deep learning models provided by Google Cloud Platform.
    * Note: This project does not use AWS services.

Other Tools:
* `dotenv`: For secure environment variable management (e.g., `GEMINI_API_KEY`).
* `cors`: Node.js middleware for enabling cross-origin requests between frontend and backend.

## ⚙️ Setup and Installation

Follow these steps to get Scribble Writer up and running on your local machine.

### Prerequisites

* Node.js (LTS version recommended)
* npm (usually comes with Node.js)
* A Google Cloud Project with the Generative Language API enabled.
* A `GEMINI_API_KEY` obtained from Google AI Studio or Google Cloud Console.

### Steps

1.  **Clone the repository:**
    ```
    git clone <your-repository-url>
    cd Scribble_Writer
    ```

2.  **Set up the backend:**
    ```
    cd backend
    npm install
    ```

3.  **Create a `.env` file in the `backend` directory:**
    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
    * **Replace `YOUR_API_KEY_HERE`** with your actual Google Generative AI API key.

4.  **Go back to the root directory (if you're still in `backend`):**
    ```
    cd ..
    ```
    (No installation needed for `frontend` as it's pure HTML/CSS/JS)

5.  **Start the backend server:**
    ```
    cd backend
    node server.js
    ```
    You should see:
    ```
    Server listening on 3000
    Access your application at http://localhost:3000
    ```

6.  **Open the frontend in your browser:**
    Navigate to `http://localhost:3000` in your web browser.

## 🚀 Usage

1.  **Draw on the Canvas:** Use your mouse or touch screen to write or draw anything in the large white canvas area.
2.  **Auto Recognition:** The application will attempt to automatically recognize your handwriting after a short pause (around 1.5 seconds) and display the text in the "Live Recognition" box.
3.  **Manual Recognition:** Click the "✨ Recognize Now" button to manually trigger handwriting recognition.
4.  **Tools:** Select "Pen", "Brush", or "Eraser" from the toolbar. Adjust color and size using the respective controls.
5.  **Translate Text:** Enter text (or let it recognize your handwriting), choose a target language from the "Translate To" dropdown, and click "🌐 Translate Text".
6.  **Format Text:** Enter text (or use recognized text), select a format (Bullet List, Numbered List, Paragraph) from the "Format As" dropdown, and click "✨ Apply Format".
7.  **Copy/Save:** Use the "📋 Copy Text" button to copy the recognized text to your clipboard, or "💾 Save Drawing" to download your canvas as a PNG image.
8.  **Clear Canvas:** Click "🗑️ Clear Canvas" to erase everything and start fresh.
9.  **Recognition History:** View a log of recognized text in the history section.
10. **Suggestions:** If text is "Unrecognized," the app will provide plausible suggestions to choose from.

## 🐛 Troubleshooting

* **"Translation failed..." or Backend Errors:**
    * Ensure your `GEMINI_API_KEY` in `backend/.env` is correct.
    * **STOP** your backend server (`Ctrl+C`), **SAVE** the `backend/server.js` file with the latest code (especially ensuring `textModel` uses `gemini-1.5-flash`), and then **RESTART** the server (`node server.js`).
    * Check your backend terminal for detailed error logs.
* **Auto Recognition Not Working / Frontend Issues:**
    * **Hard Refresh your browser:** On `http://localhost:3000`, press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac).
    * **Clear browser cache:** Go to browser settings > privacy/security > clear browsing data, and select "Cached images and files." Then close and reopen the tab.
    * Open your browser's **Developer Console (F12)** and check the "Console" tab for any red JavaScript errors.

## 🧠 Deep Learning

This project *indirectly* utilizes deep learning. The core AI functionalities (handwriting recognition, translation, formatting, and suggestions) are powered by advanced **Google Generative AI models** (like `gemini-1.5-flash`). These models themselves are built using sophisticated deep learning techniques, such as convolutional neural networks for image understanding and transformer architectures for natural language processing. While you are not implementing deep learning algorithms directly, you are leveraging their power through the provided APIs.

## 🛣️ What's Next for Scribble Writer

* Advanced Formatting: More text styling options (bold, italics, etc.).
* Drawing Layers: Support for multiple layers on the canvas for more complex drawings.
* Cloud Storage & User Accounts: Integrate a database (e.g., Firestore) to save user data and drawings to the cloud.
* Real-time Collaboration: Allow multiple users to work on the same canvas simultaneously.
* Improved AI Accuracy: Continuous refinement of AI prompts for better recognition and suggestions.
* More Export Options: Export to PDF or editable document formats.
* Offline Mode: Explore limited functionality even without an internet connection.
