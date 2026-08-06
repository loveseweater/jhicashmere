import { createToken, json, readJson } from "../_lib.js";

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const secret = env.ADMIN_PASSWORD || "jinhexi2026";
  if (body.password !== secret) {
    return json({ error: "Incorrect password" }, { status: 403 });
  }
  const token = await createToken(
    { role: "admin", exp: Date.now() + 1000 * 60 * 60 * 12 },
    secret
  );
  return json({ token });
}
