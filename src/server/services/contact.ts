import { prisma } from "@/lib/db/prisma";
import { logAudit } from "./audit";
import { notify } from "./notifications";

export async function submitContactMessage(input: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  locale?: string;
}) {
  const created = await prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      subject: input.subject || null,
      message: input.message,
      locale: input.locale || "en",
    },
  });

  // Notify all staff/manager/admin users in-app.
  const staff = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      roles: {
        some: { role: { name: { in: ["STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"] } } },
      },
    },
    select: { id: true },
  });
  await Promise.all(
    staff.map((s) =>
      notify(s.id, "MESSAGE_RECEIVED", "New contact message", `${input.name} — ${input.subject || "Contact form"}`)
    )
  );

  await logAudit({
    action: "contact.create",
    entity: "ContactMessage",
    entityId: created.id,
    diff: { email: input.email },
  });

  return created;
}
