import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { auth } from "./auth";

const app = new Hono();

// CORS configuration for frontend access
app.use(
  "/*",
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.FRONTEND_URL || "",
    ].filter(Boolean),
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "better-auth" });
});

// Mount Better-Auth handler on /api/auth/*
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

// Start server
const port = parseInt(process.env.PORT || "3100", 10);

console.log(`Better-Auth service starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Better-Auth service running at http://localhost:${port}`);
console.log(`Auth endpoints available at http://localhost:${port}/api/auth/*`);
console.log(`JWKS endpoint: http://localhost:${port}/api/auth/jwks`);
