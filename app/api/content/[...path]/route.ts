import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (for production, use Redis/Upstash)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (record.count >= limit) {
        return false;
    }

    record.count++;
    return true;
}

// Ultra-performance configuration
const CACHE_STRENGTH = {
    // Cache on CDN/Server for 1 hour, revalidate in background
    default: 'public, s-maxage=3600, stale-while-revalidate=59',
    // Search results cache for shorter time (5 mins)
    search: 'public, s-maxage=300, stale-while-revalidate=30'
};

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        if (!rateLimit(ip)) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': '60' } }
            );
        }

        const { path } = await context.params;
        const subPath = path.join('/');
        const searchParams = request.nextUrl.searchParams;

        // Determine cache strategy based on path
        const cacheHeader = subPath.includes('search')
            ? CACHE_STRENGTH.search
            : CACHE_STRENGTH.default;

        // Construct the content API URL
        const contentUrl = new URL(`https://api.themoviedb.org/3/${subPath}`);

        // Append search params (excluding api_key if sent by client)
        searchParams.forEach((value, key) => {
            if (key !== 'api_key') {
                contentUrl.searchParams.append(key, value);
            }
        });

        const apiKey = process.env.TMDB_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'System configuration error' }, { status: 500 });
        }

        contentUrl.searchParams.set('api_key', apiKey);

        // Internal Next.js fetch with optimized behavior
        const response = await fetch(contentUrl.toString(), {
            next: {
                revalidate: subPath.includes('search') ? 300 : 3600
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();

        // Return with high-performance headers
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': cacheHeader,
                'Vary': 'Accept-Encoding'
            }
        });
    } catch (error) {
        console.error('[CONTENT PROXY ERROR]:', error);
        return NextResponse.json({ error: 'Internal gateway error' }, { status: 500 });
    }
}