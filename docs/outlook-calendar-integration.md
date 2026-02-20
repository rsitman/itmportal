# Outlook Kalendář Integrace

Tento dokument popisuje, jak nastavit a používat integraci s Microsoft Outlook kalendářem.

## Požadavky

### 1. Instalace balíčků

```bash
npm install @microsoft/microsoft-graph-client @microsoft/microsoft-graph-types @azure/msal-browser @azure/msal-react
```

### 2. Environment proměnné

Přidejte do `.env.local` souboru:

```env
# Microsoft Entra ID konfigurace
AZURE_AD_CLIENT_ID=your_client_id_here
AZURE_AD_CLIENT_SECRET=your_client_secret_here
AZURE_AD_TENANT_ID=your_tenant_id_here

# Microsoft Graph API permissions
GRAPH_API_SCOPES="Calendars.ReadWrite,User.Read,offline_access"
```

### 3. Azure AD Application nastavení

1. Přejděte na [Azure Portal](https://portal.azure.com)
2. Vytvořte novou App Registration
3. Nastavte redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
4. Přidejte API permissions:
   - `Calendars.ReadWrite`
   - `User.Read`
   - `offline_access`
5. Udělte admin consent

## Funkcionalita

### Vytvořené komponenty:

1. **API Endpoint** (`/api/outlook-calendar`)
   - GET: Načte události z Outlook kalendáře
   - POST: Vytvoří novou událost v Outlooku

2. **OutlookCalendarService** (`/src/lib/outlook-calendar.ts`)
   - Služba pro synchronizaci s Outlook kalendářem
   - Podpora dvousměrné synchronizace
   - Lokální storage pro nastavení integrace

3. **Rozšířený Event interface**
   - Přidána pole pro Outlook synchronizaci
   - `outlookId`, `syncedWithOutlook`, `lastSyncedAt`, `location`

4. **UI Komponenty**
   - Panel pro povolení/zakázání synchronizace
   - Tlačítko pro manuální synchronizaci
   - Pole pro zadání místa konání

## Použití

### 1. Povolení synchronizace

V kalendářové komponentě:
1. Klikněte na "Povolit" v Outlook synchronizačním panelu
2. Synchronizace se automaticky spustí

### 2. Vytváření událostí

- Pokud je synchronizace povolena, nové události se automaticky vytvoří i v Outlooku
- Události obsahují informace o synchronizaci

### 3. Ruční synchronizace

- Klikněte na tlačítko "Synchronizovat" pro manuální sync
- Synchronizuje události z posledních 7 dní a následujících 30 dní

## Architektura

```
src/
├── app/
│   ├── api/
│   │   └── outlook-calendar/
│   │       └── route.ts          # API endpoint pro Graph API
│   └── calendar/
│       └── page.tsx              # Kalendář komponenta s UI
├── lib/
│   ├── entra-id.ts               # Entra ID konfigurace
│   └── outlook-calendar.ts       # Synchronizační služba
└── types/
    └── calendar.ts               # Event interface
```

## Další kroky

1. **Dvousměrná synchronizace**: Implementace plné synchronizace (změny z Outlooku → lokální DB)
2. **Error handling**: Lepší zpracování chyb a notifikace
3. **Batch operations**: Optimalizace pro velký počet událostí
4. **Recurring events**: Podpora opakujících se událostí
5. **Multiple calendars**: Podpora více kalendářů

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Zkontrolujte access token a permissions
2. **400 Bad Request**: Ověřte formát dat a časové zóny
3. **CORS errors**: Ujistěte se, že redirect URI je správně nastaveno

### Debugging:

- Konzole logy obsahují detaily o synchronizaci
- Network tab pro kontrolu API volání
- Azure Portal logs pro debugging Graph API
