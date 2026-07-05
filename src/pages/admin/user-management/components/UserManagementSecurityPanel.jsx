import React from 'react';
import { ShieldCheck, KeyRound, Smartphone, AlertCircle, Fingerprint, Lock } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { motion } from 'framer-motion';

const UserManagementSecurityPanel = () => {
    const securityFeatures = [
        {
            title: "Authentication Providers",
            description: "Email/Password and OAuth Providers configured at the Identity layer.",
            icon: Fingerprint,
            status: "Active",
            statusType: "success",
            details: [
                { label: "Email / Password", value: "Enabled" },
                { label: "Google OAuth", value: "Enabled" },
                { label: "Apple OAuth", value: "Disabled" },
                { label: "Anonymous", value: "Disabled" }
            ]
        },
        {
            title: "Access Controls",
            description: "Role-Based Access Control (RBAC) and network restrictions.",
            icon: ShieldCheck,
            status: "Active",
            statusType: "success",
            details: [
                { label: "Role Hierarchy", value: "Enforced" },
                { label: "Custom Permissions", value: "Supported" },
                { label: "IP Allowlisting", value: "Not Configured" },
                { label: "Concurrent Sessions", value: "Unlimited" }
            ]
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div 
            className="auth-security-panel"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <div className="ui-flex-between ui-mb-medium">
                <h3 className="ui-heading ui-m-0">Security Posture</h3>
            </div>

            <div className="ui-mb-medium">
                <div className="ui-alert ui-alert-info">
                    <AlertCircle size={16} />
                    <span>
                        <strong>Note:</strong> Security policies are enforced at the identity provider (Firebase) and database (Firestore Rules) levels. This panel provides a read-only architectural overview.
                    </span>
                </div>
            </div>

            <div className="ui-grid ui-grid-cols-2 ui-gap-medium">
                {securityFeatures.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                        <motion.div variants={itemVariants} key={idx} className="ui-card ui-p-medium">
                            <div className="ui-flex-between ui-mb-small">
                                <h4 className="ui-heading ui-m-0 ui-flex-center-gap-small">
                                    <Icon size={18} className="ui-text-muted" />
                                    {feature.title}
                                </h4>
                                <div className={`ui-badge ui-badge-${feature.statusType}`}>
                                    {feature.status}
                                </div>
                            </div>
                            <p className="ui-text-muted ui-text-sm ui-mb-medium">
                                {feature.description}
                            </p>
                            
                            <div className="ui-divider ui-my-small" />
                            
                            <ul className="ui-list-none ui-p-0 ui-m-0">
                                {feature.details.map((detail, i) => (
                                    <li key={i} className="ui-flex-between ui-py-xs ui-text-sm">
                                        <span className="ui-text-muted">{detail.label}</span>
                                        <span className="ui-text-bold">{detail.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default UserManagementSecurityPanel;
