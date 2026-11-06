import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDict, getLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import {
  getAdminExperience,
  listAdminMedia,
  listAdminExperienceAvailability,
} from "@/server/services/admin";
import { AdminPanel, AdminTable, Th, Td, EmptyRow } from "@/components/admin/AdminKit";
import { StatusPill } from "@/components/admin/StatusPill";
import { ExperienceStatusSelect } from "@/components/admin/ExperienceControls";
import { ExperienceEditForm } from "@/components/admin/ExperienceEditForm";
import { CreateButton, EditButton, DeleteButton } from "@/components/admin/ResourceCrud";
import { availabilityFields } from "@/components/admin/crud-fields";

export const metadata: Metadata = { title: "Admin — Edit experience" };

export default async function AdminExperienceEditPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const locale = await getLocale();
  const dict = getDict(locale);
  const e = dict.admin.experiences;
  const [experience, mediaItems] = await Promise.all([
    getAdminExperience(id),
    listAdminMedia(120),
  ]);
  if (!experience) notFound();
  const availability = await listAdminExperienceAvailability(experience.id);
  const fields = availabilityFields(dict, {
    experiences: [{ value: experience.id, label: experience.title }],
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/experiences"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-ivory/55 hover:text-sand"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {e.title}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl">{experience.title}</h1>
            <ExperienceStatusSelect
              experienceId={experience.id}
              status={experience.status}
              labels={{ status: e.status, saved: e.saved }}
            />
          </div>
          <p className="mt-1 text-sm text-ivory/50">
            /{experience.slug} · {experience.category.name} · {experience.destination.name} ·{" "}
            {formatPrice(experience.priceMinor, locale)} · {experience.bookingCount}{" "}
            {e.bookings} · {experience.ratingAvg.toFixed(1)} ({experience.ratingCount})
          </p>
        </div>
        {experience.coverImage ? (
          <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-2xl">
            <Image
              src={experience.coverImage.path}
              alt={experience.coverImage.alt ?? experience.title}
              fill
              sizes="160px"
              className="object-cover"
            />
          </div>
        ) : null}
      </header>

      <AdminPanel title={e.edit}>
        <ExperienceEditForm
          experienceId={experience.id}
          initial={{
            title: experience.title,
            summary: experience.summary ?? "",
            description: experience.description,
            priceMinor: experience.priceMinor,
            capacityMin: experience.capacityMin,
            capacityMax: experience.capacityMax,
            meetingPoint: experience.meetingPoint ?? "",
            cancelWindowHours: experience.cancelWindowHours,
            coverImageId: experience.coverImageId,
            galleryMediaIds: experience.gallery.map((item) => item.mediaId),
          }}
          mediaItems={Array.from(new Map([
            ...mediaItems.map((item) => [item.id, item] as const),
            ...(experience.coverImage ? [[experience.coverImage.id, experience.coverImage] as const] : []),
            ...experience.gallery.map((galleryItem) => [galleryItem.media.id, galleryItem.media] as const),
          ]).values()).map((item) => ({
            id: item.id,
            path: item.path,
            filename: item.filename,
            alt: item.alt,
            mimeType: item.mimeType,
          }))}
          labels={{
            titleField: e.titleField,
            summary: e.summary,
            description: e.description,
            price: e.price,
            capacity: e.capacity,
            meetingPoint: dict.booking.meetingPoint,
            cancelWindow: dict.admin.settings.cancelWindow,
            publish: e.publish,
            saved: e.saved,
            error: dict.common.error,
            edit: e.edit,
            mediaTitle: e.mediaTitle,
            uploadMedia: e.uploadMedia,
            uploading: e.uploading,
            cover: e.cover,
            addToGallery: e.addToGallery,
            removeFromGallery: e.removeFromGallery,
            noMedia: e.noMedia,
            uploadError: e.uploadError,
          }}
        />
      </AdminPanel>

      <AdminPanel
        title={`${dict.admin.nav.availability} · ${availability.length}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {availability.length > 0 ? (
              <Link
                href={`/book/${experience.slug}`}
                className="h-9 rounded-full border border-sand/50 px-4 text-xs text-sand transition-colors hover:bg-sand/10"
              >
                {e.keepBooking} →
              </Link>
            ) : null}
            <CreateButton
              resourceKey="availability"
              fields={fields}
              labels={dict.admin.crud}
              title={e.addAvailability}
              defaults={{ experienceId: experience.id }}
            />
          </div>
        }
      >
        <AdminTable minWidth={620}>
          <thead>
            <tr>
              <Th>{dict.booking.date}</Th>
              <Th className="text-end">{dict.admin.tours.seats}</Th>
              <Th>{dict.admin.bookings.status}</Th>
              <Th>{dict.admin.bookings.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {availability.length === 0 ? (
              <EmptyRow colSpan={4} message={dict.common.empty} />
            ) : (
              availability.map((row) => (
                <tr key={row.id} className="hover:bg-ivory/[0.03]">
                  <Td className="whitespace-nowrap text-ivory/75">
                    {row.date.toISOString().slice(0, 10)}
                  </Td>
                  <Td className="text-end text-ivory/70">
                    {row.capacityBooked} / {row.capacityTotal}
                  </Td>
                  <Td>
                    <StatusPill status={row.closed ? "CANCELLED" : "PUBLISHED"} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <EditButton
                        resourceKey="availability"
                        id={row.id}
                        fields={fields}
                        labels={dict.admin.crud}
                      />
                      <DeleteButton
                        resourceKey="availability"
                        id={row.id}
                        labels={dict.admin.crud}
                      />
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </AdminTable>
      </AdminPanel>
    </div>
  );
}
