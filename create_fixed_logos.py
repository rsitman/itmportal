#!/usr/bin/env python3
"""
Opravený skript pro vytvoření log se správnými názvy (JavaScript kompatibilní)
"""

import os
from PIL import Image, ImageDraw, ImageFont
import re
import unicodedata

def sanitize_filename_js_style(company_name):
    """JavaScript styl generování názvů souborů"""
    filename = company_name.lower()
    filename = unicodedata.normalize('NFD', filename)  # Normalize diacritics
    filename = ''.join(c for c in filename if unicodedata.category(c) != 'Mn')  # Remove diacritic marks
    filename = ''.join(c if c.isalnum() else '_' for c in filename)  # Replace non-alnum with _
    filename = '_'.join(filter(None, filename.split('_')))  # Remove multiple underscores
    filename = filename.strip('_')  # Remove leading/trailing underscores
    filename += '.png'
    
    return filename

def create_default_logo(company_name, filename):
    """Vytvoří jednoduché defaultní logo s iniciálkami firmy"""
    
    # Získání iniciál (první 2-3 písmena z názvu)
    words = company_name.split()
    initials = ""
    
    for word in words[:2]:  # První dvě slova
        if len(word) > 0:
            initials += word[0].upper()
    
    if len(initials) < 2:
        initials = company_name[:2].upper()
    
    # Vytvoření obrázku
    size = (80, 80)
    image = Image.new('RGBA', size, (255, 255, 255, 0))  # Průhledné pozadí
    draw = ImageDraw.Draw(image)
    
    # Kruhové pozadí
    circle_color = (59, 130, 246)  # Modrá barva
    draw.ellipse([10, 10, 70, 70], fill=circle_color)
    
    # Text s iniciálami
    try:
        # Zkusit načíst font
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
    except:
        # Fallback na default font
        font = ImageFont.load_default()
    
    # Vykreslení textu
    text_color = (255, 255, 255)  # Bílá
    text_bbox = draw.textbbox((0, 0), initials, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    # Centrování textu
    x = (size[0] - text_width) // 2
    y = (size[1] - text_height) // 2
    
    draw.text((x, y), initials, fill=text_color, font=font)
    
    # Uložení obrázku
    image.save(filename)
    print(f"✅ Vytvořeno logo pro {company_name}: {os.path.basename(filename)}")

def main():
    """Hlavní funkce"""
    # Seznam zákazníků
    companies = [
        "ABS Jets, a.s.",
        "agriKomp Bohemia s.r.o.",
        "ATALIAN CZ s.r.o.",
        "ATALIAN SK s. r. o.",
        "Aviation composite solution s.r.o.",
        "BBH Tsuchiya s.r.o.",
        "BeF Home, s.r.o.",
        "Chládek zahradnické centrum s.r.o.",
        "ČKD Blansko Holding, a.s.",
        "CONSULTEST s.r.o.",
        "CONTEG, spol. s r.o.",
        "CZ-AEROMOTIVE a.s.",
        "CZ-SKD Solutions a.s.",
        "Dopravní podnik města České Budějovice, a.s.",
        "EGE Power System, s.r.o.",
        "EGE, spol. s r.o.",
        "EVEKTOR, spol. s r.o.",
        "Falcon security, s.r.o.",
        "Geomine a.s.",
        "HGS, a.s.",
        "ITMAN Czech, s.r.o.",
        "KAMÍR a Co spol. s r. o.",
        "KARAT Software a.s.",
        "KRAB BRNO, s.r.o.",
        "Lašek Transport s.r.o.",
        "LINEA NIVNICE, a.s.",
        "Mark2 Corporation Czech a.s.",
        "MEDICA FILTER spol. s r.o.",
        "MODELÁRNA LIAZ spol. s r. o.",
        "NN STEEL s.r.o.",
        "NPK Europe Mfg. s.r.o.",
        "NYTRON s.r.o.",
        "PAPOS Trade s.r.o.",
        "PCV Computers, s. r. o.",
        "POLAK CZ s.r.o.",
        "PRODOMOS s.r.o.",
        "SAGITTA Ltd., spol. s r.o.",
        "SENSIT s.r.o.",
        "SIGNUM spol. s r.o.",
        "SILROC CZ,a.s.",
        "SINOP SMP s.r.o.",
        "TVD-Technická výroba, a.s.",
        "ZAMET, spol. s r.o."
    ]
    
    # Vytvořit adresář pro loga pokud neexistuje
    logos_dir = '/home/oak/firma-portal/public/logos'
    os.makedirs(logos_dir, exist_ok=True)
    
    print(f"🎨 Vytvářím {len(companies)} log se správnými názvy...")
    
    # Nejprve smazat stará loga
    import glob
    old_files = glob.glob(os.path.join(logos_dir, '*.png'))
    for old_file in old_files:
        os.remove(old_file)
        print(f"🗑️  Smazáno staré logo: {os.path.basename(old_file)}")
    
    print()
    
    for company in companies:
        filename = sanitize_filename_js_style(company)
        filepath = os.path.join(logos_dir, filename)
        create_default_logo(company, filepath)
    
    print(f"\n📁 Nová loga uložena v: {logos_dir}")
    print("🔄 Nyní by mapa měla zobrazovat správná loga!")

if __name__ == "__main__":
    main()
