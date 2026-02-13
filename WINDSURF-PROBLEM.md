# Windsurf Problém - Generování příkazů nefunguje

## Problém
Uživatel hlásí že Windsurf vůbec negeneruje příkazy pro spuštění v Ubuntu. Místo toho používáte PowerShell příkazy v terminálu.

## Možné příčiny
1. **Konfigurace Windsurf** - špatné nastavení terminálu
2. **Verze Windsurf** - starší verze s chybami
3. **WSL prostředí** - nekompatibilita s WSL

## Řešení

### 1. Zkontrolovat nastavení Windsurf
- Otevřít nastavení Windsurf (Ctrl+Shift+P)
- Zkontrolovat terminál: `bash` nebo `wsl.exe`
- Zkontrolovat shell path

### 2. Správné použití
Pro spuštění vývoje v Ubuntu použijte:
```bash
wsl.exe -e bash -c "npm run dev"
```

### 3. Alternativa - PowerShell
Pokud bash nefunguje, zkuste PowerShell:
```powershell
wsl.exe -e powershell -c "npm run dev"
```

### 4. Manuální spuštění
Pokud automatické generování nefunguje:
1. Otevřít terminál v Ubuntu
2. Spustit manuálně: `npm run dev`
3. Ověřit funkčnost

## Diagnostika
Zkontrolujte:
- Verze Windsurf
- Nastavení terminálu
- Shell path
- Funkčnost příkazů

## Kontakt na podporu
Pokud problém přetrvává, kontaktujte podporu Windsurf.
