import React, { useEffect } from 'react';
import { normalizeRenderableText } from '../adminUtils';

const AdminToast = ({ message, type, onClose, language = 'en' }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose, message]);

    const getIcon = () => ({
        success: 'OK',
        error: 'X',
        warning: '!',
        info: 'i'
    }[type] || '*');

    const displayMessage = normalizeRenderableText(message, language, '');

    return (
        <div className={`ui-toast ui-${type}`}>
            <span style={{ fontWeight: 'bold' }}>{getIcon()}</span>
            <p>{displayMessage}</p>
            <button onClick={onClose} className="ui-toastClose">x</button>
        </div>
    );
};

export default AdminToast;

