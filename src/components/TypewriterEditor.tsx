// src/components/TypewriterEditor.tsx - Typewriter Effect Code Editor
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Pause, FastForward, SkipForward } from 'lucide-react';

interface TypewriterEditorProps {
    content: string;
    language: string;
    isStreaming: boolean;
    onComplete?: () => void;
    speed?: 'slow' | 'normal' | 'fast';
}

const TypewriterEditor: React.FC<TypewriterEditorProps> = ({
    content,
    language,
    isStreaming,
    onComplete,
    speed = 'normal'
}) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [currentSpeed, setCurrentSpeed] = useState(speed);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const getSpeedMs = (speedType: string): number => {
        switch (speedType) {
            case 'slow': return 50;
            case 'normal': return 15;
            case 'fast': return 3;
            default: return 15;
        }
    };

    // Typewriter effect
    useEffect(() => {
        if (!isStreaming || isPaused) return;

        if (currentIndex >= content.length) {
            onComplete?.();
            return;
        }

        const speedMs = getSpeedMs(currentSpeed);

        intervalRef.current = setTimeout(() => {
            // Type multiple characters at once for faster speeds
            const chunkSize = currentSpeed === 'fast' ? 10 : currentSpeed === 'normal' ? 3 : 1;
            const nextIndex = Math.min(currentIndex + chunkSize, content.length);
            setDisplayedContent(content.substring(0, nextIndex));
            setCurrentIndex(nextIndex);
        }, speedMs);

        return () => {
            if (intervalRef.current) {
                clearTimeout(intervalRef.current);
            }
        };
    }, [content, currentIndex, isStreaming, isPaused, currentSpeed, onComplete]);

    // Reset when content changes completely
    useEffect(() => {
        if (!isStreaming) {
            setDisplayedContent(content);
            setCurrentIndex(content.length);
        }
    }, [content, isStreaming]);

    // When streaming starts, reset
    useEffect(() => {
        if (isStreaming && displayedContent === '') {
            setCurrentIndex(0);
            setDisplayedContent('');
        }
    }, [isStreaming]);

    const handlePause = () => {
        setIsPaused(!isPaused);
    };

    const handleSpeedChange = () => {
        const speeds: ('slow' | 'normal' | 'fast')[] = ['slow', 'normal', 'fast'];
        const currentIdx = speeds.indexOf(currentSpeed);
        const nextIdx = (currentIdx + 1) % speeds.length;
        setCurrentSpeed(speeds[nextIdx]);
    };

    const handleSkip = () => {
        setDisplayedContent(content);
        setCurrentIndex(content.length);
        onComplete?.();
    };

    const progress = content.length > 0 ? (currentIndex / content.length) * 100 : 0;

    return (
        <div className="typewriter-editor-container">
            {/* Streaming Controls */}
            {isStreaming && currentIndex < content.length && (
                <div className="typewriter-controls">
                    <div className="typewriter-progress-container">
                        <div className="typewriter-progress-bar">
                            <div
                                className="typewriter-progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="typewriter-progress-text">
                            {Math.round(progress)}%
                        </span>
                    </div>

                    <div className="typewriter-buttons">
                        <button
                            onClick={handlePause}
                            className="typewriter-btn"
                            title={isPaused ? 'Resume' : 'Pause'}
                        >
                            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </button>

                        <button
                            onClick={handleSpeedChange}
                            className="typewriter-btn speed-btn"
                            title={`Speed: ${currentSpeed}`}
                        >
                            <FastForward className="w-4 h-4" />
                            <span className="speed-label">{currentSpeed}</span>
                        </button>

                        <button
                            onClick={handleSkip}
                            className="typewriter-btn skip-btn"
                            title="Skip to end"
                        >
                            <SkipForward className="w-4 h-4" />
                            <span>Skip</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Monaco Editor */}
            <div className="typewriter-monaco">
                <Editor
                    height="100%"
                    language={language}
                    value={displayedContent}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                        fontLigatures: true,
                        lineNumbers: 'on',
                        renderLineHighlight: 'all',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        readOnly: true,
                        padding: { top: 16, bottom: 16 },
                        smoothScrolling: true,
                        cursorBlinking: isStreaming ? 'phase' : 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        bracketPairColorization: { enabled: true },
                        guides: { bracketPairs: true, indentation: true }
                    }}
                />

                {/* Typing Cursor Overlay */}
                {isStreaming && currentIndex < content.length && !isPaused && (
                    <div className="typewriter-cursor-overlay">
                        <span className="typewriter-cursor">▌</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TypewriterEditor;
