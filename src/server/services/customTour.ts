import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { logAudit } from "./audit";
import { notify } from "./notifications";
import { customTourSchema } from "@/lib/validation";

type CustomTourInput = z.infer<typeof customTourSchema>;

const STYLE_LABELS: Record<CustomTourInput["travelStyle"], string> = {
  solo: "Solo",
  couple: "Couple",
  family: "Family",
  friends: "Friends",
  group: "Group",
};

const BUDGET_LABELS: Record<CustomTourInput["budget"], string> = {
  economy: "Essential",
  comfort: "Comfort",
  premium: "Premium",
};

export async function submitCustomTourRequest(input: CustomTourInput) {
  const interests = input.interests.length > 0 ? input.interests.join(", ") : "—";
  const lines = [
    `Custom tour request submitted via the website form.`,
    ``,
    `Travel style: ${STYLE_LABELS[input.travelStyle]}`,
    `Start date: ${input.startDate}`,
    `Duration: ${input.days} day(s)`,
    `Travellers: ${input.travelers}`,
    `Budget: ${BUDGET_LABELS[input.budget]}`,
    `Interests: ${interests}`,
    input.destinations ? `Desired destinations: ${input.destinations}` : null,
    input.message ? `Special requests: ${input.message}` : null,
  ].filter((line): line is string => line !== null);

  const created = await prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      subject: "Custom tour request",
      message: lines.join("\n"),
      locale: input.locale || "en",
    },
  });

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
      notify(
        s.id,
        "MESSAGE_RECEIVED",
        "New custom tour request",
        `${input.name} — ${input.days} day(s), ${input.travelers} traveller(s), from ${input.startDate}`
      )
    )
  );

  await logAudit({
    action: "custom_tour.create",
    entity: "ContactMessage",
    entityId: created.id,
    diff: { email: input.email, days: input.days, travelers: input.travelers },
  });

  return created;
}
