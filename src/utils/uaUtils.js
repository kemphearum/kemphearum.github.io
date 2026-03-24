/**
 * Utility for parsing User Agent strings into human-readable browser and OS names.
 * Lightweight and designed for the portfolio analytics dashboard.
 */

export const parseUserAgent = (ua) => {
    let browser = 'Unknown';
    let os = 'Unknown';
    const normalizedUa = typeof ua === 'string' ? ua : '';

    // Browser Detection
    if (normalizedUa.includes('Firefox')) browser = 'Firefox';
    else if (normalizedUa.includes('SamsungBrowser')) browser = 'Samsung Browser';
    else if (normalizedUa.includes('Opera') || normalizedUa.includes('OPR')) browser = 'Opera';
    else if (normalizedUa.includes('Trident') || normalizedUa.includes('MSIE')) browser = 'Internet Explorer';
    else if (normalizedUa.includes('Edg/') || normalizedUa.includes('Edge')) browser = 'Edge';
    else if (normalizedUa.includes('Chrome')) browser = 'Chrome';
    else if (normalizedUa.includes('Safari')) browser = 'Safari';

    // OS Detection
    if (normalizedUa.includes('Win')) os = 'Windows';
    else if (normalizedUa.includes('Android')) os = 'Android';
    else if (normalizedUa.includes('like Mac') || normalizedUa.includes('iPhone') || normalizedUa.includes('iPad')) os = 'iOS';
    else if (normalizedUa.includes('Mac')) os = 'macOS';
    else if (normalizedUa.includes('Linux')) os = 'Linux';

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
