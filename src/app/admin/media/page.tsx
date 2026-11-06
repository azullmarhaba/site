import type { Metadata } from "next";
import { getDict, getLocale } from "@/lib/i18n";
import { listAdminMedia } from "@/server/services/admin";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const metadata: Metadata = { title: "Admin — Media" };

export default async function AdminMediaPage() {
  const locale = await getLocale();
  const dict = getDict(locale);
  const media = await listAdminMedia(120);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl">{dict.admin.nav.media}</h1>
        <p className="mt-1 text-sm text-ivory/50">{media.length}</p>
      </header>

      <MediaLibrary
        initial={media.map((m) => ({
          id: m.id,
          path: m.path,
          filename: m.filename,
          alt: m.alt,
          caption: m.caption,
          width: m.width,
          height: m.height,
          mimeType: m.mimeType,
        }))}
        labels={dict.admin.crud}
      />
    </div>
  );
}
