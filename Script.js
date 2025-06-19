class ScribbleWriterApp {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.clearButton = document.getElementById('clearBtn');
        this.recognizeButton = document.getElementById('recognizeButton');
        this.recognizedTextElement = document.getElementById('recognizedText');
        this.loadingIndicator = document.getElementById('processingIndicator');
        this.errorMessageElement = document.getElementById('errorMessage');
        this.copyButton = document.getElementById('copyBtn');
        this.saveButton = document.getElementById('saveBtn');
        this.autoToggleButton = document.getElementById('autoToggle');
        this.liveBadge = document.getElementById('liveBadge');
        this.suggestionBox = document.getElementById('suggestionBox');
        this.suggestionsContainer = document.getElementById('suggestionsContainer');
        this.historyList = document.getElementById('historyList');
        this.recognitionHistorySection = document.getElementById('recognitionHistory');

        this.penToolButton = document.getElementById('penTool');
        this.brushToolButton = document.getElementById('brushTool');
        this.eraserToolButton = document.getElementById('eraserTool');
        this.colorPicker = document.getElementById('colorPicker');
        this.sizeSlider = document.getElementById('sizeSlider');
        this.sizeDisplay = document.getElementById('sizeDisplay');
        this.fontSelector = document.getElementById('fontSelector');
        this.languageSelector = document.getElementById('languageSelector');
        this.translateButton = document.getElementById('translateBtn');
        this.formatSelector = document.getElementById('formatSelector');
        this.applyFormatButton = document.getElementById('applyFormatBtn');

        this.apiUrl = window.location.origin;
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.currentSize = 8;
        this.lastX = 0;
        this.lastY = 0;
        this.autoRecognition = true;
        this.recognitionTimeout = null;
        this.lastCanvasState = null;
        this.currentRecognizedText = "";
        this.recognitionDelay = 1500; 
        this.drawingDataPresent = false; 
        this.initializeCanvas();
        this.setupEventListeners();
        this.setupTools();
        this.setInitialUIState(); 
    }

    initializeCanvas = () => { 
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.offsetWidth;
        this.canvas.height = parent.offsetHeight || 500;

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentSize;
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveCanvasState();
        this.drawingDataPresent = false; 
        window.addEventListener('resize', () => {
            const imageData = this.canvas.toDataURL(); 
            const currentParent = this.canvas.parentElement;
            this.canvas.width = currentParent.offsetWidth;
            this.canvas.height = currentParent.offsetHeight || 500; 
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                this.saveCanvasState();
                if (this.autoRecognition && this.drawingDataPresent && this.hasCanvasChanged()) {
                    this.scheduleRecognition();
                }
            };
            img.src = imageData;
        });
    }
    saveCanvasState = () => {
        this.lastCanvasState = this.canvas.toDataURL();
    }
    hasCanvasChanged = () => {
        return this.lastCanvasState !== this.canvas.toDataURL();
    }
    scheduleRecognition = () => {
        console.log("scheduleRecognition called. autoRecognition:", this.autoRecognition, "drawingDataPresent:", this.drawingDataPresent); 
        if (!this.autoRecognition || !this.drawingDataPresent) return;
        if (this.recognitionTimeout) {
            clearTimeout(this.recognitionTimeout);
        }
        this.recognitionTimeout = setTimeout(async () => {
            console.log("Recognition timeout triggered. hasCanvasChanged:", this.hasCanvasChanged()); 
            if (this.hasCanvasChanged()) {
                await this.performRecognition();
                this.saveCanvasState(); 
            }
        }, this.recognitionDelay);
    }

    setupEventListeners = () => {
      
        this.canvas.addEventListener('mousedown', this.startDrawing);
        this.canvas.addEventListener('mousemove', this.draw);
        this.canvas.addEventListener('mouseup', this.stopDrawing);
        this.canvas.addEventListener('mouseout', this.stopDrawing);
        this.canvas.addEventListener('touchstart', this.handleTouch);
        this.canvas.addEventListener('touchmove', this.handleTouch);
        this.canvas.addEventListener('touchend', this.stopDrawing);
        this.canvas.addEventListener('touchcancel', this.stopDrawing);
        this.clearButton.addEventListener('click', this.clearCanvas);
        this.recognizeButton.addEventListener('click', this.performRecognition);
        this.copyButton.addEventListener('click', this.copyText);
        this.saveButton.addEventListener('click', this.saveDrawing);
    }
    handleTouch = (e) => {
        e.preventDefault(); 
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(
            e.type === 'touchstart' ? 'mousedown' :
            e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true,
                cancelable: true
            }
        );
        this.canvas.dispatchEvent(mouseEvent);
    }

    setupTools = () => {
        this.penToolButton.addEventListener('click', () => this.selectTool('pen'));
        this.brushToolButton.addEventListener('click', () => this.selectTool('brush'));
        this.eraserToolButton.addEventListener('click', () => this.selectTool('eraser'));
        this.autoToggleButton.addEventListener('click', this.toggleAutoRecognition);
        this.colorPicker.addEventListener('change', (e) => {
            this.currentColor = e.target.value;
            this.ctx.strokeStyle = this.currentTool === 'eraser' ? 'white' : this.currentColor;
        });
        this.sizeSlider.addEventListener('input', (e) => {
            this.currentSize = parseInt(e.target.value, 10);
            this.sizeDisplay.textContent = this.currentSize;
            this.ctx.lineWidth = this.currentSize;
        });
        this.sizeDisplay.textContent = this.currentSize;
        this.fontSelector.addEventListener('change', (e) => {
            this.recognizedTextElement.style.fontFamily = `'${e.target.value}', sans-serif`;
            this.recognizedTextElement.classList.forEach(className => {
                if (className.startsWith('font-')) {
                    this.recognizedTextElement.classList.remove(className);
                }
            });
            const fontClass = 'font-' + e.target.value.toLowerCase().replace(/\s/g, '-');
            this.recognizedTextElement.classList.add(fontClass);
        });
        this.translateButton.addEventListener('click', async () => {
            const targetLanguage = this.languageSelector.value;
            if (this.currentRecognizedText && targetLanguage !== 'en') {
                this.showProcessing('Translating text...');
                try {
                    const translatedText = await this.callBackendAPI('/translate-text', { text: this.currentRecognizedText, targetLanguage: targetLanguage });
                    this.displayRecognitionResults(translatedText.translatedText);
                    this.addHistoryItem(`Translated to ${targetLanguage}: "${translatedText.translatedText}"`);
                } catch (error) {
                    console.error('Translation error:', error);
                    this.showError('Translation failed. Please check backend logs for details or try again.');
                } finally {
                    this.hideProcessing();
                }
            } else if (targetLanguage === 'en' && this.currentRecognizedText) {
                this.displayRecognitionResults(this.currentRecognizedText); 
                this.addHistoryItem(`Reverted to English: "${this.currentRecognizedText}"`);
            } else {
                this.showError('No text to translate.');
            }
        });
        this.applyFormatButton.addEventListener('click', async () => {
            const formatStyle = this.formatSelector.value;
            if (this.currentRecognizedText && formatStyle !== 'none') {
                this.showProcessing(`Applying ${formatStyle} formatting...`);
                try {
                    const formattedResponse = await this.callBackendAPI('/format-text', { text: this.currentRecognizedText, format: formatStyle });
                    let formattedText = formattedResponse.formattedText;
                    let htmlContent = formattedText;
                    if (formatStyle === 'bullet-list') {
                        htmlContent = `<ul>${formattedText.split('\n').filter(line => line.trim().startsWith('* ')).map(line => `<li>${line.replace(/^\* /, '').trim()}</li>`).join('')}</ul>`;
                    } else if (formatStyle === 'numbered-list') {
                        htmlContent = `<ol>${formattedText.split('\n').filter(line => line.match(/^\d+\.\s/)).map(line => `<li>${line.replace(/^\d+\.\s/, '').trim()}</li>`).join('')}</ol>`;
                    } else if (formatStyle === 'paragraph') {
                        htmlContent = formattedText.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('');
                    }
                    this.recognizedTextElement.innerHTML = htmlContent;
                    this.recognizedTextElement.classList.add('has-content');
                    this.addHistoryItem(`Applied ${formatStyle} format`);
                } catch (error) {
                    console.error('Formatting error:', error);
                    this.showError('Formatting failed. Please try again.');
                } finally {
                    this.hideProcessing();
                }
            } else if (formatStyle === 'none' && this.currentRecognizedText) {
                this.recognizedTextElement.innerHTML = this.currentRecognizedText.replace(/\n/g, '<br>');
                this.recognizedTextElement.classList.remove('has-content');
                this.addHistoryItem('Removed formatting');
            } else {
                this.showError('No text to format.');
            }
        });
    }
    startDrawing = (e) => {
        this.isDrawing = true;
        this.recognizeButton.disabled = false; 
        this.ctx.beginPath();
        const { x, y } = this.getMousePos(e);
        this.lastX = x;
        this.lastY = y;
        this.ctx.moveTo(this.lastX, this.lastY);
        this.drawingDataPresent = true; 
        console.log("Drawing started, drawingDataPresent set to true."); 
    }
    draw = (e) => {
        if (!this.isDrawing) return;

        e.preventDefault();
        const { x, y } = this.getMousePos(e);

        this.ctx.strokeStyle = this.currentTool === 'eraser' ? 'white' : this.currentColor;
        this.ctx.lineWidth = this.currentSize;

        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        this.lastX = x;
        this.lastY = y;

        this.scheduleRecognition(); 
    }
    stopDrawing = () => {
        this.isDrawing = false;
        this.ctx.closePath();
        this.saveCanvasState(); 
    }
    getMousePos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    clearCanvas = () => {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.recognizedTextElement.textContent = "Start writing on the canvas!";
        this.recognizedTextElement.classList.remove('has-content');
        this.currentRecognizedText = "";
        this.hideError();
        this.hideProcessing();
        this.recognizeButton.disabled = true; 
        this.copyButton.disabled = true;
        this.suggestionBox.style.display = 'none'; 
        this.historyList.innerHTML = ''; 
        this.saveCanvasState(); 
        this.addHistoryItem('Canvas cleared.');
        this.drawingDataPresent = false; 
        console.log("Canvas cleared, drawingDataPresent set to false."); 
    }
    saveDrawing = () => {
        const dataURL = this.canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'scribble_drawing.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.addHistoryItem('Drawing saved.');
    }
    copyText = () => {
        const textarea = document.createElement('textarea');
        textarea.value = this.currentRecognizedText;
        textarea.style.position = 'fixed'; 
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            const successful = document.execCommand('copy'); 
            if (successful) {
                this.addHistoryItem('Recognized text copied to clipboard!');
            } else {
                this.showError('Failed to copy text.');
            }
        } catch (err) {
            this.showError('Error copying text: ' + err);
        } finally {
            document.body.removeChild(textarea);
        }
    }
    selectTool = (tool) => {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tool + 'Tool').classList.add('active');
        
        this.canvas.style.cursor = tool === 'eraser' ? 'grab' : 'crosshair';

        if (tool === 'eraser') {
            this.ctx.strokeStyle = 'white'; 
        } else {
            this.ctx.strokeStyle = this.currentColor; 
        }
        this.ctx.lineWidth = this.currentSize;
    }
    toggleAutoRecognition = () => {
        this.autoRecognition = !this.autoRecognition;
        
        if (this.autoRecognition) {
            this.autoToggleButton.textContent = '🔍 Auto Recognition: ON';
            this.autoToggleButton.classList.add('active');
            this.liveBadge.style.display = 'block';
            if (this.drawingDataPresent) {
                this.scheduleRecognition();
            }
            this.addHistoryItem('Auto Recognition: ON');
            console.log("Auto Recognition ON."); 
        } else {
            this.autoToggleButton.textContent = '🔍 Auto Recognition: OFF';
            this.autoToggleButton.classList.remove('active');
            this.liveBadge.style.display = 'none';
            if (this.recognitionTimeout) {
                clearTimeout(this.recognitionTimeout);
                this.recognitionTimeout = null;
            }
            this.addHistoryItem('Auto Recognition: OFF');
            console.log("Auto Recognition OFF."); 
        }
    }
    callBackendAPI = async (endpoint, payload) => {
        const response = await fetch(`${this.apiUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        return response.json();
    }
    performRecognition = async () => {
        if (!this.drawingDataPresent) {
            this.displayRecognitionResults("Draw something on the canvas first!");
            console.log("Attempted recognition on empty canvas. Aborting."); 
            return;
        }

        this.showProcessing('Analyzing handwriting...');
        this.hideError();
        this.recognizedTextElement.classList.add('live-updating');
        this.copyButton.disabled = true;
        this.suggestionBox.style.display = 'none'; 

        try {
            const imageData = this.canvas.toDataURL('image/png');
            console.log("Sending image data to /recognize-handwriting endpoint."); 
            const data = await this.callBackendAPI('/recognize-handwriting', { imageData: imageData });
            
            const recognizedText = data.recognizedText;

            this.displayRecognitionResults(recognizedText);
            this.currentRecognizedText = recognizedText;
            this.copyButton.disabled = !recognizedText || recognizedText === "Unrecognized text";

            if (recognizedText && recognizedText !== "Unrecognized text") {
                this.addHistoryItem(`Recognized: "${recognizedText}"`);
            } else if (recognizedText === "Unrecognized text") {
                 this.addHistoryItem(`Recognized: "Unrecognized text"`);
                 await this.getSuggestionsForUnrecognizedText();
            }
            console.log("Recognized Text:", recognizedText);

        } catch (error) {
            console.error('Frontend recognition error:', error);
            this.showError(`Recognition failed: ${error.message}`);
            this.displayRecognitionResults("Error recognizing text.");
            this.copyButton.disabled = true;
            this.addHistoryItem(`Recognition failed.`);
        } finally {
            this.hideProcessing();
            this.recognizedTextElement.classList.remove('live-updating');
            this.recognizeButton.disabled = !this.drawingDataPresent; 
        }
    }
    getSuggestionsForUnrecognizedText = async () => {
        try {
            const imageData = this.canvas.toDataURL('image/png');
            console.log("Sending image data to /get-suggestions endpoint."); 
            const suggestionsData = await this.callBackendAPI('/get-suggestions', { imageData: imageData, currentRecognizedText: this.currentRecognizedText });
            
            const suggestions = suggestionsData.suggestions || [];
            if (suggestions.length > 0) {
                this.showSuggestions(suggestions);
            } else {
                this.showSuggestions(["Try again", "Clear and retry"]); 
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            this.showSuggestions(["Try again", "Clear and retry"]);
        }
    }
    displayRecognitionResults = (text) => {
        this.recognizedTextElement.textContent = text;
        this.recognizedTextElement.classList.toggle('has-content', !!text && text !== "Unrecognized text");
        this.recognizedTextElement.style.color = '#333';
        if (text === "Unrecognized text") {
            this.recognizedTextElement.style.color = 'red';
        }
    }
    showProcessing = (message) => {
        this.loadingIndicator.querySelector('span').textContent = message;
        this.loadingIndicator.style.display = 'flex';
    }
    hideProcessing = () => {
        this.loadingIndicator.style.display = 'none';
    }
    showError = (message) => {
        this.errorMessageElement.textContent = message;
        this.errorMessageElement.style.display = 'block';
    }
    hideError = () => {
        this.errorMessageElement.style.display = 'none';
    }
    setInitialUIState = () => {
        this.hideProcessing();
        this.hideError();
        this.recognizedTextElement.textContent = "Start writing on the canvas!";
        this.recognizeButton.disabled = true; 
        this.copyButton.disabled = true;
        this.suggestionBox.style.display = 'none';
        this.historyList.innerHTML = '';
        this.recognitionHistorySection.style.display = 'block'; 
    }
    addHistoryItem = (message) => {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newItem = document.createElement('div');
        newItem.classList.add('history-item');
        newItem.textContent = `${time}: ${message}`;
        if (this.historyList.firstChild) {
            this.historyList.insertBefore(newItem, this.historyList.firstChild);
        } else {
            this.historyList.appendChild(newItem);
        }
        this.recognitionHistorySection.style.display = 'block';
    }
    showSuggestions = (suggestions) => {
        this.suggestionsContainer.innerHTML = '';
        suggestions.forEach(suggestion => {
            const btn = document.createElement('button');
            btn.classList.add('suggestion-btn');
            btn.textContent = suggestion;
            btn.addEventListener('click', () => {
                this.applySuggestion(suggestion);
            });
            this.suggestionsContainer.appendChild(btn);
        });
        const tryAgainBtn = document.createElement('button');
        tryAgainBtn.classList.add('suggestion-btn', 'try-again');
        tryAgainBtn.textContent = 'Try again';
        tryAgainBtn.addEventListener('click', () => this.performRecognition());
        this.suggestionsContainer.appendChild(tryAgainBtn);
        const clearAndRetryBtn = document.createElement('button');
        clearAndRetryBtn.classList.add('suggestion-btn', 'clear-and-retry');
        clearAndRetryBtn.textContent = 'Clear and retry';
        clearAndRetryBtn.addEventListener('click', () => {
            this.clearCanvas();
            this.hideSuggestions();
        });
        this.suggestionsContainer.appendChild(clearAndRetryBtn);

        this.suggestionBox.style.display = 'flex';
    }
    hideSuggestions = () => {
        this.suggestionBox.style.display = 'none';
    }
    applySuggestion = (suggestion) => {
        this.recognizedTextElement.textContent = `Applied suggestion: "${suggestion}"`;
        this.currentRecognizedText = suggestion;
        this.displayRecognitionResults(suggestion); 
        this.addHistoryItem(`Applied suggestion: "${suggestion}"`); 
        this.hideSuggestions(); 
        this.copyButton.disabled = false; 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ScribbleWriterApp();
});
