import knowledgeBase from './../../../src/Knowledge/extension-knowledge-base.json';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GeneratedFile {
  name: string;
  path: string;
  content: string;
  language: string;
}

export interface BuildInstructions {
  hasReact: boolean;
  needsInstall: boolean;
}

export interface GenerateResponse {
  response: string;
  explanation: string;
  files: GeneratedFile[];
  buildInstructions: BuildInstructions;
}

// Terminal command types for agentic UI
export interface TerminalCommand {
  type: 'info' | 'success' | 'error' | 'warning' | 'command';
  message: string;
  timestamp: Date;
}

// Streaming callbacks for agentic experience
export interface StreamCallbacks {
  onChunk?: (text: string) => void;
  onFileStart?: (filename: string) => void;
  onFileProgress?: (filename: string, progress: number) => void;
  onFileComplete?: (file: GeneratedFile) => void;
  onTerminalCommand?: (command: TerminalCommand) => void;
  onStatusChange?: (status: string) => void;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Fallback AI providers
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Best Groq models for code generation (fallback order)
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',    // 70B - best for code
  'llama-3.1-70b-versatile',    // 70B fallback
  'llama-3.2-90b-vision-preview', // 90B vision
  'mixtral-8x7b-32768',         // 8x7B MoE
];

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ============================================
// BEST FREE OPENROUTER MODELS FOR CODE GENERATION (2025)
// Ordered by quality: highest parameter models first, fallback to smaller
// ============================================
const OPENROUTER_FREE_MODELS = [
  // === TIER 1: Largest/Best Models (70B+) ===
  'deepseek/deepseek-r1-0528:free',           // 671B MoE - BEST reasoning & code
  'qwen/qwen3-235b-a22b:free',                // 235B - exceptional code generation
  'meta-llama/llama-3.3-70b-instruct:free',   // 70B - strong instruction following
  'nvidia/llama-3.1-nemotron-70b-instruct:free', // 70B NVIDIA optimized
  'qwen/qwen-2.5-72b-instruct:free',          // 72B - excellent reasoning

  // === TIER 2: Mid-range Models (30-70B) ===
  'qwen/qwen-2.5-coder-32b-instruct:free',    // 32B specialized coder
  'google/gemma-3-27b-it:free',               // 27B - good balance speed/quality
  'mistralai/mistral-small-3.1-24b-instruct:free', // 24B - fast and capable

  // === TIER 3: Fallback Models (7-20B) ===
  'deepseek/deepseek-chat:free',              // Fast and reliable
  'meta-llama/llama-3.2-11b-vision-instruct:free', // 11B multimodal
  'microsoft/phi-4:free',                      // 14B - compact but capable
  'google/gemma-2-9b-it:free',                // 9B - very fast
];

// Retry configuration - more patient for better results
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 15000]; // Progressive backoff

// Prompt length limits to prevent timeouts
const MAX_PROMPT_LENGTH = 4000; // Characters - longer prompts will be summarized
const API_TIMEOUT_MS = 90000;   // 90 second timeout for API calls (increased for complex extensions)

// Fetch with timeout wrapper
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = API_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
    }
    throw error;
  }
}

// Smart summarization that preserves file structure and architecture requirements
function summarizePrompt(prompt: string): string {
  if (prompt.length <= MAX_PROMPT_LENGTH) return prompt;

  console.log(`⚠️ Prompt too long (${prompt.length} chars), smart summarizing...`);

  // Extract file/folder structure if mentioned (preserve architecture)
  const fileStructure = prompt.match(/(?:├──|└──|extension\/|manifest\.json|\.js|\.html|\.css|\.json|content\.js|background\.js|popup\.|grammar\/|data\/|ui\/|rules\.js|spellcheck|tokenizer)/gi) || [];
  const uniqueFiles = [...new Set(fileStructure)].slice(0, 15);

  // Extract key features from the prompt
  const featurePatterns = [
    /(?:detect|check|validate|analyze)[^.]*\./gi,
    /(?:underline|highlight|show|display)[^.]*\./gi,
    /(?:implement|build|create)[^.]*\./gi,
    /(?:rule|grammar|spell|error|correction)[^.]*\./gi,
  ];

  const features: string[] = [];
  featurePatterns.forEach(pattern => {
    const matches = prompt.match(pattern);
    if (matches) features.push(...matches.slice(0, 2));
  });

  // Extract specific requirements (❌ NO ..., ✅ Must have...)
  const requirements = prompt.match(/[❌✅][^❌✅\n]*/g) || [];

  // Build concise but comprehensive summary
  const lines = prompt.split('\n').filter(l => l.trim());
  const goalLine = lines.find(l => /goal|objective|build|create/i.test(l))?.substring(0, 200) || lines[0]?.substring(0, 200);

  const summary = `${goalLine}

KEY REQUIREMENTS:
${requirements.slice(0, 6).join('\n')}

FILE STRUCTURE NEEDED: ${uniqueFiles.join(', ')}

FEATURES TO IMPLEMENT:
${features.slice(0, 5).join('\n')}

Generate ALL necessary files as a complete working extension using === filename === format.
For complex extensions, generate MORE files as needed (content.js, background.js, rules.js, etc.)`;

  console.log(`✅ Smart summarized to ${summary.length} chars (preserved ${uniqueFiles.length} file refs)`);
  return summary;
}

// ============================================
// ENHANCED SYSTEM PROMPT WITH KNOWLEDGE BASE
// ============================================

