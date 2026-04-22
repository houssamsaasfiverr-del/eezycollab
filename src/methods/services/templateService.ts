export interface ExtensionTemplate {
  name: string;
  category: string;
  manifest: any;
  html: string;
  js: string;
  css: string;
}

export const TEMPLATES: Record<string, ExtensionTemplate> = {
  basic: {
    name: 'Basic Extension',
    category: 'general',
    manifest: {
      manifest_version: 3,
      name: 'Basic Extension',
      version: '1.0.0',
      description: 'A basic Chrome extension',
      action: { default_popup: 'popup.html' },
      permissions: ['storage', 'activeTab']
    },
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extension</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{EXTENSION_NAME}}</h1>
      <div class="icon">✨</div>
    </div>
    
    <div class="content">
      <div class="card">
        <h3>Welcome!</h3>
        <p>{{DESCRIPTION}}</p>
      </div>

      <button id="mainBtn" class="btn-primary">
        Click Me
      </button>

      <div id="output" class="output"></div>

      <input type="text" id="inputField" placeholder="Type something..." class="input">
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
    js: `document.addEventListener('DOMContentLoaded', function() {
  const mainBtn = document.getElementById('mainBtn');
  const output = document.getElementById('output');
  const inputField = document.getElementById('inputField');
  
  // Load saved data
  chrome.storage.local.get(['clickCount'], function(result) {
    const count = result.clickCount || 0;
    output.textContent = \`Clicks: \${count}\`;
  });

  // Button click handler
  mainBtn.addEventListener('click', function() {
    chrome.storage.local.get(['clickCount'], function(result) {
      const newCount = (result.clickCount || 0) + 1;
      chrome.storage.local.set({ clickCount: newCount });
      output.textContent = \`Clicks: \${newCount}\`;
      mainBtn.classList.add('btn-success');
      setTimeout(() => mainBtn.classList.remove('btn-success'), 500);
    });
  });

  // Input field handler
  inputField.addEventListener('input', function(e) {
    chrome.storage.local.set({ userInput: e.target.value });
  });

  // Get current tab info
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      console.log('Current tab:', tabs[0].title);
    }
  });
});`,
    css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 420px;
  min-height: 500px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.container {
  padding: 0;
}

.header {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
}

.icon {
  font-size: 32px;
}

.content {
  padding: 24px;
}

.card {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255,255,255,0.2);
}

.card h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.card p {
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.5;
}

.btn-primary {
  width: 100%;
  padding: 16px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.2);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-success {
  background: #4ade80 !important;
  color: white !important;
}

.output {
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.input {
  width: 100%;
  padding: 16px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;
}

.input::placeholder {
  color: rgba(255,255,255,0.6);
}

.input:focus {
  background: rgba(255,255,255,0.25);
  border-color: rgba(255,255,255,0.5);
}`
  },

  productivity: {
    name: 'Productivity Tool',
    category: 'productivity',
    manifest: {
      manifest_version: 3,
      name: 'Productivity Tool',
      version: '1.0.0',
      description: 'Boost your productivity',
      action: { default_popup: 'popup.html' },
      permissions: ['storage', 'activeTab', 'tabs']
    },
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Productivity</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ {{EXTENSION_NAME}}</h1>
    </div>
    
    <div class="content">
      <div class="timer-display" id="timerDisplay">25:00</div>
      
      <div class="button-group">
        <button id="startBtn" class="btn-primary">Start</button>
        <button id="pauseBtn" class="btn-secondary">Pause</button>
        <button id="resetBtn" class="btn-outline">Reset</button>
      </div>

      <div class="stats">
        <div class="stat-card">
          <span class="stat-value" id="sessionsCount">0</span>
          <span class="stat-label">Sessions</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" id="totalTime">0m</span>
          <span class="stat-label">Total Time</span>
        </div>
      </div>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
    js: `let timeLeft = 25 * 60;
let isRunning = false;
let interval = null;

document.addEventListener('DOMContentLoaded', function() {
  const timerDisplay = document.getElementById('timerDisplay');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const sessionsCount = document.getElementById('sessionsCount');
  const totalTime = document.getElementById('totalTime');

  // Load stats
  chrome.storage.local.get(['sessions', 'totalMinutes'], function(result) {
    sessionsCount.textContent = result.sessions || 0;
    totalTime.textContent = (result.totalMinutes || 0) + 'm';
  });

  function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
  }

  startBtn.addEventListener('click', function() {
    if (!isRunning) {
      isRunning = true;
      interval = setInterval(() => {
        if (timeLeft > 0) {
          timeLeft--;
          updateDisplay();
        } else {
          chrome.storage.local.get(['sessions', 'totalMinutes'], function(result) {
            const newSessions = (result.sessions || 0) + 1;
            const newTotal = (result.totalMinutes || 0) + 25;
            chrome.storage.local.set({ sessions: newSessions, totalMinutes: newTotal });
            sessionsCount.textContent = newSessions;
            totalTime.textContent = newTotal + 'm';
          });
          clearInterval(interval);
          isRunning = false;
          timeLeft = 25 * 60;
          updateDisplay();
        }
      }, 1000);
    }
  });

  pauseBtn.addEventListener('click', function() {
    clearInterval(interval);
    isRunning = false;
  });

  resetBtn.addEventListener('click', function() {
    clearInterval(interval);
    isRunning = false;
    timeLeft = 25 * 60;
    updateDisplay();
  });
});`,
    css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 420px;
  min-height: 500px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.container { padding: 0; }

.header {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  padding: 24px;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.header h1 {
  color: white;
  font-size: 24px;
}

.content {
  padding: 32px 24px;
}

.timer-display {
  font-size: 72px;
  font-weight: 700;
  text-align: center;
  color: white;
  margin-bottom: 32px;
  text-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.button-group {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
}

.btn-primary, .btn-secondary, .btn-outline {
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: white;
  color: #f5576c;
}

.btn-secondary {
  background: rgba(255,255,255,0.3);
  color: white;
}

.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-primary:hover, .btn-secondary:hover, .btn-outline:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-card {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: rgba(255,255,255,0.8);
}`
  }
};

export function matchTemplate(prompt: string): ExtensionTemplate {
  const lowerPrompt = prompt.toLowerCase();
  
  // Keyword matching
  if (lowerPrompt.includes('timer') || lowerPrompt.includes('pomodoro') || 
      lowerPrompt.includes('productivity') || lowerPrompt.includes('focus')) {
    return TEMPLATES.productivity;
  }
  
  // Default to basic template
  return TEMPLATES.basic;
}

export function customizeTemplate(template: ExtensionTemplate, prompt: string) {
  const extensionName = prompt.substring(0, 50) || 'Chrome Extension';
  const description = `A ${prompt} extension for Chrome`;

  return {
    manifest: {
      ...template.manifest,
      name: extensionName,
      description: description
    },
    html: template.html
      .replace(/{{EXTENSION_NAME}}/g, extensionName)
      .replace(/{{DESCRIPTION}}/g, description),
    js: template.js,
    css: template.css
  };
}
