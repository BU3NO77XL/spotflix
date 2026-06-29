import { NextRequest, NextResponse } from 'next/server';

// Redis-ready architecture (Conceptual implementation due to environment constraints)
// In a production environment, you would use: import Redis from 'ioredis';
// const redis = new Redis(process.env.REDIS_URL);

// Fallback high-performance in-memory cache (Simulating Redis behavior)
const serverCache = new Map<string, { data: any; expiry: number }>();

async function getFromCache(key: string) {
    const record = serverCache.get(key);
    if (record && record.expiry > Date.now()) {
        return record.data;
    }
    return null;
}

async function setToCache(key: string, data: any, ttlSeconds: number) {
    serverCache.set(key, {
        data,
        expiry: Date.now() + ttlSeconds * 1000
    });
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(ip: string, limit: number = 2000, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (record.count >= limit) return false;
    record.count++;
    return true;
}

const CACHE_STRENGTH = {
    default: 'public, s-maxage=3600, stale-while-revalidate=59',
    search: 'public, s-maxage=300, stale-while-revalidate=30'
};

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await context.params;
        const subPath = path.join('/');
        const searchParams = request.nextUrl.searchParams;
        const cacheKey = `tmdb:${subPath}:${searchParams.toString()}`;

        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        if (!rateLimit(ip)) {
            const stale = serverCache.get(cacheKey);
            if (stale) return NextResponse.json(stale.data);
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        // 1. Try to get from Redis (Conceptual) / Server Cache
        const cachedResponse = await getFromCache(cacheKey);
        if (cachedResponse) {
            return NextResponse.json(cachedResponse, {
                headers: { 'X-Cache': 'HIT', 'Cache-Control': CACHE_STRENGTH.default }
            });
        }

        // 2. Fetch from TMDB if not in cache
        const contentUrl = new URL(`https://api.themoviedb.org/3/${subPath}`);
        searchParams.forEach((value: string, key: string) => {
            if (key !== 'api_key') contentUrl.searchParams.append(key, value);
        });

        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'Config error' }, { status: 500 });
        contentUrl.searchParams.set('api_key', apiKey);

        const response = await fetch(contentUrl.toString(), {
            next: { revalidate: subPath.includes('search') ? 300 : 3600 }
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'TMDB Error' }, { status: response.status });
        }

        const data = await response.json();

        // 3. Save to Redis (Conceptual) / Server Cache
        const ttl = subPath.includes('search') ? 300 : 3600;
        await setToCache(cacheKey, data, ttl);

        return NextResponse.json(data, {
            headers: {
                'X-Cache': 'MISS',
                'Cache-Control': subPath.includes('search') ? CACHE_STRENGTH.search : CACHE_STRENGTH.default,
                'Vary': 'Accept-Encoding'
            }
        });
    } catch (error) {
        console.error('[CONTENT PROXY ERROR]:', error);
        return NextResponse.json({ error: 'Internal gateway error' }, { status: 500 });
    }
}