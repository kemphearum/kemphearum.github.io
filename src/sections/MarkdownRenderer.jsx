import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import { Check, Copy } from 'lucide-react';
import styles from './MarkdownRenderer.module.scss';
import { useTranslation } from '../hooks/useTranslation';

const SyntaxHighlighter = lazy(async () => {
    const [
        { default: PrismLight },
        { default: bash },
        { default: css },
        { default: javascript },
        { default: json },
        { default: jsx },
        { default: markdown },
        { default: markup },
        { default: python },
        { default: scss },
        { default: tsx },
        { default: typescript },
        { vscDarkPlus }
    ] = await Promise.all([
        import('react-syntax-highlighter/dist/esm/prism-light'),
        import('react-syntax-highlighter/dist/esm/languages/prism/bash'),
        import('react-syntax-highlighter/dist/esm/languages/prism/css'),
        import('react-syntax-highlighter/dist/esm/languages/prism/javascript'),
        import('react-syntax-highlighter/dist/esm/languages/prism/json'),
        import('react-syntax-highlighter/dist/esm/languages/prism/jsx'),
        import('react-syntax-highlighter/dist/esm/languages/prism/markdown'),
        import('react-syntax-highlighter/dist/esm/languages/prism/markup'),
        import('react-syntax-highlighter/dist/esm/languages/prism/python'),
        import('react-syntax-highlighter/dist/esm/languages/prism/scss'),
        import('react-syntax-highlighter/dist/esm/languages/prism/tsx'),
        import('react-syntax-highlighter/dist/esm/languages/prism/typescript'),
        import('react-syntax-highlighter/dist/esm/styles/prism')
    ]);

    PrismLight.registerLanguage('bash', bash);
    PrismLight.registerLanguage('css', css);
    PrismLight.registerLanguage('javascript', javascript);
    PrismLight.registerLanguage('json', json);
    PrismLight.registerLanguage('jsx', jsx);
    PrismLight.registerLanguage('markdown', markdown);
    PrismLight.registerLanguage('markup', markup);
    PrismLight.registerLanguage('python', python);
    PrismLight.registerLanguage('scss', scss);
    PrismLight.registerLanguage('tsx', tsx);
    PrismLight.registerLanguage('typescript', typescript);
    PrismLight.alias('javascript', ['js']);
    PrismLight.alias('typescript', ['ts']);
    PrismLight.alias('markup', ['html', 'xml']);
    PrismLight.alias('bash', ['sh', 'shell']);

    return {
        default: (props) => <PrismLight {...props} style={vscDarkPlus} />
    };
});

const CodeBlock = ({ inline, className, children, ...props }) => {
    const { t } = useTranslation();
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    const [copied, setCopied] = useState(false);
    const resetCopiedRef = useRef(null);

    useEffect(() => {
        return () => {
            if (resetCopiedRef.current) clearTimeout(resetCopiedRef.current);
        };
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        if (resetCopiedRef.current) clearTimeout(resetCopiedRef.current);
        resetCopiedRef.current = setTimeout(() => setCopied(false), 2000);
    };

    return !inline && match ? (
        <div className={styles.codeBlockWrapper}>
            <div className={styles.codeHeader}>
                <span className={styles.language}>{match[1]}</span>
                <button
                    className={styles.copyButton}
                    onClick={handleCopy}
                    aria-label={t('ui.copyCodeToClipboard')}
                    title={t('ui.copyCode')}
                >
                    {copied ? <Check size={16} className={styles.checkIcon} /> : <Copy size={16} />}
                    <span>{copied ? t('ui.copied') : t('ui.copy')}</span>
                </button>
            </div>
            <Suspense fallback={<pre className={styles.codeBlock}><code>{codeString}</code></pre>}>
                <SyntaxHighlighter
                    {...props}
                    children={codeString}
                    language={match[1]}
                    PreTag="div"
                    className={styles.codeBlock}
                />
            </Suspense>
        </div>
    ) : (
        <code {...props} className={`${className} ${styles.inlineCode}`}>
            {children}
        </code>
    );
};

const MarkdownRenderer = ({ content }) => {
    const { t } = useTranslation();
    const safeContent = typeof content === 'string' ? content : '';

    return (
        <div className={styles.markdownContent}>
            <ReactMarkdown
                rehypePlugins={[rehypeSlug]}
                components={{
                    code: CodeBlock,
                    iframe: (props) => {
                        return (
                            <span className={styles.iframeWrapper}>
                                <iframe {...props} allowFullScreen={true} />
                            </span>
                        );
                    },
                    img: ({ ...props }) => {
                        if (!props.src) return null;
                        return <img {...props} loading="lazy" alt={props.alt || t('ui.contentImage')} />;
                    },
                    a: ({ ...props }) => {
                        const url = props.href;
                        if (url) {
                            // YouTube
                            const ytMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
                            if (ytMatch) {
                                return (
                                    <span className={styles.videoWrapper}>
                                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytMatch[1]}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen={true}></iframe>
                                    </span>
                                );
                            }
                            // TikTok
                            const tkMatch = url.match(/tiktok\.com\/@.*\/video\/(\d+)/i);
                            if (tkMatch) {
                                return (
                                    <span className={styles.videoWrapper}>
                                        <iframe src={`https://www.tiktok.com/embed/v2/${tkMatch[1]}`} style={{ width: '100%', height: '100%' }} frameBorder="0" allow="encrypted-media;" allowFullScreen={true}></iframe>
                                    </span>
                                );
                            }
                            // Facebook (Post or Video)
                            const fbMatch = url.match(/facebook\.com\/(?:.*\/videos\/(\d+)|([a-zA-Z0-9.]+)\/posts\/([a-zA-Z0-9]+)|permalink\.php\?story_fbid=([a-zA-Z0-9]+)&id=([a-zA-Z0-9]+))/i);
                            let isFbHost = false;
                            try {
                                const hostname = new URL(url).hostname.toLowerCase();
                                isFbHost = hostname === 'facebook.com' || hostname.endsWith('.facebook.com');
                            } catch { /* ignore */ }
                            if (fbMatch || isFbHost) {
                                const encodedUrl = encodeURIComponent(url);
                                const isVideo = url.includes('/videos/');
                                const fbSrc = isVideo 
                                    ? `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=0&width=560`
                                    : `https://www.facebook.com/plugins/post.php?href=${encodedUrl}&show_text=true&width=500`;

                                return (
                                    <span className={isVideo ? styles.videoWrapper : styles.iframeWrapper}>
                                        <iframe 
                                            src={fbSrc} 
                                            width="100%" 
                                            height={isVideo ? "100%" : "auto"} 
                                            style={{ border: 'none', overflow: 'hidden', minHeight: isVideo ? 'none' : '500px' }} 
                                            scrolling="no" 
                                            frameBorder="0" 
                                            allowFullScreen={true} 
                                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                        ></iframe>
                                    </span>
                                );
                            }
                        }
                        return <a {...props} target="_blank" rel="noopener noreferrer" />;
                    }
                }}
            >
                {safeContent}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
