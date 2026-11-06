import { jsonError, jsonOk, parseBody } from "@/lib/api";
import { favoriteSchema } from "@/lib/validation";
import { toggleFavorite, listFavorites } from "@/server/services/favorites";
import { apiUser } from "@/lib/auth/guards";

export async function GET() {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);
  const favorites = await listFavorites(user.id);
  return jsonOk(favorites);
}

export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError("Unauthorized", 401);

  const parsed = await parseBody(request, favoriteSchema);
  if ("error" in parsed) return jsonError(parsed.error, 400, parsed.details);

  const result = await toggleFavorite(user.id, parsed.data.experienceSlug);
  return jsonOk(result);
}
