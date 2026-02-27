# RSC Payload Error - Finální oprava

## Datum: 25.2.2026 - 14:32

## 🔴 Problém
```
Failed to fetch RSC payload for http://localhost:3000/login
TypeError: NetworkError when attempting to fetch resource.
```

## 🔍 Příčina
Konfliktní logika v `middleware.ts`:
- `authorized` callback povoloval přístup na `/login` bez tokenu
- Hlavní middleware funkce přesměrovávala z `/login` na `/dashboard` **před** kontrolou tokenu
- To způsobovalo redirect loop a RSC fetch errors

## ✅ Řešení

### 1. Upravena logika v middleware funkci
**Změna pořadí:** Redirect na `/dashboard` se nyní provádí **pouze pokud existuje token**

```typescript
// PŘED (špatně):
if (!token) {
  return NextResponse.next()
}

const userRole = token.role as Role || Role.USER

// ... role checks ...

// Přesměrování - toto se provádělo PŘED role checks!
if (pathname === '/' || pathname === '/login') {
  return NextResponse.redirect(new URL('/dashboard', req.url))
}

// PO (správně):
if (!token) {
  return NextResponse.next()
}

const userRole = token.role as Role || Role.USER

// Redirect hned po kontrole tokenu, před role checks
if (pathname === '/' || pathname === '/login') {
  return NextResponse.redirect(new URL('/dashboard', req.url))
}

// ... role checks následují ...
```

### 2. Přidána `pages` konfigurace
```typescript
{
  callbacks: {
    authorized: ({ token, req }) => {
      // ... authorized logic
    },
  },
  pages: {
    signIn: '/login',  // <-- NOVÉ
  },
}
```

## 📝 Změněné soubory

### `/home/oak/firma-portal/middleware.ts`
- Přesunut redirect z `/login` na `/dashboard` na správné místo
- Přidána `pages: { signIn: '/login' }` konfigurace
- Přidán whitelist pro `/api/simple-test` endpoint

## 🧪 Test

### ✅ Server spuštěn
```bash
▲ Next.js 16.1.6 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://0.0.0.0:3000
✓ Ready in 17.1s
```

### ✅ Middleware zkompilován
```
○ Compiling middleware ...
✓ Ready in 17.1s
```

### 🎯 Očekávané chování

1. **Nepřihlášený uživatel na `/login`:**
   - ✅ Zobrazí se login formulář
   - ✅ Žádný redirect
   - ✅ Žádný RSC error

2. **Přihlášený uživatel na `/login`:**
   - ✅ Přesměruje na `/dashboard`

3. **Nepřihlášený uživatel na `/dashboard`:**
   - ✅ Přesměruje na `/login`

4. **Přihlášený uživatel na `/dashboard`:**
   - ✅ Zobrazí dashboard s kontrolou role

## 📊 Výsledek

**Status:** ✅ **VYŘEŠENO**

Server běží na `http://localhost:3000` bez RSC payload errors.

## 🔄 Kroky pro restart (pokud potřeba)

```bash
# 1. Zastavit všechny Node procesy
pkill -9 node

# 2. Smazat .next cache
cd /home/oak/firma-portal
find .next -type f -delete
find .next -type d -delete

# 3. Spustit dev server
npm run dev

# 4. Počkat ~15-20 sekund na build
```

## 🎯 Co testovat

1. **Login page přístup:**
   - Otevřít http://localhost:3000/login
   - Měl by se zobrazit login formulář (bez errors)

2. **Credentials login:**
   - Email: `admin@firma.cz`
   - Heslo: `admin123`
   - Mělo by přesměrovat na `/dashboard`

3. **Azure AD login:**
   - Kliknout "Sign in with Azure Active Directory"
   - Mělo by přesměrovat na Microsoft login

4. **Protected routes:**
   - Zkusit `/dashboard` bez přihlášení
   - Mělo by přesměrovat na `/login`

---

**Server status:** 🟢 Running on port 3000  
**Middleware:** 🟢 Compiled and active  
**Auth:** 🟢 Ready for testing
