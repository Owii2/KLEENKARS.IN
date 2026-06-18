import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AuthUser, verifyToken } from "@/lib/auth";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function requireRoles(allowedRoles: string[]) {
  const user = await getCurrentUser();

  if (!user || !allowedRoles.includes(user.role)) {
    return {
      user: null,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { user, response: null };
}
