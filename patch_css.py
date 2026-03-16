import os

file_path = r'c:\Users\Juanjo\Documents\tenisymas\collections-style.css'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix modal-content-container on mobile
# Lines around 1447-1455
search_target = '.modal-content-container {'
found = False
for i in range(1400, 1600):
    if i < len(lines) and search_target in lines[i]:
        # Found it. Now let's see if it's inside the media query
        if '@media (max-width: 900px)' in lines[i-1]:
            # This is the one
            lines[i] = '    .modal-content-container {\n'
            lines[i+1] = '        grid-template-columns: 1fr;\n'
            lines[i+2] = '        max-height: 92vh;\n'
            lines[i+3] = '        overflow-y: auto;\n'
            lines[i+4] = '        display: block;\n'
            lines[i+5] = '        margin: 10px;\n'
            lines[i+6] = '        width: calc(100% - 20px);\n'
            lines[i+7] = '    }\n'
            # Check if there was an old closing brace we need to skip
            j = i + 1
            while j < len(lines) and '}' not in lines[j]:
                j += 1
            # We already set the contents up to lines[i+7]
            # If j > i + 7, we should remove lines between i+8 and j
            if j > i + 7:
                del lines[i+8:j+1]
            found = True
            break

if found:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Successfully patched collections-style.css")
else:
    print("Could not find targets")
