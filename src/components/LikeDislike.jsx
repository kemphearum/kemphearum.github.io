import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './LikeDislike.module.scss';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

const LikeDislike = ({ postId }) => {
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userVote, setUserVote] = useState(null); // 'like', 'dislike', or null
    const [isVoting, setIsVoting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!postId) return;

        // Check local storage for previous vote
        const storedVote = localStorage.getItem(`vote_${postId}`);
        if (storedVote) {
            setUserVote(storedVote);
        }

        // Fetch current counts
        const fetchCounts = async () => {
            try {
                const docRef = doc(db, 'posts', postId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setLikes(data.likes || 0);
                    setDislikes(data.dislikes || 0);
                }
            } catch (error) {
                console.error("Error fetching likes: ", error);
            }
        };

        fetchCounts();
    }, [postId]);

    const handleVote = async (type) => {
        if (!postId || isVoting || userVote === type) return;

        setIsVoting(true);
        setErrorMsg('');
        const docRef = doc(db, 'posts', postId);

        try {
            // Determine the changes to make
            let likeChange = 0;
            let dislikeChange = 0;

            if (type === 'like') {
                likeChange = 1;
                if (userVote === 'dislike') dislikeChange = -1; // removing previous dislike
            } else if (type === 'dislike') {
                dislikeChange = 1;
                if (userVote === 'like') likeChange = -1; // removing previous like
            }

            // Update local state predictively
            setLikes(prev => prev + likeChange);
            setDislikes(prev => prev + dislikeChange);
            setUserVote(type);
            localStorage.setItem(`vote_${postId}`, type);

            // Update Firebase
            await updateDoc(docRef, {
                likes: increment(likeChange),
                dislikes: increment(dislikeChange)
            });

        } catch (error) {
            console.error("Error updating vote: ", error);
            // Revert on failure
            setUserVote(localStorage.getItem(`vote_${postId}`));
            setLikes(prev => prev - likeChange);
            setDislikes(prev => prev - dislikeChange);
            setErrorMsg("Failed to vote. Permission denied.");
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className={styles.likeDislikeContainer}>
            <div className={styles.buttonsWrapper}>
                <button
                    className={`${styles.voteBtn} ${userVote === 'like' ? styles.active : ''}`}
                    onClick={() => handleVote('like')}
                    disabled={isVoting || userVote === 'like'}
                    aria-label="Like post"
                >
                    <ThumbsUp size={20} />
                    <span>{likes}</span>
                </button>
                <button
                    className={`${styles.voteBtn} ${styles.dislikeBtn} ${userVote === 'dislike' ? styles.active : ''}`}
                    onClick={() => handleVote('dislike')}
                    disabled={isVoting || userVote === 'dislike'}
                    aria-label="Dislike post"
                >
                    <ThumbsDown size={20} />
                    <span>{dislikes}</span>
                </button>
            </div>
            {errorMsg && <span className={styles.errorMessage}>{errorMsg}</span>}
        </div>
    );
};

export default LikeDislike;
