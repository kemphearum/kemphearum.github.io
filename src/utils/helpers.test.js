import { describe, it, expect } from 'vitest';
import { calculateReadTime } from './helpers';

describe('calculateReadTime', () => {
    it('returns "1 min read" for empty text', () => {
        expect(calculateReadTime('')).toBe('1 min read');
    });

    it('returns "1 min read" for null input', () => {
        expect(calculateReadTime(null)).toBe('1 min read');
    });

    it('returns "1 min read" for undefined input', () => {
        expect(calculateReadTime(undefined)).toBe('1 min read');
    });

    it('returns "1 min read" for short text (< 200 words)', () => {
        const shortText = 'Hello world this is a short text.';
        expect(calculateReadTime(shortText)).toBe('1 min read');
    });

    it('returns correct time for exactly 200 words', () => {
        const words = Array(200).fill('word').join(' ');
        expect(calculateReadTime(words)).toBe('1 min read');
    });

    it('returns correct time for 400 words (2 min)', () => {
        const words = Array(400).fill('word').join(' ');
        expect(calculateReadTime(words)).toBe('2 min read');
    });

    it('returns correct time for 1000 words (5 min)', () => {
        const words = Array(1000).fill('word').join(' ');
        expect(calculateReadTime(words)).toBe('5 min read');
    });

    it('rounds up partial minutes', () => {
        const words = Array(201).fill('word').join(' ');
        expect(calculateReadTime(words)).toBe('2 min read');
    });
});