const SYSTEM_PROMPT = `You are an EXPERT Chrome Extension developer. Generate PRODUCTION-READY code.

# 🚨🚨🚨 CRITICAL: YOU MUST GENERATE AT LEAST 4 FILES 🚨🚨🚨

You MUST output ALL of these files in your response:

=== manifest.json ===
(complete JSON content here)

=== popup.html ===
(complete HTML content here)

=== popup.css ===
(complete CSS content here)

=== popup.js ===
(complete JavaScript content here)

DO NOT generate only manifest.json! That is a CRITICAL FAILURE.
The extension WILL NOT WORK without ALL 4 files.

# 🧠 THINK FIRST, CODE SECOND

Before writing code, ANALYZE the user's request:
1. What is the MAIN PURPOSE of this extension?
2. What BUTTONS and ACTIONS does the user need?
3. What DATA needs to be stored/retrieved?

# 📦 FILE FORMAT (USE EXACTLY THIS FORMAT)

Generate files using === filename === markers:

=== manifest.json ===
- manifest_version: 3
- permissions: ["storage"] + any needed
- action with default_popup: "popup.html"

=== popup.html ===
- Complete HTML structure
- Each button MUST have a unique id attribute
- Link to popup.css and popup.js

=== popup.css ===
- Modern dark theme with gradients
- Animations for hover states
- Width: 360-400px, min-height: 400px

=== popup.js ===
CRITICAL: This file MUST contain:
- document.addEventListener('DOMContentLoaded', function() { ... })
- For EACH button in HTML: document.getElementById('buttonId').addEventListener('click', function() { ... })
- REAL functionality inside handlers - NOT comments or placeholders
- chrome.storage.local.get/set for data persistence

For complex extensions, also generate:
=== content.js === (for page manipulation)
=== background.js === (for service worker)
=== Additional files as needed ===

# ⚡ WORKING CODE REQUIREMENTS

1. Every button MUST have a corresponding click handler
2. Every handler MUST do something REAL:
   - Add/remove items from lists
   - Save/load from chrome.storage
   - Modify DOM elements
   - Perform calculations
   - NO placeholder comments like "// TODO" or "// Real functionality here"

3. Use chrome.storage.local for ALL data:
   chrome.storage.local.get(['key'], result => { ... });
   chrome.storage.local.set({ key: value });

4. For content scripts accessing page content:
   - Use chrome.tabs.sendMessage to communicate
   - content.js listens with chrome.runtime.onMessage.addListener

# 🎨 UI REQUIREMENTS

- Dark mode with gradient backgrounds
- Rounded corners and subtle shadows
- Hover effects on interactive elements
- Clear visual feedback for actions
- Empty states when no data exists

# ❌ DO NOT

- Generate placeholder/skeleton code
- Copy example code with comments
- Leave buttons without handlers
- Use generic names like "Click Me"
- Skip files - generate ALL needed files

# ✅ DO

- Think about what the user ACTUALLY wants
- Generate COMPLETE, WORKING code
- Make each extension UNIQUE to the request
- Test mentally: "If I click this button, what happens?"

Generate the extension now based on the user's specific request.`;






// ============================================
// HELPER FUNCTIONS
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fixSmartQuotes(content: string): string {
  return content
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-');
}

function cleanCodeBlock(content: string): string {
  content = content.replace(/^```(?:[a-zA-Z]+\n)?/, '');
  content = content.replace(/\n?```$/gm, '');
  return content.trim();
}

function mergeFiles(existingFiles: GeneratedFile[], newFiles: GeneratedFile[]): GeneratedFile[] {
  const merged = [...existingFiles];
  newFiles.forEach(newFile => {
    const existingIndex = merged.findIndex(f => f.name === newFile.name);
    if (existingIndex >= 0) {
      merged[existingIndex] = newFile;
      console.log(`🔄 Updated: ${newFile.name}`);
    } else {
      merged.push(newFile);
      console.log(`➕ Added: ${newFile.name}`);
    }
  });
  return merged;
}

// ============================================
// TEMPLATE DETECTION
// ============================================

function detectTemplate(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  let templateContext = '';

  Object.entries(knowledgeBase.templates).forEach(([_key, template]) => {
    if (template.keywords.some((keyword: string) => lowerPrompt.includes(keyword))) {
      templateContext += `\n\n=== MATCHED TEMPLATE: ${template.name} ===\n`;
      templateContext += `Structure: ${JSON.stringify(template.structure, null, 2)}\n`;
      templateContext += `Code Patterns: ${JSON.stringify(template.code_patterns, null, 2)}\n`;
      console.log('✅ Matched template:', template.name);
    }
  });

  // Add best practices
  templateContext += `\n\n=== BEST PRACTICES ===\n`;
  templateContext += JSON.stringify(knowledgeBase.best_practices, null, 2);

  // Add UI patterns
  templateContext += `\n\n=== UI PATTERNS ===\n`;
  templateContext += JSON.stringify(knowledgeBase.ui_patterns, null, 2);

  // Add common patterns
  templateContext += `\n\n=== COMMON PATTERNS ===\n`;
  templateContext += JSON.stringify(knowledgeBase.common_patterns, null, 2);

  return templateContext;
}

// ============================================
// IMPROVED FILE PARSING - STREAMING SUPPORT
// ============================================

