import { storage } from "./storage";
import { hashPassword } from "./auth";

async function seedAdmin() {
  try {
    const existingAdmin = await storage.getUserByEmail("mastercraft@gmail.com");
    
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    const hashedPassword = await hashPassword("mastercraft80");
    
    const admin = await storage.createUser({
      email: "mastercraft@gmail.com",
      password: hashedPassword,
      firstName: "Master",
      lastName: "Craft",
      role: "admin",
      emailVerified: true,
      onboardingCompleted: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });

    console.log("Admin user created successfully:", admin.email);
    console.log("Email: mastercraft@gmail.com");
    console.log("Password: mastercraft80");
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
