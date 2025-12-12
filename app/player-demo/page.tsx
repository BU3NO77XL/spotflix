'use client';

import VideoPlayer from '@/components/streaming/VideoPlayer';
import { motion } from 'framer-motion';

export default function PlayerDemo() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] py-8">
            <div className="max-w-6xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Player de Vídeo Personalizado
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Demonstração da nova skin do player com controles avançados
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <VideoPlayer
                        title="Filme de Demonstração"
                        posterUrl="https://images.unsplash.com/photo-1489599735734-79b4169c2a78?w=1920&h=1080&fit=crop"
                        backdropUrl="https://images.unsplash.com/photo-1489599735734-79b4169c2a78?w=1920&h=1080&fit=crop"
                        duration="2:15:30"
                        onPlay={() => console.log('Play iniciado')}
                        onPause={() => console.log('Play pausado')}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-[#141414] rounded-lg p-6"
                >
                    <h2 className="text-2xl font-semibold text-white mb-4">
                        Recursos do Player
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-medium text-white mb-3">Controles Básicos</h3>
                            <ul className="space-y-2 text-gray-300">
                                <li>• Play/Pause com clique simples</li>
                                <li>• Tela cheia com duplo clique</li>
                                <li>• Barra de progresso interativa</li>
                                <li>• Controle de volume com slider</li>
                                <li>• Pular 10 segundos (frente/trás)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white mb-3">Recursos Avançados</h3>
                            <ul className="space-y-2 text-gray-300">
                                <li>• Configurações de qualidade</li>
                                <li>• Velocidade de reprodução</li>
                                <li>• Seleção de idioma/legendas</li>
                                <li>• Transmissão (Cast)</li>
                                <li>• Download offline</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 bg-[#141414] rounded-lg p-6"
                >
                    <h2 className="text-2xl font-semibold text-white mb-4">
                        Design Features
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                                <span className="text-white font-bold">✓</span>
                            </div>
                            <h4 className="text-white font-medium mb-2">Gradiente Verde</h4>
                            <p className="text-gray-400 text-sm">Barra de progresso com gradiente verde moderno</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-black/60 backdrop-blur-sm rounded-full mx-auto mb-3 flex items-center justify-center border border-white/20">
                                <span className="text-white font-bold">⚡</span>
                            </div>
                            <h4 className="text-white font-medium mb-2">Loading Centralizado</h4>
                            <p className="text-gray-400 text-sm">Indicador de carregamento no centro da tela</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mx-auto mb-3 flex items-center justify-center">
                                <span className="text-white font-bold">🎨</span>
                            </div>
                            <h4 className="text-white font-medium mb-2">UI Moderna</h4>
                            <p className="text-gray-400 text-sm">Interface limpa com efeitos de blur e animações</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}