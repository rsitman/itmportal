# Firma Portal - Firemní Manažerský Systém

## 🎯 Přehled
Next.js 16.1.6 aplikace pro správu projektů, uživatelů a kalendáře s integrací na KARAT ERP, Azure AD a Outlook Calendar. Role-based access control s PostgreSQL database.

## 🚀 Quick Start

### Development
```bash
# Clone repository
git clone <repo>
cd firma-portal

# Install dependencies
npm install

# Setup database
docker-compose up -d postgres
npx prisma db push
npx prisma db seed

# Start development
npm run dev
```

### Production
```bash
# Build and run with Docker
docker-compose up -d

# Or manual build
npm run build
npm start
```

## 📁 Projektová Struktura
- `/src/app` - Next.js App Router pages a API routes
- `/src/components` - React komponenty
- `/src/lib` - Utility knihovny a services
- `/src/types` - TypeScript definice
- `/prisma` - Database schema a migrace
- `/docs` - Technická dokumentace

## 🔧 Konfigurace

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/portal?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-32-chars-minimum"
NEXTAUTH_URL="http://localhost:3000"

# Azure AD (volitelné)
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""

# ERP System
ERP_API_URL="http://itmsql01:44612"

# Production
NODE_ENV="production"
```

## 🌐 API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js authentication
- `GET /api/auth/session` - Current session info

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Projects
- `GET /api/projects` - List projects from KARAT
- `GET /api/projects/[id]` - Project detail
- `GET /api/projects/[id]/team` - Project team members
- `GET /api/projects/[id]/extcomps` - External components

### Calendar
- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `GET /api/outlook-calendar` - Outlook calendar integration
- `GET /api/erp-calendar` - ERP calendar sync
- `POST /api/erp-calendar/sync` - Sync ERP events

### Hardware/Software Management
- `GET /api/hwsw/hardware` - Hardware assets from ERP
- `GET /api/hwsw/software` - Software licenses from ERP
- `GET /api/hwsw/network` - Network configuration from ERP

### KARAT Integration
- `GET /api/karat/projects` - Projects from KARAT ERP
- `GET /api/karat/service-projects` - Service projects
- `GET /api/karat/patch-modules` - Patch modules
- `GET /api/karat/patch-modules-by-company` - Company-specific modules

### System
- `GET /api/health` - Health check for monitoring
- `GET /api/user-info` - Current user info
- `GET /api/user/preferences` - User preferences

## 🔐 Security

### Authentication & Authorization
- **NextAuth.js** pro secure session management
- **Role-based Access Control**: ADMIN, IT, USER roles
- **Azure AD Integration** pro enterprise users
- **Session Security** s JWT tokens a proper expiration

### Security Features
- PostgreSQL s Prisma ORM (SQL injection protection)
- Environment variables pro sensitive data
- Rate limiting na API endpoints
- CORS protection
- Input validation

## 📊 Funkce

### Dashboard
- Přehled statistik a rychlých akcí
- Real-time data z ERP systémů
- Personalizovaný obsah podle role

### Správa Uživatelů
- CRUD operace s rolěmi
- Azure AD synchronizace
- Activity logy a audit trail

### Projekty
- Integrace s KARAT ERP systémem
- Team management
- External components tracking
- Project status reporting

### Kalendář
- Synchronizace s Outlook Calendar
- ERP event integrace
- Multi-calendar support
- Event filtering a search

### Reporty a Grafy
- Database size monitoring
- Project statistics
- Resource utilization
- Interactive charts s Recharts

### Mapy
- Zobrazení poboček a projektů
- GPS integrace
- Geografické reporting

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.1.6** - React framework s App Router
- **React 18.3.1** - UI framework
- **TypeScript 5.x** - Type safety
- **TailwindCSS 4.x** - CSS framework
- **Radix UI** - Component library

### Backend
- **Next.js API Routes** - Serverless API
- **Prisma ORM** - Database management
- **PostgreSQL 16** - Primary database
- **NextAuth.js 4.24** - Authentication

### Integrations
- **Azure AD** - Enterprise authentication
- **KARAT ERP** - Business system integration
- **Outlook Calendar** - Calendar synchronization
- **Microsoft Graph** - Office 365 integration

### UI Libraries
- **React Big Calendar** - Calendar component
- **Recharts 3.7.0** - Charting library
- **React Leaflet** - Map components
- **Lucide Icons** - Icon system

## 📝 Development Notes

### Best Practices
- Používejte `npx prisma studio` pro database management
- Console logy jsou pouze v development mode (pomocí logger utility)
- Všechny API routes vyžadují authentication
- Azure AD integrace je volitelná

### Performance
- Bundle size optimalizace s dynamic imports
- Database queries s proper indexing
- Response caching pro static data
- Lazy loading pro heavy components

### Monitoring
- Health check endpoint: `/api/health`
- Application logging s structured logs
- Error tracking a reporting
- Performance metrics

## 🚀 Deployment

### Docker Production
```bash
# Build image
docker build -t firma-portal .

# Run with database
docker-compose up -d

# Check health
curl http://localhost:3000/api/health
```

### Environment Setup
- **Production**: PostgreSQL s proper connection string
- **Development**: Docker compose s PostgreSQL
- **Testing**: In-memory database pro unit tests

### Health Monitoring
```bash
# Health check
curl http://localhost:3000/api/health

# Expected response
{
  "status": "healthy",
  "services": {
    "database": { "status": "healthy" },
    "erp": { "status": "healthy" }
  }
}
```

## 🔧 Troubleshooting

### Common Issues
1. **Database connection**: Zkontrolujte DATABASE_URL
2. **Authentication**: Ujistěte se že NEXTAUTH_SECRET je 32+ znaků
3. **ERP integration**: Ověřte ERP_API_URL dostupnost
4. **Azure AD**: Zkontrolujte client credentials

### Performance Tips
- Používejte `npm run build` pro production build
- Monitorujte memory usage s `/api/health`
- Cache ERP responses pro lepší performance
- Optimalizujte database queries

## 📞 Support

### Documentation
- **API docs**: `/docs` složka
- **Database schema**: `prisma/schema.prisma`
- **Type definitions**: `src/types/`

### Contact
- **Issues**: GitHub repository
- **Support**: IT administrátor
- **Emergency**: System administrator

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-15  
**Node.js**: 20+  
**Database**: PostgreSQL 16+
