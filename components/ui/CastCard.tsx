'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { CastMember } from '@/types/movie';

interface CastCardProps {
  member: CastMember;
  onClick?: (member: CastMember) => void;
  index?: number;
}

export default function CastCard({ member, onClick, index = 0 }: CastCardProps) {
  const profileUrl = member.profile_path
    ? `https://image.tmdb.org/t/p/w300${member.profile_path}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="shrink-0 w-[140px] group cursor-pointer"
      onClick={() => onClick?.(member)}
    >
      <div className="bg-[#1f1f1f] rounded-lg p-3 
              transition-all duration-300 hover:bg-[#222] hover:scale-[1.02]">

        {/* Profile Image */}
        <div className="aspect-3/4 overflow-hidden">
          {profileUrl ? (
            <img
              src={profileUrl}
              alt={member.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-b from-[#2a2a2a] to-[#1f1f1f]">
              <User className="w-12 h-12 text-gray-600" />
            </div>
          )}
        </div>

        {/* Cast Info */}
        <div className="mt-3 space-y-1">
          <h3 className="text-white text-sm font-medium truncate group-hover:text-[#1DB954] transition-colors">
            {member.name}
          </h3>
          {member.character && (
            <p className="text-gray-400 text-xs truncate">
              {member.character}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}