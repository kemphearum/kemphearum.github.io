import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './MarkdownRenderer.module.scss';

const MarkdownRenderer = ({ content }) => {
    return (
        <div className={styles.markdownContent}>
            <ReactMarkdown
                rehypePlugins={[rehypeRaw, rehypeSlug]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <SyntaxHighlighter
                                {...props}
                                children={String(children).replace(/\n$/, '')}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className={styles.codeBlock}
                            />
                        ) : (
                            <code {...props} className={`${className} ${styles.inlineCode}`}>
                                {children}
                            </code>
                        );
                    },
                    a: ({ node, ...props }) => {
                        const url = props.href;
                        if (url) {
                            // YouTube
                            const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                            if (ytMatch) {
                                return (
                                    <div className={styles.videoWrapper}>
                                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytMatch[1]}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                    </div>
                                );
                            }
                            // TikTok
                            const tkMatch = url.match(/tiktok\.com\/@.*\/video\/(\d+)/i);
                            if (tkMatch) {
                                return (
                                    <div className={styles.videoWrapper}>
                                        <iframe src={`https://www.tiktok.com/embed/v2/${tkMatch[1]}`} style={{ width: '100%', height: '100%' }} frameBorder="0" allow="encrypted-media;" allowFullScreen></iframe>
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
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
