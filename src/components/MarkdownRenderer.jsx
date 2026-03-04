import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DOMPurify from 'dompurify';
import { Check, Copy } from 'lucide-react';
import styles from './MarkdownRenderer.module.scss';

const CodeBlock = ({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return !inline && match ? (
        <div className={styles.codeBlockWrapper}>
            <div className={styles.codeHeader}>
                <span className={styles.language}>{match[1]}</span>
                <button
                    className={styles.copyButton}
                    onClick={handleCopy}
                    aria-label="Copy code to clipboard"
                    title="Copy code"
                >
                    {copied ? <Check size={16} className={styles.checkIcon} /> : <Copy size={16} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
            </div>
            <SyntaxHighlighter
                {...props}
                children={codeString}
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                className={styles.codeBlock}
            />
        </div>
    ) : (
        <code {...props} className={`${className} ${styles.inlineCode}`}>
            {children}
        </code>
    );
};

const MarkdownRenderer = ({ content }) => {
    // Sanitize the content before rendering to prevent XSS. 
    // We allow iframe tags for youtube, tiktok embedded components
    const cleanContent = DOMPurify.sanitize(content, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
    });

    return (
        <div className={styles.markdownContent}>
            <ReactMarkdown
                rehypePlugins={[rehypeRaw, rehypeSlug]}
                components={{
                    code: CodeBlock,
                    iframe: ({ node, allowFullScreen, allowfullscreen, ...props }) => {
                        const isFullScreen = allowFullScreen === "true" || allowFullScreen === true || allowfullscreen === "true" || allowfullscreen === "";
                        return <iframe {...props} allowFullScreen={isFullScreen} />;
                    },
                    a: ({ ...props }) => {
                        const url = props.href;
                        if (url) {
                            // YouTube
                            const ytMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
                            if (ytMatch) {
                                return (
                                    <div className={styles.videoWrapper}>
                                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytMatch[1]}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen={true}></iframe>
                                    </div>
                                );
                            }
                            // TikTok
                            const tkMatch = url.match(/tiktok\.com\/@.*\/video\/(\d+)/i);
                            if (tkMatch) {
                                return (
                                    <div className={styles.videoWrapper}>
                                        <iframe src={`https://www.tiktok.com/embed/v2/${tkMatch[1]}`} style={{ width: '100%', height: '100%' }} frameBorder="0" allow="encrypted-media;" allowFullScreen={true}></iframe>
                                    </div>
                                );
                            }
                            // Facebook video
                            const fbMatch = url.match(/facebook\.com\/.*\/videos\/(\d+)/i);
                            if (fbMatch) {
                                const encodedUrl = encodeURIComponent(url);
                                return (
                                    <div className={styles.videoWrapper}>
                                        <iframe src={`https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=0&width=560`} width="100%" height="100%" style={{ border: 'none', overflow: 'hidden' }} scrolling="no" frameBorder="0" allowFullScreen={true} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
                                    </div>
                                );
                            }
                        }
                        return <a {...props} target="_blank" rel="noopener noreferrer" />;
                    }
                }}
            >
                {cleanContent}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
