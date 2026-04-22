interface GeneratedExtension {
  name: string;
  description: string;
  manifest: Record<string, any>;
  files: Record<string, string>;
}

export class GeminiService {
  private apiKey: string;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateExtension(
    prompt: string,
    browserTarget: 'chrome' | 'edge' | 'firefox' = 'chrome'
  ): Promise<GeneratedExtension> {
    const systemPrompt = `You are an expert browser extension developer. Generate a complete, production-ready browser extension based on the user's description.

CRITICAL REQUIREMENTS:
1. Use Manifest V3 (latest standard)
2. Generate ALL necessary files with complete, working code
3. Include proper error handling and security best practices
4. Make the extension fully functional out of the box
5. Target browser: ${browserTarget}

Generate a JSON response with this EXACT structure:
{
  "name": "Extension Name",
  "description": "Brief description",
  "manifest": { /* complete manifest.json content */ },
  "files": {
    "popup.html": "<!-- complete HTML -->",
    "popup.js": "// complete JavaScript",
    "background.js": "// complete service worker code",
    "content.js": "// complete content script if needed",
    "styles.css": "/* complete CSS */"
  }
}

MANIFEST V3 STRUCTURE:
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0.0",
  "description": "Description",
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  "permissions": ["storage", "activeTab"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
}

User's request: ${prompt}

Respond ONLY with valid JSON. No markdown, no explanation, just JSON.`;

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('No response from Gemini API');
      }

      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI');
      }

      const result = JSON.parse(jsonMatch[0]) as GeneratedExtension;

      if (!result.manifest.manifest_version) {
        result.manifest.manifest_version = 3;
      }

      if (!result.manifest.icons) {
        result.manifest.icons = {
          '16': 'icon16.png',
          '48': 'icon48.png',
          '128': 'icon128.png',
        };
      }

      return result;
    } catch (error) {
      console.error('Gemini generation error:', error);
      return this.getFallbackExtension(prompt);
    }
  }

  private getFallbackExtension(prompt: string): GeneratedExtension {
    return {
      name: 'Generated Extension',
      description: `Extension based on: ${prompt}`,
      manifest: {
        manifest_version: 3,
        name: 'Generated Extension',
        version: '1.0.0',
        description: `Extension based on: ${prompt}`,
        action: {
          default_popup: 'popup.html',
        },
        permissions: ['storage', 'activeTab'],
        background: {
          service_worker: 'background.js',
        },
        icons: {
          '16': 'icon16.png',
          '48': 'icon48.png',
          '128': 'icon128.png',
        },
      },
      files: {
        'popup.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Extension</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Extension Ready</h1>
    <p>${prompt}</p>
    <button id="actionBtn">Click Me</button>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
        'popup.js': `document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('actionBtn');

  button.addEventListener('click', () => {
    chrome.storage.local.get(['count'], (result) => {
      const count = (result.count || 0) + 1;
      chrome.storage.local.set({ count });
      alert(\`Clicked \${count} times!\`);
    });
  });
});`,
        'background.js': `chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  chrome.storage.local.set({ count: 0 });
});

chrome.action.onClicked.addListener((tab) => {
  console.log('Extension clicked', tab);
});`,
        'styles.css': `body {
  width: 300px;
  min-height: 200px;
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.container {
  text-align: center;
}

h1 {
  margin: 0 0 10px;
  font-size: 24px;
}

p {
  margin: 0 0 20px;
  font-size: 14px;
  opacity: 0.9;
}

button {
  background: white;
  color: #667eea;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

button:active {
  transform: translateY(0);
}`,
      },
    };
  }
}
