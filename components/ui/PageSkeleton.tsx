'use client';

export default function PageSkeleton() {
    const shimmer = "bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] animate-pulse";

    return (
        <div className="min-h-screen bg-[#121212]">
            {/* Hero Skeleton */}
            <div className="relative w-full h-[810px] bg-[#1a1a1a] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
                <div className="absolute bottom-[15%] left-6 md:left-12 max-w-xl space-y-5">
                    <div className={`h-16 md:h-20 w-72 md:w-96 rounded-lg ${shimmer}`} />
                    <div className="space-y-2">
                        <div className={`h-4 w-full max-w-[518px] rounded ${shimmer}`} />
                        <div className={`h-4 w-3/4 max-w-[400px] rounded ${shimmer}`} />
                        <div className={`h-4 w-1/2 max-w-[300px] rounded ${shimmer}`} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <div className={`h-[50px] md:h-[52px] w-[130px] md:w-[150px] rounded-[4px] ${shimmer}`} />
                        <div className={`h-[50px] md:h-[52px] w-[170px] md:w-[190px] rounded-[4px] ${shimmer}`} />
                    </div>
                </div>
            </div>

            {/* Carousels Skeleton */}
            <div className="relative z-20 -mt-[211px] pb-12 space-y-8">
                {[1, 2, 3, 4, 5].map((section) => (
                    <div key={section} className="space-y-3 pl-4 sm:pl-6 lg:pl-[24px] pr-0">
                        <div className={`h-6 w-44 rounded ${shimmer}`} />
                        <div className="flex gap-3 lg:gap-4 overflow-hidden">
                            {[1, 2, 3, 4, 5, 6, 7].map((card) => (
                                <div
                                    key={card}
                                    className={`shrink-0 w-[140px] sm:w-[150px] lg:w-[160px] aspect-[2/3] rounded-[4px] ${shimmer}`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
