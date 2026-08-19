import { json, readBody, signToken } from "./_lib.js";

export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const password = context.env.JINHEXI_ADMIN_PASSWORD || "";
  if (!password || !body || body.password !== password) {
    return json(403, { error: "密码不正确" });
  }
  const token = await signToken(password);
  return json(200, { token });
}