function parseGeneratedFiles(
  text: string,
  callbacks?: StreamCallbacks
): GeneratedFile[] {
  const newFiles: GeneratedFile[] = [];

  // Send terminal command
  callbacks?.onTerminalCommand?.({
    type: 'info',
    message: 'Parsing generated files...',
    timestamp: new Date()
  });

  // Flexible regex that catches ANY filename with extension
  const fileMarkerRegex = /===\s*([a-zA-Z0-9._\-\/]+\.[a-zA-Z0-9]+)\s*===\s*\n([\s\S]*?)(?=\n===\s*[a-zA-Z0-9._\-\/]+\.[a-zA-Z0-9]+\s*===|$)/g;
  let match;

  console.log('📄 Parsing generated files...');

  while ((match = fileMarkerRegex.exec(text)) !== null) {
    const filename = match[1].trim();
    let content = match[2].trim();

    if (!filename) {
      console.warn('⚠️ Empty filename, skipping');
      continue;
    }

    // Notify file start
    callbacks?.onFileStart?.(filename);
    callbacks?.onTerminalCommand?.({
      type: 'command',
      message: `Creating ${filename}...`,
      timestamp: new Date()
    });

    // Clean code blocks
    content = cleanCodeBlock(content);
    content = fixSmartQuotes(content);
    content = content.replace(/\n*===.*$/s, '').trim();

    if (content.length < 10) {
      console.warn(`⚠️ File ${filename} too short (${content.length} chars), skipping`);
      callbacks?.onTerminalCommand?.({
        type: 'warning',
        message: `Skipped ${filename} (too short)`,
        timestamp: new Date()
      });
      continue;
    }

    // Detect language from extension
    let language = 'plaintext';
    const ext = filename.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'json': language = 'json'; break;
      case 'html': case 'htm': language = 'html'; break;
      case 'css': language = 'css'; break;
      case 'js': case 'mjs': language = 'javascript'; break;
      case 'ts': language = 'typescript'; break;
      case 'jsx': language = 'javascript'; break;
      case 'tsx': language = 'typescript'; break;
      case 'md': language = 'markdown'; break;
      case 'txt': language = 'plaintext'; break;
    }

    const file = {
      name: filename,
      path: filename,
      content,
      language
    };

    newFiles.push(file);
    console.log(`✅ Parsed: ${filename} (${language}, ${content.length} chars)`);

    // Notify file complete
    callbacks?.onFileComplete?.(file);
    callbacks?.onTerminalCommand?.({
      type: 'success',
      message: `Created ${filename} (${content.length} chars)`,
      timestamp: new Date()
    });
  }

  // If no files found with === markers, try alternative parsing
  if (newFiles.length === 0) {
    console.warn('⚠️ No files found with === markers, trying alternative parsing...');
    callbacks?.onTerminalCommand?.({
      type: 'warning',
      message: 'Using alternative file parsing...',
      timestamp: new Date()
    });
    newFiles.push(...tryAlternativeParsing(text, callbacks));
  }

  return newFiles;
}

// Alternative parsing for when AI doesn't use === markers
function tryAlternativeParsing(text: string, callbacks?: StreamCallbacks): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const MAX_FILES = 15; // Allow many files for complex extensions (grammar checkers, etc.)

  // Try to extract JSON blocks for manifest (only first one)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch && files.length < MAX_FILES) {
    callbacks?.onFileStart?.('manifest.json');
    files.push({
      name: 'manifest.json',
      path: 'manifest.json',
      content: jsonMatch[1].trim(),
      language: 'json'
    });
    callbacks?.onFileComplete?.(files[files.length - 1]);
  }

  // Try to extract HTML (max 3 - popup.html, index.html, options.html)
  const htmlMatches = text.matchAll(/```html\s*([\s\S]*?)```/g);
  let htmlIndex = 0;
  const htmlNames = ['popup.html', 'index.html', 'options.html'];
  for (const match of htmlMatches) {
    if (htmlIndex >= 3 || files.length >= MAX_FILES) break;
    // Check if content mentions popup or options
    const content = match[1].trim();
    let filename = htmlNames[htmlIndex];
    if (content.includes('popup.js') || content.includes('popup.css')) {
      filename = 'popup.html';
    } else if (content.includes('options')) {
      filename = 'options.html';
    }
    // Skip if already have this file
    if (files.some(f => f.name === filename)) {
      htmlIndex++;
      continue;
    }
    callbacks?.onFileStart?.(filename);
    files.push({
      name: filename,
      path: filename,
      content: content,
      language: 'html'
    });
    callbacks?.onFileComplete?.(files[files.length - 1]);
    htmlIndex++;
  }

  // Try to extract CSS (max 2 - popup.css and styles.css)
  const cssMatches = text.matchAll(/```css\s*([\s\S]*?)```/g);
  let cssIndex = 0;
  for (const match of cssMatches) {
    if (cssIndex >= 2 || files.length >= MAX_FILES) break;
    const filename = cssIndex === 0 ? 'popup.css' : 'styles.css';
    if (files.some(f => f.name === filename)) {
      cssIndex++;
      continue;
    }
    callbacks?.onFileStart?.(filename);
    files.push({
      name: filename,
      path: filename,
      content: match[1].trim(),
      language: 'css'
    });
    callbacks?.onFileComplete?.(files[files.length - 1]);
    cssIndex++;
  }

  // Try to extract JavaScript (max 3 - popup.js, background.js, content.js)
  const jsMatches = text.matchAll(/```(?:javascript|js)\s*([\s\S]*?)```/g);
  let jsIndex = 0;
  for (const match of jsMatches) {
    if (jsIndex >= 3 || files.length >= MAX_FILES) break;
    const content = match[1].trim();
    let filename: string;
    // Detect file type by content
    if (content.includes('chrome.runtime.onInstalled') || content.includes('service_worker')) {
      filename = 'background.js';
    } else if (content.includes('chrome.runtime.onMessage') && content.includes('document.querySelector')) {
      filename = 'content.js';
    } else {
      filename = jsIndex === 0 ? 'popup.js' : (jsIndex === 1 ? 'script.js' : 'background.js');
    }
    // Skip if already have this file
    if (files.some(f => f.name === filename)) {
      jsIndex++;
      continue;
    }
    callbacks?.onFileStart?.(filename);
    files.push({
      name: filename,
      path: filename,
      content: content,
      language: 'javascript'
    });
    callbacks?.onFileComplete?.(files[files.length - 1]);
    jsIndex++;
  }

  console.log(`✅ Alternative parsing found ${files.length} files (max ${MAX_FILES})`);
  return files;
}

