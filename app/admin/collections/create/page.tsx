import { requireAdmin } from "@/lib/auth"
import { CreateCollectionPageClient } from "./create-page-client"
import { uploadImage as uploadImageAction } from "@/lib/actions/file.actions"

export default async function CreateCollectionPage() {
  await requireAdmin()

  const handleUploadImage = async (formData: FormData) => {
    "use server"

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
