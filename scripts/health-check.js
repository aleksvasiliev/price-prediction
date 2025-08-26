// scripts/health-check.js
const http = require('http');

function checkHealth(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'GET' }, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001/health';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost';

  console.log('🔍 Checking application health...');

  const backendHealthy = await checkHealth(backendUrl);
  const frontendHealthy = await checkHealth(frontendUrl);

  console.log(`Backend (${backendUrl}): ${backendHealthy ? '✅' : '❌'}`);
  console.log(`Frontend (${frontendUrl}): ${frontendHealthy ? '✅' : '❌'}`);

  if (backendHealthy && frontendHealthy) {
    console.log('🎉 All services are healthy!');
    process.exit(0);
  } else {
    console.log('❌ Some services are unhealthy');
    process.exit(1);
  }
}

main().catch(console.error);
