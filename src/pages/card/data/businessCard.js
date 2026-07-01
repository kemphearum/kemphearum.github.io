export const businessCardConfig = {
    // These values supplement the dynamic data from the CMS
    badges: [
        { id: 'iso', icon: 'ShieldCheck', labelKey: 'card.bullets.iso', defaultLabel: 'ISO/IEC 27001 Lead Implementer' },
        { id: 'risk', icon: 'User', labelKey: 'card.bullets.risk', defaultLabel: 'Risk Management & Governance' },
        { id: 'secure', icon: 'Server', labelKey: 'card.bullets.secure', defaultLabel: 'Secure Software Development' },
        { id: 'audit', icon: 'Search', labelKey: 'card.bullets.audit', defaultLabel: 'IT Audit & Compliance' }
    ],
    theme: {
        primaryAccent: '#3b82f6',
        leftPanelBg: '#04162e',
        leftPanelShapes: '#082142',
        glassBgLight: 'rgba(255, 255, 255, 0.85)',
        glassBgDark: 'rgba(15, 23, 42, 0.85)'
    }
};
