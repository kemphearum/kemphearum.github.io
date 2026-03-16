with open(r'd:\portfolio\src\pages\Admin.module.scss', 'r', encoding='utf-8') as f:
    content = f.read()
    open_braces = content.count('{')
    close_braces = content.count('}')
    print(f"Open: {open_braces}, Close: {close_braces}")
