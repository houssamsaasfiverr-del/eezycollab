// src/components/Terminal.tsx - VS Code Style Integrated Terminal
import React, { useRef, useEffect, useState } from 'react';
import { Terminal as TerminalIcon, ChevronDown, ChevronUp, X, Maximize2, Minimize2 } from 'lucide-react';
import { TerminalCommand } from '../methods/services/aiService';

interface TerminalProps {
    commands: TerminalCommand[];
    isGenerating: boolean;
    onClear?: () => void;
    onMinimize?: () => void;
    isMinimized?: boolean;
}

const Terminal: React.FC<TerminalProps> = ({
    commands,
    isGenerating,
    onClear,
    onMinimize,
    isMinimized = false
}) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-scroll to bottom when new commands arrive
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [commands]);

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getCommandIcon = (type: TerminalCommand['type']): string => {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '✗';
            case 'warning': return '⚠';
            case 'command': return '>';
            default: return '•';
        }
    };

    const getCommandClass = (type: TerminalCommand['type']): string => {
        switch (type) {
            case 'success': return 'terminal-line-success';
            case 'error': return 'terminal-line-error';
            case 'warning': return 'terminal-line-warning';
            case 'command': return 'terminal-line-command';
            default: return 'terminal-line-info';
        }
    };

    if (isMinimized) {
        return (
            <div className="terminal-minimized" onClick={onMinimize}>
                <TerminalIcon className="w-4 h-4" />
                <span>Terminal</span>
                {isGenerating && <span className="terminal-badge-active">Running</span>}
                {commands.length > 0 && <span className="terminal-badge">{commands.length}</span>}
                <ChevronUp className="w-4 h-4" />
            </div>
        );
    }

    return (
        <div className={`terminal-container ${isExpanded ? 'terminal-expanded' : ''}`}>
            {/* Terminal Header */}
            <div className="terminal-header">
                <div className="terminal-header-left">
                    <TerminalIcon className="w-4 h-4" />
                    <span className="terminal-title">TERMINAL</span>
                    {isGenerating && (
                        <span className="terminal-status-active">
                            <span className="terminal-dot"></span>
                            Running
                        </span>
                    )}
                </div>
                <div className="terminal-header-right">
                    <button
                        onClick={onClear}
                        className="terminal-header-btn"
                        title="Clear Terminal"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="terminal-header-btn"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={onMinimize}
                        className="terminal-header-btn"
                        title="Minimize"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Terminal Content */}
            <div className="terminal-content" ref={terminalRef}>
                {commands.length === 0 ? (
                    <div className="terminal-empty">
                        <span className="terminal-prompt">&gt;</span>
                        <span className="terminal-hint">Agent ready. Enter a prompt to start building...</span>
                    </div>
                ) : (
                    <>
                        {commands.map((cmd, index) => (
                            <div key={index} className={`terminal-line ${getCommandClass(cmd.type)}`}>
                                <span className="terminal-timestamp">[{formatTime(cmd.timestamp)}]</span>
                                <span className="terminal-icon">{getCommandIcon(cmd.type)}</span>
                                <span className="terminal-message">{cmd.message}</span>
                            </div>
                        ))}
                        {isGenerating && (
                            <div className="terminal-line terminal-line-active">
                                <span className="terminal-timestamp">[{formatTime(new Date())}]</span>
                                <span className="terminal-icon">&gt;</span>
                                <span className="terminal-cursor">█</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Terminal;
