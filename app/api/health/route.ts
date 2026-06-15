export async function GET() {
  return Response.json({ ok: true, service: "contact-finder", awake: true });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
