module.exports = {
  apps: [{
    name: 'firma-portal',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/home/spravce/firma-portal',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXTAUTH_URL: 'https://portal.itman.cz',
      NEXTAUTH_SECRET: 'Pid9zVWY8UQzpzj9fh2yw0vfp141EK3U/hg8bKLWHFo=',
      AUTH_TRUST_HOST: 'true',
      DATABASE_URL: 'postgresql://portal:DBportal1@localhost:5433/portal?schema=public',
      KARAT_API_URL: 'http://itmsql01:44612/web',
      ERP_API_URL: 'http://itmsql01:44612/web',
      AZURE_AD_CLIENT_ID: '82b69964-c6a5-4baa-8968-2fced67ee6b1',
      AZURE_AD_CLIENT_SECRET: 'REDACTED_SECRET',
      AZURE_AD_TENANT_ID: 'e5f151fa-45e9-4ec0-93a0-a03b147a6ec5',
    }
  }]
}
