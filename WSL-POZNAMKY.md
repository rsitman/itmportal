# WSL Poznámky pro příkazy

## Jak posílat příkazy do Ubuntu z Windows

### 1. Přímé příkazy v terminálu
Pokud máte otevřený terminál v Ubuntu (např. přes VS Code s WSL rozšířením), můžete přímo psát Ubuntu příkazy.

### 2. Z Windows terminálu
Z Windows terminálu (CMD, PowerShell):
```bash
# Spuštění Ubuntu příkazu
wsl.exe -e bash -c "příkaz"

# Příklad:
wsl.exe -e bash -c "npm run dev"
```

### 3. Z VS Code terminálu
Pokud používáte VS Code s WSL rozšířením:
1. Otevřít terminál v VS Code (`Ctrl + `` `)
2. Psát příkazy normálně - budou automaticky přesměrovány do WSL

### 4. Důležité WSL příkazy
```bash
# Seznam všech dostupných distribucí
wsl.exe -l -v

# Restartování WSL
wsl.exe --shutdown

# Aktualizace balíčků
sudo apt update && sudo apt upgrade
```

### 5. PATH proměnné
Pro kontrolu PATH v Ubuntu:
```bash
echo $PATH
```

### 6. Práce se soubory
```bash
# Kopírování souborů z Windows do WSL
cp /mnt/c/cesta/k/souboru.txt /home/uzivatel/destinace/

# Kopírování z WSL do Windows
cp /home/uzivatel/soubor.txt /mnt/c/cesta/k/destinace/
```

## Doporučení
- Používejte `wsl.exe -e bash -c "příkaz"` pro spolehlivost
- Využívejte VS Code s WSL rozšířením pro pohodlnější práci
- Vytvořte si aliasy pro často používané příkazy
