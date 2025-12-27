'use client';

import { useState } from 'react';
import { CastMember } from '@/types/movie';
import BaseCarousel from '@/components/ui/BaseCarousel';
import CastCard from '@/components/ui/CastCard';
import ActorModal from './ActorModal';

interface CastCarouselProps {
    cast: CastMember[];
}

export default function CastCarousel({ cast }: CastCarouselProps) {
    const [selectedActorId, setSelectedActorId] = useState<number | null>(null);

    if (!cast?.length) return null;

    const handleCastClick = (member: CastMember) => {
        if (member.id) {
            setSelectedActorId(member.id);
        }
    };

    return (
        <>
            <BaseCarousel 
                title="Cast & Crew"
                gap="md"
                padding="md"
            >
                {cast.map((member, index) => (
                    <CastCard
                        key={member.id || index}
                        member={member}
                        onClick={handleCastClick}
                        index={index}
                    />
                ))}
            </BaseCarousel>

            {/* Actor Modal */}
            <ActorModal
                actorId={selectedActorId}
                isOpen={!!selectedActorId}
                onClose={() => setSelectedActorId(null)}
            />
        </>
    );
}