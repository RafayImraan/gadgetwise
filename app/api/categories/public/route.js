import { NextResponse } from "next/server";
import { getPublicCategories } from "@/lib/storefront-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getPublicCategories(24);
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}
