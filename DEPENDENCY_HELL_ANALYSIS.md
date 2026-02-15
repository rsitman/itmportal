# 🚨 DEPENDENCY HELL ANALYSIS - KRITICKÁ SITUACE

## 🔴 BLOKER UPGRADE: Kompletní dependency konflikt

### Problém:
**Všechny hlavní knihovny vyžadují React 19**, ale my chceme zůstat u React 18 z bezpečnostních důvodů.

## 📊 KONFLIKTNÍ MATICE

| Knihovna | Současná verze | Vyžaduje React | Problém |
|---------|----------------|----------------|---------|
| **@azure/msal-browser** | 5.1.0 | React 19 | 🔴 BLOKER |
| **@azure/msal-react** | 5.0.3 | React 19.2.1 | 🔴 BLOKER |
| **react-leaflet** | 5.0.0 | React 19 | 🔴 BLOKER |
| **@radix-ui/react-slot** | 1.1.0 | React 16-19 | 🟡 OK |
| **next-auth** | 4.24.8 | React 16-19 | 🟡 OK |

## 🔍 DETAIALNÍ ANALÝZA KONFLIKTŮ

### 1. @azure/msal-react 5.0.3
```
peer react@"^19.2.1" from @azure/msal-react@5.0.3
```
- **Problém**: Vyžaduje React 19.2.1+
- **Dopad**: Azure AD integrace nefunguje
- **Alternativy**: Downgrade na 3.x, ale pak konflikt s msal-browser 5.x

### 2. react-leaflet 5.0.0
```
peer react@"^19.0.0" from react-leaflet@5.0.0
```
- **Problém**: Vyžaduje React 19+
- **Dopad**: Mapová funkce nefunguje
- **Alternativy**: Downgrade na 4.x

### 3. @azure/msal-browser 5.1.0
```
peer @azure/msal-browser@"^4.28.2" from @azure/msal-react@3.0.26
```
- **Problém**: Kompatibilní pouze s msal-react 4.x+
- **Dopad**: Nelze downgradovat msal-react

## 🎯 MOŽNÁ ŘEŠENÍ

### Řešení A: Kompletní downgrade Azure knihoven
```bash
# Downgrade na React 18 compatible verze
npm install @azure/msal-browser@^4.0.0
npm install @azure/msal-react@^3.0.0
npm install react-leaflet@^4.0.0
```
**Rizika**: 
- 🔴 Ztráta nových Azure AD features
- 🔴 Možné breaking changes v API
- 🔴 Security updates ztraceny

### Řešení B: Přechod na React 19 (původní plán)
```bash
# Upgrade na React 19
npm install react@19 react-dom@19
```
**Rizika**:
- 🔴 NextAuth.js selže (již identifikováno)
- 🔴 React Big Calendar nekompatibilní
- 🔴 2-3 týdny vývoje

### Řešení C: Najít alternativní knihovny
```bash
# Alternativy k Azure knihovnám
npm uninstall @azure/msal-browser @azure/msal-react
# Přidat alternativu (Clerk, Lucia, atd.)
```
**Rizika**:
- 🔴 Kompletní rewrite autentizace
- 🔴 Ztráta Azure AD integrace
- 🔴 Velký development effort

### Řešení D: Zůstat u současných verzí (DOPORUČENÉ)
```bash
# Nic neměnit, zůstat u funkčního stavu
# Pouze upgradovat bezpečné knihovny:
npm install typescript@latest next-auth@latest
```
**Výhody**:
- ✅ Aplikace funguje
- ✅ Žádné riziko
- ✅ Stabilní prostředí

## 🚨 DOPORUČENÍ: ŽÁDNÝ UPGRADE

### Proč?
1. **Dependency hell** - příliš mnoho konfliktů
2. **Azure AD integrace** - klíčová funkce by selhala
3. **Mapová funkce** - důležitá feature by nefungovala
4. **Časová náročnost** - měsíce místo dnů

### Co dělat místo toho?
1. **Zůstat u současných verzí** - aplikace funguje
2. **Monitorovat situaci** - čekat na React 19 podporu
3. **Plánovat migraci** - připravit se na budoucí upgrade
4. **Dokumentovat problémy** - pro budoucí reference

## 📋 ALTERNATIVNÍ BEZPEČNÉ UPGRADE

### Pouze tyto knihovny jsou bezpečné:
```bash
# Bezpečné upgrady (žádné dependency konflikty)
npm install typescript@latest  # ✅ Bezpečné
npm install next-auth@latest    # ✅ Bezpečné
npm install prisma@5.25.0      # ✅ Bezpečné
npm install @prisma/client@5.25.0 # ✅ Bezpečné
```

### Co rozhodně neupgradovat:
- ❌ **React** - zůstat u 18.3.1
- ❌ **Next.js** - kvůli async params
- ❌ **Azure knihovny** - vyžadují React 19
- ❌ **React Leaflet** - vyžaduje React 19
- ❌ **Recharts** - downgradovali bychom

## 🎯 FINÁLNÍ ROZHODNUTÍ

### DOPORUČENÁ AKCE:
1. **Cancel upgrade plán** - příliš rizikové
2. **Zůstat u stabilního stavu** - aplikace funguje
3. **Vytvořit monitoring plán** - sledovat React 19 podporu
4. **Plánovat budoucí migraci** - až bude podpora

### ČASOVÁ OCHLAZENÍ:
- **Teď**: 0 dní (žádné změny)
- **Budoucnost**: 6-12 měsíců (čekání na podporu)

## 📊 ŠKODY A ZÍSKÁNÍ

### Pokud nic neuděláme:
- ✅ **Aplikace funguje stabilně**
- ✅ **Žádné riziko produkce**
- ❌ **Zastará technologie**
- ❌ **Nové features unavailable**

### Pokud riskneme upgrade:
- ❌ **Aplikace může selhat**
- ❌ **Týdny vývoje**
- ❌ **Produkční downtime**
- ✅ **Moderní technologie**

---

## 🎯 KONEČNÉ DOPORUČENÍ: NEUPGRADEOVAT

**Důvod**: Dependency hell je příliš komplexní a riziko převyšuje přínosy.

**Akce**: Zůstat u současných verzí a počkat na lepší podporu React 19.

**Plán**: Monitorovat situaci a připravit se na migraci až bude bezpečná.

---

**Analýza vytvořena**: 15. února 2026
**Status**: UPGRADE ZRUŠEN
**Důvod**: Komplexní dependency konflikty
