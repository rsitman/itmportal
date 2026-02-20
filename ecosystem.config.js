module.exports = {
  apps: [{
    name: 'firma-portal',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/home/spravce/firma-portal',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXTAUTH_URL: 'http://portal.itman.cz:3000',
      NEXTAUTH_SECRET: 'firma-portal-production-secret-key-32chars-minimum',
      AUTH_TRUST_HOST: 'true'
    }
  }]
}
