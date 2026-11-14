import { requireAdmin } from "@/modules/users/server"
import { CreateCollectionPageClient } from "./create-page-client"
import { uploadImage as uploadImageAction } from "@/modules/admin/server"

export default async function CreateCollectionPage() {
  await requireAdmin()

  const handleUploadImage = async (formData: FormData) => {
    "use server"

    // Inline server actions are public endpoints: authorize inside the action itself,
    // not only in the page that renders it.
    await requireAdmin()

    const file = formData.get("file")
    if (!(file instanceof File)) {
      return { success: false, error: "File is required" }
    }

    const result = await uploadImageAction(file, {
      folder: "milowearco/collections",
      quality: "auto",
    })

    return result
  }

  return <CreateCollectionPageClient onUploadImage={handleUploadImage} />
}
