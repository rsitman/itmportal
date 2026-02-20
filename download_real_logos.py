#!/usr/bin/env python3
"""
Skript pro stažení skutečných log zákazníků z internetu
"""

import os
import requests
import time
import re
import unicodedata
from urllib.parse import quote

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

def download_logo_from_various_sources(company_name, filename):
    """Stáhne logo z různých zdrojů"""
    
    # 1. Clearbit Logo API
    clearbit_domains = [
        company_name.lower().replace(' ', '').replace(',', '').replace('.', '').replace('s.r.o.', '').replace('a.s.', '').replace('spol.', ''),
        company_name.lower().replace(' ', '').split(',')[0].replace('.', ''),
    ]
    
    for domain in clearbit_domains:
        if len(domain) > 3:  # Minimální délka domény
            try:
                clearbit_url = f"https://logo.clearbit.com/{domain}.com"
                response = requests.get(clearbit_url, timeout=10)
                if response.status_code == 200 and len(response.content) > 1000:
                    with open(filename, 'wb') as f:
                        f.write(response.content)
                    print(f"✅ Clearbit: {company_name} -> {domain}.com")
                    return True
            except:
                continue
    
    # 2. Google Favicon API
    for domain in clearbit_domains:
        if len(domain) > 3:
            try:
                favicon_url = f"https://www.google.com/s2/favicons?domain={domain}.com&sz=128"
                response = requests.get(favicon_url, timeout=10)
                if response.status_code == 200 and len(response.content) > 500:
                    with open(filename, 'wb') as f:
                        f.write(response.content)
                    print(f"✅ Favicon: {company_name} -> {domain}.com")
                    return True
            except:
                continue
    
    # 3. DuckDuckGo Icon API
    try:
        search_query = quote(company_name + " logo")
        duckduckgo_url = f"https://icons.duckduckgo.com/ip3/{company_name.lower().replace(' ', '')}.com.ico"
        response = requests.get(duckduckgo_url, timeout=10)
        if response.status_code == 200 and len(response.content) > 500:
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"✅ DuckDuckGo: {company_name}")
            return True
    except:
        pass
    
    # 4. Custom logo sources pro známé české firmy
    custom_sources = {
        "ČKD Blansko Holding, a.s.": "https://www.ckdblansko.cz/wp-content/uploads/2021/03/CKD-Blansko-logo.png",
        "Dopravní podnik města České Budějovice, a.s.": "https://www.dpb.cz/images/logo-dpb.png",
        "EVEKTOR, spol. s r.o.": "https://www.evektor.cz/images/evektor-logo.png",
        "KARAT Software a.s.": "https://www.karat.cz/wp-content/uploads/2020/09/karat-logo.png",
        "LINEA NIVNICE, a.s.": "https://www.linea-nivnice.cz/images/logo.png",
    }
    
    if company_name in custom_sources:
        try:
            custom_url = custom_sources[company_name]
            response = requests.get(custom_url, timeout=10)
            if response.status_code == 200 and len(response.content) > 500:
                with open(filename, 'wb') as f:
                    f.write(response.content)
                print(f"✅ Custom: {company_name}")
                return True
        except:
            pass
    
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
    
    print(f"🌐 Stahuji {len(companies)} log z internetu...")
    print("🔄 Zdroje: Clearbit, Google Favicon, DuckDuckGo, Custom sources")
    print("-" * 60)
    
    successful = 0
    failed = 0
    
    for i, company in enumerate(companies, 1):
        filename = sanitize_filename_js_style(company)
        filepath = os.path.join(logos_dir, filename)
        
        # Přeskočit pokud soubor již existuje
        if os.path.exists(filepath):
            print(f"⏭️  [{i}/{len(companies)}] {company} - již existuje")
            successful += 1
            continue
        
        print(f"🔍 [{i}/{len(companies)}] {company}")
        
        if download_logo_from_various_sources(company, filepath):
            successful += 1
        else:
            failed += 1
            print(f"❌ [{i}/{len(companies)}] {company} - nenalezeno")
        
        time.sleep(1)  # Počkat mezi stahováním
    
    print("-" * 60)
    print(f"📊 Statistika:")
    print(f"✅ Úspěšně staženo: {successful}")
    print(f"❌ Neúspěšných: {failed}")
    print(f"📁 Loga uložena v: {logos_dir}")
    print(f"📈 Úspěšnost: {successful/(successful+failed)*100:.1f}%")

if __name__ == "__main__":
    main()
