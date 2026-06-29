'use client';

export default function NetflixBadge({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <img src="/assets/netflix-n.png" alt="Netflix" className="w-[14px] h-[24px] object-contain" />
    </div>
  );
}
