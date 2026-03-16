import os

def fix_file_encoding(file_path):
    replacements = {
        'ðŸš€': '🚀',
        'âš¡': '⚡',
        'ðŸ”„': '🔄',
        'ðŸ“¡': '📡',
        'âœ…': '✅',
        'ðŸ’¾': '💾',
        'â ³': '⏳',
        'ðŸ‘Ÿ': '👟',
        'ðŸ’°': '💰',
        'ðŸ“ ': '📍',
        'ðŸŽ¨': '🎨',
        'ðŸ‘‹': '👋',
        'ColecciÃ³n': 'Colección',
    }
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    original_content = content
    for old, new in replacements.items():
        content = content.replace(old, new)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed encoding issues in {file_path}")
    else:
        print(f"No encoding issues found in {file_path}")

fix_file_encoding(r'c:\Users\Juanjo\Documents\tenisymas\collections-logic.js')
fix_file_encoding(r'c:\Users\Juanjo\Documents\tenisymas\script.js')
