import React from 'react';
import { ShieldCheck, KeyRound, Smartphone, AlertCircle, Fingerprint, Lock } from 'lucide-react';
import { Button } from '@/shared/components/ui';

const AuthSecurityPanel = () => {
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
            title: "Multi-Factor Auth (MFA)",
            description: "Require a secondary form of authentication (SMS, Authenticator App) for privileged roles.",
            icon: Smartphone,
            status: "Unavailable in Zero-Cost",
            statusType: "warning",
            details: [
                { label: "SMS Authentication", value: "Disabled" },
                { label: "Time-based OTP", value: "Disabled" },
                { label: "Security Keys", value: "Disabled" }
            ]
        },
        {
            title: "Password Policies",
            description: "Enforcement of password complexity, rotation, and history.",
            icon: KeyRound,
            status: "Managed by Identity Provider",
            statusType: "info",
            details: [
                { label: "Minimum Length", value: "6 Characters" },
                { label: "Complexity Requirements", value: "Firebase Default" },
                { label: "Password History", value: "Not Tracked" }
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

    return (
        <div className="auth-security-panel">
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
                        <div key={idx} className="ui-card ui-p-medium">
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
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AuthSecurityPanel;
