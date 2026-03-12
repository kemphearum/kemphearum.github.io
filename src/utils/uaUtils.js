/**
 * Utility for parsing User Agent strings into human-readable browser and OS names.
 * Lightweight and designed for the portfolio analytics dashboard.
 */

export const parseUserAgent = (ua) => {
    let browser = 'Unknown';
    let os = 'Unknown';

    // Browser Detection
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('SamsungBrowser')) browser = 'Samsung Browser';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    else if (ua.includes('Trident')) browser = 'Internet Explorer';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    // OS Detection
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('like Mac')) os = 'iOS';

    return { browser, os };
};

/**
 * Checks if this is a returning visitor based on local storage.
 * @returns {boolean}
 */
export const isReturningVisitor = () => {
    if (typeof window === 'undefined') return false;
    const hasBeenBefore = localStorage.getItem('portfolio_visited');
    if (!hasBeenBefore) {
        localStorage.setItem('portfolio_visited', 'true');
        return false;
    }
    return true;
};
