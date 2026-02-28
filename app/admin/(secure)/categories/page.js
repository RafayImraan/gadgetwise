import { revalidatePath } from "next/cache";
import {
  createAdminAuditLog,
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory
} from "@/lib/storefront-db";
import { requireAdminAuth } from "@/lib/admin-auth";
import { saveUploadedImage } from "@/lib/admin-media";

export const metadata = {
  title: "Admin Categories",
  description: "Create and manage product categories."
};

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdminAuth();

  const categories = await getAdminCategories();

  async function createCategoryAction(formData) {
    "use server";
    await requireAdminAuth();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const imageUrl = String(formData.get("image") || "").trim();
    const imageFile = formData.get("imageFile");
    const uploaded = await saveUploadedImage(imageFile, "categories");
    const image = uploaded || imageUrl;

    if (!name) {
      return;
    }

    await createCategory({
      name,
      description,
      image
    });
    await createAdminAuditLog({
      actor: "admin",
      action: "category_created",
      scope: "categories",
      meta: { name }
    });

    revalidatePath("/admin/categories");
    revalidatePath("/catalog");
    revalidatePath("/");
  }

  async function updateCategoryAction(formData) {
    "use server";
    await requireAdminAuth();
    const categoryId = String(formData.get("categoryId") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const currentImage = String(formData.get("currentImage") || "").trim();
    const imageUrl = String(formData.get("image") || "").trim();
    const imageFile = formData.get("imageFile");
    const uploaded = await saveUploadedImage(imageFile, "categories");
    const image = uploaded || imageUrl || currentImage;

    if (!categoryId || !name) {
      return;
    }

    await updateCategory(categoryId, {
      name,
      description,
      image
    });
    await createAdminAuditLog({
      actor: "admin",
      action: "category_updated",
      scope: "categories",
      targetId: categoryId,
      meta: { name }
    });

    revalidatePath("/admin/categories");
    revalidatePath("/catalog");
    revalidatePath("/");
  }

  async function deleteCategoryAction(formData) {
    "use server";
    await requireAdminAuth();
    const categoryId = String(formData.get("categoryId") || "");
    if (!categoryId) {
      return;
    }

    await deleteCategory(categoryId);
    await createAdminAuditLog({
      actor: "admin",
      action: "category_deleted",
      scope: "categories",
      targetId: categoryId
    });

    revalidatePath("/admin/categories");
    revalidatePath("/catalog");
    revalidatePath("/");
  }

  return (
    <section className="admin-layout-grid">
      <article className="panel-card">
        <h2>Create Category</h2>
        <form action={createCategoryAction}>
          <label>
            Name
            <input type="text" name="name" required />
          </label>
          <label>
            Description
            <textarea name="description" rows={4} />
          </label>
          <label>
            Image URL
            <input type="url" name="image" />
          </label>
          <label>
            Upload Image
            <input type="file" name="imageFile" accept="image/*" />
          </label>
          <button className="btn" type="submit">
            Add Category
          </button>
        </form>
      </article>

      <article className="panel-card">
        <h2>Existing Categories</h2>
        {!categories.length ? <p>No categories yet.</p> : null}
        <div className="admin-list">
          {categories.map((category) => (
            <div key={category.id} className="admin-list-row">
              <div>
                <h3>{category.name}</h3>
                <p>Slug: {category.slug}</p>
                <p>{category.description}</p>
                <p>{category.image || "No image"}</p>
                <details>
                  <summary>Edit Category</summary>
                  <form action={updateCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <input type="hidden" name="currentImage" value={category.image || ""} />
                    <label>
                      Name
                      <input type="text" name="name" defaultValue={category.name} required />
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows={3} defaultValue={category.description} />
                    </label>
                    <label>
                      Image URL
                      <input type="url" name="image" defaultValue={category.image || ""} />
                    </label>
                    <label>
                      Upload Image
                      <input type="file" name="imageFile" accept="image/*" />
                    </label>
                    <button className="btn secondary" type="submit">
                      Save Changes
                    </button>
                  </form>
                </details>
              </div>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="categoryId" value={category.id} />
                <button className="btn secondary" type="submit">
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}



