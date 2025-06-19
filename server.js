require('dotenv').config(); 

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai'); 
const cors = require('cors');
const path = require('path'); 

const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in the .env file. Please provide your API key.');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); 
app.use(express.static(path.join(__dirname, '../frontend')));
function base64ToGenerativePart(dataUrl) {
    const parts = dataUrl.split(';');
    const mimeType = parts[0].split(':')[1];
    const base64Data = parts[1].split(',')[1];
    
    return {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };
}
app.post('/recognize-handwriting', async (req, res) => {
    try {
        const { imageData } = req.body;

        if (!imageData) {
            return res.status(400).json({ error: 'No image data provided.' });
        }

        const imagePart = base64ToGenerativePart(imageData);

        const prompt = `Transcribe ONLY the clearly visible, distinct handwritten text in the image. Be absolutely literal and precise. For cursive or connected handwriting, transcribe characters ONLY if they are unambiguously distinguishable. If the visual evidence for a character or word is weak or ambiguous, DO NOT guess, infer, or fabricate common phrases (e.g., "Hello World", "Good morning", "This is a test"). Instead, transcribe only what you are reasonably confident in, character by character. If no distinct characters or words are clearly discernible from the drawing, return "Unrecognized text". Provide only the transcribed text, without any additional conversational preambles, markdown, or extra characters.`;

        const result = await visionModel.generateContent([prompt, imagePart]);
        const response = await result.response;
        let recognizedText = response.text().trim();

        let confidence = 0.0;
        if (recognizedText && recognizedText !== "Unrecognized text") {
            confidence = 0.9; 
        } else if (recognizedText === "Unrecognized text") {
            confidence = 0.1; 
        }

        res.json({ recognizedText: recognizedText, confidence: confidence });

    } catch (error) {
        console.error('Error during handwriting recognition with Gemini API:', error);
        if (error.response && error.response.error) {
            console.error('Gemini API Error details:', error.response.error);
        }
        res.status(500).json({ error: `Handwriting recognition failed: ${error.message}. Please check your Gemini API key, network, or try with clearer handwriting.` });
    }
});
app.post('/translate-text', async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        if (!text || !targetLanguage) {
            return res.status(400).json({ error: 'Text and target language are required for translation.' });
        }

        const prompt = `Translate the following English text to ${targetLanguage}. Return only the translated text, no preamble or extra characters:\n\n"${text}"`;
        const result = await textModel.generateContent(prompt);
        const response = await result.response;
        const translatedText = response.text().trim();

        res.json({ translatedText: translatedText });

    } catch (error) {
        console.error('Error during translation with Gemini API:');
        console.error('  Request Text:', req.body.text);
        console.error('  Target Language:', req.body.targetLanguage);
        if (error.response && error.response.error) {
            console.error('  Gemini API Error details:', error.response.error);
        }
        console.error('  Full Error Object:', error); 
        res.status(500).json({ error: `Translation failed: ${error.message}.` });
    }
});
app.post('/format-text', async (req, res) => {
    try {
        const { text, format } = req.body;
        if (!text || !format) {
            return res.status(400).json({ error: 'Text and format style are required for formatting.' });
        }

        let prompt;
        if (format === 'bullet-list') {
            prompt = `Reformat the following text as a bulleted list. Each item should start with an asterisk (*). Return only the formatted list:\n\n"${text}"`;
        } else if (format === 'numbered-list') {
            prompt = `Reformat the following text as a numbered list. Each item should start with a number followed by a period (e.g., 1., 2.). Return only the formatted list:\n\n"${text}"`;
        } else {
            return res.status(400).json({ error: 'Invalid format style provided.' });
        }

        const result = await textModel.generateContent(prompt);
        const response = await result.response;
        const formattedText = response.text().trim();

        res.json({ formattedText: formattedText });

    } catch (error) {
        console.error('Error during formatting with Gemini API:', error);
        res.status(500).json({ error: `Formatting failed: ${error.message}.` });
    }
});
app.post('/get-suggestions', async (req, res) => {
    try {
        const { imageData } = req.body; 
        if (!imageData) {
            return res.status(400).json({ error: 'Image data is required for suggestions.' });
        }

        const imagePart = base64ToGenerativePart(imageData);

        const visionDescriptionPrompt = `Describe the handwritten content in this image purely by its visual characteristics (lines, curves, angles, loops, strokes). Do not interpret it as text or provide any words. Be objective and literal. Examples: "a single vertical line with a small loop at the top", "three connected humps", "a series of jagged horizontal strokes".`;
        const visionResult = await visionModel.generateContent([visionDescriptionPrompt, imagePart]);
        const visionResponse = await visionResult.response;
        const imageDescription = visionResponse.text().trim();

        const textSuggestionPrompt = `Given the literal visual description of a handwritten drawing: "${imageDescription}", and knowing that its interpretation as text was ambiguous, brainstorm 3 to 5 very common, simple English words or single letters that *could plausibly* be represented by *only* that literal drawing. Provide only a comma-separated list of these suggestions. Do not include common conversational phrases like "Hello World" or "Good morning" unless the visual description specifically depicts such words. Focus on basic characters or very short, simple words. Examples: "I, L, T, 1, 7", "cat, cut, cot", "run, ran, raw".`;
        const textResult = await textModel.generateContent(textSuggestionPrompt);
        const textResponse = await textResult.response;
        const suggestionRaw = textResponse.text().trim();

        const suggestions = suggestionRaw.split(',').map(s => s.trim()).filter(s => s.length > 0 && s.length <= 20);
        
        res.json({ suggestions: suggestions });

    } catch (error) {
        console.error('Error during suggestion generation with Gemini API:', error);
        res.status(500).json({ error: `Suggestion generation failed: ${error.message}.` });
    }
});
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Access your application at http://localhost:${PORT}`);
});
