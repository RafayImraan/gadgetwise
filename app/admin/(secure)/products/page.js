import { revalidatePath } from "next/cache";
import {
  createAdminAuditLog,
  createProduct,
  deleteProduct,
  getAdminCategories,
  getAdminProducts,
  toggleProductPublished,
  updateProduct
} from "@/lib/storefront-db";
import { parseCommaList } from "@/lib/product-normalize";
import { slugify, toInt } from "@/lib/utils";
import { requireAdminAuth } from "@/lib/admin-auth";
import { saveUploadedImages } from "@/lib/admin-media";

export const metadata = {
  title: "Admin Products",
  description: "Create, publish, and manage product inventory."
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  requireAdminAuth();

  const [categories, products] = await Promise.all([
    getAdminCategories(),
    getAdminProducts()
  ]);

  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  async function createProductAction(formData) {
    "use server";
    requireAdminAuth();
    const name = String(formData.get("name") || "").trim();
    const slugInput = String(formData.get("slug") || "").trim();
    const sku = String(formData.get("sku") || "").trim();
    const brand = String(formData.get("brand") || "").trim();
    const categoryId = String(formData.get("categoryId") || "").trim();
    const shortDescription = String(formData.get("shortDescription") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const shippingInfo = String(formData.get("shippingInfo") || "").trim();
    const price = toInt(formData.get("price"), 0);
    const compareAtPrice = toInt(formData.get("compareAtPrice"), 0);
    const stock = toInt(formData.get("stock"), 0);
    const rating = Number(formData.get("rating")) || 0;
    const reviewCount = toInt(formData.get("reviewCount"), 0);
    const tags = parseCommaList(formData.get("tags"));
    const variants = parseCommaList(formData.get("variants"));
    const features = parseCommaList(formData.get("features"));
    const imageUrls = parseCommaList(formData.get("images"));
    const uploadedImages = await saveUploadedImages(formData.getAll("imageFiles"), "products", 8);
    const images = [...uploadedImages, ...imageUrls];
    const badges = parseCommaList(formData.get("badges"));
    const isPublished = Boolean(formData.get("isPublished"));
    const isFeatured = Boolean(formData.get("isFeatured"));
    const isNewArrival = Boolean(formData.get("isNewArrival"));

    if (!name || !sku || price <= 0) {
      return;
    }

    const slug = slugify(slugInput || name);

    await createProduct({
      name,
      slug,
      sku,
      brand,
      price,
      compareAtPrice,
      stock,
      rating,
      reviewCount,
      shortDescription,
      description,
      shippingInfo,
      tags,
      variants,
      features,
      images,
      badges,
      isPublished,
      isFeatured,
      isNewArrival,
      categoryId
    });
    await createAdminAuditLog({
      actor: "admin",
      action: "product_created",
      scope: "products",
      meta: { name, sku }
    });

    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/catalog");
  }

  async function updateProductAction(formData) {
    "use server";
    requireAdminAuth();
    const productId = String(formData.get("productId") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const slugInput = String(formData.get("slug") || "").trim();
    const sku = String(formData.get("sku") || "").trim();
    const brand = String(formData.get("brand") || "").trim();
    const categoryId = String(formData.get("categoryId") || "").trim();
    const shortDescription = String(formData.get("shortDescription") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const shippingInfo = String(formData.get("shippingInfo") || "").trim();
    const price = toInt(formData.get("price"), 0);
    const compareAtPrice = toInt(formData.get("compareAtPrice"), 0);
    const stock = toInt(formData.get("stock"), 0);
    const rating = Number(formData.get("rating")) || 0;
    const reviewCount = toInt(formData.get("reviewCount"), 0);
    const tags = parseCommaList(formData.get("tags"));
    const variants = parseCommaList(formData.get("variants"));
    const features = parseCommaList(formData.get("features"));
    const imageUrls = parseCommaList(formData.get("images"));
    const uploadedImages = await saveUploadedImages(formData.getAll("imageFiles"), "products", 8);
    const images = uploadedImages.length ? [...uploadedImages, ...imageUrls] : imageUrls;
    const badges = parseCommaList(formData.get("badges"));
    const isPublished = Boolean(formData.get("isPublished"));
    const isFeatured = Boolean(formData.get("isFeatured"));
    const isNewArrival = Boolean(formData.get("isNewArrival"));

    if (!productId || !name || !sku || price <= 0) {
      return;
    }

    const slug = slugify(slugInput || name);

    await updateProduct(productId, {
      name,
      slug,
      sku,
      brand,
      price,
      compareAtPrice,
      stock,
      rating,
      reviewCount,
      shortDescription,
      description,
      shippingInfo,
      tags,
      variants,
      features,
      images,
      badges,
      isPublished,
      isFeatured,
      isNewArrival,
      categoryId
    });
    await createAdminAuditLog({
      actor: "admin",
      action: "product_updated",
      scope: "products",
      targetId: productId,
      meta: { name, sku }
    });

    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/catalog");
  }

  async function deleteProductAction(formData) {
    "use server";
    requireAdminAuth();
    const productId = String(formData.get("productId") || "");
    if (!productId) {
      return;
    }

    await deleteProduct(productId);
    await createAdminAuditLog({
      actor: "admin",
      action: "product_deleted",
      scope: "products",
      targetId: productId
    });

    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/catalog");
  }

  async function togglePublishedAction(formData) {
    "use server";
    requireAdminAuth();
    const productId = String(formData.get("productId") || "");
    if (!productId) {
      return;
    }

    await toggleProductPublished(productId);
    await createAdminAuditLog({
      actor: "admin",
      action: "product_publish_toggled",
      scope: "products",
      targetId: productId
    });

    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/catalog");
  }

  return (
    <section className="admin-layout-grid">
      <article className="panel-card">
        <h2>Create Product</h2>
        <form action={createProductAction}>
          <div className="field-row">
            <label>
              Name
              <input type="text" name="name" required />
            </label>
            <label>
              SKU
              <input type="text" name="sku" required />
            </label>
          </div>
          <div className="field-row">
            <label>
              Slug (optional)
              <input type="text" name="slug" />
            </label>
            <label>
              Brand
              <input type="text" name="brand" defaultValue="Gadgetwise" />
            </label>
          </div>
          <div className="field-row">
            <label>
              Price (PKR)
              <input type="number" name="price" min={1} required />
            </label>
            <label>
              Compare At Price
              <input type="number" name="compareAtPrice" min={0} />
            </label>
          </div>
          <div className="field-row">
            <label>
              Stock
              <input type="number" name="stock" min={0} defaultValue={0} />
            </label>
            <label>
              Category
              <select name="categoryId">
                <option value="">Unassigned</option>
                {sortedCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field-row">
            <label>
              Rating
              <input type="number" name="rating" min={0} max={5} step="0.1" defaultValue={0} />
            </label>
            <label>
              Review Count
              <input type="number" name="reviewCount" min={0} defaultValue={0} />
            </label>
          </div>
          <label>
            Short Description
            <input type="text" name="shortDescription" />
          </label>
          <label>
            Description
            <textarea name="description" rows={4} />
          </label>
          <label>
            Shipping Info
            <textarea name="shippingInfo" rows={3} />
          </label>
          <label>
            Image URLs (comma/new line)
            <textarea name="images" rows={3} placeholder="https://..., https://..." />
          </label>
          <label>
            Upload Images
            <input type="file" name="imageFiles" accept="image/*" multiple />
          </label>
          <label>
            Variants (comma separated)
            <input type="text" name="variants" placeholder="Black, White, Gold" />
          </label>
          <label>
            Features (comma separated)
            <input type="text" name="features" placeholder="Feature 1, Feature 2" />
          </label>
          <label>
            Tags (comma separated)
            <input type="text" name="tags" placeholder="kitchen, organizer, smart" />
          </label>
          <label>
            Badges (comma separated)
            <input type="text" name="badges" placeholder="Best Seller, New Arrival" />
          </label>
          <div className="checkbox-stack">
            <label className="checkbox-row">
              <input type="checkbox" name="isPublished" defaultChecked />
              Published
            </label>
            <label className="checkbox-row">
              <input type="checkbox" name="isFeatured" />
              Featured on homepage
            </label>
            <label className="checkbox-row">
              <input type="checkbox" name="isNewArrival" />
              Mark as new arrival
            </label>
          </div>
          <button className="btn" type="submit">
            Save Product
          </button>
        </form>
      </article>

      <article className="panel-card">
        <h2>Product Inventory</h2>
        {!products.length ? <p>No products yet. Add your first product from the form.</p> : null}
        <div className="admin-list">
          {products.map((product) => (
            <div key={product.id} className="admin-list-row">
              <div>
                <h3>{product.name}</h3>
                <p>
                  SKU: {product.sku} | Price: Rs. {product.price.toLocaleString("en-PK")} | Stock:{" "}
                  {product.stock}
                </p>
                <p>
                  Category: {product.category?.name || "Unassigned"} | Published:{" "}
                  {product.isPublished ? "Yes" : "No"}
                </p>
                <details>
                  <summary>Edit Product</summary>
                  <form action={updateProductAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <div className="field-row">
                      <label>
                        Name
                        <input type="text" name="name" defaultValue={product.name} required />
                      </label>
                      <label>
                        SKU
                        <input type="text" name="sku" defaultValue={product.sku} required />
                      </label>
                    </div>
                    <div className="field-row">
                      <label>
                        Slug
                        <input type="text" name="slug" defaultValue={product.slug} />
                      </label>
                      <label>
                        Brand
                        <input type="text" name="brand" defaultValue={product.brand} />
                      </label>
                    </div>
                    <div className="field-row">
                      <label>
                        Price (PKR)
                        <input type="number" name="price" min={1} defaultValue={product.price} required />
                      </label>
                      <label>
                        Compare At Price
                        <input
                          type="number"
                          name="compareAtPrice"
                          min={0}
                          defaultValue={product.compareAtPrice || 0}
                        />
                      </label>
                    </div>
                    <div className="field-row">
                      <label>
                        Stock
                        <input type="number" name="stock" min={0} defaultValue={product.stock} />
                      </label>
                      <label>
                        Category
                        <select name="categoryId" defaultValue={product.categoryId || ""}>
                          <option value="">Unassigned</option>
                          {sortedCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="field-row">
                      <label>
                        Rating
                        <input
                          type="number"
                          name="rating"
                          min={0}
                          max={5}
                          step="0.1"
                          defaultValue={product.rating}
                        />
                      </label>
                      <label>
                        Review Count
                        <input
                          type="number"
                          name="reviewCount"
                          min={0}
                          defaultValue={product.reviewCount}
                        />
                      </label>
                    </div>
                    <label>
                      Short Description
                      <input
                        type="text"
                        name="shortDescription"
                        defaultValue={product.shortDescription || ""}
                      />
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows={4} defaultValue={product.description || ""} />
                    </label>
                    <label>
                      Shipping Info
                      <textarea name="shippingInfo" rows={3} defaultValue={product.shippingInfo || ""} />
                    </label>
                    <label>
                      Image URLs (comma/new line)
                      <textarea
                        name="images"
                        rows={3}
                        defaultValue={(product.images || []).join("\n")}
                      />
                    </label>
                    <label>
                      Upload Images
                      <input type="file" name="imageFiles" accept="image/*" multiple />
                    </label>
                    <label>
                      Variants (comma separated)
                      <input
                        type="text"
                        name="variants"
                        defaultValue={(product.variants || []).join(", ")}
                      />
                    </label>
                    <label>
                      Features (comma separated)
                      <input
                        type="text"
                        name="features"
                        defaultValue={(product.features || []).join(", ")}
                      />
                    </label>
                    <label>
                      Tags (comma separated)
                      <input type="text" name="tags" defaultValue={(product.tags || []).join(", ")} />
                    </label>
                    <label>
                      Badges (comma separated)
                      <input type="text" name="badges" defaultValue={(product.badges || []).join(", ")} />
                    </label>
                    <div className="checkbox-stack">
                      <label className="checkbox-row">
                        <input type="checkbox" name="isPublished" defaultChecked={product.isPublished} />
                        Published
                      </label>
                      <label className="checkbox-row">
                        <input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} />
                        Featured on homepage
                      </label>
                      <label className="checkbox-row">
                        <input type="checkbox" name="isNewArrival" defaultChecked={product.isNewArrival} />
                        Mark as new arrival
                      </label>
                    </div>
                    <button className="btn secondary" type="submit">
                      Save Changes
                    </button>
                  </form>
                </details>
              </div>
              <div className="inline-actions">
                <form action={togglePublishedAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <button className="btn secondary" type="submit">
                    {product.isPublished ? "Unpublish" : "Publish"}
                  </button>
                </form>
                <form action={deleteProductAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <button className="btn secondary" type="submit">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}


