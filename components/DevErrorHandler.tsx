'use client';

import { useEffect, useState } from 'react';
import { X, AlertTriangle, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface DevError {
    id: string;
    type: 'error' | 'warning';
    message: string;
    stack?: string;
    timestamp: Date;
}

export default function DevErrorHandler() {
    const [errors, setErrors] = useState<DevError[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        // Só ativa em desenvolvimento
        if (process.env.NODE_ENV !== 'development') return;

        // Esconde o overlay padrão do Next.js
        const style = document.createElement('style');
        style.id = 'hide-nextjs-overlay';
        style.textContent = `
            nextjs-portal { display: none !important; }
            [data-nextjs-dialog] { display: none !important; }
            [data-nextjs-dialog-overlay] { display: none !important; }
            [data-nextjs-toast] { display: none !important; }
            #__next-build-indicator { display: none !important; }
            [data-nextjs-scroll-focus-boundary] + div[style*="position: fixed"] { display: none !important; }
        `;
        document.head.appendChild(style);

        // Captura erros do console
        const originalError = console.error;
        const originalWarn = console.warn;

        console.error = (...args) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');

            // Ignora alguns erros internos do React/Next e erros de rede
            const ignoredPatterns = [
                'Warning: ReactDOM.render',
                'Download the React DevTools',
                'Failed to fetch',
                'ERR_CONNECTION_CLOSED',
                'ERR_CONNECTION_RESET',
                'ERR_NETWORK',
                'NetworkError',
                'Load failed',
                'Network request failed'
            ];

            if (!ignoredPatterns.some(pattern => message.includes(pattern))) {
                addError('error', message);
            }
            originalError.apply(console, args);
        };

        console.warn = (...args) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            addError('warning', message);
            originalWarn.apply(console, args);
        };

        // Captura erros não tratados
        const handleError = (event: ErrorEvent) => {
            addError('error', event.message, event.error?.stack);
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            addError('error', `Unhandled Promise Rejection: ${event.reason}`);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            console.error = originalError;
            console.warn = originalWarn;
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            document.getElementById('hide-nextjs-overlay')?.remove();
        };
    }, []);

    const addError = (type: 'error' | 'warning', message: string, stack?: string) => {
        const newError: DevError = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            message,
            stack,
            timestamp: new Date()
        };

        setErrors(prev => {
            // Evita duplicatas
            if (prev.some(e => e.message === message)) return prev;
            return [...prev.slice(-19), newError]; // Mantém últimos 20
        });
        setIsOpen(true);
        setShowDetails(false);
    };

    const handleCopy = async (error: DevError) => {
        const text = `${error.type.toUpperCase()}: ${error.message}\n${error.stack || ''}`;
        await navigator.clipboard.writeText(text);
        setCopied(error.id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleCopyAll = async () => {
        const text = errors.map(e => `${e.type.toUpperCase()}: ${e.message}`).join('\n\n');
        await navigator.clipboard.writeText(text);
        setCopied('all');
        setTimeout(() => setCopied(null), 2000);
    };

    const handleDismiss = (id: string) => {
        setErrors(prev => prev.filter(e => e.id !== id));
    };

    const handleClose = () => {
        setIsOpen(false);
        setShowDetails(false);
    };

    const handleClearAll = () => {
        setErrors([]);
        setIsOpen(false);
        setShowDetails(false);
    };

    if (process.env.NODE_ENV !== 'development' || errors.length === 0 || !isOpen) return null;

    const latestError = errors[errors.length - 1];
    const errorCount = errors.filter(e => e.type === 'error').length;
    const warningCount = errors.filter(e => e.type === 'warning').length;

    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-[#1f1f1f] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                {/* Header com gradiente */}
                <div className="relative px-6 py-5 bg-linear-to-b from-red-500/20 to-transparent">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 rounded-full bg-red-500/20 mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-white text-xl font-semibold mb-2">
                            Oops! Algo deu errado
                        </h2>
                        <p className="text-white/50 text-sm max-w-sm">
                            Detectamos {errorCount > 0 && `${errorCount} erro${errorCount > 1 ? 's' : ''}`}
                            {errorCount > 0 && warningCount > 0 && ' e '}
                            {warningCount > 0 && `${warningCount} aviso${warningCount > 1 ? 's' : ''}`} durante o desenvolvimento.
                            Isso não afeta os usuários em produção.
                        </p>
                    </div>
                </div>

                {/* Preview do último erro */}
                {!showDetails && (
                    <div className="px-6 py-4">
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${latestError.type === 'error'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {latestError.type === 'error' ? 'ERRO' : 'AVISO'}
                                </span>
                                <span className="text-white/30 text-xs">
                                    {latestError.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-white/70 text-sm font-mono line-clamp-2">
                                {latestError.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Lista detalhada de erros */}
                {showDetails && (
                    <div className="px-6 py-4 max-h-[40vh] overflow-y-auto">
                        <div className="space-y-3">
                            {errors.map((error) => (
                                <div
                                    key={error.id}
                                    className="p-4 rounded-xl bg-black/40 border border-white/5 group"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${error.type === 'error'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {error.type === 'error' ? 'ERRO' : 'AVISO'}
                                                </span>
                                                <span className="text-white/30 text-xs">
                                                    {error.timestamp.toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-white/70 text-xs font-mono break-all">
                                                {error.message}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleCopy(error)}
                                                className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                title="Copiar"
                                            >
                                                {copied === error.id ? (
                                                    <Check className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDismiss(error.id)}
                                                className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                title="Remover"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10 bg-black/20">
                    {!showDetails ? (
                        <button
                            onClick={() => setShowDetails(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-white/60 hover:text-white transition-colors"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Erro de desenvolvimento — clique aqui para visualizar</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white transition-colors"
                            >
                                <ChevronUp className="w-4 h-4" />
                                <span>Minimizar</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopyAll}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    {copied === 'all' ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-400" />
                                            <span className="text-green-400">Copiado!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            <span>Copiar tudo</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                >
                                    Limpar tudo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
