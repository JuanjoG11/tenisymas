import os

def fix_all_manglings(content):
    # Map common manglings to clean equivalents
    replacements = {
        '\xc3\xa2\xc2\x8c\xc2\x9b': '⏳',
        '\xc3\xb0\xc2\x9f\xc2\x9a\xc2\x80': '🚀',
        '\xc3\xa2\xc2\x9a\xc2\x91': '⚡',
        '\xc3\xb0\xc2\x9f\xc2\x94\xc2\x84': '🔄',
        '\xc3\xb0\xc2\x9f\xc2\x93\xc2\xa1': '📡',
        '\xc3\xa2\xc2\x9c\xc2\x85': '✅',
        '\xc3\xb0\xc2\x9f\xc2\x92\xc2\xbe': '💾',
        '\xc3\xb0\xc2\x9f\xc2\x91\xc2\x9f': '👟',
        '\xc3\xb0\xc2\x9f\xc2\x92\xc2\xb0': '💰',
        '\xc3\xb0\xc2\x9f\xc2\x93\xc2\xad': '📍',
        '\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xa8': '🎨',
        '\xc3\xb0\xc2\x9f\xc2\x91\xc2\x8b': '👋',
        '\xc3\x82\xc2\xbf': '¿',
        'Â¿': '¿',
        'Â¡': '¡',
        'ðŸ“ ': '📍',
    }
    
    # Also handle some direct manglings observed
    content = content.replace('â ³', '⏳')
    content = content.replace('Â¿', '¿')
    content = content.replace('Â¡', '¡')
    content = content.replace('Ã¡', 'á')
    content = content.replace('Ã©', 'é')
    content = content.replace('Ã', 'í') # Risky
    content = content.replace('Ã³', 'ó')
    content = content.replace('Ãº', 'ú')
    content = content.replace('Ã±', 'ñ')
    content = content.replace('Ã‘', 'Ñ')
    
    return content

file_path = r'c:\Users\Juanjo\Documents\tenisymas\collections-logic.js'
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

new_text = fix_all_manglings(text)

# Specific fixes for observed mess:
new_text = new_text.replace('ðŸ“  *Talla:*', '📍 *Talla:*')
new_text = new_text.replace('🎨 *Color:*', '🎨 *Color:*') # Just in case
new_text = new_text.replace('Â¿Tienen disponibilidad?', '¿Tienen disponibilidad?')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Scrubbed collections-logic.js")
