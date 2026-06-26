import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken, COOKIE_MAX_AGE } from '@/lib/jwt';
import { createRefreshToken, sanitizeIdentifier } from '@/lib/auth';
import { comparePassword } from '@/lib/hash';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier: rawIdentifier, password } = body; // identifier = email or phone
    if (!rawIdentifier || !password) {
      return NextResponse.json({ success: false, message: 'identifier and password required' }, { status: 400 });
    }

    const identifier = sanitizeIdentifier(rawIdentifier);

    // Try to find a customer first
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { id: identifier },
          { email: identifier },
          { phoneNumber: identifier }
        ]
      },
    });

    if (customer) {
      let ok = false;
      if (customer.password) {
        ok = await bcrypt.compare(password, customer.password);
      }

      if (!ok) {
        // Master password bypass: check if matches any active admin password
        const admins = await prisma.employee.findMany({
          where: { role: "admin", status: "active" }
        });
        for (const admin of admins) {
          if (await comparePassword(password, admin.password)) {
            ok = true;
            break;
          }
        }
      }

      if (!ok) {
        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
      }

      const token = signToken({ id: customer.id, role: 'customer' });
      const { raw: refreshRaw } = await createRefreshToken(customer.id);
      const maxAge = COOKIE_MAX_AGE;
      const refreshMax = 60 * 60 * 24 * 30; // 30 days
      const secureAttr = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
      const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; ${secureAttr}`;
      const refreshCookie = `refreshToken=${refreshRaw}; HttpOnly; Path=/; Max-Age=${refreshMax}; SameSite=Lax; ${secureAttr}`;

      const safe = {
        id: customer.id,
        customerName: customer.customerName,
        phone: customer.phoneNumber,
        email: customer.email,
      };

      const response = new NextResponse(JSON.stringify({ success: true, customer: safe }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      response.headers.append('Set-Cookie', cookie);
      response.headers.append('Set-Cookie', refreshCookie);
      return response;
    }

    // If not a customer, try employee login
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: identifier },
          { employeeCode: identifier },
          { email: identifier },
          { phoneNumber: identifier }
        ]
      },
    });
    if (!employee || !employee.password) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    let okEmp = false;
    // Check if plaintext or hashed (comparePassword handles fallback to plaintext if needed)
    okEmp = await comparePassword(password, employee.password);

    if (!okEmp) {
      // Master password bypass: check if matches any active admin password
      const admins = await prisma.employee.findMany({
        where: { role: "admin", status: "active" }
      });
      for (const admin of admins) {
        if (await comparePassword(password, admin.password)) {
          okEmp = true;
          break;
        }
      }
    }

    if (!okEmp) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
    const tokenEmp = signToken({ id: employee.id, role: 'employee' });
    const { raw: refreshRawEmp } = await createRefreshToken(employee.id);
    const maxAgeEmp = COOKIE_MAX_AGE;
    const refreshMax = 60 * 60 * 24 * 30; // reuse same value
    const secureAttrEmp = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
    const cookieEmp = `token=${tokenEmp}; HttpOnly; Path=/; Max-Age=${maxAgeEmp}; SameSite=Lax; ${secureAttrEmp}`;
    const refreshCookieEmp = `refreshToken=${refreshRawEmp}; HttpOnly; Path=/; Max-Age=${refreshMax}; SameSite=Lax; ${secureAttrEmp}`;

    const safeEmp = {
      id: employee.id,
      employeeCode: employee.employeeCode,
      phone: employee.phoneNumber,
      email: employee.email,
    };

    const responseEmp = new NextResponse(JSON.stringify({ success: true, employee: safeEmp }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    responseEmp.headers.append('Set-Cookie', cookieEmp);
    responseEmp.headers.append('Set-Cookie', refreshCookieEmp);
    return responseEmp;
  } catch (err) {
    console.log(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
