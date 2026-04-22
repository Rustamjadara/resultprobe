// lib/auth.ts
import { SignJWT, jwtVerify } from "jose";

const SECRET = () => new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);
const PIN = () => process.env.LOGIN_PIN ?? "@rustam";
const COOKIE = "jnv_auth";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export async function signToken(): Promise<string> {
  return new SignJWT({ auth: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET());
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET());
    return true;
  } catch { return false; }
}

export function checkPin(pin: string): boolean {
  return pin === PIN();
}

export { COOKIE, MAX_AGE };
