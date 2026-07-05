import json
import os

def update_json(filepath, lang):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    db_ui = data.setdefault('admin', {}).setdefault('database', {}).setdefault('ui', {})
    
    # English Strings
    updates = {
        'loadingDocuments': 'Loading documents...' if lang=='en' else 'កំពុងផ្ទុកឯកសារ...',
        'noDocumentsFound': 'No documents found.' if lang=='en' else 'មិនមានឯកសារទេ។',
        'exportingFlatCollections': 'Exporting flat collections to CSV is supported. Nested objects and arrays will be ignored or flattened to strings.' if lang=='en' else 'គាំទ្រការនាំចេញការប្រមូលទិន្នន័យទៅជា CSV។ ទិន្នន័យស្មុគស្មាញ (nested objects/arrays) នឹងត្រូវបានមិនអើពើ។',
        'importExpectsCSV': "Import expects a CSV with an 'id' column. Existing documents with matching IDs will be merged/overwritten. Use JSON for complex nested data." if lang=='en' else "ការនាំចូលទាមទារឯកសារ CSV ដែលមានជួរឈរ 'id'។ ទិន្នន័យចាស់នឹងត្រូវបានសរសេរជាន់។ ប្រើ JSON សម្រាប់ទិន្នន័យស្មុគស្មាញ។",
        'warningNoIdColumn': "Warning: No 'id' column found. Rows without an 'id' will be skipped." if lang=='en' else "ការព្រមាន៖ មិនមានជួរឈរ 'id' ទេ។ ជួរដេកដែលគ្មាន 'id' នឹងត្រូវបានរំលង។",
        'recentActivity': 'Recent Activity' if lang=='en' else 'សកម្មភាពថ្មីៗ',
        'backups': 'Backups' if lang=='en' else 'ការបម្រុងទុក',
        'noRecentBackups': 'No recent backups.' if lang=='en' else 'មិនមានការបម្រុងទុកថ្មីៗទេ។',
        'restores': 'Restores' if lang=='en' else 'ការស្តារ',
        'noRecentRestores': 'No recent restores.' if lang=='en' else 'មិនមានការស្តារថ្មីៗទេ។',
        'loadingActivity': 'Loading activity...' if lang=='en' else 'កំពុងផ្ទុកសកម្មភាព...',
        'noRecentActivity': 'No recent activity.' if lang=='en' else 'មិនមានសកម្មភាពថ្មីៗទេ។',
        'time': 'Time' if lang=='en' else 'ពេលវេលា',
        'action': 'Action' if lang=='en' else 'សកម្មភាព',
        'user': 'User' if lang=='en' else 'អ្នកប្រើប្រាស់',
        'details': 'Details' if lang=='en' else 'ព័ត៌មានលម្អិត',
        'uniqueAssets': 'Unique Assets' if lang=='en' else 'ទ្រព្យសកម្មតែមួយ',
        'duplicatedAssets': 'Duplicated Assets' if lang=='en' else 'ទ្រព្យសកម្មជាន់គ្នា',
        'crossReferencedUrls': 'Cross-referenced URLs' if lang=='en' else 'URL យោងឆ្លង',
        'noAssetsFound': 'No assets found.' if lang=='en' else 'រកមិនឃើញទ្រព្យសកម្មទេ។',
        'healthScore': 'Health Score' if lang=='en' else 'ពិន្ទុសុខភាព',
        'loadingMetrics': 'Loading metrics...' if lang=='en' else 'កំពុងផ្ទុករង្វាស់...',
        'noUsageDataAvailableYet': 'No usage data available yet.' if lang=='en' else 'មិនទាន់មានទិន្នន័យប្រើប្រាស់ទេ។',
        'totalReads': 'Total Reads' if lang=='en' else 'ការអានសរុប',
        'totalWrites': 'Total Writes' if lang=='en' else 'ការសរសេរសរុប',
        'totalDeletes': 'Total Deletes' if lang=='en' else 'ការលុបសរុប',
        'provider': 'Provider' if lang=='en' else 'អ្នកផ្តល់សេវា',
        'projectId': 'Project ID' if lang=='en' else 'លេខសម្គាល់គម្រោង',
        'environment': 'Environment' if lang=='en' else 'បរិស្ថាន',
        'region': 'Region' if lang=='en' else 'តំបន់',
        'connection': 'Connection' if lang=='en' else 'ការតភ្ជាប់',
        'pendingWrites': 'Pending Writes' if lang=='en' else 'ការសរសេររង់ចាំ',
    }

    # toasts
    db_toasts = data.setdefault('admin', {}).setdefault('database', {}).setdefault('toasts', {})
    toast_updates = {
        'assetAnalysisComplete': 'Asset analysis complete' if lang=='en' else 'ការវិភាគទ្រព្យសកម្មបានបញ្ចប់',
        'csvExportedSuccessfully': 'CSV Exported successfully' if lang=='en' else 'នាំចេញ CSV ដោយជោគជ័យ',
        'collectionIsEmpty': 'Collection is empty' if lang=='en' else 'បណ្តុំគឺទទេ',
        'failedToAnalyzeAssets': 'Failed to analyze assets' if lang=='en' else 'បរាជ័យក្នុងការវិភាគទ្រព្យសកម្ម',
        'failedToExportCsv': 'Failed to export CSV' if lang=='en' else 'បរាជ័យក្នុងការនាំចេញ CSV',
        'failedToImportCsv': 'Failed to import CSV' if lang=='en' else 'បរាជ័យក្នុងការនាំចូល CSV',
        'failedToParseCsv': 'Failed to parse CSV' if lang=='en' else 'បរាជ័យក្នុងការញែក CSV',
        'healthCheckComplete': 'Health check complete' if lang=='en' else 'ការត្រួតពិនិត្យសុខភាពបានបញ្ចប់',
        'healthCheckFailed': 'Health check failed' if lang=='en' else 'ការត្រួតពិនិត្យសុខភាពបានបរាជ័យ'
    }

    db_ui.update(updates)
    db_toasts.update(toast_updates)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

update_json('src/i18n/en.json', 'en')
update_json('src/i18n/km.json', 'km')
print('Database JSON updated successfully')
