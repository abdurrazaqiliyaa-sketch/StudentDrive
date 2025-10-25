import { db } from './server/db';
import { users } from './shared/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function createAdmin() {
  const email = 'admin@drive.com';
  const password = 'pass@drive123';
  
  // Check if admin already exists
  const existingAdmin = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existingAdmin.length > 0) {
    console.log('Admin user already exists');
    process.exit(0);
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create admin user
  await db.insert(users).values({
    email,
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    emailVerified: true,
    onboardingCompleted: true,
  });
  
  console.log('Admin user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('Error creating admin:', err);
  process.exit(1);
});
