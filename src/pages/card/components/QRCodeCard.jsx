import { memo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng, toSvg } from 'html-to-image';
import { Download } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import styles from './QRCodeCard.module.scss';

const QRCodeCard = memo(({ url, logoUrl, compact = false, exportMode = false }) => {
    const { t } = useTranslation();
    const qrRef = useRef(null);
    
    // We get the primary color from CSS variables if possible, 
    // but qrcode.react needs hex. We'll use a standard dark color 
    // for high contrast, ensuring scannability on all devices.
    const qrColor = '#1a1a1a';

    const handleDownload = async (format) => {
        if (!qrRef.current) return;
        try {
            const dataUrl = format === 'png' 
                ? await toPng(qrRef.current, { backgroundColor: '#ffffff', pixelRatio: 3, skipFonts: true })
                : await toSvg(qrRef.current, { backgroundColor: '#ffffff', skipFonts: true });
                
            const link = document.createElement('a');
            link.download = `qrcode.${format}`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to download QR Code', err);
        }
    };

    return (
        <div className={styles.qrContainer} style={compact ? { padding: 0, gap: 0 } : {}}>
            {!compact && (
                <p className={styles.instruction}>
                    {t('card.scanInstruction', 'Scan to save digital card')}
                </p>
            )}
            
            <div className={styles.qrWrapper} ref={qrRef} id="qr-code-node">
                <QRCodeSVG 
                    value={url} 
                    size={110}
                    fgColor={qrColor}
                    level="Q" // Higher error correction for logo
                    imageSettings={logoUrl ? {
                        src: logoUrl,
                        height: 24,
                        width: 24,
                        excavate: true, // Creates white border around logo
                    } : undefined}
                />
            </div>
            
            {!exportMode && (
                <div className={styles.downloadRow}>
                    <button onClick={() => handleDownload('png')} className={styles.downloadBtn} aria-label="Download QR as PNG">
                        <Download size={14} /> PNG
                    </button>
                    <button onClick={() => handleDownload('svg')} className={styles.downloadBtn} aria-label="Download QR as SVG">
                        <Download size={14} /> SVG
                    </button>
                </div>
            )}
            
            {!compact && (
                <p className={styles.url}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        {url.replace(/^https?:\/\//, '')}
                    </a>
                </p>
            )}
        </div>
    );
});

QRCodeCard.displayName = 'QRCodeCard';
export default QRCodeCard;
