import os

file_path = r'c:\Users\Juanjo\Documents\tenisymas\collections-style.css'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Update .pill to add user-select: none and tap-highlight-color
for i, line in enumerate(lines):
    if '.pill {' in line:
        # Check if already added
        if 'user-select: none' not in lines[i+1] and 'user-select: none' not in lines[i+8]:
            lines.insert(i+9, '    user-select: none;\n')
            lines.insert(i+10, '    -webkit-tap-highlight-color: transparent;\n')
        break

# 2. Fix .modal-info on mobile (overflow-y: visible)
# We already patched the mobile media query part partly, let's refine it
media_query_found = False
for i, line in enumerate(lines):
    if '@media (max-width: 900px)' in line:
        media_query_found = True
        # Look for .modal-info inside this media query
        j = i + 1
        info_found = False
        while j < len(lines) and '@media' not in lines[j] and j < i + 100:
            if '.modal-info {' in lines[j]:
                lines[j+1] = '        padding: 25px 20px;\n'
                lines[j+2] = '        overflow-y: visible !important;\n'
                lines[j+3] = '        height: auto;\n'
                info_found = True
                break
            j += 1
        
        if not info_found:
            # Need to add .modal-info block to the media query
            # Add it after .modal-gallery if found
            k = i + 1
            gallery_end = -1
            while k < len(lines) and '@media' not in lines[k] and k < i + 100:
                if '.modal-gallery {' in lines[k]:
                    # Find end of gallery block
                    while k < len(lines) and '}' not in lines[k]:
                        k += 1
                    gallery_end = k
                    break
                k += 1
            
            if gallery_end != -1:
                new_block = [
                    '\n',
                    '    .modal-info {\n',
                    '        padding: 25px 20px;\n',
                    '        overflow-y: visible !important;\n',
                    '        height: auto;\n',
                    '    }\n'
                ]
                for idx, val in enumerate(new_block):
                    lines.insert(gallery_end + 1 + idx, val)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Updated CSS with pill and modal-info fixes")
