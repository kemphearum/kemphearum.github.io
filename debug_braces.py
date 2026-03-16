with open(r'd:\portfolio\src\pages\Admin.module.scss', 'r', encoding='utf-8') as f:
    stack = []
    for i, line in enumerate(f, 1):
        for char in line:
            if char == '{':
                # Attempt to find the selector
                stripped = line.strip()
                stack.append((i, stripped))
            elif char == '}':
                if stack:
                    stack.pop()
                else:
                    print(f"Extra closing brace at line {i}")
    
    if stack:
        print("Unclosed blocks:")
        for line_num, selector in stack:
            print(f"Line {line_num}: {selector}")
    else:
        print("All blocks closed.")
