# Souhrn oprav autentizace - 25.2.2026

## 🎯 Provedené opravy

### 1. **Přesunutí middleware do správného umístění**
**Problém:** Middleware byl v `src/proxy.ts`, ale Next.js vyžaduje middleware v root adresáři jako `middleware.ts`

**Řešení:**
- Vytvořen nový `/middleware.ts` v root adresáři
- Smazán starý `src/proxy.ts` a `src/proxy-new.ts`
- Vymazána `.next` cache pro reload

**Důsledek:** Middleware se nyní správně načítá a spouští pro všechny requesty

---

### 2. **Opravený matcher v middleware**
**Problém:** Původní matcher vylučoval všechny `/api` routes, což bránilo NextAuth callbackům

**Původní:**
```typescript
'/((?!_next/static|_next/image|favicon.ico|public|api).*)'
```

**Opravený:**
```typescript
'/((?!_next/static|_next/image|favicon.ico|public).*)'
```

**Důsledek:** NextAuth `/api/auth/*` endpointy jsou nyní dostupné

---

### 3. **Opravený login flow**
**Problém:** Login page používal custom fetch místo standardního NextAuth `signIn()`

**Původní kód:**
```typescript
// Přímý fetch na NextAuth signin endpoint
const formData = new FormData()
formData.append('email', email)
formData.append('password', password)
// ... CSRF token fetch
const response = await fetch('/api/auth/signin/credentials', {
  method: 'POST',
  body: formData,
  redirect: 'manual'
})
```

**Opravený kód:**
```typescript
const result = await signIn('credentials', {
  email: email,
  password: password,
  redirect: false,
  callbackUrl: callbackUrl,
})

if (result?.error) {
  setError('Neplatné přihlašovací údaje')
} else if (result?.ok) {
  router.push(callbackUrl)
}
```

**Důsledek:** Správné nastavení session cookies a JWT tokens

---

## 📋 Testování

### Test credentials provideru
1. Otevřete http://localhost:3000/login
2. Zadejte credentials: `admin@firma.cz` / `admin123`
3. Mělo by vás přesměrovat na `/dashboard`

### Test Azure AD provideru
1. Na login stránce klikněte na "Sign in with Azure Active Directory"
2. Přesměruje vás na Microsoft login
3. Po úspěšném přihlášení vrátí na `/dashboard`

**Poznámka:** Azure AD vyžaduje správné nastavení Redirect URI v Azure Portal:
- Development: `http://localhost:3000/api/auth/callback/azure-ad`
- Production: `https://vase-domena.cz/api/auth/callback/azure-ad`

### Test middleware autorizace
1. Zkuste přístup na `/dashboard` bez přihlášení
2. Mělo by vás přesměrovat na `/login`
3. Po přihlášení byste měli mít přístup podle vaší role

---

## 🔧 Soubory změněny

### Vytvořeno:
- `/middleware.ts` - Nový middleware v root adresáři

### Upraveno:
- `/src/app/login/page.tsx` - Opravený login flow (řádky 89-137)

### Smazáno:
- `/src/proxy.ts` - Starý middleware (přesunut do root)
- `/src/proxy-new.ts` - Nepoužívaný soubor

---

## 🚀 Konfigurace

### Environment Variables
Ujistěte se, že máte správně nastavené:

```env
# NextAuth
NEXTAUTH_SECRET="tvoje-super-delka-tajemstvi-32-znaků-minimum"
NEXTAUTH_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://admin:admin@localhost:5432/portal?schema=public"

# Azure AD (volitelné)
AZURE_AD_CLIENT_ID="82b69964-c6a5-4baa-8968-2fced67ee6b1"
AZURE_AD_CLIENT_SECRET="REDACTED_SECRET"
AZURE_AD_TENANT_ID="e5f151fa-45e9-4ec0-93a0-a03b147a6ec5"
```

### Database
Ujistěte se, že PostgreSQL běží a obsahuje testovacího uživatele:

```bash
# Spustit databázi
docker-compose up -d postgres

# Nahrát seed data
npx prisma db push
npx prisma db seed
```

---

## ⚠️ Poznámky

### Azure AD Redirect URI
V Azure Portal musíte nastavit redirect URI:
- Přejděte do Azure AD > App registrations
- Vyberte vaši aplikaci
- Authentication > Add a platform > Web
- Redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
- Povolit "ID tokens" v Implicit grant settings

### Middleware Priority
Next.js hledá middleware v tomto pořadí:
1. `/middleware.ts` (nebo `/middleware.js`)
2. `/src/middleware.ts` (nebo `/src/middleware.js`)

Proto musí být middleware v root adresáři, ne v `src/`.

### Session Cookies
Middleware správně nastavuje cookies pro HTTP development:
- `secure: false` pro localhost
- `sameSite: 'lax'` pro cross-origin requests
- `httpOnly: true` pro bezpečnost

---

## 📝 Další kroky

1. **Otestovat všechny providery** (credentials ✅, Azure AD ⏳)
2. **Ověřit role-based access** na různých pages
3. **Zkontrolovat session persistence** po reloadu
4. **Testovat logout** flow

---

## 🐛 Řešení problémů

### "Connection refused" na localhost:3000
- Zkontrolujte, že dev server běží: `npm run dev`
- Server běží na `0.0.0.0:3000`, měl by být dostupný na `localhost:3000`

### Middleware se nenačítá
- Smažte `.next` cache: `rm -rf .next`
- Restartujte dev server

### Přihlášení nefunguje
- Zkontrolujte konzoli prohlížeče pro chyby
- Ověřte, že databáze běží a obsahuje uživatele
- Zkontrolujte `NEXTAUTH_SECRET` a `NEXTAUTH_URL` v `.env`

### Azure AD nefunguje
- Ověřte redirect URI v Azure Portal
- Zkontrolujte, že client secret není expirovaný
- Ujistěte se, že aplikace má správná API permissions
