# Technology Upgrade Risk Analysis

## 🚨 KRITICKÁ ZJIŠTĚNÍ

### 📊 RIZIKOVÁ MATICE UPGRADŮ

| Technologie | Současná → Cílová | Riziko | Dopad | Akce |
|-------------|-------------------|--------|-------|------|
| **Recharts** | 3.7.0 → 2.12.x | 🔴 VYSOKÉ | MAJOR | ZVAŽOVAT VYPNUTÍ |
| **Next.js** | 16.1.6 → 16.2.x | 🟡 STŘEDNÍ | MEDIUM | CODMOD POTŘEBA |
| **Prisma** | 5.22.0 → 5.28.x | 🟡 STŘEDNÍ | MEDIUM | POSTUPNÝ UPGRADE |
| **TypeScript** | 5.x → 5.7.x | 🟢 NÍZKÉ | LOW | BEZPEČNÝ |
| **NextAuth.js** | 4.24.8 → 4.24.11 | 🟢 NÍZKÉ | LOW | BEZPEČNÝ |

---

## 🔴 VYSOKÉ RIZIKO: RECHARTS

### Problém:
- **Downgrade z 3.7.0 na 2.12.x** (opačný směr!)
- **Breaking changes v 3.0** - kompletní rewrite
- Naše verze 3.7.0 je NOVĚJŠÍ než cílová 2.12.x

### Breaking Changes v Recharts 3.0:
1. **CategoricalChartState** - completely removed
2. **Customized component** - no longer receives internal state
3. **Internal props** - removed (activeIndex, points, payload)
4. **Dependencies** - removed recharts-scale, react-smooth

### Naše použití:
```typescript
// src/app/grafy/db-size/page.tsx - používáme Recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
```

### DOPORUČENÍ: **NEUPGRADEOVAT RECHARTS**
- Zůstat u verze 3.7.0
- Je stabilní a funguje
- Downgrade by způsobil ztrátu funkcí

---

## 🟡 STŘEDNÍ RIZIKO: NEXT.JS 16.2

### Breaking Changes:
1. **Async Request APIs** - synchroní přístup odstraněn
2. **Turbopack by default** - nový build systém
3. **Node.js 20.9+** minimum requirement

### Naše problematické soubory:
```typescript
// API routes používají params - NUTNO PŘEPSAT
{ params }: { params: Promise<{ id: string }> }

// Client components používají searchParams - OK
const searchParams = useSearchParams() // ✅ funguje
```

### Required Changes:
```typescript
// PŘED (Next.js 16.1)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const projectCode = params.id
}

// PO (Next.js 16.2)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const projectCode = resolvedParams.id
}
```

### Postižené soubory (8 souborů):
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/events/[id]/route.ts`
- `src/app/api/projects/[id]/extcomps/route.ts`
- Další API routes s dynamickými parametry

### ŘEŠENÍ:
- **Automatický codemod**: `npx @next/codemod@canary upgrade latest`
- **Manuální opravy**: 8 souborů s params

---

## 🟡 STŘEDNÍ RIZIKO: PRISMA 5.28

### Breaking Changes v Prisma 6.0:
1. **Node.js 18.18.0+** minimum
2. **TypeScript 5.1.0+** minimum
3. **Buffer → Uint8Array** conversion
4. **NotFoundError** removed
5. **New keywords**: async, await, using

### Naše použití:
```typescript
// Prisma schema - žádné problematické patterny
model User {
  id               String            @id @default(cuid())
  // ... standard fields
}
```

### Database operace:
```typescript
// Naše kód - bezpečný
const user = await prisma.user.findUnique({
  where: { email: credentials.email as string }
})
```

### ŘEŠENÍ:
- **Postupný upgrade**: 5.22.0 → 5.28.x (přeskočit 6.0)
- **Žádné schema changes** potřeba
- **Test database operations**

---

## 🟢 NÍZKÉ RIZIKO: TYPESCRIPT 5.7

### Changes:
- Nové type features
- Lepší error messages
- Performance improvements

### Naše použití:
```typescript
// Standard TypeScript - bez problémů
interface UserPreferences {
  rememberLogin: boolean
  sessionPreference: SessionPreference
}
```

### ŘEŠENÍ:
- **Bezpečný upgrade**
- **Žádné code changes** potřeba

---

## 🟢 NÍZKÉ RIZIKO: NEXTAUTH.JS 4.24.11

### Changes:
- Pouze patch verze
- Security fixes
- Minor improvements

### ŘEŠENÍ:
- **Bezpečný patch upgrade**
- **Žádné breaking changes**

---

## 🎯 UPRAVENÝ UPGRADE PLAN

### Fáze 1: Bezpečné upgrady (0.5 dne)
```bash
# Nízké riziko
npm install typescript@latest
npm install next-auth@latest
```

### Fáze 2: Next.js 16.2 (1 den)
```bash
# Střední riziko - potřebuje codemod
npm install next@latest
npx @next/codemod@canary upgrade latest
# Manuální opravy 8 API souborů
```

### Fáze 3: Prisma 5.28 (0.5 dne)
```bash
# Střední riziko - postupný
npm install prisma@5.28.0 @prisma/client@5.28.0
npx prisma generate
npx prisma db push
```

### Fáze 4: Testování (0.5 dne)
- API routes test
- Database operations test
- Frontend functionality test

### CO NEUPGRADEOVAT:
- **Recharts** - zůstat u 3.7.0 (funkční a novější)
- **React Big Calendar** - zůstat u 1.19.4
- **React Leaflet** - pouze pokud potřeba

---

## 📈 PŘÍNOSY vs RIZIKA

### PŘÍNOSY:
- ✅ **Next.js 16.2**: Lepší výkon, Turbopack
- ✅ **TypeScript 5.7**: Nové features
- ✅ **Prisma 5.28**: Vylepšený engine
- ✅ **NextAuth 4.24.11**: Security fixes

### RIZIKA:
- ⚠️ **Next.js**: 8 souborů k opravě
- ⚠️ **Prisma**: Database compatibility check
- ⚠️ **Build process**: Turbopack změny

### ČASOVÁ NÁROČNOST:
- **Původní plán**: 4.5 dny
- **Nový plán**: 2.5 dny
- **Úspora**: 2 dny díky vynechání Recharts

---

## 🎯 FINÁLNÍ DOPORUČENÍ

### PROVÉST:
1. **TypeScript 5.7** - bezpečný
2. **NextAuth.js 4.24.11** - bezpečný
3. **Next.js 16.2** - s codemod a manual opravami
4. **Prisma 5.28** - postupný upgrade

### NEPROVÉST:
1. **Recharts** - zůstat u 3.7.0
2. **React Big Calendar** - zůstat u 1.19.4
3. **React Leaflet** - pouze pokud problém

### PRIORITY:
1. **HIGH**: TypeScript, NextAuth.js
2. **MEDIUM**: Next.js, Prisma
3. **LOW**: UI knihovny (pouze pokud potřeba)

---

**Analýza dokončena**: 15. února 2026
**Plánováno zahájení**: Ihned
**Odhadovaný čas**: 2.5 dny
**Riziko**: STŘEDNÍ (spravovatelné)
