import os

replacements = {
    'CollectionExplorerDialog.jsx': [
        ('Loading documents...', "{tm('ui.loadingDocuments')}"),
        ('No documents found.', "{tm('ui.noDocumentsFound')}"),
    ],
    'CsvImportExportDialog.jsx': [
        ('Exporting flat collections to CSV is supported. Nested objects and arrays will be ignored or flattened to strings.', "{tm('ui.exportingFlatCollections')}"),
        ("Import expects a CSV with an 'id' column. Existing documents with matching IDs will be merged/overwritten. Use JSON for complex nested data.", "{tm('ui.importExpectsCSV')}"),
        ("Warning: No 'id' column found. Rows without an 'id' will be skipped.", "{tm('ui.warningNoIdColumn')}"),
    ],
    'DatabaseActions.jsx': [
        ('Recent Activity', "{tm('ui.recentActivity')}"),
        ('>Backups<', ">{tm('ui.backups')}<"),
        ('No recent backups.', "{tm('ui.noRecentBackups')}"),
        ('>Restores<', ">{tm('ui.restores')}<"),
        ('No recent restores.', "{tm('ui.noRecentRestores')}"),
    ],
    'DatabaseActivityPanel.jsx': [
        ('Loading activity...', "{tm('ui.loadingActivity')}"),
        ('No recent activity.', "{tm('ui.noRecentActivity')}"),
        ('>Time<', ">{tm('ui.time')}<"),
        ('>Action<', ">{tm('ui.action')}<"),
        ('>User<', ">{tm('ui.user')}<"),
        ('>Details<', ">{tm('ui.details')}<"),
    ],
    'DatabaseAssetAnalytics.jsx': [
        ('>Unique Assets<', ">{tm('ui.uniqueAssets')}<"),
        ('>Duplicated Assets<', ">{tm('ui.duplicatedAssets')}<"),
        ('>Cross-referenced URLs<', ">{tm('ui.crossReferencedUrls')}<"),
        ('No assets found.', "{tm('ui.noAssetsFound')}"),
        ("'Asset analysis complete'", "tm('toasts.assetAnalysisComplete')"),
        ("'Failed to analyze assets'", "tm('toasts.failedToAnalyzeAssets')"),
        ("'CSV Exported successfully'", "tm('toasts.csvExportedSuccessfully')"),
        ("'Failed to export CSV'", "tm('toasts.failedToExportCsv')"),
    ],
    'DatabaseHealthCheck.jsx': [
        ('>Health Score<', ">{tm('ui.healthScore')}<"),
        ("'Health check complete'", "tm('toasts.healthCheckComplete')"),
        ("'Health check failed'", "tm('toasts.healthCheckFailed')"),
    ],
    'DatabaseMonitoringPanel.jsx': [
        ('Loading metrics...', "{tm('ui.loadingMetrics')}"),
        ('No usage data available yet.', "{tm('ui.noUsageDataAvailableYet')}"),
        ('>Total Reads<', ">{tm('ui.totalReads')}<"),
        ('>Total Writes<', ">{tm('ui.totalWrites')}<"),
        ('>Total Deletes<', ">{tm('ui.totalDeletes')}<"),
    ],
    'DatabaseStats.jsx': [
        ('>Provider<', ">{tm('ui.provider')}<"),
        ('>Project ID<', ">{tm('ui.projectId')}<"),
        ('>Environment<', ">{tm('ui.environment')}<"),
        ('>Region<', ">{tm('ui.region')}<"),
        ('>Connection<', ">{tm('ui.connection')}<"),
        ('>Pending Writes<', ">{tm('ui.pendingWrites')}<"),
    ]
}

base_dir = 'src/pages/admin/database/components'

for filename, rules in replacements.items():
    filepath = os.path.join(base_dir, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if tm is imported / extracted from useTranslation
        # They should already have tm defined or I will need to add it!
        
        for old, new in rules:
            content = content.replace(old, new)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
print("Replaced hardcoded strings in JSX")