// ============================================
// AUTO-UPDATE MANIFEST FOR NEW FILES
// ============================================

function updateManifestForFiles(files: GeneratedFile[]): GeneratedFile[] {
  const manifestFile = files.find(f => f.name === 'manifest.json');
  if (!manifestFile) return files;

  try {
    const manifest = JSON.parse(manifestFile.content);
    const hasBackground = files.some(f => f.name === 'background.js');
    const hasContent = files.some(f => f.name === 'content.js');
    const hasOptions = files.some(f => f.name === 'options.html');

    let updated = false;

    // Add background service worker if exists
    if (hasBackground && !manifest.background) {
      manifest.background = {
        service_worker: 'background.js'
      };
      updated = true;
      console.log('➕ Added background to manifest');
    }

    // Add content scripts if exists
    if (hasContent && !manifest.content_scripts) {
      manifest.content_scripts = [{
        matches: ['<all_urls>'],
        js: ['content.js']
      }];
      updated = true;
      console.log('➕ Added content_scripts to manifest');
    }

    // Add options page if exists
    if (hasOptions && !manifest.options_page && !manifest.options_ui) {
      manifest.options_ui = {
        page: 'options.html',
        open_in_tab: true
      };
      updated = true;
      console.log('➕ Added options_ui to manifest');
    }

    // Update manifest file if changed
    if (updated) {
      const updatedFiles = files.map(f =>
        f.name === 'manifest.json'
          ? { ...f, content: JSON.stringify(manifest, null, 2) }
          : f
      );
      return updatedFiles;
    }

  } catch (error) {
    console.error('❌ Failed to update manifest:', error);
  }

  return files;
}

// ============================================
// GROQ API CALL (FALLBACK 1)
// ============================================

async function callGroq(
  prompt: string,
  callbacks?: StreamCallbacks,
  existingFiles?: GeneratedFile[]
): Promise<string> {
  if (!GROQ_API_KEY || GROQ_API_KEY === "") {
    throw new Error('Groq API key not configured');
  }

  // Build context from existing files
  let existingContext = '';
  if (existingFiles && existingFiles.length > 0) {
    existingContext = '\n\n=== EXISTING PROJECT FILES ===\n';
    existingFiles.forEach(file => {
      existingContext += `--- ${file.name} ---\n`;
      const preview = file.content.length > 500 ? file.content.substring(0, 500) + '...' : file.content;
      existingContext += preview + '\n';
    });
    existingContext += '\n⚠️ Keep existing functionality!\n';
  }

  // Summarize long prompts to prevent timeout
  const summarizedPrompt = summarizePrompt(prompt);
  const fullPrompt = `${existingContext}\n${summarizedPrompt}`;

  // Try each Groq model until one works
  let lastError = '';
  for (let i = 0; i < GROQ_MODELS.length; i++) {
    const model = GROQ_MODELS[i];
    try {
      console.log(`🦙 Calling Groq (${model})...`);
      callbacks?.onTerminalCommand?.({
        type: 'info',
        message: `Trying Groq ${model}...`,
        timestamp: new Date()
      });

      // Use timeout wrapper to prevent hanging
      const response = await fetchWithTimeout(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT.substring(0, 6000) },
            { role: 'user', content: fullPrompt }
          ],
          temperature: 0.3,       // Lower for more consistent code
          max_tokens: 16000       // Higher for complete code
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `${model}: ${response.status} - ${errorText}`;
        console.warn(`❌ Groq ${model} failed:`, lastError);
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';

      if (!text || text.length < 100) {
        lastError = `${model}: Empty or too short response`;
        console.warn(`❌ Groq ${model} returned empty response`);
        continue;
      }

      callbacks?.onTerminalCommand?.({
        type: 'success',
        message: `Generated with Groq ${model}`,
        timestamp: new Date()
      });

      return text;
    } catch (err: any) {
      lastError = `${model}: ${err.message}`;
      console.warn(`❌ Groq ${model} error:`, err);
    }
  }

  throw new Error(`All Groq models failed. Last error: ${lastError}`);
}

// ============================================
// OPENROUTER API CALL (FALLBACK 2)
// ============================================

