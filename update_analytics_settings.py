import re

filepath = 'src/pages/admin/analytics/components/AnalyticsSettingsPanel.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useTranslation import if not exists
if 'useTranslation' not in content:
    content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useTranslation } from '../../../../../hooks/useTranslation';")
    content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { useTranslation } from '../../../../../hooks/useTranslation';")

if 'const { t }' not in content:
    content = content.replace('const AnalyticsSettingsPanel = () => {', 'const AnalyticsSettingsPanel = () => {\n    const { t } = useTranslation();\n    const tm = (key, params = {}) => t(`admin.analytics.settings.${key}`, params);')

# Replace texts
content = content.replace('Analytics Settings\n            </h3>', '{tm(\'title\')}\n            </h3>')
content = content.replace('<h4 style={{ margin: 0, fontSize: \'1.125rem\' }}>Data Retention</h4>', '<h4 style={{ margin: 0, fontSize: \'1.125rem\' }}>{tm(\'dataRetention.title\')}</h4>')
content = content.replace('<label>Analytics Retention Period (Days)</label>', '<label>{tm(\'dataRetention.period\')}</label>')
content = content.replace('Older analytics data will be automatically purged by client-side janitor routines to save Firestore storage.', '{tm(\'dataRetention.note\')}')
content = content.replace('<h4 style={{ margin: 0, fontSize: \'1.125rem\' }}>Tracking Preferences</h4>', '<h4 style={{ margin: 0, fontSize: \'1.125rem\' }}>{tm(\'tracking.title\')}</h4>')

content = content.replace('<div style={{ fontWeight: 500 }}>Enable Visitor Tracking</div>', '<div style={{ fontWeight: 500 }}>{tm(\'tracking.visitor.label\')}</div>')
content = content.replace('<div style={{ fontSize: \'0.75rem\', color: \'var(--text-secondary)\' }}>Record page views and sessions to Firestore.</div>', '<div style={{ fontSize: \'0.75rem\', color: \'var(--text-secondary)\' }}>{tm(\'tracking.visitor.desc\')}</div>')

content = content.replace('<div style={{ fontWeight: 500 }}>Anonymize IP Addresses</div>', '<div style={{ fontWeight: 500 }}>{tm(\'tracking.anonymize.label\')}</div>')
content = content.replace('<div style={{ fontSize: \'0.75rem\', color: \'var(--text-secondary)\' }}>Mask the last octet of IP addresses before saving.</div>', '<div style={{ fontSize: \'0.75rem\', color: \'var(--text-secondary)\' }}>{tm(\'tracking.anonymize.desc\')}</div>')

content = content.replace('<div style={{ fontWeight: 500 }}>Enable Search Tracking</div>', '<div style={{ fontWeight: 500 }}>{tm(\'tracking.search.label\')}</div>')
content = content.replace('<div style={{ fontSize: \'0.75rem\', color: \'var(--text-secondary)\' }}>Record search queries from the public frontend.</div>', '<div style={{ fontSize: \'0.75rem\', color: \'var(--text-secondary)\' }}>{tm(\'tracking.search.desc\')}</div>')

content = content.replace('<div style={{ fontWeight: 500 }}>Enable Download Tracking</div>', '<div style={{ fontWeight: 500 }}>{tm(\'tracking.download.label\')}</div>')
content = content.replace('<div style={{ fontSize: \'0.75rem\', color: \'var(--text-secondary)\' }}>Record file downloads (Resumes, PDFs).</div>', '<div style={{ fontSize: \'0.75rem\', color: \'var(--text-secondary)\' }}>{tm(\'tracking.download.desc\')}</div>')

content = content.replace('<option value={30}>30 Days</option>', '<option value={30}>{tm(\'dataRetention.days\', { count: 30 })}</option>')
content = content.replace('<option value={90}>90 Days</option>', '<option value={90}>{tm(\'dataRetention.days\', { count: 90 })}</option>')
content = content.replace('<option value={180}>180 Days</option>', '<option value={180}>{tm(\'dataRetention.days\', { count: 180 })}</option>')
content = content.replace('<option value={365}>1 Year</option>', '<option value={365}>{tm(\'dataRetention.days\', { count: 365 })}</option>')
content = content.replace('<option value={9999}>Indefinite</option>', '<option value={9999}>{t(\'admin.common.indefinite\', \'Indefinite\')}</option>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated AnalyticsSettingsPanel.jsx")
