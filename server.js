const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const port = 8000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware to check API key
const checkApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'API key is required' });
    }
    next();
};

// Get available voices
app.get('/voices', checkApiKey, async (req, res) => {
    try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: {
                'xi-api-key': req.headers['x-api-key']
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch voices');
        }
        
        const data = await response.json();
        res.json(data.voices);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch voices' });
    }
});

// Generate speech
app.post('/generate-speech', checkApiKey, async (req, res) => {
    try {
        const { text, voiceId, stability, similarity_boost, style, speed } = req.body;
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': req.headers['x-api-key'],
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability,
                    similarity_boost,
                    style,
                    speed
                }
            })
        });

        if (!response.ok) {
            throw new Error('Speech generation failed');
        }

        const audioBuffer = await response.buffer();
        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
