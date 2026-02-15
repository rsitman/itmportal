# Safe Technology Upgrade Plan (React 18 Stable)

## 🎯 CÍL
Upgrade všech technologií na nejnovější verze při zachování React 18.3.1 pro maximální stabilitu a kompatibilitu.

## 📊 SOUČASNÝ STAV VS CÍLOVÉ VERZE

### Frontend Core
| Komponenta | Současná verze | Cílová verze | Status |
|------------|----------------|---------------|---------|
| **React** | 18.3.1 | 18.3.1 | ✅ ZŮSTÁVÁ |
| **Next.js** | 16.1.6 | 16.2.x | 🔄 UPGRADE |
| **TypeScript** | 5.x | 5.7.x | 🔄 UPGRADE |
| **TailwindCSS** | 4.x | 4.x | ✅ AKTUÁLNÍ |

### Backend & Integrace
| Komponenta | Současná verze | Cílová verze | Status |
|------------|----------------|---------------|---------|
| **NextAuth.js** | 4.24.8 | 4.24.11 | 🔄 PATCH |
| **Prisma** | 5.22.0 | 5.28.x | 🔄 UPGRADE |
| **@prisma/client** | 5.22.0 | 5.28.x | 🔄 UPGRADE |

### UI Knihovny
| Komponenta | Současná verze | Cílová verze | Status |
|------------|----------------|---------------|---------|
| **React Big Calendar** | 1.19.4 | 1.19.4 | ✅ ZŮSTÁVÁ |
| **React Leaflet** | 5.0.0 | 5.1.0 | 🔄 PATCH |
| **Recharts** | 3.7.0 | 2.12.x | 🔄 MAJOR |
| **@radix-ui/react-slot** | 1.1.0 | 1.1.1 | 🔄 PATCH |

### Utility Knihovny
| Komponenta | Současná verze | Cílová verze | Status |
|------------|----------------|---------------|---------|
| **date-fns** | 4.1.0 | 4.1.0 | ✅ AKTUÁLNÍ |
| **bcryptjs** | 2.4.3 | 2.4.3 | ✅ AKTUÁLNÍ |
| **clsx** | 2.1.1 | 2.1.1 | ✅ AKTUÁLNÍ |

## 🔄 FÁZE UPGRADE

### Fáze 1: Příprava (0.5 dne)
1. **Záloha projektu**
   ```bash
   git tag pre-safe-upgrade
   ```
2. **Baseline testování**
   - Spustit aplikaci
   - Otestovat klíčové funkce
   - Vytvořit screenshoty

### Fáze 2: Core Technologies (1 den)
1. **Next.js upgrade**
   ```bash
   npm install next@latest
   ```
2. **TypeScript upgrade**
   ```bash
   npm install typescript@latest
   ```
3. **Testování základní funkčnosti**
   - Build process
   - Development server
   - API routes

### Fáze 3: Database Layer (1 den)
1. **Prisma upgrade**
   ```bash
   npm install prisma@latest
   npm install @prisma/client@latest
   ```
2. **Database migration**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
3. **Testování databázových operací**
   - User management
   - Event CRUD
   - Session management

### Fáze 4: Authentication (0.5 dne)
1. **NextAuth.js patch**
   ```bash
   npm install next-auth@latest
   ```
2. **Testování autentizace**
   - Login/logout
   - Session management
   - Azure AD integration

### Fáze 5: UI Components (1 den)
1. **React Leaflet patch**
   ```bash
   npm install react-leaflet@latest
   ```
2. **Recharts major upgrade**
   ```bash
   npm install recharts@latest
   ```
3. **Radix UI patch**
   ```bash
   npm install @radix-ui/react-slot@latest
   ```
4. **Testování UI komponent**
   - Kalendář
   - Mapa
   - Grafy
   - Tlačítka a formuláře

### Fáze 6: Final Testing (0.5 dne)
1. **Komplexní testování**
   - Všechny stránky
   - API endpoints
   - Database operations
   - Authentication flow
2. **Performance check**
   - Bundle size
   - Load times
   - Memory usage

## 🎯 PŘÍNOSY UPGRADE

### Next.js 16.2.x
- ✅ Lepší výkon App Router
- ✅ Vylepšené build procesy
- ✅ Nové development features
- ✅ Lepší error handling

### TypeScript 5.7.x
- ✅ Nové type features
- ✅ Lepší intellisense
- ✅ Vylepšené error messages
- ✅ Lepší performance

### Prisma 5.28.x
- ✅ Vylepšený query engine
- ✅ Lepší type safety
- ✅ Nové database features
- ✅ Optimalizované migrace

### Recharts 2.12.x
- ✅ Nové chart types
- ✅ Lepší performance
- ✅ Vylepšené animations
- ✅ Lepší responsivita

## ⚠️ POTENCIÁLNÍ RIZIKA

### Next.js 16.2.x
- **Riziko**: Breaking changes v App Router
- **Mitigace**: Postupný upgrade a testování

### Prisma 5.28.x
- **Riziko**: Database schema changes
- **Mitigace**: `npx prisma db push` s kontrolou

### Recharts 2.12.x
- **Riziko**: API changes v chart components
- **Mitigace**: Testování každého grafu

## 📋 CHECKLIST PRO KAŽDOU FÁZI

### Před upgradem:
- [ ] Git commit s čistým stavem
- [ ] Záloha databáze
- [ ] Screenshoty klíčových stránek

### Během upgradu:
- [ ] `npm install` bez chyb
- [ ] `npm audit fix` pro security
- [ ] Build proběhne v pořádku

### Po upgradu:
- [ ] Development server startuje
- [ ] Všechny stránky fungují
- [ ] API endpoints odpovídají
- [ ] Database operace fungují
- [ ] Authentication funguje
- [ ] Žádné console chyby

## 🚀 RYCHLÝ START

### 1. Okamžitě možné upgrady:
```bash
# Bezpečné patch upgrady
npm update next typescript
npm update @radix-ui/react-slot
npm update react-leaflet
```

### 2. Vyžadují testování:
```bash
# Major upgrady - postupně
npm install recharts@latest
npm install prisma@latest @prisma/client@latest
```

### 3. Poslední fáze:
```bash
# Authentication - nejrizikovější
npm install next-auth@latest
```

## ⏱ ČASOVÝ ODHAD
- **Fáze 1**: 0.5 dne
- **Fáze 2**: 1 den
- **Fáze 3**: 1 den
- **Fáze 4**: 0.5 dne
- **Fáze 5**: 1 den
- **Fáze 6**: 0.5 dne

**Celkem: 4.5 dny**

## 🎯 SUCCESS CRITERIA
- ✅ Všechny funkce pracují jako předtím
- ✅ Žádné regression bugs
- ✅ Výkon se zlepšil nebo zůstal stejný
- ✅ Build process funguje
- ✅ TypeScript bez chyb
- ✅ Security aktualizace aplikovány

---

**Plán vytvořen**: 15. února 2026
**Cílové datum dokončení**: 19. února 2026
**Priority**: STŘEDNÍ - Bezpečný upgrade s minimálním rizikem
