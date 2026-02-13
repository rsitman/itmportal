# Bash příkazy pro Ubuntu

## Jak posílat příkazy z Windows přímo do Ubuntu

### 1. Z Windows CMD (příkazový řádek)
```cmd
# Spuštění Ubuntu příkazu
wsl.exe -e bash -c "příkaz"

# Příklad:
wsl.exe -e bash -c "npm run dev"
wsl.exe -e bash -c "cd /home/uzivatel && ls -la"
```

### 2. Z Windows PowerShell
```powershell
# Spuštění Ubuntu příkazu
wsl.exe -e bash -c "příkaz"

# Příklad:
wsl.exe -e bash -c "npm run dev"
```

### 3. Vytvoření si batch souboru (.bat)
Vytvořte soubor `ubuntu-prikazy.bat`:
```batch
@echo off
wsl.exe -e bash -c "%*"
```

### 4. Vytvoření si PowerShell skriptu (.ps1)
Vytvořte soubor `ubuntu-prikazy.ps1`:
```powershell
param(
    [Parameter(Mandatory=$true)][string]$Prikaz
)

wsl.exe -e bash -c $Prikaz
```

### 5. Přímé spuštění Ubuntu shellu
Pokud chcete přímo pracovat v Ubuntu shellu:
```cmd
wsl.exe
```

### 6. Nejlepší metoda pro vývoj
Pro vývoj v Next.js projektu doporučuji:
1. Používat VS Code s WSL rozšířením
2. Vytvořit si aliasy pro časté příkazy
3. Používat `wsl.exe -e bash -c "příkaz"`

## Příklady použití

### Vývoj serveru
```cmd
wsl.exe -e bash -c "npm run dev"
```

### Instalace závislostí
```cmd
wsl.exe -e bash -c "npm install nazev-balicku"
```

### Build projektu
```cmd
wsl.exe -e bash -c "npm run build"
```

### Kontrola verze
```cmd
wsl.exe -e bash -c "node --version"
wsl.exe -e bash -c "npm --version"
```

### Čištění cache
```cmd
wsl.exe -e bash -c "rm -rf .next"
```

### Restartování služeb
```cmd
wsl.exe -e bash -c "sudo systemctl restart nginx"
```

## Tipy pro efektivní práci
1. Vytvořte si aliasy v `.bashrc`
2. Používejte tab completion
3. Využívejte historii příkazů
4. Sledujte výkon systému

## Struktura projektu
- `/home/uzivatel/firma-portal` - hlavní adresář projektu
- `/home/uzivatel/.bashrc` - konfigurace bash
- `/home/uzivatel/.profile` - profil uživatele
