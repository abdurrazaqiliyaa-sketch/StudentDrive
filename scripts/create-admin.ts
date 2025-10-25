import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

async function createAdmin() {
  const email = "admin@studentdrive.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  
  const existingAdmin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  if (existingAdmin) {
    console.log("Admin user already exists!");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    id: randomUUID(),
    email,
    password: hashedPassword,
    role: "admin",
    firstName: "Admin",
    lastName: "User",
    emailVerified: true,
    onboardingCompleted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("✅ Admin user created successfully!");
  console.log("📧 Email:", email);
  console.log("🔑 Password:", password);
  console.log("\n⚠️  IMPORTANT: Please change this password after first login!");
  
  process.exit(0);
}

createAdmin().catch(console.error);
