// src/components/AgentStatus.tsx - Agent Status Bar Component
import React from 'react';
import { Bot, Loader2, CheckCircle, AlertCircle, FileCode, Clock, Sparkles } from 'lucide-react';

interface AgentStatusProps {
    status: 'idle' | 'thinking' | 'writing' | 'complete' | 'error';
    currentFile?: string;
    filesCompleted: number;
    totalFiles: number;
    elapsedTime: number;
    message?: string;
}

const AgentStatus: React.FC<AgentStatusProps> = ({
    status,
    currentFile,
    filesCompleted,
    totalFiles,
    elapsedTime,
    message
}) => {
    const formatTime = (seconds: number): string => {
        if (seconds < 60) {
            return `${seconds}s`;
        }
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'thinking':
                return <Sparkles className="w-4 h-4 agent-icon-thinking" />;
            case 'writing':
                return <Loader2 className="w-4 h-4 agent-icon-writing animate-spin" />;
            case 'complete':
                return <CheckCircle className="w-4 h-4 agent-icon-complete" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 agent-icon-error" />;
            default:
                return <Bot className="w-4 h-4 agent-icon-idle" />;
        }
    };

    const getStatusText = (): string => {
        if (message) return message;

        switch (status) {
            case 'thinking':
                return 'Analyzing request...';
            case 'writing':
                return currentFile ? `Writing ${currentFile}...` : 'Generating code...';
            case 'complete':
                return 'Build complete!';
            case 'error':
                return 'Build failed';
            default:
                return 'Ready';
        }
    };

    const getStatusClass = (): string => {
        switch (status) {
            case 'thinking': return 'agent-status-thinking';
            case 'writing': return 'agent-status-writing';
            case 'complete': return 'agent-status-complete';
            case 'error': return 'agent-status-error';
            default: return 'agent-status-idle';
        }
    };

    return (
        <div className={`agent-status-bar ${getStatusClass()}`}>
            <div className="agent-status-left">
                <div className="agent-status-indicator">
                    {getStatusIcon()}
                    <span className="agent-status-text">{getStatusText()}</span>
                </div>

                {status !== 'idle' && totalFiles > 0 && (
                    <div className="agent-status-progress">
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Files: {filesCompleted}/{totalFiles}</span>
                        <div className="agent-progress-bar">
                            <div
                                className="agent-progress-fill"
                                style={{ width: `${(filesCompleted / totalFiles) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="agent-status-right">
                {status !== 'idle' && (
                    <div className="agent-status-time">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(elapsedTime)}</span>
                    </div>
                )}

                {(status === 'thinking' || status === 'writing') && (
                    <div className="agent-status-dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentStatus;
