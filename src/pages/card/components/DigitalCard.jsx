import { memo } from 'react';
import { Link as RouterLink } from 'react-router';
import { useTranslation } from '../../../hooks/useTranslation';
import { 
    Phone, Mail, Globe, MapPin, 
    Linkedin, Github, Facebook, Send,
    MessageCircle, UserPlus, Share2, 
    Link, ArrowRight, ShieldCheck, 
    User, Search, Server, BadgeCheck
} from 'lucide-react';

// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import QRCodeCard from './QRCodeCard';
import { businessCardConfig } from '../data/businessCard';
import styles from './DigitalCard.module.scss';

const DigitalCard = memo(({ 
    name, 
    title, 
    company, 
    photoUrl, 
    location,
    social,
    portfolioUrl,
    cardUrl,
    exportMode = false
}) => {
    const { t } = useTranslation();

    // Robust fallbacks for previewing without data
    const safeName = name || t('card.fallbackName', 'John Doe');
    const firstName = safeName.split(' ')[0];
    const lastName = safeName.split(' ').slice(1).join(' ');
    const safeTitle = title || t('card.fallbackTitle', 'Information Security Professional');
    const safeCompany = company || '';

    const renderSocialIcon = (key, size = 22) => {
        switch (key) {
            case 'linkedin': return <Linkedin size={size} strokeWidth={1.5} color="white" />;
            case 'github': return <Github size={size} strokeWidth={1.5} color="white" />;
            case 'facebook': return <Facebook size={size} strokeWidth={1.5} color="white" />;
            case 'telegram': return <Send size={size} strokeWidth={1.5} color="white" />;
            case 'whatsapp': return <MessageCircle size={size} strokeWidth={1.5} color="white" />;
            case 'twitter':
            case 'x': return <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>X</span>;
            default: return null;
        }
    };

    const getSocialLabel = (key) => {
        switch (key) {
            case 'linkedin': return 'LinkedIn';
            case 'github': return 'GitHub';
            case 'facebook': return 'Facebook';
            case 'telegram': return 'Telegram';
            case 'whatsapp': return 'WhatsApp';
            case 'twitter':
            case 'x': return 'X';
            default: return key;
        }
    };

    return (
        <div className={`${styles.digitalCard} ${exportMode ? styles.exportMode : ''}`}>
            
            <div className={styles.mainContent}>
                {/* Left Panel (Dark Blue) */}
                <div className={styles.leftPanel}>
                    {/* Background curved gold wave separator */}
                    <div className={styles.waveSeparator}></div>
                    
                    <div className={styles.leftPanelContent}>
                        
                        <div className={styles.profileSection}>
                            <div className={styles.photoWrapper}>
                                <img src={photoUrl || '/images/default-avatar.png'} alt={safeName} className={styles.photo} />
                            </div>
                            
                            <div className={styles.nameBlock}>
                                <h1 className={styles.firstName}>{firstName}</h1>
                                {lastName && <h1 className={styles.lastName}>{lastName}</h1>}
                            </div>
                            
                            <div className={styles.titleBlock}>
                                <h2 className={styles.title}>{safeTitle}</h2>
                                {safeCompany && <h3 className={styles.subtitle}>{safeCompany}</h3>}
                            </div>
                        </div>

                        <div className={styles.bulletList}>
                            {businessCardConfig.badges.map(badge => {
                                const IconComponent = {
                                    ShieldCheck, User, Server, Search
                                }[badge.icon];
                                
                                return (
                                    <motion.div 
                                        key={badge.id}
                                        className={styles.bulletRow}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {IconComponent && <IconComponent size={16} />} 
                                        <span>{t(badge.labelKey, badge.defaultLabel)}</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Panel (White) */}
                <div className={styles.rightPanel}>
                    
                    {/* Top Section: Contact Info & QR */}
                    <div className={styles.contactAndQrRow}>
                        
                        <div className={styles.contactList}>
                            {social?.phone && (
                                <div className={styles.contactItem}>
                                    <div className={styles.contactIcon}><Phone size={18} color="white" /></div>
                                    <div className={styles.contactText}>
                                        <span className={styles.value}>{social.phone}</span>
                                        <span className={styles.label}>{t('card.labels.mobile', 'Mobile')}</span>
                                    </div>
                                </div>
                            )}
                            {social?.email && (
                                <div className={styles.contactItem}>
                                    <div className={styles.contactIcon}><Mail size={18} color="white" /></div>
                                    <div className={styles.contactText}>
                                        <span className={styles.value}>{social.email}</span>
                                        <span className={styles.label}>{t('card.labels.email', 'Email')}</span>
                                    </div>
                                </div>
                            )}
                            <div className={styles.contactItem}>
                                <div className={styles.contactIcon}><Globe size={18} color="white" /></div>
                                <div className={styles.contactText}>
                                    <span className={styles.value}>{portfolioUrl.replace(/^https?:\/\//, '')}</span>
                                    <span className={styles.label}>{t('card.labels.website', 'Website')}</span>
                                </div>
                            </div>
                            {location && (
                                <div className={styles.contactItem}>
                                    <div className={styles.contactIcon}><MapPin size={18} color="white" /></div>
                                    <div className={styles.contactText}>
                                        <span className={styles.value}>{location}</span>
                                        <span className={styles.label}>{t('card.labels.location', 'Location')}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.qrSectionBlock}>
                            <div className={styles.qrScaleWrapper}>
                                <QRCodeCard url={cardUrl} logoUrl={photoUrl} compact={true} exportMode={exportMode} />
                            </div>
                            <div className={styles.qrText}>
                                <span className={styles.qrMain}>{t('card.qr.scanToSave', 'SCAN TO SAVE')}</span>
                                <span className={styles.qrSub}>{t('card.qr.myContactInstantly', 'my contact instantly')}</span>
                            </div>
                        </div>

                    </div>

                    <div className={styles.horizontalDivider} />

                    <div className={styles.bottomRow}>
                        {/* Social Section */}
                        <div className={styles.socialSection}>
                            <div className={styles.socialGrid}>
                                {['linkedin', 'github', 'telegram', 'whatsapp', 'facebook', 'twitter'].map(key => {
                                    if (social?.[key]) {
                                        return (
                                            <motion.a 
                                                key={key}
                                                href={social[key]}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.socialBtn}
                                                aria-label={key}
                                                whileHover={{ y: -4, scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <div className={styles.socialIconCircle}>
                                                    {renderSocialIcon(key)}
                                                </div>
                                                <span className={styles.socialLabel}>{getSocialLabel(key)}</span>
                                            </motion.a>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>

                        <div className={styles.footerTagline}>
                            {t('card.tagline', 'SECURE TODAY • PROTECT TOMORROW • EMPOWER FUTURE')}
                        </div>
                    </div>

                </div>
            </div>
            
        </div>
    );
});

DigitalCard.displayName = 'DigitalCard';
export default DigitalCard;
