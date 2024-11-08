// DOM Elements
const btn = document.querySelector('.talk');
const content = document.querySelector('.content');
let isListening = false;
let currentUtterance = null;
let userLocation = null;

// Add microphone icon to the button
const micIcon = document.createElement('i');
micIcon.className = 'fas fa-microphone';
btn.appendChild(micIcon);

// API Keys
const GEMINI_API_KEY = 'AIzaSyC_CohD_uCGZovkfBnqHzjH3bQxxuN3OJo'; // Replace with your API key
const OPENWEATHER_API_KEY = 'b76ef054e6fa51739f614769d942f8d9'; // Replace with your OpenWeather API key
const APILAYER_KEY = 'f1DG9ydnspULnEIfw61xZ98z07K6btHG'; // APILayer API Key for Language Detection and Translation

// API Endpoints
const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const languageDetectionEndpoint = 'https://api.apilayer.com/language_translation/detect';
const translationEndpoint = 'https://api.apilayer.com/language_translation/translate';

// Add status indicator to the DOM
const statusIndicator = document.createElement('div');
statusIndicator.className = 'status-indicator';
document.querySelector('.main').appendChild(statusIndicator);

// Add wave animation container
const waveContainer = document.createElement('div');
waveContainer.className = 'wave-container';
for (let i = 0; i < 4; i++) {
    const wave = document.createElement('div');
    wave.className = 'wave';
    waveContainer.appendChild(wave);
}
document.querySelector('.input').appendChild(waveContainer);

// Initialize Location
async function initializeLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    };
                    showStatus('Location accessed successfully', 2000);
                    resolve(userLocation);
                },
                error => {
                    console.error('Error getting location:', error);
                    showStatus('Could not access location. Please enable location services.', 3000);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            showStatus('Geolocation is not supported by this browser', 3000);
            reject(new Error('Geolocation not supported'));
        }
    });
}

// Language Detection Function
async function detectLanguage(text) {
    try {
        const response = await fetch(languageDetectionEndpoint, {
            method: 'POST',
            headers: { 'apikey': APILAYER_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text })
        });
        if (!response.ok) throw new Error(`Language Detection API returned status: ${response.status}`);
        const data = await response.json();
        return data.language_code;
    } catch (error) {
        console.error('Error detecting language:', error);
        return null;
    }
}

// Translation Function
async function translateText(text, targetLang) {
    try {
        const response = await fetch(translationEndpoint, {
            method: 'POST',
            headers: { 'apikey': APILAYER_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, target_language: targetLang })
        });
        if (!response.ok) throw new Error(`Translation API returned status: ${response.status}`);
        const data = await response.json();
        return data.translation_text;
    } catch (error) {
        console.error('Error translating text:', error);
        return text;
    }
}

// Weather Functions
async function getWeather() {
    try {
        if (!userLocation) {
            userLocation = await initializeLocation();
        }
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.lat}&lon=${userLocation.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        if (!response.ok) throw new Error(`Weather API returned status: ${response.status}`);
        const data = await response.json();
        return `The current weather in ${data.name} is ${data.weather[0].description} with a temperature of ${Math.round(data.main.temp)}°C. The humidity is ${data.main.humidity}% and wind speed is ${data.wind.speed} meters per second.`;
    } catch (error) {
        console.error('Error fetching weather:', error);
        return "I need permission to access your location for weather information. Please enable location services and try again.";
    }
}

async function getWeatherForecast() {
    try {
        if (!userLocation) {
            userLocation = await initializeLocation();
        }
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${userLocation.lat}&lon=${userLocation.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        if (!response.ok) throw new Error(`Weather API returned status: ${response.status}`);
        const data = await response.json();
        let forecast = "Here's the weather forecast: ";
        const uniqueDays = new Set();
        for (const item of data.list) {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'long' });
            if (!uniqueDays.has(day) && uniqueDays.size < 3) {
                uniqueDays.add(day);
                forecast += `${day}: ${item.weather[0].description} with a high of ${Math.round(item.main.temp_max)}°C. `;
            }
        }
        return forecast;
    } catch (error) {
        console.error('Error fetching forecast:', error);
        return "I'm having trouble accessing the weather forecast. Please make sure location services are enabled.";
    }
}

