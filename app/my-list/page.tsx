'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/lib/dataClient';
import { Movie } from '@/types/movie';
import { Heart, Clock, Trash2, Play, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MyListHero from '@/components/streaming/MyListHero';
import { toast } from 'sonner';
import MovieModal from '@/components/streaming/MovieModal';

export default function MyList() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'favorites' | 'watch_later'>('favorites');

    const { data: userList = [] } = useQuery({
        queryKey: ['userList'],
        queryFn: () => base44.entities.UserList.list(),
    });

    const { data: movies = [] } = useQuery({
        queryKey: ['movies'],
        queryFn: () => base44.entities.Movie.list(),
    });

    const deleteFromListMutation = useMutation({
        mutationFn: (id: string) => base44.entities.UserList.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userList'] });
            toast.success('Removed from list');
        },
    });

    const addToListMutation = useMutation({
        mutationFn: (data: { movie_id: string; list_type: 'favorites' | 'watch_later' }) =>
            base44.entities.UserList.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userList'] });
            toast.success('Added to list');
        },
    });

    const getMoviesForList = (listType: 'favorites' | 'watch_later') => {
        const listItems = userList.filter(item => item.list_type === listType);
        return listItems.map(item => {
            const movie = movies.find(m => m.id === item.movie_id);
            return movie ? { ...movie, listItemId: item.id } : null;
        }).filter(Boolean) as (Movie & { listItemId: string })[];
    };

    const favorites = getMoviesForList('favorites');
    const watchLater = getMoviesForList('watch_later');

    const handleWatch = (movie: Movie) => {
        router.push(`/watch?id=${movie.id}&ref=${movie.tmdb_id}`);
        setTimeout(() => setModalOpen(false), 500);
    };

    const handleRemove = (listItemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteFromListMutation.mutate(listItemId);
    };

    const currentList = activeTab === 'favorites' ? favorites : watchLater;

    return (
        <div className="min-h-screen bg-[#121212]">
            <MyListHero
                title="Minha Lista"
                description={
                    `Aqui estão seus conteúdos salvos — ${favorites.length} favoritos e ${watchLater.length} para assistir depois.`
                }
                backdrops={(() => {
                    const b = currentList.map((m) => m.backdrop_url).filter(Boolean) as string[];
                    if (b.length) return b;
                    return movies.map((m) => m.backdrop_url).filter(Boolean).slice(0, 8) as string[];
                })()}
            />

            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 pt-6 sm:pt-8 lg:pt-12 pb-8">
                {/* Tabs - levantadas sobre o hero */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-1 mb-6 inline-flex -mt-12 sm:-mt-16 lg:-mt-20 relative z-30">
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={`rounded-lg px-6 py-2.5 font-medium transition-all flex items-center whitespace-nowrap ${activeTab === 'favorites'
                            ? 'bg-[#1DB954] text-black'
                            : 'text-gray-300 hover:text-white'
                            }`}
                    >
                        <Heart className="w-4 h-4 mr-2" />
                        Favorites ({favorites.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('watch_later')}
                        className={`rounded-lg px-6 py-2.5 font-medium transition-all flex items-center whitespace-nowrap ${activeTab === 'watch_later'
                            ? 'bg-[#1DB954] text-black'
                            : 'text-gray-300 hover:text-white'
                            }`}
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        Watch Later ({watchLater.length})
                    </button>
                </div>

                {/* Content */}
                <AnimatePresence mode="popLayout">
                    {currentList.length > 0 ? (
                        <div className="bg-[#1f1f1f] rounded-lg p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
                                {currentList.map((movie) => (
                                    <motion.div
                                        key={movie.listItemId}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        layout
                                        className="group relative cursor-pointer"
                                        onClick={() => {
                                            setSelectedMovie(movie);
                                            setModalOpen(true);
                                        }}
                                    >
                                        <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-[#1f1f1f] 
                                shadow-lg transition-all duration-500 
                                group-hover:shadow-2xl group-hover:shadow-[#1DB954]/20 group-hover:scale-105">
                                            <img
                                                src={movie.poster_url}
                                                alt={movie.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />

                                            {/* Overlay */}
                                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                            {/* Score Badge */}
                                            {movie.score && (
                                                <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm 
                                    px-2 py-1 rounded-full">
                                                    <Star className="w-3 h-3 text-[#1DB954] fill-[#1DB954]" />
                                                    <span className="text-white text-xs font-semibold">{movie.score}</span>
                                                </div>
                                            )}

                                            {/* Remove Button */}
                                            <button
                                                onClick={(e) => handleRemove(movie.listItemId, e)}
                                                className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-500 
                               rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300
                               hover:scale-110"
                                            >
                                                <Trash2 className="w-4 h-4 text-white" />
                                            </button>

                                            {/* Play Button */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 
                                  group-hover:opacity-100 transition-opacity duration-300">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleWatch(movie);
                                                    }}
                                                    className="w-14 h-14 rounded-full bg-[#1DB954] hover:bg-[#1ed760] 
                                 flex items-center justify-center transition-all duration-200"
                                                >
                                                    <Play className="w-6 h-6 text-black fill-current ml-1" />
                                                </button>
                                            </div>

                                            {/* Bottom Info */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 
                                  transition-opacity duration-300">
                                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                                    <span>{movie.year}</span>
                                                    {movie.rating && (
                                                        <span className="px-1.5 border border-gray-500 text-[10px]">{movie.rating}</span>
                                                    )}
                                                    <span>{movie.duration}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <div className="mt-3">
                                            <h3 className="text-white font-medium truncate group-hover:text-[#1DB954] transition-colors">
                                                {movie.title}
                                            </h3>
                                            <p className="text-gray-500 text-sm truncate">
                                                {movie.genre?.slice(0, 2).join(' • ')}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                {activeTab === 'favorites' ? (
                                    <Heart className="w-10 h-10 text-gray-500" />
                                ) : (
                                    <Clock className="w-10 h-10 text-gray-500" />
                                )}
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {activeTab === 'favorites' ? 'No Favorites Yet' : 'Nothing Saved for Later'}
                            </h3>
                            <p className="text-gray-400 max-w-md mb-6">
                                {activeTab === 'favorites'
                                    ? 'Start adding movies and series to your favorites to keep track of what you love.'
                                    : 'Add movies and series to your watch later list to easily find them when you\'re ready to watch.'}
                            </p>
                            <button
                                onClick={() => router.push('/')}
                                className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-lg px-8 py-3"
                            >
                                Browse Content
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Movie Modal */}
            <MovieModal
                movie={selectedMovie}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onWatch={handleWatch}
                onAddToList={(movie, listType) => {
                    addToListMutation.mutate({
                        movie_id: movie.id,
                        list_type: listType,
                    });
                }}
            />
        </div>
    );
}
