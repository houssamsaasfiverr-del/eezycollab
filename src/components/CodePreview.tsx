import React, { useEffect, useState, useMemo } from 'react';
import { GeneratedFile } from './../methods/services/aiService';
import { RefreshCw, Eye, Maximize2, X, Info, ExternalLink, CheckCircle, FileCode, Copy, Check, Zap, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserCredits } from './../../src/methods/services/CreditService';
import { useNavigate } from 'react-router-dom';

interface CodePreviewProps {
  files: GeneratedFile[];
  onBrowserSelect?: (browser: BrowserType) => void;
}

// Browser logos from CDN
const BROWSER_LOGOS = {
  chrome: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chrome/chrome-original.svg",
  firefox: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firefox/firefox-original.svg",
  edge: "https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/edge.svg",
  safari: "https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/safari.svg",
  opera: "https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/opera.svg",
  brave: "https://raw.githubusercontent.com/edent/SuperTinyIcons/master/images/svg/brave.svg"
};


type BrowserType = 'chrome' | 'firefox' | 'edge' | 'safari';

// NEW: Browser Selection Modal Component
const BrowserSelectionModal: React.FC<{
  onSelect: (browser: BrowserType) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  const browsers = [
    {
      type: 'chrome' as BrowserType,
      name: 'Chrome',
      subtitle: 'Google Chrome Browser',
      color: '#4285F4',
      icon: '🎨'
    },
    {
      type: 'brave' as BrowserType,
      name: 'Brave',
      subtitle: 'Privacy-focused Chromium Browser',
      color: '#FB542B',
      icon: '🦁'
    },
    {
      type: 'opera' as BrowserType,
      name: 'Opera',
      subtitle: 'Opera & Opera GX Browser',
      color: '#FF1B2D',
      icon: '🎭'
    },
    {
      type: 'firefox' as BrowserType,
      name: 'Firefox',
      subtitle: 'Mozilla Firefox & Firefox Developer Edition',
      color: '#FF6611',
      icon: '🦊'
    },
    {
      type: 'edge' as BrowserType,
      name: 'Edge',
      subtitle: 'Chromium-based Edge Browser',
      color: '#0078D7',
      icon: '🌐'
    },
    {
      type: 'safari' as BrowserType,
      name: 'Safari',
      subtitle: 'macOS Safari (Requires Xcode)',
      color: '#006CFF',
      icon: '🧭'
    }
  ];


  return (
    <div className="browser-modal-overlay" onClick={onClose}>
      <div className="browser-modal" onClick={(e) => e.stopPropagation()}>
        <div className="browser-modal-header">
          <h2>Select Your Browser</h2>
          <p>Choose the browser you want to preview your extension in</p>
        </div>

        <div className="browser-grid">
          {browsers.map((browser) => (
            <button
              key={browser.type}
              onClick={() => onSelect(browser.type)}
              className="browser-card"
              style={{ '--browser-color': browser.color } as React.CSSProperties}
            >
              <div className="browser-card-icon">
                <img src={BROWSER_LOGOS[browser.type]} alt={browser.name} />
              </div>
              <div className="browser-card-content">
                <h3>{browser.icon} {browser.name}</h3>
                <p>{browser.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="browser-modal-close">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

const InstallationGuide: React.FC<{ browser: BrowserType }> = ({ browser }) => {
  const guides = {
    chrome: {
      title: 'Chrome / Chromium Browsers',
      subtitle: 'Works for Chrome, Brave, Opera, Vivaldi',
      icon: '🎨',
      color: '#4285F4',
      steps: [
        { text: 'Download and extract the extension files', highlight: 'Download button above' },
        { text: 'Open Chrome and navigate to', code: 'chrome://extensions' },
        { text: 'Toggle "Developer mode" in the top right corner' },
        { text: 'Click "Load unpacked" button' },
        { text: 'Select the extracted folder containing manifest.json' },
        { text: 'Your extension is now installed! 🎉' }
      ],
      tips: [
        'Extensions stay installed until manually removed',
        'Refresh the extension after making changes',
        'Check console for any errors'
      ]
    },
    brave: {
      title: 'Brave Browser',
      subtitle: 'Privacy-focused Chromium Browser',
      icon: '🦁',
      color: '#FB542B',
      steps: [
        { text: 'Download and extract the extension files', highlight: 'Download button above' },
        { text: 'Open Brave and navigate to', code: 'brave://extensions' },
        { text: 'Toggle "Developer mode" in the top right corner' },
        { text: 'Click "Load unpacked" button' },
        { text: 'Select the extracted folder containing manifest.json' },
        { text: 'Your extension is now installed in Brave! 🦁' }
      ],
      tips: [
        'Brave is Chromium-based, so Chrome extensions work perfectly',
        'Built-in ad blocker and privacy features',
        'Same installation process as Chrome'
      ]
    },
    opera: {
      title: 'Opera Browser',
      subtitle: 'Opera & Opera GX Browser',
      icon: '🎭',
      color: '#FF1B2D',
      steps: [
        { text: 'Download and extract the extension files', highlight: 'Download button above' },
        { text: 'Open Opera and navigate to', code: 'opera://extensions' },
        { text: 'Enable "Developer mode" (toggle top right)' },
        { text: 'Click "Load unpacked extension" button' },
        { text: 'Select your extension folder' },
        { text: 'Extension is now active in Opera! 🎭' }
      ],
      tips: [
        'Opera is Chromium-based with extra features',
        'Works with both Opera and Opera GX',
        'Extensions can be installed from Chrome Web Store'
      ]
    },
    firefox: {
      title: 'Firefox Browser',
      subtitle: 'Mozilla Firefox & Firefox Developer Edition',
      icon: '🦊',
      color: '#FF6611',
      steps: [
        { text: 'Download and extract the extension files', highlight: 'Download button above' },
        { text: 'Open Firefox and navigate to', code: 'about:debugging#/runtime/this-firefox' },
        { text: 'Click "Load Temporary Add-on" button' },
        { text: 'Select manifest.json from your extracted folder' },
        { text: 'Extension loads temporarily (until browser restart)' },
        { text: 'For permanent install, package as .xpi and sign it' }
      ],
      tips: [
        'Temporary extensions reset on browser restart',
        'For permanent install, submit to Firefox Add-ons',
        'Use web-ext tool for easier development'
      ]
    },
    edge: {
      title: 'Microsoft Edge',
      subtitle: 'Chromium-based Edge Browser',
      icon: '🌐',
      color: '#0078D7',
      steps: [
        { text: 'Download and extract the extension files', highlight: 'Download button above' },
        { text: 'Open Edge and navigate to', code: 'edge://extensions' },
        { text: 'Enable "Developer mode" (toggle bottom left)' },
        { text: 'Click "Load unpacked" button' },
        { text: 'Select your extension folder' },
        { text: 'Extension is now active in Edge! ✅' }
      ],
      tips: [
        'Edge uses Chromium, so Chrome extensions work',
        'Extensions can be published to Edge Add-ons store',
        'Developer mode required for unpacked extensions'
      ]
    },
    safari: {
      title: 'Safari Browser',
      subtitle: 'macOS Safari (Requires Xcode)',
      icon: '🧭',
      color: '#006CFF',
      steps: [
        { text: 'Safari extensions require conversion to Safari Web Extension format' },
        { text: 'Install Xcode from Mac App Store' },
        { text: 'Use Safari Web Extension Converter:', code: 'xcrun safari-web-extension-converter [folder]' },
        { text: 'Open the generated Xcode project' },
        { text: 'Build and run the project in Xcode' },
        { text: 'Enable extension in Safari Preferences → Extensions' }
      ],
      tips: [
        'Safari requires macOS and Xcode',
        'Extensions need to be signed for distribution',
        'Safari uses WebExtensions API with some differences'
      ]
    }
  };

  const guide = guides[browser];
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="installation-guide">
      <div className="guide-header" style={{ borderLeftColor: guide.color }}>
        <div className="guide-title-row">
          <span className="guide-icon">{guide.icon}</span>
          <div>
            <h3 className="guide-title">{guide.title}</h3>
            <p className="guide-subtitle">{guide.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="guide-content">
        <div className="guide-section">
          <h4 className="section-title">
            <CheckCircle size={16} />
            Installation Steps
          </h4>
          <ol className="steps-list">
            {guide.steps.map((step, i) => (
              <li key={i} className="step-item">
                <span className="step-number">{i + 1}</span>
                <div className="step-content">
                  <span>{step.text}</span>
                  {step.code && (
                    <div className="code-block-wrapper">
                      <code className="step-code">{step.code}</code>
                      <button
                        onClick={() => copyCode(step.code!)}
                        className="copy-code-btn"
                        title="Copy code"
                        type="button"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                  {'highlight' in step && step.highlight && (
                    <span className="step-highlight">({step.highlight})</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {guide.tips && (
          <div className="guide-section tips-section">
            <h4 className="section-title">
              <Info size={16} />
              Pro Tips
            </h4>
            <ul className="tips-list">
              {guide.tips.map((tip, i) => (
                <li key={i} className="tip-item">💡 {tip}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="guide-links">
          <a
            href={
              browser === 'chrome' ? 'https://developer.chrome.com/docs/extensions/' :
                browser === 'firefox' ? 'https://extensionworkshop.com/' :
                  browser === 'edge' ? 'https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/' :
                    'https://developer.apple.com/documentation/safariservices/safari_web_extensions'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="guide-link"
          >
            <ExternalLink size={14} />
            Official Documentation
          </a>
        </div>
      </div>
    </div>
  );
};

const FilesList: React.FC<{ files: GeneratedFile[] }> = ({ files }) => {
  const totalSize = useMemo(() => {
    return files.reduce((acc, file) => acc + file.content.length, 0);
  }, [files]);

  return (
    <div className="files-list-panel">
      <div className="files-list-header">
        <h4 className="files-list-title">
          <FileCode size={16} />
          Generated Files
        </h4>
        <div className="files-stats">
          <span className="stat-badge">{files.length} files</span>
          <span className="stat-badge">{(totalSize / 1024).toFixed(1)} KB</span>
        </div>
      </div>
      <div className="files-grid">
        {files.map((file, i) => {
          const fileExt = file.name.split('.').pop()?.toLowerCase();
          const fileIcon = {
            'html': '📄',
            'css': '🎨',
            'js': '⚡',
            'json': '📋',
            'png': '🖼️',
            'jpg': '🖼️',
            'svg': '🎨',
            'md': '📝'
          }[fileExt || ''] || '📁';

          return (
            <div key={i} className="file-item">
              <div className="file-icon">{fileIcon}</div>
              <div className="file-info">
                <span className="file-name" title={file.name}>{file.name}</span>
                <span className="file-size">{(file.content.length / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CodePreview: React.FC<CodePreviewProps> = ({ files, onBrowserSelect }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBrowser, setSelectedBrowser] = useState<BrowserType | null>(null);
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState<any>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Load credits
  useEffect(() => {
    const loadCredits = async () => {
      if (user) {
        const userCredits = await getUserCredits(user.uid);
        setCredits(userCredits);

        if (userCredits?.plan === 'free' && userCredits.credits <= 3) {
          setShowUpgradePrompt(true);
        }
      }
    };
    loadCredits();
  }, [user]);

  // Show browser selection modal when files are first generated
  useEffect(() => {
    if (files.length > 0 && !selectedBrowser) {
      const savedBrowser = localStorage.getItem('preferredBrowser') as BrowserType;
      if (savedBrowser) {
        setSelectedBrowser(savedBrowser);
      } else {
        setShowBrowserModal(true);
      }
    }
  }, [files]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBrowserSelection = (browser: BrowserType) => {
    setSelectedBrowser(browser);
    localStorage.setItem('preferredBrowser', browser);
    setShowBrowserModal(false);
    if (onBrowserSelect) {
      onBrowserSelect(browser);
    }
  };

  const entryFile = useMemo(() => {
    return files.find(f => f.name === 'popup.html') ||
      files.find(f => f.name === 'index.html') ||
      files.find(f => f.name === 'options.html') ||
      files.find(f => f.name.endsWith('.html'));
  }, [files]);

  const cssFiles = useMemo(() => {
    return files.filter(f => f.name.endsWith('.css') || f.language === 'css');
  }, [files]);

  const jsFiles = useMemo(() => {
    return files.filter(f => f.name.endsWith('.js') || f.language === 'javascript');
  }, [files]);

  const previewHtml = useMemo(() => {
    if (!entryFile || !selectedBrowser) return null;

    try {
      let html = entryFile.content;

      cssFiles.forEach(cssFile => {
        const cssLinkPattern = new RegExp(`<link[^>]*href=["']${cssFile.name}["'][^>]*>`, 'gi');
        html = html.replace(cssLinkPattern, `<style>${cssFile.content}</style>`);
      });

      const linkedCssFiles = cssFiles.filter(cssFile =>
        html.includes(`href="${cssFile.name}"`) || html.includes(`href='${cssFile.name}'`)
      );

      const unlinkedCssFiles = cssFiles.filter(cssFile =>
        !linkedCssFiles.includes(cssFile)
      );

      if (unlinkedCssFiles.length > 0) {
        const additionalStyles = unlinkedCssFiles.map(f => `<style>${f.content}</style>`).join('\n');
        html = html.replace(/<\/head>/i, `${additionalStyles}</head>`);
      }

      const mockAPI = ['chrome', 'edge'].includes(selectedBrowser) ? `
<script>
  (function() {
    const storageKey = '${selectedBrowser}_ext_storage';
    window.chrome = window.chrome || {};
    window.chrome.storage = {
      local: {
        get: function(keys, callback) {
          const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
          const result = {};
          if (typeof keys === 'string') result[keys] = data[keys];
          else if (Array.isArray(keys)) keys.forEach(key => result[key] = data[key]);
          else Object.assign(result, data);
          if (callback) callback(result);
          return Promise.resolve(result);
        },
        set: function(items, callback) {
          const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
          Object.assign(data, items);
          localStorage.setItem(storageKey, JSON.stringify(data));
          console.log('🎨 ${selectedBrowser.toUpperCase()} storage:', items);
          if (callback) callback();
          return Promise.resolve();
        },
        remove: function(keys, callback) {
          const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
          if (Array.isArray(keys)) keys.forEach(key => delete data[key]);
          else delete data[keys];
          localStorage.setItem(storageKey, JSON.stringify(data));
          if (callback) callback();
          return Promise.resolve();
        }
      }
    };
    window.chrome.runtime = {
      sendMessage: (msg, cb) => { if (cb) cb({ success: true }); return Promise.resolve({ success: true }); },
      getURL: (path) => path,
      id: 'preview-extension-${selectedBrowser}'
    };
    window.chrome.tabs = {
      query: (q, cb) => { if (cb) cb([{ id: 1 }]); return Promise.resolve([{ id: 1 }]); },
      sendMessage: (id, msg, cb) => { if (cb) cb({ success: true }); return Promise.resolve({ success: true }); }
    };
    console.log('🎨 ${selectedBrowser.toUpperCase()} Extension API ready');
  })();
</script>` : selectedBrowser === 'firefox' ? `
<script>
  (function() {
    const storageKey = 'firefox_ext_storage';
    window.browser = {
      storage: {
        local: {
          get: function(keys) {
            return new Promise((resolve) => {
              const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
              const result = {};
              if (typeof keys === 'string') result[keys] = data[keys];
              else if (Array.isArray(keys)) keys.forEach(key => result[key] = data[key]);
              else Object.assign(result, data);
              resolve(result);
            });
          },
          set: function(items) {
            return new Promise((resolve) => {
              const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
              Object.assign(data, items);
              localStorage.setItem(storageKey, JSON.stringify(data));
              console.log('🦊 Firefox storage:', items);
              resolve();
            });
          },
          remove: function(keys) {
            return new Promise((resolve) => {
              const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
              if (Array.isArray(keys)) keys.forEach(key => delete data[key]);
              else delete data[keys];
              localStorage.setItem(storageKey, JSON.stringify(data));
              resolve();
            });
          }
        }
      },
      runtime: {
        sendMessage: (msg) => Promise.resolve({ success: true }),
        getURL: (path) => path,
        id: 'preview-extension-firefox'
      },
      tabs: {
        query: (q) => Promise.resolve([{ id: 1 }]),
        sendMessage: (id, msg) => Promise.resolve({ success: true })
      }
    };
    window.chrome = window.browser;
    console.log('🦊 Firefox WebExtension API ready');
  })();
</script>` : `
<script>
  (function() {
    const storageKey = 'safari_ext_storage';
    window.browser = {
      storage: {
        local: {
          get: function(keys) {
            return new Promise((resolve) => {
              const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
              const result = {};
              if (typeof keys === 'string') result[keys] = data[keys];
              else if (Array.isArray(keys)) keys.forEach(key => result[key] = data[key]);
              else Object.assign(result, data);
              resolve(result);
            });
          },
          set: function(items) {
            return new Promise((resolve) => {
              const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
              Object.assign(data, items);
              localStorage.setItem(storageKey, JSON.stringify(data));
              console.log('🧭 Safari storage:', items);
              resolve();
            });
          }
        }
      },
      runtime: {
        sendMessage: (msg) => Promise.resolve({ success: true }),
        getURL: (path) => path,
        id: 'preview-extension-safari'
      }
    };
    console.log('🧭 Safari Web Extension API ready');
  })();
</script>`;

      html = html.replace(/<\/head>/i, `${mockAPI}</head>`);

      jsFiles.forEach(jsFile => {
        const jsPattern = new RegExp(`<script[^>]*src=["']${jsFile.name}["'][^>]*><\/script>`, 'gi');
        html = html.replace(jsPattern, `<script>${jsFile.content}</script>`);
      });

      // Inject popup scripts (not background/content scripts)
      const popupScripts = jsFiles.filter(f =>
        !f.name.includes('background') && !f.name.includes('content')
      );

      // Remove script src tags that try to load files (they don't exist in blob)
      html = html.replace(/<script\s+src=['"][^'"]*['"][^>]*>\s*<\/script>/gi, '');

      // Inject scripts with DOMContentLoaded wrapper to ensure buttons exist
      const injectedScripts = popupScripts.map(f => {
        // Check if the code already has DOMContentLoaded
        const hasDOMReady = f.content.includes('DOMContentLoaded') ||
          f.content.includes('$(document).ready') ||
          f.content.includes('window.onload');

        if (hasDOMReady) {
          // Code already waits for DOM, use as-is
          return `<script>
// File: ${f.name}
try {
  ${f.content}
  console.log('✅ ${f.name} executed successfully');
} catch(e) { console.error('❌ ${f.name} error:', e); }
</script>`;
        } else {
          // Wrap in robust DOM readiness check
          return `<script>
// File: ${f.name}
(function() {
  const run = () => {
    try {
      ${f.content}
      console.log('✅ ${f.name} executed successfully');
    } catch(e) { console.error('❌ ${f.name} error:', e); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    // DOM already ready, run immediately
    run();
  }
})();
</script>`;
        }
      }).join('\n');

      if (html.includes('</body>')) {
        html = html.replace(/<\/body>/i, `${injectedScripts}\n</body>`);
      } else {
        html += `\n${injectedScripts}`;
      }
      const baseStyles = `<style>
        html,body{margin:0;padding:0;width:100%;height:100%;overflow-x:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;}
        *{box-sizing:border-box;}
        @media(max-width:768px){body{font-size:14px;}}
        ::-webkit-scrollbar{width:8px;height:8px;}
        ::-webkit-scrollbar-track{background:#f1f1f1;}
        ::-webkit-scrollbar-thumb{background:#888;border-radius:4px;}
        ::-webkit-scrollbar-thumb:hover{background:#555;}
      </style>`;
      html = html.replace(/<\/head>/i, `${baseStyles}</head>`);

      return html;
    } catch (error) {
      console.error('Preview generation error:', error);
      return null;
    }
  }, [files, selectedBrowser, entryFile, cssFiles, jsFiles]);

  useEffect(() => {
    if (!previewHtml) return;

    try {
      const blob = new Blob([previewHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Preview error:', error);
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewHtml]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const blob = new Blob([previewHtml || ''], { type: 'text/html' });
      setPreviewUrl(URL.createObjectURL(blob));
      setIsRefreshing(false);
    }, 300);
  };

  if (files.length === 0) {
    return (
      <div className="preview-empty-state">
        <Eye size={48} strokeWidth={1.5} className="preview-empty-icon" />
        <p>No preview available</p>
        <p className="empty-hint">Generate an extension to see it in action</p>
      </div>
    );
  }

  if (!entryFile) {
    return (
      <div className="preview-empty-state">
        <FileCode size={48} strokeWidth={1.5} className="preview-empty-icon" />
        <p>No HTML file found</p>
        <p className="empty-hint">Extension needs an HTML file for preview</p>
        <FilesList files={files} />
      </div>
    );
  }

  const browserInfo = selectedBrowser ? {
    chrome: { name: 'Chrome', icon: '🎨', color: '#4285F4' },
    brave: { name: 'Brave', icon: '🦁', color: '#FB542B' },
    opera: { name: 'Opera', icon: '🎭', color: '#FF1B2D' },
    firefox: { name: 'Firefox', icon: '🦊', color: '#FF6611' },
    edge: { name: 'Edge', icon: '🌐', color: '#0078D7' },
    safari: { name: 'Safari', icon: '🧭', color: '#006CFF' }
  }[selectedBrowser] : null;


  return (
    <>
      {/* Browser Selection Modal */}
      {showBrowserModal && (
        <BrowserSelectionModal
          onSelect={handleBrowserSelection}
          onClose={() => setShowBrowserModal(false)}
        />
      )}

      <div className="preview-container">
        {/* Credits Banner */}
        {credits && (
          <div className={`credits-banner ${credits.plan === 'free' && credits.credits <= 3 ? 'credits-low' : ''}`}>
            <div className="credits-info">
              <Zap size={16} className="credits-icon" />
              <span className="credits-text">
                <strong>{credits.credits}</strong> / {credits.maxCredits} prompts left
              </span>
              <span className="credits-plan">({credits.plan} plan)</span>
            </div>
            {credits.plan === 'free' && credits.credits <= 3 && (
              <button
                onClick={() => navigate('/#pricing')}
                className="credits-upgrade-btn"
              >
                <CreditCard size={14} />
                Upgrade Plan
              </button>
            )}
          </div>
        )}

        <div className="preview-topbar">
          <div className="preview-label">
            <Eye size={18} strokeWidth={2} />
            {!isMobile && <span>Live Preview</span>}
            {selectedBrowser && browserInfo && (
              <span className="browser-indicator" style={{ color: browserInfo.color }}>
                {browserInfo.icon} {browserInfo.name}
              </span>
            )}
          </div>

          <div className="preview-toolbar">
            <div className="preview-actions-group">
              <button
                onClick={() => setShowBrowserModal(true)}
                className="icon-btn browser-change-btn"
                title="Change Browser"
                type="button"
              >
                {selectedBrowser && <img src={BROWSER_LOGOS[selectedBrowser]} alt="browser" className="browser-logo-small" />}
                <span>Change</span>
              </button>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className={`icon-btn ${showGuide ? 'active' : ''}`}
                title="Installation Guide"
                type="button"
              >
                <Info size={16} />
              </button>
              <button
                onClick={handleRefresh}
                className="icon-btn"
                disabled={isRefreshing}
                title="Refresh Preview"
                type="button"
              >
                <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
              </button>
              <button
                onClick={() => setIsFullscreen(true)}
                className="icon-btn"
                title="Fullscreen Mode"
                type="button"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Upgrade Prompt */}
        {showUpgradePrompt && credits?.plan === 'free' && (
          <div className="upgrade-prompt">
            <div className="upgrade-content">
              <Zap size={24} className="upgrade-icon" />
              <div className="upgrade-text">
                <h4>Running low on prompts!</h4>
                <p>You have only <strong>{credits.credits}</strong> prompts left. Upgrade to continue building amazing extensions.</p>
              </div>
            </div>
            <div className="upgrade-actions">
              <button onClick={() => setShowUpgradePrompt(false)} className="upgrade-dismiss">
                Later
              </button>
              <button onClick={() => navigate('/#pricing')} className="upgrade-cta">
                View Plans
              </button>
            </div>
          </div>
        )}

        <div className="preview-content-wrapper">
          {showGuide ? (
            <div className="guide-panel">
              <FilesList files={files} />
              {selectedBrowser && <InstallationGuide browser={selectedBrowser} />}
            </div>
          ) : (
            <div className="preview-viewport">
              {previewUrl && selectedBrowser ? (
                <iframe
                  key={`${previewUrl}-${selectedBrowser}`}
                  src={previewUrl}
                  className="preview-iframe"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  title="Extension Preview"
                />
              ) : (
                <div className="preview-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading preview...</p>
                </div>
              )}

              <div className="preview-info-bar">
                <div className="info-item">
                  <FileCode size={14} />
                  <span>{files.length} files</span>
                </div>
                {selectedBrowser && browserInfo && (
                  <div className="info-item">
                    <span className="api-badge" style={{ backgroundColor: `${browserInfo.color}15`, color: browserInfo.color }}>
                      {browserInfo.icon} {browserInfo.name} API
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isFullscreen && selectedBrowser && (
        <div className="fullscreen-overlay" onClick={() => setIsFullscreen(false)}>
          <div className="fullscreen-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-topbar">
              <div className="fullscreen-label">
                <Eye size={20} />
                <span>Live Preview</span>
                {browserInfo && (
                  <span className="browser-indicator" style={{ color: browserInfo.color }}>
                    {browserInfo.icon} {browserInfo.name}
                  </span>
                )}
              </div>

              <div className="fullscreen-toolbar">
                <div className="fullscreen-actions">
                  <button onClick={handleRefresh} className="icon-btn" type="button" title="Refresh">
                    <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
                  </button>
                  <button onClick={() => setIsFullscreen(false)} className="icon-btn close" type="button" title="Close">
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="fullscreen-viewport-wrapper">
              {previewUrl && (
                <iframe
                  key={`fullscreen-${previewUrl}-${selectedBrowser}`}
                  src={previewUrl}
                  className="fullscreen-iframe"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  title="Fullscreen Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CodePreview;
