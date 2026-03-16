import os

def patch_file(file_path, items_per_page=12):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Revert itemsPerPage to 12
    if 'itemsPerPage = 24' in content:
        content = content.replace('itemsPerPage = 24', f'itemsPerPage = {items_per_page}')
    elif 'itemsPerPage = 12' not in content:
        # Just in case it's something else
        import re
        content = re.sub(r'itemsPerPage = \d+', f'itemsPerPage = {items_per_page}', content)

    # 2. Fix the delegation logic to include discountFilter correctly
    # The current logic is:
    # if (sidebar) { sidebar.addEventListener('change', (e) => { ... if (!filterType) return; ... }
    # discountFilter has no data-filter, so it returns!
    
    old_delegation = """            const el = e.target;
            const filterType = el.getAttribute('data-filter');
            if (!filterType) return;

            const val = el.value;"""
            
    new_delegation = """            const el = e.target;
            const filterType = el.getAttribute('data-filter');
            
            // Handle discount filter even if it has no data-filter
            if (el.id === 'discountFilter') {
                activeFilters.discount = el.checked;
                applyFilters();
                return;
            }

            if (!filterType) return;

            const val = el.value;"""
            
    if old_delegation in content:
        content = content.replace(old_delegation, new_delegation)

    # 3. Increase rootMargin of observer to be more aggressive? 
    # Or actually DECREASE it if it was causing loops? 
    # Original was 100px. I set it to 200px. Let's set it to 50px.
    content = content.replace("rootMargin: '200px'", "rootMargin: '50px'")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

patch_file(r'c:\Users\Juanjo\Documents\tenisymas\collections-logic.js')

# Also remove backdrop-filter from CSS as it causes crashes on some iOS Safaris
css_path = r'c:\Users\Juanjo\Documents\tenisymas\collections-style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace('backdrop-filter: blur(10px);', '/* backdrop-filter: blur(10px); */')
css = css.replace('backdrop-filter: blur(12px);', '/* backdrop-filter: blur(12px); */')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

print("Reverted itemsPerPage, fixed delegation, and removed backdrop-filters")
