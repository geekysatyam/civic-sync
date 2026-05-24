import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { runAdminSeed, resetAdminData } from './adminSeed.js';
import { runBulkSeed, resetBulkData } from './bulkSeed.js';

const argv = process.argv;
const FULL_RESET = argv.includes('--reset');
const RESET_ADMIN = argv.includes('--reset-admin');
const RESET_USER = argv.includes('--reset-user');
const ADMIN_ONLY = argv.includes('--admin-only');
const USER_ONLY = argv.includes('--user-only');

async function dropAll() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('No database connection');
  const cols = await db.listCollections().toArray();
  for (const c of cols) {
    await db.dropCollection(c.name);
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required. Set your MongoDB Atlas connection string in backend/.env');
  }
  await connectDb(uri);

  if (FULL_RESET) {
    await dropAll();
    console.log('Database fully reset.');
  } else {
    if (RESET_ADMIN) {
      await resetAdminData();
      console.log('Admin-related collections cleared.');
    }
    if (RESET_USER) {
      await resetBulkData();
      console.log('User/citizen-related collections cleared.');
    }
  }

  if (USER_ONLY && !ADMIN_ONLY) {
    await runBulkSeed();
  } else if (ADMIN_ONLY && !USER_ONLY) {
    await runAdminSeed();
  } else {
    await runAdminSeed();
    await runBulkSeed();
  }

  console.log('\nDone. Commands:');
  console.log('  npm run seed              — full database (use with -- --reset to wipe all)');
  console.log('  npm run seed:admin        — departments, mayor/state, rewards, stories, spots');
  console.log('  npm run seed:user         — bulk citizens, issues, articles, contractors (needs admin first)');
  console.log('  npm run seed:admin -- --reset-admin');
  console.log('  npm run seed:user -- --reset-user');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
