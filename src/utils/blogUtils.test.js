import { describe, it, expect } from 'vitest';
import { parseFrontmatter, generateSlug } from './blogUtils';

describe('parseFrontmatter', () => {
    it('parses valid YAML frontmatter', () => {
        const input = `---
title: Hello World
author: Kem
---
This is the content.`;
        const result = parseFrontmatter(input);
        expect(result.data.title).toBe('Hello World');
        expect(result.data.author).toBe('Kem');
        expect(result.content).toBe('This is the content.');
    });

    it('returns empty data when no frontmatter exists', () => {
        const input = 'Just plain markdown content.';
        const result = parseFrontmatter(input);
        expect(result.data).toEqual({});
        expect(result.content).toBe('Just plain markdown content.');
    });

    it('handles boolean values correctly', () => {
        const input = `---
visible: true
draft: false
---
Body`;
        const result = parseFrontmatter(input);
        expect(result.data.visible).toBe(true);
        expect(result.data.draft).toBe(false);
    });

    it('handles bracket array values', () => {
        const input = `---
tags: ["react", "firebase", "vite"]
---
Body`;
        const result = parseFrontmatter(input);
        expect(result.data.tags).toEqual(['react', 'firebase', 'vite']);
    });

    it('handles comma-separated tags', () => {
        const input = `---
tags: react, firebase, vite
---
Body`;
        const result = parseFrontmatter(input);
        expect(result.data.tags).toEqual(['react', 'firebase', 'vite']);
    });

    it('handles quoted values', () => {
        const input = `---
title: "Hello: World"
subtitle: 'Another Value'
---
Body`;
        const result = parseFrontmatter(input);
        expect(result.data.title).toBe('Hello: World');
        expect(result.data.subtitle).toBe('Another Value');
    });

    it('handles invalid empty frontmatter by returning it as content', () => {
        const input = `---
---
Body only.`;
        const result = parseFrontmatter(input);
        expect(result.data).toEqual({});
        expect(result.content).toBe(input);
    });
});

describe('generateSlug', () => {
    it('generates a slug from a normal title', () => {
        expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('strips special characters', () => {
        expect(generateSlug('React & Firebase: A Guide!')).toBe('react-firebase-a-guide');
    });

    it('collapses multiple spaces and underscores', () => {
        expect(generateSlug('hello   world__test')).toBe('hello-world-test');
    });

    it('trims leading and trailing hyphens', () => {
        expect(generateSlug('-hello world-')).toBe('hello-world');
    });

    it('handles an already-slugified string', () => {
        expect(generateSlug('already-a-slug')).toBe('already-a-slug');
    });
});