async function callOpenRouter(
  prompt: string,
  callbacks?: StreamCallbacks,
  existingFiles?: GeneratedFile[]
): Promise<string> {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "") {
    throw new Error('OpenRouter API key not configured');
  }

  // Build context from existing files (same as Gemini)
  let existingContext = '';
  if (existingFiles && existingFiles.length > 0) {
    existingContext = '\n\n=== EXISTING PROJECT FILES - DO NOT REPLACE, ONLY UPDATE ===\n';
    existingFiles.forEach(file => {
      existingContext += `\n--- ${file.name} ---\n`;
      const preview = file.content.length > 1000 ? file.content.substring(0, 1000) + '...[truncated]' : file.content;
      existingContext += preview + '\n';
    });
    existingContext += '\n⚠️ CRITICAL: Keep existing functionality! Only modify what user asked for.\n';
  }

  // Summarize long prompts to prevent timeout
  const summarizedPrompt = summarizePrompt(prompt);
  const fullUserPrompt = `${existingContext}\n\n=== USER REQUEST ===\n${summarizedPrompt}\n\nGenerate COMPLETE, WORKING code that directly addresses the user's request!`;

  // Try each model until one works
  let lastError = '';
  for (let i = 0; i < OPENROUTER_FREE_MODELS.length; i++) {
    const model = OPENROUTER_FREE_MODELS[i];
    try {
      console.log(`🌐 Calling OpenRouter (${model})...`);
      callbacks?.onTerminalCommand?.({
        type: 'info',
        message: `Trying ${model.split('/')[1] || model}...`,
        timestamp: new Date()
      });

      // Use timeout wrapper to prevent hanging
      const response = await fetchWithTimeout(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CollabFree'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: fullUserPrompt }
          ],
          temperature: 0.4,     // Lower for more consistent code generation
          max_tokens: 16000,    // Higher for complete extension code
          top_p: 0.95,          // Nucleus sampling for quality
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `${model}: ${response.status} - ${errorText}`;
        console.warn(`❌ ${model} failed:`, lastError);
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';

      if (!text || text.length < 50) {
        lastError = `${model}: Empty or too short response`;
        console.warn(`❌ ${model} returned empty response`);
        continue;
      }

      callbacks?.onTerminalCommand?.({
        type: 'success',
        message: `Generated with ${model.split('/')[1] || model}`,
        timestamp: new Date()
      });

      return text;
    } catch (err: any) {
      lastError = `${model}: ${err.message}`;
      console.warn(`❌ ${model} error:`, err);
    }
  }

  throw new Error(`All OpenRouter free models failed. Last error: ${lastError}`);
}

// ============================================
// API CALL WITH RETRY AND FALLBACK LOGIC
// ============================================

