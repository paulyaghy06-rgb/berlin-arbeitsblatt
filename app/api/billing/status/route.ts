import { NextResponse } from "next/server";
import { getBillingSnapshot } from "@/utils/serverBilling";

export async function GET(req: Request) {
  try {
    const snapshot = await getBillingSnapshot(req);
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Abo-Status konnte nicht geladen werden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
