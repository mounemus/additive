import { NextResponse } from "next/server";
import { getModulairConfig } from "@/lib/modulair-settings";

/** Config PUBLIQUE des éléments de combinaison MODUL'AIR (libellés + prix). */
export async function GET() {
  return NextResponse.json(await getModulairConfig());
}
