import os

file_path = r'c:\Users\Juanjo\Documents\tenisymas\collections-logic.js'
with open(file_path, 'rb') as f:
    content = f.read()

# I want to replace the bytes that show up as â ³ Cargando
# Based on common mangling:
# â ³ is often the interpretation of \xE2 \x8C \x9B (⌛) in some encodings.
# But if it's in the file as the literal characters that show up as â ³ in UTF-8, 
# it would be \xC3\xA2\xC2\x80\xC2\xB3 or something similar.

# Let's just look for the string "Cargando..." and fix the bytes before it.
import re
# We look for something like <span style="opacity: 0.7;">[ANYTHING] Cargando...</span>
pattern = b'<span style="opacity: 0.7;">.*?Cargando\.\.\.</span>'
match = re.search(pattern, content)
if match:
    # Replace exactly that part
    new_span = b'<span style="opacity: 0.7;">\xe2\x8c\x9b Cargando...</span>'
    content = content.replace(match.group(0), new_span)
    with open(file_path, 'wb') as f:
        f.write(content)
    print("Found and replaced loading span")
else:
    print("Could not find the loading span with bytes")
