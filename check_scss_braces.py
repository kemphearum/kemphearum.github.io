import re

with open(r'd:\portfolio\src\pages\Admin.module.scss', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove multi-line comments
content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
# Remove single-line comments
content = re.sub(r'//.*', '', content)
# Remove strings (double and single quotes)
content = re.sub(r'"(?:\\.|[^"\\])*"', '', content)
content = re.sub(r"'(?:\\.|[^'\\])*'", '', content)

open_b = content.count('{')
close_b = content.count('}')

print(f"Open after stripping comments/strings: {open_b}")
print(f"Close after stripping comments/strings: {close_b}")

stack = []
for i, line in enumerate(content.split('\n'), 1):
    for char in line:
        if char == '{':
            stack.append(i)
        elif char == '}':
            if stack:
                stack.pop()
            else:
                print(f"Extra }} at line {i}")

if stack:
    print(f"Unclosed blocks from lines: {stack}")
