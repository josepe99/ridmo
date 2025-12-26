import { requireAdmin } from "@/lib/auth"
import { CreateCollectionPageClient } from "./create-page-client"

export default async function CreateCollectionPage() {
  await requireAdmin()

  return <CreateCollectionPageClient />
}
