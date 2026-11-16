import { getSeoCatalog } from "@/modules/catalog/server"
import { buildLlmsTxt } from "@/shared/seo/llms-txt"

export const revalidate = 3600

export async function GET() {
  const { collections, products } = await getSeoCatalog()

  return new Response(buildLlmsTxt(collections, products), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
