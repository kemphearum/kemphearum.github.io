import { describe, it, expect } from 'vitest';
import { parseUserAgent } from './uaUtils';

describe('parseUserAgent', () => {
    it('detects Chrome on Windows', () => {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        const result = parseUserAgent(ua);
        expect(result.browser).toBe('Chrome');
        expect(result.os).toBe('Windows');
    });

    it('detects Firefox on Linux', () => {
        const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0';
        const result = parseUserAgent(ua);
        expect(result.browser).toBe('Firefox');
        expect(result.os).toBe('Linux');
    });

    it('detects Safari on macOS', () => {
        const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15';
        const result = parseUserAgent(ua);
        expect(result.browser).toBe('Safari');
        expect(result.os).toBe('macOS');
    });

    it('detects Edge on Windows', () => {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edge/120.0.0.0';
        const result = parseUserAgent(ua);
        expect(result.browser).toBe('Edge');
        expect(result.os).toBe('Windows');
    });

    it('detects Samsung Browser on Android', () => {
        const ua = 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36';
        const result = parseUserAgent(ua);
        expect(result.browser).toBe('Samsung Browser');
        expect(result.os).toBe('Android');
    });

    it('detects Opera', () => {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0';
        const result = parseUserAgent(ua);
        expect(result.browser).toBe('Opera');
        expect(result.os).toBe('Windows');
    });

    it('returns Unknown for unrecognized UA', () => {
        const result = parseUserAgent('SomeBot/1.0');
        expect(result.browser).toBe('Unknown');
        expect(result.os).toBe('Unknown');
    });

    it('detects iOS', () => {
        const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';
        const result = parseUserAgent(ua);
        expect(result.browser).toBe('Safari');
        expect(result.os).toBe('iOS');
    });

    it('detects Chromium Edge via Edg token', () => {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0';
        const result = parseUserAgent(ua);
        expect(result.browser).toBe('Edge');
        expect(result.os).toBe('Windows');
    });
});
