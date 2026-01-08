import 'dotenv/config';
import app from './app';
import prisma from './config/database';

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await prisma.$connect();
    console.log('✓ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ API endpoints available at http://localhost:${PORT}/api/search`);
    });
  } catch (error) {
    console.error('✗ Startup failed:', error);
    process.exit(1);
  }
}

main();

