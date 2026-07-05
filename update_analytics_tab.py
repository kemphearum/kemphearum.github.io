import os

filepath = 'src/pages/admin/analytics/AnalyticsTab.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('>Overview<', ">{t('admin.analytics.tabs.overview')}<"),
    ('>Visitors<', ">{t('admin.analytics.tabs.visitors')}<"),
    ('>Content<', ">{t('admin.analytics.tabs.content')}<"),
    ('>Contact<', ">{t('admin.analytics.tabs.contact')}<"),
    ('>Search<', ">{t('admin.analytics.tabs.search')}<"),
    ('>Downloads<', ">{t('admin.analytics.tabs.downloads')}<"),
    ('>Technology<', ">{t('admin.analytics.tabs.technology')}<"),
    ('>Reports<', ">{t('admin.analytics.tabs.reports')}<"),
    ('>Data Explorer<', ">{t('admin.analytics.tabs.dataExplorer')}<"),
    ('>Settings<', ">{t('admin.analytics.tabs.settings')}<"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated AnalyticsTab.jsx")
