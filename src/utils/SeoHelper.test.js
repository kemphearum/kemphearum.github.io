import { describe, it, expect } from 'vitest';
import { generateMetaTags } from './SeoHelper';

describe('generateMetaTags', () => {
    it('generates full meta tags with all params', () => {
        const tags = generateMetaTags({
            title: 'My Blog Post',
            description: 'A great article',
            image: 'https://example.com/img.jpg',
            url: 'https://example.com/blog/my-post',
            type: 'article',
            siteTitle: 'Kem Phearum'
        });

        expect(tags).toContainEqual({ title: 'My Blog Post | Kem Phearum' });
        expect(tags).toContainEqual({ name: 'description', content: 'A great article' });
        expect(tags).toContainEqual({ property: 'og:title', content: 'My Blog Post | Kem Phearum' });
        expect(tags).toContainEqual({ property: 'og:description', content: 'A great article' });
        expect(tags).toContainEqual({ property: 'og:type', content: 'article' });
        expect(tags).toContainEqual({ property: 'og:image', content: 'https://example.com/img.jpg' });
        expect(tags).toContainEqual({ property: 'og:url', content: 'https://example.com/blog/my-post' });
        expect(tags).toContainEqual({ name: 'twitter:card', content: 'summary_large_image' });
        expect(tags).toContainEqual({ name: 'twitter:image', content: 'https://example.com/img.jpg' });
    });

    it('uses default siteTitle and description when not provided', () => {
        const tags = generateMetaTags({});

        expect(tags).toContainEqual({ title: 'Kem Phearum' });
        expect(tags).toContainEqual({ name: 'description', content: 'Kem Phearum Portfolio - ICT Security & IT Audit Professional' });
    });

    it('does not include og:image when image is not provided', () => {
        const tags = generateMetaTags({ title: 'Test' });

        const ogImage = tags.find(t => t.property === 'og:image');
        expect(ogImage).toBeUndefined();
    });

    it('does not include og:url when url is not provided', () => {
        const tags = generateMetaTags({ title: 'Test' });

        const ogUrl = tags.find(t => t.property === 'og:url');
        expect(ogUrl).toBeUndefined();
    });

    it('defaults og:type to website', () => {
        const tags = generateMetaTags({ title: 'Home' });

        expect(tags).toContainEqual({ property: 'og:type', content: 'website' });
    });
});
