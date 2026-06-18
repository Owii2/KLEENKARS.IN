import { prisma } from "@/lib/prisma";

import { comparePassword } from "@/lib/hash";

import { createToken } from "@/lib/auth";

import { serialize } from "cookie";

import { NextResponse } from "next/server";

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const identifier = body.phoneNumber || body.identifier;

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { phoneNumber: identifier },
          { employeeCode: identifier },
          { email: identifier }
        ]
      },
    });

    if (!employee) {

      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 401,
        }
      );

    }

    const validPassword =
      await comparePassword(
        body.password,
        employee.password
      );

    if (!validPassword) {

      return NextResponse.json(
        {
          success: false,
          message: "Invalid password",
        },
        {
          status: 401,
        }
      );

    }

    const token = createToken({

      id: employee.id,

      role: employee.role,

      name: employee.name,

    });

    const response = NextResponse.json({
      success: true,
      role: employee.role,
    });

    response.headers.set(
      "Set-Cookie",

      serialize("token", token, {

        httpOnly: true,

        secure: false,

        sameSite: "strict",

        path: "/",

        maxAge: 60 * 60 * 24 * 7,

      })
    );

    return response;

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}