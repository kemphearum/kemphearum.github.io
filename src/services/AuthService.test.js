import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from './AuthService';
import { auth } from '../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    signInWithPopup,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink
} from 'firebase/auth';

vi.mock('../firebase', () => ({
    auth: {
        currentUser: null
    }
}));

vi.mock('firebase/auth', async () => {
    const actual = await vi.importActual('firebase/auth');
    return {
        ...actual,
        signInWithEmailAndPassword: vi.fn(),
        createUserWithEmailAndPassword: vi.fn(),
        onAuthStateChanged: vi.fn(),
        signOut: vi.fn(),
        GoogleAuthProvider: class {
            setCustomParameters = vi.fn();
        },
        OAuthProvider: class {
            addScope = vi.fn();
        },
        signInWithPopup: vi.fn(),
        sendSignInLinkToEmail: vi.fn(),
        isSignInWithEmailLink: vi.fn(),
        signInWithEmailLink: vi.fn(),
        EmailAuthProvider: { credential: vi.fn() },
        linkWithCredential: vi.fn(),
        updatePassword: vi.fn(),
        reauthenticateWithPopup: vi.fn(),
        reauthenticateWithCredential: vi.fn()
    };
});

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        if (typeof window !== 'undefined') {
            window.localStorage.clear();
        }
    });

    describe('login', () => {
        it('calls signInWithEmailAndPassword', async () => {
            await AuthService.login('test@example.com', 'password');
            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password');
        });
    });

    describe('register', () => {
        it('calls createUserWithEmailAndPassword', async () => {
            await AuthService.register('test@example.com', 'password');
            expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password');
        });
    });

    describe('loginWithGoogle', () => {
        it('calls signInWithPopup with GoogleAuthProvider', async () => {
            await AuthService.loginWithGoogle();
            expect(signInWithPopup).toHaveBeenCalledWith(auth, expect.any(Object));
        });
    });

    describe('loginWithApple', () => {
        it('calls signInWithPopup with OAuthProvider for apple.com', async () => {
            await AuthService.loginWithApple();
            expect(signInWithPopup).toHaveBeenCalledWith(auth, expect.any(Object));
        });
    });

    describe('logout', () => {
        it('calls signOut', async () => {
            await AuthService.logout();
            expect(signOut).toHaveBeenCalledWith(auth);
        });
    });

    describe('onAuthChange', () => {
        it('calls onAuthStateChanged', () => {
            const callback = vi.fn();
            AuthService.onAuthChange(callback);
            expect(onAuthStateChanged).toHaveBeenCalledWith(auth, callback);
        });
    });

    describe('getCurrentUser', () => {
        it('returns current user from auth', () => {
            auth.currentUser = { uid: '123' };
            expect(AuthService.getCurrentUser()).toEqual({ uid: '123' });
        });
    });

    describe('magic links', () => {
        it('sends magic link and stores email', async () => {
            await AuthService.sendMagicLink('test@example.com');
            expect(sendSignInLinkToEmail).toHaveBeenCalledWith(auth, 'test@example.com', expect.any(Object));
            expect(window.localStorage.getItem('adminMagicLinkEmail')).toBe('test@example.com');
        });

        it('checks if url is magic link', () => {
            isSignInWithEmailLink.mockReturnValue(true);
            expect(AuthService.isMagicLink('http://localhost')).toBe(true);
            expect(isSignInWithEmailLink).toHaveBeenCalledWith(auth, 'http://localhost');
        });

        it('gets stored magic link email', () => {
            window.localStorage.setItem('adminMagicLinkEmail', 'test@example.com');
            expect(AuthService.getStoredMagicLinkEmail()).toBe('test@example.com');
        });

        it('completes magic link and removes stored email', async () => {
            window.localStorage.setItem('adminMagicLinkEmail', 'test@example.com');
            signInWithEmailLink.mockResolvedValue('credential');
            
            const result = await AuthService.completeMagicLink('test@example.com', 'http://localhost');
            
            expect(signInWithEmailLink).toHaveBeenCalledWith(auth, 'test@example.com', 'http://localhost');
            expect(window.localStorage.getItem('adminMagicLinkEmail')).toBeNull();
            expect(result).toBe('credential');
        });
    });
});
