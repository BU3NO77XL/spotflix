'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CastMember } from '@/types/movie';
import ActorModal from './ActorModal';

interface CastCarouselProps {
    cast: CastMember[];
}

export default function CastCarousel({ cast }: CastCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [selectedActorId, setSelectedActorId] = useState<number | null>(null);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth * 0.8;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!cast?.length) return null;

    return (
        <div className="relative">
            <h3 className="text-white font-semibold mb-5 text-lg">Elenco Principal</h3>

            <div className="relative group/carousel">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className={cn(
                        "absolute left-0 top-0 bottom-0 z-20 w-12",
                        "flex items-center justify-start pl-1",
                        "transition-opacity duration-300",
                        showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    <div className="p-2 bg-black/60 transition-colors">
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </div>
                </button>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className={cn(
                        "absolute right-0 top-0 bottom-0 z-20 w-12",
                        "flex items-center justify-end pr-1",
                        "transition-opacity duration-300",
                        showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    <div className="p-2 bg-black/60 transition-colors">
                        <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                </button>

                {/* Scrollable Content */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth pb-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {cast.map((actor, index) => (
                        <CastCard 
                            key={index} 
                            actor={actor} 
                            index={index} 
                            onClick={() => actor.id && setSelectedActorId(actor.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Actor Modal */}
            <ActorModal
                actorId={selectedActorId}
                isOpen={selectedActorId !== null}
                onClose={() => setSelectedActorId(null)}
            />
        </div>
    );
}

interface CastCardProps {
    actor: CastMember;
    index: number;
    onClick: () => void;
}

function CastCard({ actor, index, onClick }: CastCardProps) {
    const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
    const profileUrl = actor.profile_path
        ? `${TMDB_IMAGE_BASE}/w185${actor.profile_path}`
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            className="flex-shrink-0 w-[140px] group cursor-pointer"
            onClick={onClick}
        >
            {/* Card Container */}
            <div className="relative overflow-hidden rounded-lg bg-[#1a1a1a] 
                transition-all duration-300 hover:bg-[#222] hover:scale-[1.02]">
                
                {/* Profile Image */}
                <div className="aspect-[3/4] overflow-hidden">
                    {profileUrl ? (
                        <img
                            src={profileUrl}
                            alt={actor.name}
                            className="w-full h-full object-cover transition-transform duration-500 
                                group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a]">
                            <User className="w-12 h-12 text-gray-600" />
                        </div>
                    )}
                </div>

                {/* Info Overlay */}
                <div className="p-3">
                    <p className="text-white text-sm font-medium truncate leading-tight">
                        {actor.name}
                    </p>
                    {actor.character && (
                        <p className="text-gray-500 text-xs truncate mt-1 leading-tight">
                            {actor.character}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}