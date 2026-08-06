import { NextResponse } from "next/server";

import { getCurrentCustomer } from "@/lib/customer-auth";

export async function GET() {
  const customer = await getCurrentCustomer();
  return NextResponse.json(
    customer ? { customer: { name: customer.name } } : { customer: null },
  );
}
