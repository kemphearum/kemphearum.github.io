with open(r'd:\portfolio\src\pages\Admin.module.scss', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    stack = []
    for i, line in enumerate(lines, 1):
        for j, char in enumerate(line):
            if char == '{':
                stack.append(i)
            elif char == '}':
                if stack:
                    stack.pop()
                else:
                    print(f"Error: Extra '}}' at line {i}")
        
        # After each line, if we are at the root level, mark it
        if not stack:
            # Check if this line actually contained any non-whitespace characters other than braces
            stripped = line.strip()
            if stripped and stripped != '}':
                print(f"Root Level: Line {i}: {stripped}")

    if stack:
        print(f"Error: Unclosed blocks starting at lines: {stack}")
