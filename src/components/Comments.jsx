import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './Comments.module.scss';
import { MessageSquare, User, Clock } from 'lucide-react';

const Comments = ({ postId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // comment id

    useEffect(() => {
        if (!postId) return;

        // Fetch comments ordered by time
        const q = query(collection(db, `posts/${postId}/comments`), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComments(commentsData);
        });

        return () => unsubscribe();
    }, [postId]);

    const handleSubmit = async (e, parentId = null) => {
        e.preventDefault();

        const content = parentId ? e.target.replyContent.value : newComment;
        const name = parentId ? e.target.replyName.value : authorName;

        if (!content.trim() || !name.trim()) return;

        setIsSubmitting(true);
        setErrorMsg('');
        try {
            if (parentId) {
                // Add reply as a separate document or handle as subcollection.
                // We'll use a subcollection for replies: posts/{postId}/comments/{commentId}/replies
                await addDoc(collection(db, `posts/${postId}/comments/${parentId}/replies`), {
                    name: name.trim(),
                    content: content.trim(),
                    createdAt: serverTimestamp()
                });
                setReplyingTo(null);
            } else {
                // Top level comment
                await addDoc(collection(db, `posts/${postId}/comments`), {
                    name: name.trim(),
                    content: content.trim(),
                    createdAt: serverTimestamp()
                });
                setNewComment('');
                setAuthorName('');
            }
        } catch (error) {
            console.error("Error adding comment: ", error);
            setErrorMsg("Failed to post comment. You might not have permission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now';
        return new Date(timestamp.seconds * 1000).toLocaleString();
    };

    return (
        <div className={styles.commentsSection}>
            <div className={styles.header}>
                <MessageSquare size={24} />
                <h3>Comments ({comments.length})</h3>
            </div>

            {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

            <form onSubmit={(e) => handleSubmit(e)} className={styles.commentForm}>
                <div className={styles.inputGroup}>
                    <User size={18} className={styles.icon} />
                    <input
                        type="text"
                        placeholder="Your Name (required)"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        required
                    />
                </div>
                <textarea
                    placeholder="Leave a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                    rows="3"
                />
                <button type="submit" disabled={isSubmitting || !newComment.trim() || !authorName.trim()}>
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
            </form>

            <div className={styles.commentsList}>
                {comments.length === 0 ? (
                    <p className={styles.noComments}>Be the first to comment!</p>
                ) : (
                    comments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                            isReplying={replyingTo === comment.id}
                            onReplyClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            onSubmitReply={(e) => handleSubmit(e, comment.id)}
                            formatDate={formatDate}
                            isSubmitting={isSubmitting}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// Sub-component to handle replies cleanly
const CommentItem = ({ comment, postId, isReplying, onReplyClick, onSubmitReply, formatDate, isSubmitting }) => {
    const [replies, setReplies] = useState([]);

    useEffect(() => {
        const q = query(collection(db, `posts/${postId}/comments/${comment.id}/replies`), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const repliesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setReplies(repliesData);
        });

        return () => unsubscribe();
    }, [postId, comment.id]);

    return (
        <div className={styles.commentCard}>
            <div className={styles.commentHeader}>
                <div className={styles.avatar}>{comment.name?.charAt(0).toUpperCase()}</div>
                <div className={styles.metaInfo}>
                    <span className={styles.name}>{comment.name}</span>
                    <span className={styles.date}>
                        <Clock size={14} /> {formatDate(comment.createdAt)}
                    </span>
                </div>
            </div>

            <p className={styles.commentContent}>{comment.content}</p>

            <div className={styles.commentActions}>
                <button className={styles.replyBtn} onClick={onReplyClick}>
                    {isReplying ? 'Cancel Reply' : 'Reply'}
                </button>
            </div>

            {isReplying && (
                <form onSubmit={onSubmitReply} className={styles.replyForm}>
                    <input
                        type="text"
                        name="replyName"
                        placeholder="Your Name (required)"
                        required
                        className={styles.replyInput}
                    />
                    <textarea
                        name="replyContent"
                        placeholder={`Replying to ${comment.name}...`}
                        required
                        rows="2"
                    />
                    <button type="submit" disabled={isSubmitting} className={styles.submitReplyBtn}>
                        Post Reply
                    </button>
                </form>
            )}

            {/* Render Replies */}
            {replies.length > 0 && (
                <div className={styles.repliesContainer}>
                    {replies.map(reply => (
                        <div key={reply.id} className={styles.replyCard}>
                            <div className={styles.commentHeader}>
                                <div className={styles.avatarSmall}>{reply.name?.charAt(0).toUpperCase()}</div>
                                <div className={styles.metaInfo}>
                                    <span className={styles.name}>{reply.name}</span>
                                    <span className={styles.date}>
                                        <Clock size={12} /> {formatDate(reply.createdAt)}
                                    </span>
                                </div>
                            </div>
                            <p className={styles.commentContent}>{reply.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Comments;
