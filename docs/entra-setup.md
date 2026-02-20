# MS Entra ID Integrace - Návod

## 🚀 Kroky pro nastavení

### 1. Vytvoření App Registration v Azure Portal

1. **Přihlaste se do Azure Portal:**
   - Jděte na https://portal.azure.com
   - Přihlaste se svým M365 účtem

2. **Vytvořte novou App Registration:**
   - Vyhledejte "App registrations"
   - Klikněte na "New registration"
   - **Name:** `Firma Portal`
   - **Supported account types:** `Accounts in this organizational directory only`
   - **Redirect URI:** `http://localhost:3000/api/auth/callback/azure-ad`
   - Klikněte "Register"

3. **Zkopírujte si údaje:**
   - **Application (client) ID** → `AZURE_AD_CLIENT_ID`
   - **Directory (tenant) ID** → `AZURE_AD_TENANT_ID`

4. **Vytvořte Client Secret:**
   - Jděte do "Certificates & secrets"
   - Klikněte "New client secret"
   - **Description:** `Firma Portal Secret`
   - **Expires:** `12 months`
   - Zkopírujte **Value** (ne Secret ID) → `AZURE_AD_CLIENT_SECRET`

### 2. Nastavení API oprávnění

1. **Přidejte Microsoft Graph permissions:**
   - Jděte do "API permissions"
   - Klikněte "Add a permission"
   - Vyberte "Microsoft Graph"
   - Vyberte "Delegated permissions"
   - Přidejte tyto permissiony:
     - `User.Read` - Základní informace o uživateli
     - `email` - Emailová adresa
     - `profile` - Profilové informace
     - `openid` - OpenID connect

2. **Grant admin consent:**
   - Klikněte na "Grant admin consent for [vaše doména]"

### 3. Konfigurace prostředí

Vytvořte `.env.local` soubor (nebo upravte stávající):

```env
# MS Entra ID Configuration
AZURE_AD_CLIENT_ID="váš-client-id"
AZURE_AD_CLIENT_SECRET="váš-client-secret"
AZURE_AD_TENANT_ID="váš-tenant-id"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="náhodný-tajný-klíč-min-32-znaků"
```

### 4. Integrace do aplikace

Aplikace už má připravenou integraci v:
- `src/lib/entra-id.ts` - Konfigurace Entra ID
- `src/lib/auth.ts` - NextAuth nastavení

Po nastavení .env.local se automaticky aktivuje Azure AD provider.

## 🧪 Testování

1. **Spusťte aplikaci:**
   ```bash
   npm run dev
   ```

2. **Test přihlášení:**
   - Jděte na http://localhost:3000/login
   - Uvidíte nové tlačítko "Sign in with Azure Active Directory"
   - Klikněte a přihlaste se svým M365 účtem

## 🔧 Troubleshooting

### Common Issues:

1. **AADSTS50011: Redirect URI mismatch**
   - Zkontrolujte že Redirect URI v Azure přesně odpovídá:
   - `http://localhost:3000/api/auth/callback/azure-ad`

2. **AADSTS65001: User consent required**
   - Ujistěte se že jste udělili "Grant admin consent"

3. **CORS issues**
   - Přidejte `http://localhost:3000` do "Redirect URIs" v App Registration

### Debug logy:
Aplikace má zapnuté debug logy pro NextAuth, uvidíte detaily v konzoli.

## 📝 Další kroky (volitelné)

### 1. Mapování rolí
Pro mapování Azure AD skupin na lokální role přidejte do `auth.ts`:

```typescript
// V callbacks.session
if (token.groups?.includes('Admins')) {
  session.user.role = 'ADMIN'
}
```

### 2. Automatická registrace uživatelů
Uživatelé se automaticky zaregistrují při prvním přihlášení.

### 3. Production nastavení
Pro produkci změňte:
- Redirect URI na produkční URL
- NEXTAUTH_URL na produkční doménu
- Přidejte HTTPS

## 🎯 Hotovo!

Po těchto krocích bude mít vaše aplikace plně funkční MS Entra ID integraci s:
- Jednoduchým přihlášením přes M365 účet
- Automatickou registrací uživatelů
- Bezpečným OAuth 2.0 flow
- Podporou pro role a permissions
