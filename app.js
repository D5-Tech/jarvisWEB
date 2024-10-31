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

// API Endpoints
const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Add status indicator to the DOM
const statusIndicator = document.createElement('div');
statusIndicator.className = 'status-indicator';
document.querySelector('.main').appendChild(statusIndicator);

// Add wave animation container
const waveContainer = document.createElement('div');
waveContainer.className = 'wave-container';
for(let i = 0; i < 4; i++) {
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

// Weather Functions
async function getWeather() {
    try {
        if (!userLocation) {
            // Try to get location if not already set
            userLocation = await initializeLocation();
        }

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.lat}&lon=${userLocation.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error(`Weather API returned status: ${response.status}`);
        }
        
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
        
        if (!response.ok) {
            throw new Error(`Weather API returned status: ${response.status}`);
        }
        
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
function speak(sentence) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const text_speak = new SpeechSynthesisUtterance(sentence);
    text_speak.rate = 1;
    text_speak.pitch = 1;
    
    // Store the current utterance
    currentUtterance = text_speak;
    
    // Show speaking animation
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

function wishMe() {
    const day = new Date();
    const hr = day.getHours();
    
    let greeting;
    if(hr >= 0 && hr < 12) {
        greeting = "Good Morning DEVA";
    } else if(hr === 12) {
        greeting = "Good Noon Boss";
    } else if(hr > 12 && hr <= 17) {
        greeting = "Good Afternoon DEVA";
    } else {
        greeting = "Good Evening DEVA";
    }
    
    speak(greeting);
}

// Initialize Jarvis
window.addEventListener('load', async () => {
    speak("Activating Jarvis");
    
    try {
        // Initialize location immediately
        await initializeLocation();
        
        setTimeout(() => {
            speak("Going online");
            setTimeout(wishMe, 1500);
        }, 1500);
    } catch (error) {
        console.error('Error during initialization:', error);
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
    
    // Cancel any ongoing speech when starting to listen
    if(currentUtterance) {
        window.speechSynthesis.cancel();
        waveContainer.classList.remove('active');
    }
};

recognition.onend = () => {
    isListening = false;
    btn.classList.remove('listening');
    showStatus('Stopped listening');
};

recognition.onresult = (event) => {
    const current = event.resultIndex;
    const transcript = event.results[current][0].transcript;
    content.textContent = transcript;
    speakThis(transcript.toLowerCase());
};

recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    showStatus('Error: ' + event.error);
    btn.classList.remove('listening');
};

// Button click handler with interrupt functionality
btn.addEventListener('click', () => {
    if(isListening) {
        recognition.stop();
    } else if(currentUtterance) {
        // If currently speaking, stop and start listening
        window.speechSynthesis.cancel();
        waveContainer.classList.remove('active');
        recognition.start();
    } else {
        recognition.start();
    }
});

// Gemini AI Integration
async function askGemini(prompt) {
    try {
        const contextualPrompt = `As an AI assistant named Jarvis developed by Devanarayanan, respond to: ${prompt}
        Keep the response concise and conversational. If it's a question requiring specific data 
        or web searches, indicate that. If it's a task you can help with directly, provide the solution.`;

        const response = await fetch(`${geminiEndpoint}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: contextualPrompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 200,
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Gemini API returned status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error calling Gemini:', error);
        return "I'm sorry, I couldn't process that request due to a connection issue.";
    }
}

async function speakThis(message) {
    const speech = new SpeechSynthesisUtterance();
    
    // Weather-related queries
    if (message.includes('weather')) {
        if (message.includes('forecast') || message.includes('prediction') || message.includes('tomorrow')) {
            speech.text = await getWeatherForecast();
        } else {
            speech.text = await getWeather();
        }
    }
    // Name and Developer Info
    else if(message.includes('what is your name') || message.includes('who are you')) {
        speech.text = "I am Jarvis. Would you like to know more about my developer?";
        // Store the state to handle the follow-up response
        window.waitingForDevInfo = true;
    }
    // Handle the follow-up response about developer
    else if(window.waitingForDevInfo && 
           (message.includes('yes') || message.includes('sure') || message.includes('okay'))) {
        speech.text = "I was developed by Devanarayanan, a first-year B.Tech student in Robotics and Automation with a strong background in front-end development. You have six years of experience on YouTube, where you have about 100,000 subscribers and over 300 videos. You are also an innovator, a holder of the India Book of Records, and have participated in various hackathons, winning several awards. You have your own startup in collaboration with Talrop and have created projects for companies and educational institutions. Currently, you are involved in a waste management hackathon, designing a multipurpose robot for waste collection and separation. You are studying topics in Engineering Physics and Python and are actively looking for project ideas that require minimal hardware. You have earned over 30 certificates and have been featured in various media outlets for your work.";
        window.waitingForDevInfo = false;
    }
    else if(window.waitingForDevInfo && 
           (message.includes('no') || message.includes('nope'))) {
        speech.text = "Alright, let me know if you need anything else.";
        window.waitingForDevInfo = false;
    }
    // System Commands
    else if(message.includes('open google')) {
        window.open("https://google.com", "_blank");
        speech.text = "Opening Google";
    }
    else if(message.includes('open youtube')) {
        window.open("https://youtube.com", "_blank");
        speech.text = "Opening YouTube";
    }
    else if(message.includes('open instagram')) {
        window.open("https://instagram.com", "_blank");
        speech.text = "Opening Instagram";
    }
    else if(message.includes('calculator')) {
        window.open('Calculator:///')
        speech.text = "Opening Calculator";
    }
    else if(message.includes('what is the time')) {
        const time = new Date().toLocaleString(undefined, {hour: "numeric", minute: "numeric"})
        speech.text = time;
    }
    else if(message.includes('what is the date')) {
        const date = new Date().toLocaleString(undefined, {month: "short", day: "numeric"})
        speech.text = date;
    }
    // Explicit Google Search Command
    else if(message.includes('search on google')) {
        const searchQuery = message.replace('search on google', '').trim();
        window.open(`https://www.google.com/search?q=${searchQuery.replace(/ /g, "+")}`, "_blank");
        speech.text = "I've searched Google for " + searchQuery;
    }
    // Gemini AI Response
    else {
        try {
            const geminiResponse = await askGemini(message);
            
            // Check if Gemini suggests a web search
            if(geminiResponse.toLowerCase().includes('search') || 
               geminiResponse.toLowerCase().includes('look up') ||
               geminiResponse.toLowerCase().includes('find online')) {
                window.open(`https://www.google.com/search?q=${message.replace(/ /g, "+")}`, "_blank");
                speech.text = "Let me search that for you online.";
            } else {
                speech.text = geminiResponse;
            }
        } catch (error) {
            console.error('Error:', error);
            speech.text = "I'm having trouble connecting to my AI systems. Please try again.";
        }
    }

    speech.volume = 1;
    speech.pitch = 1;
    speech.rate = 1;

    speak(speech.text);
}

// Error Handler
function handleError(error) {
    console.error('Error:', error);
    speak("I encountered an error. Please try again.");
}