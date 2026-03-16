with open(r'd:\portfolio\src\pages\Admin.module.scss', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i in range(5919, -1, -1):
        if lines[i][0] not in (' ', '\t', '\n'):
            print(f"{i+1}: {lines[i].strip()}")
            break
