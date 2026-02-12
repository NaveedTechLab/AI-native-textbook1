/**
 * Better-Auth React client for the AI-native textbook platform.
 * Handles signup, login, OAuth, and session management via Better-Auth.
 */
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

// Determine auth service URL based on environment
const AUTH_BASE_URL =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? (window.__AUTH_URL__ || "https://naveed247365-ai-textbook-auth.hf.space")
    : "http://localhost:3100";

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [jwtClient()],
});

// Export individual methods for convenience
export const {
  useSession,
  signIn,
  signUp,
  signOut,
} = authClient;

/**
 * Get JWT token for API calls to FastAPI backend.
 * Stores token in localStorage for backward compatibility with existing chatbot/API code.
 */
export async function getAuthToken() {
  try {
    const { data, error } = await authClient.token();
    if (data?.token) {
      localStorage.setItem("user_token", data.token);
      return data.token;
    }
  } catch (e) {
    // Fallback to localStorage token
  }
  return localStorage.getItem("user_token");
}

/**
 * Sign in with email and password.
 * Stores JWT token in localStorage for backward compatibility.
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await authClient.signIn.email({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message || "Login failed");
  }

  // Get JWT token for FastAPI backend calls
  if (data?.token) {
    localStorage.setItem("user_token", data.token);
    localStorage.setItem("user_email", email);
  } else {
    // Fetch JWT token via the jwt plugin
    const tokenResult = await authClient.token();
    if (tokenResult.data?.token) {
      localStorage.setItem("user_token", tokenResult.data.token);
      localStorage.setItem("user_email", email);
    }
  }

  window.dispatchEvent(new Event("authChange"));
  return data;
}

/**
 * Sign up with email, password, and background questions.
 */
export async function signUpWithEmail({
  email,
  password,
  name,
  softwareBackground = "",
  hardwareBackground = "",
  experienceLevel = "Intermediate",
}) {
  const { data, error } = await authClient.signUp.email({
    email,
    password,
    name,
    softwareBackground,
    hardwareBackground,
    experienceLevel,
  });

  if (error) {
    throw new Error(error.message || "Registration failed");
  }

  // Get JWT token for FastAPI backend calls
  const tokenResult = await authClient.token();
  if (tokenResult.data?.token) {
    localStorage.setItem("user_token", tokenResult.data.token);
    localStorage.setItem("user_email", email);
  }

  window.dispatchEvent(new Event("authChange"));
  return data;
}

/**
 * Sign in with Google OAuth.
 */
export async function signInWithGoogle() {
  const { data, error } = await authClient.signIn.social({
    provider: "google",
  });

  if (error) {
    throw new Error(error.message || "Google login failed");
  }

  return data;
}

/**
 * Sign out and clear localStorage.
 */
export async function logOut() {
  try {
    await authClient.signOut();
  } catch (e) {
    // Continue with local cleanup even if server signout fails
  }
  localStorage.removeItem("user_token");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_profile");
  window.dispatchEvent(new Event("authChange"));
}
