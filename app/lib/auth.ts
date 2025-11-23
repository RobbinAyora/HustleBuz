import { sign, verify, JwtPayload, Secret, SignOptions } from "jsonwebtoken";

// Force TS to treat this as DEFINITELY a string after validation
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("❌ Missing JWT_SECRET in .env.local");
}
export const JWT_SECRET: Secret = secret; // <=== FIX


export const signToken = (payload: Record<string, unknown>) => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

  const options: SignOptions = { expiresIn };

  return sign(payload, JWT_SECRET, options); // No more red underline
};


export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = verify(token, JWT_SECRET);

    if (typeof decoded === "string") return null;

    return decoded as JwtPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
};









