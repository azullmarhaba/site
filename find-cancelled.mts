import "dotenv/config";
import { prisma } from "./src/lib/db/prisma.ts";

const b = await prisma.booking.findFirst({
  where: { status: { in: ["CANCELLED", "REFUNDED"] } },
  select: { reference: true, status: true },
});
console.log(JSON.stringify(b));
await prisma.$disconnect();
