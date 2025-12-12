'use client';

import { Component, ReactNode } from 'react';
import { X, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    copied: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            copied: false
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ errorInfo });
        // Log para desenvolvimento
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleDismiss = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleCopyError = async () => {
        const { error, errorInfo } = this.state;
        const errorText = `Error: ${error?.message}\n\nStack: ${error?.stack}\n\nComponent Stack: ${errorInfo?.componentStack}`;
        
        try {
            await navigator.clipboard.writeText(errorText);
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, copied } = this.state;

            return (
                <>
                    {this.props.children}
                    
                    {/* Modal de Erro */}
                    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
                        {/* Backdrop */}
                        <div 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={this.handleDismiss}
                        />
                        
                        {/* Modal */}
                        <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-red-500/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-red-500/20">
                                        <AlertTriangle className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-sm">Development Error</h3>
                                        <p className="text-white/50 text-xs">Something went wrong</p>
                                    </div>
                                </div>
                                <button
                                    onClick={this.handleDismiss}
                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-4 h-4 text-white/60" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
                                {/* Error Message */}
                                <div className="space-y-2">
                                    <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Error Message</p>
                                    <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                                        <code className="text-red-400 text-sm font-mono break-all">
                                            {error?.message || 'Unknown error'}
                                        </code>
                                    </div>
                                </div>

                                {/* Stack Trace (collapsed by default) */}
                                {error?.stack && (
                                    <details className="group">
                                        <summary className="text-xs text-white/40 uppercase tracking-wider font-medium cursor-pointer hover:text-white/60 transition-colors flex items-center gap-2">
                                            <span>Stack Trace</span>
                                            <span className="text-white/20 group-open:rotate-90 transition-transform">▶</span>
                                        </summary>
                                        <div className="mt-2 p-3 rounded-lg bg-black/40 border border-white/5 max-h-32 overflow-y-auto">
                                            <pre className="text-white/50 text-xs font-mono whitespace-pre-wrap break-all">
                                                {error.stack}
                                            </pre>
                                        </div>
                                    </details>
                                )}

                                {/* Component Stack */}
                                {errorInfo?.componentStack && (
                                    <details className="group">
                                        <summary className="text-xs text-white/40 uppercase tracking-wider font-medium cursor-pointer hover:text-white/60 transition-colors flex items-center gap-2">
                                            <span>Component Stack</span>
                                            <span className="text-white/20 group-open:rotate-90 transition-transform">▶</span>
                                        </summary>
                                        <div className="mt-2 p-3 rounded-lg bg-black/40 border border-white/5 max-h-32 overflow-y-auto">
                                            <pre className="text-white/50 text-xs font-mono whitespace-pre-wrap">
                                                {errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    </details>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between px-5 py-4 border-t border-white/10 bg-black/20">
                                <button
                                    onClick={this.handleCopyError}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                            <span className="text-green-400">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy Error</span>
                                        </>
                                    )}
                                </button>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={this.handleDismiss}
                                        className="px-4 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={this.handleReload}
                                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-white transition-all"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Reload
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        return this.props.children;
    }
}
