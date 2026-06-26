import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { generateNextCustomerId } from "@/lib/auth";


export async function GET() {
  const auth = await requireRoles(["admin", "manager"]);

  if (auth.response) {
    return auth.response;
  }

  const customers =
    await prisma.customer.findMany({

      orderBy: {
        totalSpent: "desc",
      },

    });

  return NextResponse.json({
    customers,
  });
}

export async function POST(
  req: Request
) {
  const auth = await requireRoles(["admin", "manager"]);

  if (auth.response) {
    return auth.response;
  }

  try {

    const body = await req.json();

    const existingCustomer =
      await prisma.customer.findUnique({

        where: {
          phoneNumber:
            body.phoneNumber,
        },

      });

    if (existingCustomer) {

      const updatedCustomer =
        await prisma.customer.update({

          where: {
            phoneNumber:
              body.phoneNumber,
          },

          data: {

            totalVisits: {
              increment: 1,
            },

            totalSpent: {
              increment:
                body.totalSpent,
            },

            lastVisit:
              new Date(),

          },

        });

      return NextResponse.json({
        success: true,
        customer:
          updatedCustomer,
      });
    }

    const nextId = await generateNextCustomerId();
    const customer =
      await prisma.customer.create({

        data: {

          id: nextId,

          customerName:
            body.customerName,

          phoneNumber:
            body.phoneNumber,

          totalVisits: 1,

          totalSpent:
            body.totalSpent,

          lastVisit:
            new Date(),

        },

      });

    return NextResponse.json({
      success: true,
      customer,
    });

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
