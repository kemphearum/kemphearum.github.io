export function generateVCard(profile, social, portfolioUrl) {
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${profile.name || ''}`,
        `N:${profile.name?.split(' ').reverse().join(';') || ''};;;`,
        `TITLE:${profile.currentRole || profile.subtitle || ''}`,
        `ORG:${profile.company || ''}`,
    ];

    if (social.email) lines.push(`EMAIL;type=INTERNET;type=WORK:${social.email}`);
    if (social.phone) lines.push(`TEL;type=CELL:${social.phone}`);
    if (portfolioUrl || social.website) lines.push(`URL:${portfolioUrl || social.website}`);
    if (social.linkedin) lines.push(`URL;type=LinkedIn:${social.linkedin}`);
    if (social.github) lines.push(`URL;type=GitHub:${social.github}`);

    lines.push('END:VCARD');

    return lines.join('\n');
}

export function downloadVCard(vCardString, filename = 'contact.vcf') {
    const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
