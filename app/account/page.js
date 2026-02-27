import AccountClient from "@/app/account/account-client";
import { getCatalogProducts } from "@/lib/storefront-db";

export const metadata = {
  title: "My Account",
  description:
    "Manage account details, order history, addresses, and wishlist in one place."
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const products = await getCatalogProducts();
  return <AccountClient catalogProducts={products} recentOrders={[]} />;
}
