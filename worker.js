/**
 * worker.js - Cloudflare Worker for Timer-OBS
 * Handles static asset serving + Server-side Google TTS Proxy to eliminate CORS issues
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Edge API for Google Thai TTS (Proxy with CORS allowed)
    if (url.pathname === '/api/tts') {
      const text = url.searchParams.get('text') || '';
      if (!text) {
        return new Response(JSON.stringify({ error: 'Missing text parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      try {
        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=th&client=tw-ob&q=${encodeURIComponent(text)}`;
        const ttsResponse = await fetch(googleUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://translate.google.com/'
          }
        });

        if (!ttsResponse.ok) {
          throw new Error(`Google TTS responded with status ${ttsResponse.status}`);
        }

        const headers = new Headers();
        headers.set('Content-Type', 'audio/mpeg');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

        return new Response(ttsResponse.body, {
          status: 200,
          headers
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Handle OPTIONS request for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
    }

    // 2. Serve Static Assets (index.html, css, js)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Assets not configured', { status: 404 });
  }
};
