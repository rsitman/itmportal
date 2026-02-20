#!/usr/bin/env python3
"""
Skript pro stažení log zákazníků z Google Images
"""

import requests
import os
import time
import re
from urllib.parse import quote

def sanitize_filename(company_name):
    """Převede název firmy na validní název souboru"""
    return re.sub(r'[^a-z0-9]', '_', company_name.lower()) + '.png'

def download_logo(company_name, max_retries=3):
    """Stáhne logo pro danou společnost"""
    filename = sanitize_filename(company_name)
    filepath = f'/home/oak/firma-portal/public/logos/{filename}'
    
    # Přeskočit pokud soubor již existuje
    if os.path.exists(filepath):
        print(f"✅ Logo pro {company_name} již existuje: {filename}")
        return True
    
    # Hledat logo přes Google Images (použijeme jednoduchý přístup)
    search_query = f"{company_name} logo"
    
    # Zkusíme několik zdrojů log
    logo_sources = [
        f"https://logo.clearbit.com/{company_name.lower().replace(' ', '').replace(',', '').replace('.', '')}.com",
        f"https://www.google.com/s2/favicons?domain={company_name.lower().replace(' ', '')}.com&sz=128",
    ]
    
    for i, logo_url in enumerate(logo_sources):
        try:
            print(f"🔍 Pokus {i+1}/{len(logo_sources)} pro {company_name}: {logo_url}")
            
            response = requests.get(logo_url, timeout=10)
            
            if response.status_code == 200 and len(response.content) > 1000:  # Minimální velikost obrázku
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                print(f"✅ Staženo logo pro {company_name}: {filename}")
                return True
            else:
                print(f"❌ Neúspěšný pokus pro {company_name}: status {response.status_code}")
                
        except Exception as e:
            print(f"❌ Chyba při stahování pro {company_name}: {e}")
        
        time.sleep(1)  # Počkat mezi pokusy
    
    print(f"⚠️  Nepodařilo se stáhnout logo pro {company_name}")
    return False

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
    
    print(f"🚀 Začínám stahovat {len(companies)} log...")
    
    successful = 0
    failed = 0
    
    for company in companies:
        if download_logo(company):
            successful += 1
        else:
            failed += 1
        time.sleep(2)  # Počkat mezi stahováním
    
    print(f"\n📊 Statistika:")
    print(f"✅ Úspěšně staženo: {successful}")
    print(f"❌ Neúspěšných: {failed}")
    print(f"📁 Loga uložena v: {logos_dir}")

if __name__ == "__main__":
    main()
