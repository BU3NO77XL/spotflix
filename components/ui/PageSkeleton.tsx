'use client';

export default function PageSkeleton() {
    const shimmer = "bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] animate-pulse";

    return (
        <div className="min-h-screen bg-[#121212]">
            {/* Hero Skeleton */}
            <div className="relative w-full h-[85vh] md:h-[80vh] bg-[#1a1a1a] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
                <div className="absolute bottom-[15%] left-6 md:left-12 max-w-xl space-y-5">
                    <div className={`h-10 md:h-14 w-72 md:w-96 rounded-lg ${shimmer}`} />
                    <div className={`h-4 w-48 md:w-64 rounded ${shimmer}`} />
                    <div className="flex gap-3 pt-2">
                        <div className={`h-[50px] w-[140px] rounded-[4px] ${shimmer}`} />
                        <div className={`h-[50px] w-[190px] rounded-[4px] ${shimmer}`} />
                    </div>
                </div>
            </div>

            {/* Carousels Skeleton */}
            <div className="relative z-20 -mt-[211px] pb-12 space-y-8">
                {[1, 2, 3, 4, 5].map((section) => (
                    <div key={section} className="space-y-3 px-4 md:px-[38px]">
                        <div className={`h-5 w-44 rounded ${shimmer}`} />
                        <div className="flex gap-3 overflow-hidden">
                            {[1, 2, 3, 4, 5, 6, 7].map((card) => (
                                <div
                                    key={card}
                                    className={`shrink-0 w-[160px] md:w-[190px] aspect-video rounded-[4px] ${shimmer}`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
