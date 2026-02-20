# Migrace aplikace Firma Portal na testovací server

Komplexní plán migrace Next.js aplikace z vývojového prostředí na Ubuntu testovací server včetně konfigurace, instalace a nastavení pro další vývoj.

## 1. Konfigurace testovacího serveru (Ubuntu)

### Systémové požadavky
- **OS**: Ubuntu 20.04+ nebo 22.04+
- **RAM**: Minimálně 2GB, doporučeno 4GB+
- **Storage**: Minimálně 20GB volného místa
- **Network**: Přístup na port 3000 (aplikace) a 5432 (databáze)

### Uživatel a oprávnění
- Vytvořit dedikovaného uživatele `appuser` pro běh aplikace
- Nastavit správné oprávnění pro adresáře aplikace
- Konfigurovat firewall (ufw) pro povolení potřebných portů

### Síťová konfigurace
- **Lokální IP adresa**: Statická IP v intranetu (např. 192.168.1.100)
- **DNS záznam**: Lokální DNS server pro překlad názvu (např. firma-portal.local)
- **Firewall**: Povolení portů pouze pro intranetový rozsah
- **Žádné veřejné domény**: Pouze interní přístup

## 2. Požadované instalace na serveru

### Základní závislosti
```bash
# Aktualizace systému
sudo apt update && sudo apt upgrade -y

# Instalace potřebných nástrojů
sudo apt install -y curl wget git unzip htop

# Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker a Docker Compose
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
```

### Databáze (PostgreSQL)
- Použijeme Docker kontejner z docker-compose.yml
- Alternativně: instalace PostgreSQL přímo na systém

```bash
# Pokud by byla potřeba přímá instalace
sudo apt install -y postgresql postgresql-contrib
```

### Nginx (reverse proxy - volitelný)
```bash
sudo apt install -y nginx
# Pro intranet může stačit přímý přístup na port 3000
# Nginx je doporučen pro lepší správu a budoucí HTTPS
```

### Lokální DNS konfigurace
- Záznam v lokálním DNS serveru (Windows AD DNS, BIND, atd.)
- Nebo hosts soubory na klientských stanicích
- Příklad: `192.168.1.100 firma-portal.local`

### SSL certifikáty (volitelné)
- Pro intranet lze použít self-signed certifikáty
- Nebo interní CA pokud existuje

```bash
# Self-signed certifikát
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/firma-portal.key \
    -out /etc/ssl/certs/firma-portal.crt
```

## 3. Proces migrace aplikace

### Příprava aplikace
- **Vytvoření produkčního buildu**
  ```bash
  npm run build
  ```

- **Příprava environment proměnných**
  - Kopírovat `.env.example` jako `.env.production`
  - Nastavit produkční hodnoty:
    - `DATABASE_URL` (připojení k PostgreSQL)
    - `NEXTAUTH_SECRET` (silný náhodný řetězec)
    - `NEXTAUTH_URL` (intranet URL, např. "http://firma-portal.local:3000")
    - Azure AD credentials (pokud se používají)

- **Export databáze**
  ```bash
  # Z vývojového prostředí
  pg_dump postgresql://admin:admin@localhost:5432/portal > portal_backup.sql
  ```

### Přenos na server
- **Možnosti přenosu**
  - Git clone (při použití Git repozitáře)
  - SCP/SFTP přenos souborů
  - Docker image push do registry

- **Doporučený postup (Git)**
  ```bash
  # Na serveru
  git clone <repo-url> /opt/firma-portal
  cd /opt/firma-portal
  git checkout <production-branch>
  ```

### Nasazení na serveru
- **Instalace závislostí**
  ```bash
  cd /opt/firma-portal
  npm ci --only=production
  npx prisma generate
  ```

- **Konfigurace databáze**
  ```bash
  # Spuštění PostgreSQL kontejneru
  docker-compose up -d postgres

  # Import dat
  psql postgresql://admin:admin@localhost:5432/portal < portal_backup.sql

  # Spuštění migrací
  npx prisma db push
  ```

- **Spuštění aplikace**
  ```bash
  # Testovací běh
  npm start

  # Produkční běh s process managerem
  npm install -g pm2
  pm2 start npm --name "firma-portal" -- start
  ```

### Konfigurace Nginx (volitelná)
```nginx
server {
    listen 80;
    server_name firma-portal.local;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Alternativa: Přímý přístup na port 3000
Pro intranet lze aplikaci zpřístupnit přímo:
- URL: `http://firma-portal.local:3000`
- Žádná Nginx konfigurace
- Jednodušší setup

## 4. Zajištění dalšího vývoje

### CI/CD pipeline
- **Git workflow**
  - `main` produkční větev
  - `develop` vývojová větev
  - `feature/*` nové funkce

- **Automatizované nasazení**
  - GitHub Actions nebo GitLab CI
  - Automatický build a deploy po push do main
  - Testovací nasazení pro develop větev

### Prostředí pro vývoj
- **Lokální vývoj**
  - Vývojáři pokračují ve vývoji lokálně
  - Stejná konfigurace přes `.env.local`

- **Testovací prostředí**
  - Samostatná testovací instance
  - Automatická synchronizace z develop větve

### Monitoring a logování
- **Aplikační logy**
  - PM2 log management
  - Rotace logů

- **System monitoring**
  - Uptime monitoring
  - Resource monitoring (CPU, RAM, disk)

- **Backup strategie**
  - Denní backup databáze
  - Backup aplikace souborů
  - Offsite storage

### Bezpečnost
- **Aplikační bezpečnost**
  - Pravidelné aktualizace závislostí
  - Security scanning

- **Serverová bezpečnost**
  - Pravidelné system updates
  - Firewall konfigurace
  - SSH key authentication

## 5. Checklist migrace

### Před migrací
- [ ] Backup aktuální databáze
- [ ] Testovací build lokálně
- [ ] Kontrola environment proměnných
- [ ] Verifikace Git repozitáře

### Během migrace
- [ ] Instalace všech závislostí
- [ ] Konfigurace lokálního DNS záznamu
- [ ] Konfigurace databáze
- [ ] Import dat
- [ ] Testovací běh aplikace
- [ ] Ověření přístupu z intranetu
- [ ] Volitelná konfigurace Nginx

### Po migraci
- [ ] Funkční testování z různých intranetových stanic
- [ ] Ověření DNS překladu
- [ ] Volitelné SSL certifikáty
- [ ] Monitoring setup
- [ ] Backup konfigurace
- [ ] Dokumentace přístupů pro uživatele

## 6. Troubleshooting

### Běžné problémy
- **Port conflicts**: Zkontrolovat volnost portů 3000, 5432
- **Database connection**: Ověřit DATABASE_URL a přístup k DB
- **Build errors**: Kontrola Node.js verze a závislostí
- **Permission issues**: Správná oprávnění pro appuser
- **DNS resolution**: Ověřit DNS záznam nebo hosts soubory
- **Network access**: Kontrola firewall a přístupu z intranetu

### Logy pro diagnostiku
- **Aplikační logy**: `/opt/firma-portal/logs/`
- **Nginx logy**: `/var/log/nginx/`
- **System logy**: `/var/log/syslog`

---

**Plán vytvořen**: 16. února 2026  
**Priorita**: VYSOKÁ - Intranet nasazení pro testovací účely
