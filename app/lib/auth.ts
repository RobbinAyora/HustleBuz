import { sign, verify, JwtPayload, Secret, SignOptions } from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("❌ Missing JWT_SECRET in .env.local");
}

export const signToken = (payload: Record<string, unknown>) => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

  const options: SignOptions = {
    expiresIn, // ✅ Now correctly typed
  };

  return sign(payload, JWT_SECRET as Secret, options);
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = verify(token, JWT_SECRET as Secret);
    if (typeof decoded === "string") return null;
    return decoded as JwtPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
};









