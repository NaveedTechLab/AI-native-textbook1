import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import pg from "pg";

export const auth = betterAuth({
  database: new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  }),

  // Email + Password authentication
  emailAndPassword: {
    enabled: true,
  },

  // Social OAuth providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  // JWT plugin for token-based auth (FastAPI can validate these)
  plugins: [
    jwt({
      jwt: {
        issuer: process.env.BETTER_AUTH_URL || "http://localhost:3100",
        audience: process.env.BETTER_AUTH_URL || "http://localhost:3100",
        expirationTime: "1h",
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          softwareBackground: (user as any).softwareBackground || "",
          hardwareBackground: (user as any).hardwareBackground || "",
          experienceLevel: (user as any).experienceLevel || "Intermediate",
        }),
      },
    }),
  ],

  // Custom user fields for personalization (background questions at signup)
  user: {
    additionalFields: {
      softwareBackground: {
        type: "string",
        required: false,
        defaultValue: "",
        input: true,
      },
      hardwareBackground: {
        type: "string",
        required: false,
        defaultValue: "",
        input: true,
      },
      experienceLevel: {
        type: "string",
        required: false,
        defaultValue: "Intermediate",
        input: true,
      },
    },
  },

  // Base URL for callbacks
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3100",

  // Trust proxy headers in production
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.FRONTEND_URL || "",
  ].filter(Boolean),
});
