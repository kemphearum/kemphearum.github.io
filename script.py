import json
with open('lh-report-iter2.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    print('Network requests:')
    for i in data['audits']['network-requests']['details']['items']:
        if i.get('resourceSize', 0) > 50000:
            print(f"{i['url'][:80]}... {i.get('resourceSize',0)/1024:.1f}KB")
    print('\nBootup time:')
    for i in data['audits']['bootup-time']['details']['items']:
        print(f"{i['url'][:80]}... {i.get('total', 0)}ms")