// Speech Functions
function speak(sentence, lang = 'en-US') {
    window.speechSynthesis.cancel();
    const text_speak = new SpeechSynthesisUtterance(sentence);
    text_speak.lang = lang;
    text_speak.rate = 1;
    text_speak.pitch = 1;
    currentUtterance = text_speak;
    waveContainer.classList.add('active');
    text_speak.onend = () => {
        waveContainer.classList.remove('active');
        currentUtterance = null;
    };
    window.speechSynthesis.speak(text_speak);
}

// Status Indicator Function
function showStatus(message, duration = 2000) {
    statusIndicator.textContent = message;
    statusIndicator.classList.add('visible');
    setTimeout(() => {
        statusIndicator.classList.remove('visible');
    }, duration);
}

// Greetings
function wishMe() {
    const hr = new Date().getHours();
    let greeting;
    if (hr >= 0 && hr < 12) greeting = "Good Morning Devanarayanan";
    else if (hr === 12) greeting = "Good Noon Boss";
    else if (hr > 12 && hr <= 17) greeting = "Good Afternoon Devanarayanan";
    else greeting = "Good Evening Devanarayanan";
    speak(greeting);
}

// Initialize Jarvis
window.addEventListener('load', async () => {
    speak("Activating Jarvis");
    try {
        await initializeLocation();
        setTimeout(() => speak("Going online"), 1500);
        setTimeout(wishMe, 3000);
    } catch {
        speak("I'm online, but I'll need location permission for weather features.");
    }
});

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;

recognition.onstart = () => {
    isListening = true;
    btn.classList.add('listening');
    showStatus('Listening...');
    if (currentUtterance) {
        window.speechSynthesis.cancel();
        waveContainer.classList.remove('active');
    }
};

recognition.onend = () => {
    isListening = false;
    btn.classList.remove('listening');
    showStatus('Stopped listening');
};

recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    content.textContent = transcript; // Display spoken text

    // Detect language
    const detectedLang = await detectLanguage(transcript);
    let responseText = '';

    // Handle response based on detected language
    if (detectedLang === 'ml') {
        responseText = await handleResponse(transcript, 'ml');
        speak(responseText, 'ml-IN'); // Speak in Malayalam
    } else {
        responseText = await handleResponse(transcript, 'en');
        speak(responseText, 'en-US'); // Speak in English
    }
};

recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    showStatus('Error: ' + event.error);
    btn.classList.remove('listening');
};

// Toggle speech recognition
btn.addEventListener('click', () => {
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
});

// Response handling for both languages
async function handleResponse(message, lang) {
    let response;
    if (message.includes(lang === 'ml' ? 'കാലാവസ്ഥ' : 'weather')) {
        response = await getWeather();
    } else if (message.includes(lang === 'ml' ? 'കാലാവസ്ഥ പ്രവചനം' : 'forecast')) {
        response = await getWeatherForecast();
    } else if (message.includes(lang === 'ml' ? 'നിങ്ങളുടെ പേര്' : 'what is your name') || message.includes('who are you')) {
        response = "I am Jarvis. Would you like to know more about my developer?";
        window.waitingForDevInfo = true;
    } else if (window.waitingForDevInfo && (message.includes('yes') || message.includes('sure'))) {
        response = "I was developed by Devanarayanan, a B.Tech student specializing in Robotics and Automation with a strong background in front-end development...";
        window.waitingForDevInfo = false;
    } else if (window.waitingForDevInfo && (message.includes('no') || message.includes('nope'))) {
        response = "Alright, let me know if you need anything else.";
        window.waitingForDevInfo = false;
    } else if (message.includes('open google')) {
        window.open("https://google.com", "_blank");
        response = "Opening Google";
    } else if (message.includes('open youtube')) {
        window.open("https://youtube.com", "_blank");
        response = "Opening YouTube";
    } else {
        response = await askGemini(message); // Default Gemini AI response
    }

    return lang === 'ml' ? await translateText(response, 'ml') : response;
}

// Gemini AI Integration
async function askGemini(prompt) {
    try {
        const contextualPrompt = `Respond to: ${prompt}`;
        const response = await fetch(`${geminiEndpoint}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: contextualPrompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
            })
        });
        if (!response.ok) throw new Error(`Gemini API returned status: ${response.status}`);
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error calling Gemini:', error);
        return "I'm having trouble connecting to my AI systems. Please try again.";
    }
}
