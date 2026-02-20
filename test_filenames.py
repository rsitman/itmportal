#!/usr/bin/env python3
# Testovací skript pro generování názvů souborů

def sanitize_filename_js_style(company_name):
    """JavaScript styl generování názvů souborů"""
    import unicodedata
    
    filename = company_name.lower()
    filename = unicodedata.normalize('NFD', filename)  # Normalize diacritics
    filename = ''.join(c for c in filename if unicodedata.category(c) != 'Mn')  # Remove diacritic marks
    filename = ''.join(c if c.isalnum() else '_' for c in filename)  # Replace non-alnum with _
    filename = '_'.join(filter(None, filename.split('_')))  # Remove multiple underscores
    filename = filename.strip('_')  # Remove leading/trailing underscores
    filename += '.png'
    
    return filename

# Testovací data
test_companies = [
    "EGE, spol. s r.o.",
    "ČKD Blansko Holding, a.s.",
    "Dopravní podnik města České Budějovice, a.s.",
    "ABS Jets, a.s."
]

print("🧪 Testování generování názvů souborů:")
print("-" * 50)

for company in test_companies:
    filename = sanitize_filename_js_style(company)
    print(f"Company: {company}")
    print(f"Filename: {filename}")
    print()

# Zkontrolovat zda soubory existují
import os
logos_dir = '/home/oak/firma-portal/public/logos'

print("📁 Kontrola existujících souborů:")
print("-" * 50)

for company in test_companies:
    filename = sanitize_filename_js_style(company)
    filepath = os.path.join(logos_dir, filename)
    exists = "✅" if os.path.exists(filepath) else "❌"
    print(f"{exists} {filename}")
