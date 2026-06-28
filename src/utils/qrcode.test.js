import { describe, it, expect } from 'vitest';
import { generateQrMatrix, generateQrSvg } from './qrcode';

const URL = 'https://phearum-info.web.app/resume';

// A QR finder pattern is a 7x7 block: dark wherever the Chebyshev distance from
// its center is not exactly 2 (i.e. solid 7x7 ring + filled 3x3 core).
const assertFinder = (modules, originX, originY) => {
    const cx = originX + 3;
    const cy = originY + 3;
    for (let dy = 0; dy < 7; dy++) {
        for (let dx = 0; dx < 7; dx++) {
            const expected = Math.max(Math.abs(originX + dx - cx), Math.abs(originY + dy - cy)) !== 2;
            expect(modules[originY + dy][originX + dx]).toBe(expected);
        }
    }
};

describe('qrcode', () => {
    it('produces a square matrix with a valid version size', () => {
        const m = generateQrMatrix(URL, 'M');
        expect(m.length).toBeGreaterThanOrEqual(21);
        expect(m.length).toBe(m[0].length);
        expect((m.length - 17) % 4).toBe(0); // size === version*4 + 17
    });

    it('draws the three finder patterns in the correct corners', () => {
        const m = generateQrMatrix(URL, 'M');
        const size = m.length;
        assertFinder(m, 0, 0);
        assertFinder(m, size - 7, 0);
        assertFinder(m, 0, size - 7);
    });

    it('draws alternating timing patterns on row/column 6', () => {
        const m = generateQrMatrix(URL, 'M');
        const size = m.length;
        // Between the finder patterns the timing track strictly alternates.
        for (let i = 8; i < size - 8; i++) {
            expect(m[6][i]).toBe(i % 2 === 0);
            expect(m[i][6]).toBe(i % 2 === 0);
        }
    });

    it('is deterministic for the same input', () => {
        expect(generateQrSvg(URL)).toBe(generateQrSvg(URL));
    });

    it('renders a self-contained SVG with a quiet zone', () => {
        const svg = generateQrSvg(URL, { margin: 4 });
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg).toContain('viewBox="0 0');
        expect(svg).toContain('<path');
        expect(svg).toContain('fill="#ffffff"');
    });

    it('encodes different content into different matrices', () => {
        const a = JSON.stringify(generateQrMatrix('https://example.com/a', 'M'));
        const b = JSON.stringify(generateQrMatrix('https://example.com/b', 'M'));
        expect(a).not.toBe(b);
    });
});
