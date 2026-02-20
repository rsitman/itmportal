# Poznámky pro opravy portálu

## Důležité pokyny pro budoucí opravy

### 1. Při opakovaných problémech
Pokud nastane opakovaný problém při editaci některé stránky (např. konflikty názvů, duplicitní definice, atd.), je lepší vytvořit celou stránku znovu než se snažit o opravu.

### 2. WSL prostředí
Pracujeme ve WSL Ubuntu prostředí. Při opravách pamatovat na:
- Používat `wsl.exe -e bash -c "příkaz"` místo `wsl -c`
- Shell: bash (WSL Ubuntu)
- Encoding: UTF-8 pro všechny terminálové výstupy

### 3. Snadší opravy
- Preferovat kompletní přepsání souborů místo drobných korekcí
- Vždy kontrolovat celý soubor po editaci
- Testovat funkčnost po každé opravě

### 4. Struktura projektu
- Hlavní soubory jsou ve `src/` adresáři
- Komponenty ve `src/components/`
- Stránky ve `src/app/`

### 5. Lokalizace kalendáře
- Kalendář používá `date-fns` s českou lokalizací
- Pro správné zobrazení je potřeba nastavit `culture: 'cs'` v `dateFnsLocalizer`
- CSS styly pro české zkratky dnů jsou v `customStyles`

### 6. Přesměrování
- Middleware je v `src/middleware.ts`
- Automaticky přesměruje po přihlášení na `/dashboard`
- Při odhlášení přesměruje na `/login`

### 7. Propojení stránek
- Evidence projektů má tlačítko pro přechod na upgrady
- Upgrady stránka přijímá `?projekt=` parametr pro filtrování

## Příkazy pro Ubuntu/WSL
```bash
# Správné příkazy pro Ubuntu/WSL
npm run dev
rm -rf .next
npm install
npm run build

# Kontrola TypeScript
npx tsc --noEmit

# Formátování kódu
npx prettier --write .

# Kontrola lintingu
npm run lint
```

## Tip pro WSL
Pokud narazíte na problémy s WSL, zkuste:
1. Restartovat WSL: `wsl --shutdown`
2. Aktualizovat balíčky: `sudo apt update && sudo apt upgrade`
3. Překontrolovat PATH proměnné

## DŮLEŽITÁ POZNÁMKA
Uživatel je ve WSL prostředí, takže by měl používat standardní Ubuntu bash příkazy místo WSL specifických.

## Důležité soubory
- `src/app/calendar/page.tsx` - hlavní kalendářová komponenta
- `src/middleware.ts` - přesměrování
- `src/app/evidence-projektu/page.tsx` - evidence projektů
- `src/app/upgrades/page.tsx` - upgrady s filtrováním
- `src/components/projects/ProjectsRegistryClient.tsx` - komponenta pro projekty
