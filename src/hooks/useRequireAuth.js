import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import AuthService from '../services/AuthService';

export const useRequireAuth = (redirectTo = '/admin') => {
    const navigate = useNavigate();
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthed, setIsAuthed] = useState(false);

    useEffect(() => {
        const unsubscribe = AuthService.onAuthChange((user) => {
            if (user) {
                setIsAuthed(true);
            } else {
                navigate(redirectTo, { replace: true });
            }
            setAuthChecked(true);
        });
        return () => unsubscribe();
    }, [navigate, redirectTo]);

    return { authChecked, isAuthed };
};

export default useRequireAuth;
