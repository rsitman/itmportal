# Azure AD Permissions - Podrobný návod

## 📍 Kde nastavit permissions

### 1. **Přihlaste se do Azure Portal**
- URL: https://portal.azure.com
- Přihlaste se svým M365 účtem s admin právy

### 2. **Najděte vaši App Registration**
- V horním vyhledávacím poli napište: `App registrations`
- Klikněte na "App registrations"
- Najděte a klikněte na vaši "Firma Portal" aplikaci

### 3. **Přidání Microsoft Graph permissions**

#### **Krok A: Přidání permission**
1. **V levém menu** klikněte na **"API permissions"**
2. Klikněte na tlačítko **"+ Add a permission"**
3. V novém okně vyberte **"Microsoft Graph"**
4. Vyberte **"Delegated permissions"** (ne Application permissions!)

#### **Krok B: Vyhledání konkrétních permissions**

**Pro `User.Read`:**
- Do vyhledávacího pole napište: `User.Read`
- Zaškrtněte checkbox u `User.Read`
- Klikněte "Add permissions"

**Pro `email`:**
- Do vyhledávacího pole napište: `email`
- Zaškrtněte checkbox u `email`
- Klikněte "Add permissions"

**Pro `profile`:**
- Do vyhledávacího pole napište: `profile`
- Zaškrtněte checkbox u `profile`
- Klikněte "Add permissions"

**Pro `openid`:**
- Do vyhledávacího pole napište: `openid`
- Zaškrtněte checkbox u `openid`
- Klikněte "Add permissions"

### 4. **Udělení souhlasu (Grant Admin Consent)**

**DŮLEŽITÉ:** Bez tohoto kroku nebude přihlášení fungovat!

1. **V "API permissions" stránce** uvidíte přidané permissions
2. Nahoře klikněte na tlačítko **"Grant admin consent for [vaše doména]"**
3. Potvrďte dialog "Yes"
4. Počkejte až se status změní na **"Granted"** u všech permissions

## 📋 Jak má vypadat výsledek

Po úspěšném nastavení byste měli vidět:

| Permission | Type | Status |
|------------|------|---------|
| User.Read | Delegated | Granted ✓ |
| email | Delegated | Granted ✓ |
| profile | Delegated | Granted ✓ |
| openid | Delegated | Granted ✓ |

## 🚨 Časté problémy a řešení

### **Problém: "Consent not granted"**
- **Řešení:** Klikněte na "Grant admin consent" - musí to udělat admin!

### **Problém: "Invalid scope"**
- **Řešení:** Ujistěte se že používáte "Delegated permissions" ne "Application permissions"

### **Problém: "Access denied"**
- **Řešení:** Zkontrolujte že máte admin práva v tenantovi

### **Problém: Redirect URI mismatch**
- **Řešení:** V "Authentication" sekci přidejte:
  - `http://localhost:3000/api/auth/callback/azure-ad`
  - Pro produkci: `https://vasedomena.cz/api/auth/callback/azure-ad`

## 🔄 Testování permissions

### **Krok 1: Microsoft Graph Explorer**
1. Jděte na: https://developer.microsoft.com/en-us/graph/graph-explorer
2. Přihlaste se
3. Zkuste volání:
   - `GET https://graph.microsoft.com/v1.0/me`
   - Mělo by vrátit vaše uživatelské data

### **Krok 2: Test v aplikaci**
1. Spusťte `npm run dev`
2. Jděte na `http://localhost:3000/login`
3. Klikněte na "Sign in with Azure Active Directory"
4. Mělo by fungovat bez chyb

## 📱 Mobilní/ Desktop aplikace

Pokud plánujete i mobilní/desktop, přidejte i tyto redirect URIs:
- `msauth://com.yourapp/callback`
- `http://localhost:3000/api/auth/callback/azure-ad`

## ✅ Kontrolní seznam před testem

- [ ] App Registration vytvořena
- [ ] Client ID zkopírováno
- [ ] Tenant ID zkopírováno  
- [ ] Client Secret vytvořen a zkopírován
- [ ] Redirect URI nastaveno
- [ ] Všechny 4 permissions přidány
- [ ] Admin consent udělen
- [ ] Status všech permissions je "Granted"
- [ ] .env.local soubor vyplněn

## 🎯 Hotovo!

Po těchto krocích bude MS Entra ID plně funkční. Pokud narazíte na problémy, podívejte se do browser console na detaily chyby.
