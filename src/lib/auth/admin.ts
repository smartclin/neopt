// scripts/seed-admin.ts
import { APIError } from "better-auth";

import { auth } from "../auth"; // Your auth config

async function seedAdmin() {
  try {
    const newUser = await auth.api.createUser({
      body: {
        email: "clinysmar@gmail.com",
        password: "HealthF26",
        name: "Hazem Ali",
        role: "admin", // Your custom role - must match your ac/roles config
        data: {
          // Additional custom fields (optional)
          address: null,
          phone: null,
          clinicId: null,
        },
      },
    });

    console.log("Admin user created:", newUser.user.id);
  } catch (error) {
    if (error instanceof APIError) {
      console.error("API Error:", error.message, error.status);
    } else {
      console.error("Unexpected error:", error);
    }
    process.exit(1);
  }
}

void seedAdmin();
