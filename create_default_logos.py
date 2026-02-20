#!/usr/bin/env python3
"""
Jednoduchý skript pro vytvoření defaultních log pro zákazníky
"""

import os
from PIL import Image, ImageDraw, ImageFont
import re

def sanitize_filename(company_name):
    """Převede název firmy na validní název souboru"""
    return re.sub(r'[^a-z0-9]', '_', company_name.lower()) + '.png'

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
    print(f"✅ Vytvořeno default logo pro {company_name}: {os.path.basename(filename)}")

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
    
    print(f"🎨 Vytvářím {len(companies)} defaultních log...")
    
    for company in companies:
        filename = sanitize_filename(company)
        filepath = os.path.join(logos_dir, filename)
        
        # Přeskočit pokud soubor již existuje
        if os.path.exists(filepath):
            print(f"✅ Logo pro {company} již existuje: {filename}")
            continue
            
        create_default_logo(company, filepath)
    
    print(f"\n📁 Defaultní loga uložena v: {logos_dir}")
    print("🔄 Nyní můžete nahradit libovolná loga skutečnými logy zákazníků")

if __name__ == "__main__":
    main()
