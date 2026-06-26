import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const pathname = req.nextUrl.pathname;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const user = verifyToken(token) as any;

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    pathname.startsWith("/manager") &&
    user.role !== "manager" &&
    user.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    pathname.startsWith("/staff") &&
    user.role !== "staff" &&
    user.role !== "supervisor" &&
    user.role !== "manager" &&
    user.role !== "admin" &&
    user.role !== "washer" &&
    user.role !== "detailer" &&
    user.role !== "pickup_driver" &&
    user.role !== "cashier"
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/staff/:path*"],
};