async function callGeminiWithRetry(
  prompt: string,
  existingFiles: GeneratedFile[],
  callbacks?: StreamCallbacks,
  retryCount: number = 0
): Promise<string> {
  // Detect matching templates
  const templateContext = detectTemplate(prompt);

  // Build context from existing files
  let existingContext = '';
  if (existingFiles.length > 0) {
    existingContext = '\n\n=== EXISTING FILES (PRESERVE AND UPDATE) ===\n';
    existingFiles.forEach(file => {
      existingContext += `\n--- ${file.name} (${file.content.length} chars) ---\n`;
      // Only show first 500 chars to save tokens
      const preview = file.content.length > 500 ? file.content.substring(0, 500) + '...[truncated]' : file.content;
      existingContext += preview + '\n';
    });
    existingContext += '\n⚠️ IMPORTANT: Keep all existing functionality intact! Only add/modify what user requested.\n';
  }

  const fullPrompt = `${SYSTEM_PROMPT}\n${templateContext}\n${existingContext}\n\n=== USER REQUEST ===\n${prompt}\n\nGenerate COMPLETE, BEAUTIFUL, WORKING code following knowledge base patterns!`;

  try {
    console.log(`🤖 Calling Gemini 2.0 Flash (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
    console.log('📊 Prompt length:', fullPrompt.length, 'chars');

    callbacks?.onStatusChange?.('Connecting to AI...');
    callbacks?.onTerminalCommand?.({
      type: 'info',
      message: `Connecting to Gemini AI (attempt ${retryCount + 1})...`,
      timestamp: new Date()
    });

    // If Gemini API key is invalid, try OpenRouter FIRST
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "" || GEMINI_API_KEY === "YOUR_GEMINI_KEY_HERE") {
      console.log('⚠️ Gemini API key not configured, trying OpenRouter...');

      // Try OpenRouter as PRIMARY when no Gemini key
      if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== "") {
        callbacks?.onStatusChange?.('Using OpenRouter (Free tier)...');
        callbacks?.onTerminalCommand?.({
          type: 'info',
          message: 'Gemini not configured. Using OpenRouter...',
          timestamp: new Date()
        });
        return await callOpenRouter(prompt, callbacks, existingFiles);
      }

      // Try Groq if OpenRouter also not available
      if (GROQ_API_KEY && GROQ_API_KEY !== "") {
        callbacks?.onStatusChange?.('Using Groq...');
        return await callGroq(prompt, callbacks, existingFiles);
      }

      throw new Error('No AI provider configured. Please add VITE_GEMINI_API_KEY, VITE_OPENROUTER_API_KEY, or VITE_GROQ_API_KEY to your .env file.');
    }

    // Use timeout wrapper to prevent hanging on long requests
    const response = await fetchWithTimeout(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.4,         // Lower for consistent code
          maxOutputTokens: 16000,   // Higher for complete extensions
          topP: 0.95,
          topK: 40
        }
      })
    }, API_TIMEOUT_MS);

    // Handle rate limiting (429 error) - TRY FALLBACK PROVIDERS
    if (response.status === 429) {
      await response.json().catch(() => ({}));
      console.warn(`⚠️ Rate limited (429). Retry ${retryCount + 1}/${MAX_RETRIES}`);

      callbacks?.onTerminalCommand?.({
        type: 'warning',
        message: `Gemini rate limited. Trying fallback providers...`,
        timestamp: new Date()
      });

      // Try Groq as fallback
      if (GROQ_API_KEY && GROQ_API_KEY !== "") {
        try {
          console.log('🔄 Falling back to Groq...');
          callbacks?.onStatusChange?.('Switching to Groq (Llama 3.1)...');
          const groqResult = await callGroq(prompt, callbacks, existingFiles);
          return groqResult;
        } catch (groqError) {
          console.warn('❌ Groq fallback failed:', groqError);
          callbacks?.onTerminalCommand?.({
            type: 'warning',
            message: 'Groq fallback failed, trying OpenRouter...',
            timestamp: new Date()
          });
        }
      }

      // Try OpenRouter as second fallback
      if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== "") {
        try {
          console.log('🔄 Falling back to OpenRouter...');
          callbacks?.onStatusChange?.('Switching to OpenRouter (Free tier)...');
          const orResult = await callOpenRouter(prompt, callbacks, existingFiles);
          return orResult;
        } catch (orError) {
          console.warn('❌ OpenRouter fallback failed:', orError);
        }
      }

      // If all fallbacks fail, retry Gemini with delay
      if (retryCount < MAX_RETRIES - 1) {
        callbacks?.onStatusChange?.(`All fallbacks failed. Retrying Gemini in ${RETRY_DELAYS[retryCount] / 1000}s...`);
        callbacks?.onTerminalCommand?.({
          type: 'warning',
          message: `Retrying Gemini in ${RETRY_DELAYS[retryCount] / 1000}s...`,
          timestamp: new Date()
        });
        await delay(RETRY_DELAYS[retryCount]);
        return callGeminiWithRetry(prompt, existingFiles, callbacks, retryCount + 1);
      } else {
        throw new Error(`All AI providers are rate limited. Please wait a few minutes and try again. Add VITE_GROQ_API_KEY or VITE_OPENROUTER_API_KEY to your .env file for fallback options.`);
      }
    }

    // Handle other errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);

      // Parse error for better message
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      // Retry on 500-level errors
      if (response.status >= 500 && retryCount < MAX_RETRIES - 1) {
        callbacks?.onTerminalCommand?.({
          type: 'warning',
          message: `Server error. Retrying in ${RETRY_DELAYS[retryCount] / 1000}s...`,
          timestamp: new Date()
        });
        await delay(RETRY_DELAYS[retryCount]);
        return callGeminiWithRetry(prompt, existingFiles, callbacks, retryCount + 1);
      }

      throw new Error(errorMessage);
    }

    callbacks?.onStatusChange?.('Processing response...');
    callbacks?.onTerminalCommand?.({
      type: 'success',
      message: 'Connected to Gemini AI successfully',
      timestamp: new Date()
    });

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini returned no response candidates');
    }

    const text = data.candidates[0].content.parts[0].text;

    // Stream the response in chunks for typewriter effect
    if (callbacks?.onChunk) {
      const chunkSize = 50;
      for (let i = 0; i < text.length; i += chunkSize) {
        callbacks.onChunk(text.substring(0, i + chunkSize));
        await delay(10); // Small delay for visual effect
      }
    }

    console.log('✅ Gemini generated:', text.length, 'chars');

    callbacks?.onTerminalCommand?.({
      type: 'success',
      message: `Received ${text.length} chars from AI`,
      timestamp: new Date()
    });

    return text;

  } catch (error: any) {
    console.error('❌ Gemini API error:', error);

    callbacks?.onTerminalCommand?.({
      type: 'error',
      message: `Error: ${error.message}`,
      timestamp: new Date()
    });

    // Don't retry on invalid API key
    if (error.message.includes('API key')) {
      throw error;
    }

    // Retry on network errors
    if (retryCount < MAX_RETRIES - 1 && (error.name === 'TypeError' || error.message.includes('network'))) {
      callbacks?.onStatusChange?.(`Network error. Retrying in ${RETRY_DELAYS[retryCount] / 1000}s...`);
      await delay(RETRY_DELAYS[retryCount]);
      return callGeminiWithRetry(prompt, existingFiles, callbacks, retryCount + 1);
    }

    throw new Error(`Failed to generate code: ${error.message}`);
  }
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export async function generateExtensionCode(
  prompt: string,
  existingFiles: GeneratedFile[] = [],
  _conversationHistory: Message[] = [],
  onChunk?: (chunk: string) => void,
  onFileComplete?: (file: GeneratedFile) => void,
  callbacks?: StreamCallbacks
): Promise<GenerateResponse> {
  // Create unified callbacks
  const unifiedCallbacks: StreamCallbacks = {
    onChunk: onChunk || callbacks?.onChunk,
    onFileComplete: onFileComplete || callbacks?.onFileComplete,
    onFileStart: callbacks?.onFileStart,
    onFileProgress: callbacks?.onFileProgress,
    onTerminalCommand: callbacks?.onTerminalCommand,
    onStatusChange: callbacks?.onStatusChange
  };

  try {
    console.log('🚀 Starting code generation...');
    console.log('📝 Prompt:', prompt);
    console.log('📁 Existing files:', existingFiles.length);

    unifiedCallbacks.onStatusChange?.('Analyzing request...');
    unifiedCallbacks.onTerminalCommand?.({
      type: 'command',
      message: `Received prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
      timestamp: new Date()
    });

    const isUpdate = existingFiles.length > 0 &&
      /(update|change|modify|fix|add|improve|create|new file|add file|enhance)/i.test(prompt);

    console.log('🔄 Is update:', isUpdate);

    unifiedCallbacks.onStatusChange?.('Generating code...');
    unifiedCallbacks.onTerminalCommand?.({
      type: 'info',
      message: isUpdate ? 'Updating existing extension...' : 'Generating new extension...',
      timestamp: new Date()
    });

    const text = await callGeminiWithRetry(prompt, existingFiles, unifiedCallbacks);

    // Parse generated files
    unifiedCallbacks.onStatusChange?.('Parsing files...');
    const newFiles = parseGeneratedFiles(text, unifiedCallbacks);

    // Extract explanation
    let explanation = '';
    const explainMatch = text.match(/EXPLANATION:\s*(.+?)(?=\n|$)/i);
    if (explainMatch) {
      explanation = explainMatch[1].trim();
    }

    if (newFiles.length === 0) {
      throw new Error('No files were generated. Please try a more specific prompt.');
    }

    // CRITICAL: Validate minimum 4 files for complete extension
    const hasManifest = newFiles.some(f => f.name === 'manifest.json');
    const hasHtml = newFiles.some(f => f.name.endsWith('.html'));
    const hasCss = newFiles.some(f => f.name.endsWith('.css'));
    const hasJs = newFiles.some(f => f.name.endsWith('.js'));

    if (newFiles.length < 4 || !hasManifest || !hasHtml || !hasCss || !hasJs) {
      console.warn('⚠️ Warning: Incomplete extension generated. Only', newFiles.length, 'files:', newFiles.map(f => f.name));

      unifiedCallbacks?.onTerminalCommand?.({
        type: 'warning',
        message: `Warning: Only ${newFiles.length} files generated. Extensions require at least 4 files (manifest.json, popup.html, popup.css, popup.js)`,
        timestamp: new Date()
      });

      // CRITICAL: Retry when we have less than 4 files (not just 1)
      if (newFiles.length < 4) {
        unifiedCallbacks?.onStatusChange?.('Incomplete response. Retrying with explicit instructions...');
        unifiedCallbacks?.onTerminalCommand?.({
          type: 'info',
          message: 'Retrying generation to get all 4 required files...',
          timestamp: new Date()
        });

        const retryPrompt = `CRITICAL: Your previous response was INCOMPLETE. You MUST generate ALL 4 FILES.

User wants: "${prompt}"

OUTPUT EXACTLY THIS FORMAT (replace placeholders with real code):

=== manifest.json ===
{
  "manifest_version": 3,
  "name": "Extension Name Here",
  "version": "1.0.0",
  "description": "Description",
  "permissions": ["storage"],
  "action": {
    "default_popup": "popup.html"
  }
}

=== popup.html ===
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Extension</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <h1>Title</h1>
    <button id="actionBtn">Click Me</button>
  </div>
  <script src="popup.js"></script>
</body>
</html>

=== popup.css ===
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 360px; min-height: 400px; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; font-family: -apple-system, sans-serif; }
.container { padding: 20px; }
h1 { margin-bottom: 15px; }
button { width: 100%; padding: 12px; background: #667eea; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 14px; }
button:hover { background: #5a6fd6; transform: translateY(-2px); }

=== popup.js ===
document.addEventListener('DOMContentLoaded', function() {
  const actionBtn = document.getElementById('actionBtn');
  actionBtn.addEventListener('click', function() {
    alert('Button clicked!');
  });
});

GENERATE ALL 4 FILES ABOVE with proper content for: "${prompt}"`;

        try {
          const retryText = await callGeminiWithRetry(retryPrompt, existingFiles, unifiedCallbacks, 0);
          const retryFiles = parseGeneratedFiles(retryText, unifiedCallbacks);
          if (retryFiles.length >= 4) {
            newFiles.length = 0;
            newFiles.push(...retryFiles);
            console.log('✅ Retry successful:', retryFiles.map(f => f.name));
            unifiedCallbacks?.onTerminalCommand?.({
              type: 'success',
              message: `Retry successful! Generated ${retryFiles.length} files`,
              timestamp: new Date()
            });
          } else if (retryFiles.length > newFiles.length) {
            // At least got more files, use them
            newFiles.length = 0;
            newFiles.push(...retryFiles);
            console.log('⚠️ Retry got more files:', retryFiles.map(f => f.name));
          }
        } catch (retryError) {
          console.warn('Retry failed:', retryError);
        }

        // FINAL FALLBACK: If we still don't have 4 files, generate minimal working set
        if (newFiles.length < 4 && hasManifest) {
          console.log('🔧 Generating fallback files...');
          unifiedCallbacks?.onTerminalCommand?.({
            type: 'info',
            message: 'Generating fallback skeleton files...',
            timestamp: new Date()
          });

          const extensionName = prompt.split(' ').slice(0, 4).join(' ') || 'My Extension';

          if (!hasHtml) {
            newFiles.push({
              name: 'popup.html',
              path: 'popup.html',
              content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${extensionName}</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>${extensionName}</h1>
    </header>
    <main class="content">
      <p>Your extension is working! Customize this popup.</p>
      <button id="actionBtn">Click Me</button>
    </main>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
              language: 'html'
            });
          }

          if (!hasCss) {
            newFiles.push({
              name: 'popup.css',
              path: 'popup.css',
              content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 360px;
  min-height: 400px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e6edf3;
}
.container { padding: 20px; }
.header { text-align: center; margin-bottom: 20px; }
h1 { font-size: 1.5rem; font-weight: 600; }
.content { text-align: center; }
p { margin-bottom: 15px; opacity: 0.8; }
button {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }`,
              language: 'css'
            });
          }

          if (!hasJs) {
            newFiles.push({
              name: 'popup.js',
              path: 'popup.js',
              content: `document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  
  // Find ALL buttons in the page and add click handlers
  const allButtons = document.querySelectorAll('button');
  
  allButtons.forEach(function(btn, index) {
    btn.addEventListener('click', function(e) {
      const originalText = btn.textContent;
      const originalBg = btn.style.background;
      
      // Show click feedback
      btn.textContent = 'Done!';
      btn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
      btn.style.transform = 'scale(0.95)';
      
      // Reset after delay
      setTimeout(function() {
        btn.textContent = originalText;
        btn.style.background = originalBg;
        btn.style.transform = '';
      }, 800);
      
      console.log('Button clicked:', btn.id || btn.textContent);
    });
  });
  
  // Also handle any specific button by ID
  const actionBtn = document.getElementById('actionBtn');
  if (actionBtn) {
    actionBtn.addEventListener('click', function() {
      alert('Extension is working!');
    });
  }
  
  console.log('Extension loaded! Found', allButtons.length, 'buttons');
});`,
              language: 'javascript'
            });
          }

          unifiedCallbacks?.onTerminalCommand?.({
            type: 'success',
            message: `Added ${4 - (hasManifest ? 1 : 0) - (hasHtml ? 1 : 0) - (hasCss ? 1 : 0) - (hasJs ? 1 : 0)} fallback files`,
            timestamp: new Date()
          });
        }
      }
    }

    console.log('📦 Generated files:', newFiles.map(f => f.name).join(', '));

    unifiedCallbacks.onTerminalCommand?.({
      type: 'info',
      message: `Generated ${newFiles.length} files: ${newFiles.map(f => f.name).join(', ')} `,
      timestamp: new Date()
    });

    // Merge with existing files if updating
    let finalFiles = isUpdate && existingFiles.length > 0
      ? mergeFiles(existingFiles, newFiles)
      : newFiles;

    // Auto-update manifest for new files
    finalFiles = updateManifestForFiles(finalFiles);

    // Smart sorting - manifest first, then popup/index files, then background, content
    const order = [
      'manifest.json',
      'popup.html', 'popup.css', 'popup.js',
      'index.html', 'styles.css', 'script.js',
      'background.js',
      'content.js', 'content.css',
      'options.html', 'options.css', 'options.js'
    ];

    finalFiles.sort((a, b) => {
      const ai = order.indexOf(a.name);
      const bi = order.indexOf(b.name);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    console.log('✅ Final files:', finalFiles.map(f => `${f.name} (${f.content.length} chars)`));

    unifiedCallbacks.onStatusChange?.('Complete!');
    unifiedCallbacks.onTerminalCommand?.({
      type: 'success',
      message: `✓ Build complete! ${finalFiles.length} files ready`,
      timestamp: new Date()
    });

    return {
      response: `Successfully generated ${finalFiles.length} file${finalFiles.length > 1 ? 's' : ''} with beautiful UI and working functionality!`,
      explanation: explanation || `Chrome extension with ${finalFiles.length} files including modern design and full functionality`,
      files: finalFiles,
      buildInstructions: {
        hasReact: false,
        needsInstall: false
      }
    };

  } catch (error: any) {
    console.error('❌ Generation error:', error);

    unifiedCallbacks.onStatusChange?.('Error');
    unifiedCallbacks.onTerminalCommand?.({
      type: 'error',
      message: `Build failed: ${error.message} `,
      timestamp: new Date()
    });

    throw new Error(`Code generation failed: ${error.message} `);
  }
}

// ============================================
// VALIDATION & METADATA
// ============================================

export function validateExtension(files: GeneratedFile[]) {
  const names = files.map(f => f.name);

  // Support both naming conventions
  const hasHtml = names.includes('popup.html') || names.includes('index.html');
  const hasJs = names.includes('popup.js') || names.includes('script.js');
  const hasManifest = names.includes('manifest.json');
  const hasCss = names.includes('popup.css') || names.includes('styles.css');

  const missing: string[] = [];
  if (!hasManifest) missing.push('manifest.json');
  if (!hasHtml) missing.push('popup.html or index.html');
  if (!hasJs) missing.push('popup.js or script.js');

  const warnings: string[] = [];

  // Check for CSS
  if (!hasCss) {
    warnings.push('Missing CSS file - extension may not be styled');
  }

  // Check manifest content
  const manifest = files.find(f => f.name === 'manifest.json');
  if (manifest) {
    try {
      const parsed = JSON.parse(manifest.content);
      if (!parsed.manifest_version) warnings.push('Manifest missing manifest_version');
      if (parsed.manifest_version !== 3) warnings.push('Manifest should use manifest_version: 3');
      if (!parsed.name) warnings.push('Manifest missing name');
      if (!parsed.version) warnings.push('Manifest missing version');
      if (!parsed.permissions?.includes('storage')) warnings.push('Consider adding "storage" permission for data persistence');
    } catch (e) {
      warnings.push('Manifest JSON is invalid');
    }
  }

  return {
    isValid: missing.length === 0,
    missingFiles: missing,
    warnings
  };
}

export function extractExtensionMetadata(files: GeneratedFile[]) {
  const manifest = files.find(f => f.name === 'manifest.json');
  if (!manifest) return { name: 'Extension', version: '1.0.0', description: 'Chrome Extension' };

  try {
    const parsed = JSON.parse(manifest.content);
    return {
      name: parsed.name || 'Extension',
      version: parsed.version || '1.0.0',
      description: parsed.description || 'Chrome Extension'
    };
  } catch (e) {
    return { name: 'Extension', version: '1.0.0', description: 'Chrome Extension' };
  }
}

export default {
  generateExtensionCode,
  validateExtension,
  extractExtensionMetadata
};
