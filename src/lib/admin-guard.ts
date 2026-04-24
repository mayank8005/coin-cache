import { env } from "./env";
import { verifyAdminPassword } from "./crypto";
import { takeToken, clientKey } from "./rate-limit";

export class AdminForbiddenError extends Error {
  constructor(msg = "Admin auth failed") {
    super(msg);
    this.name = "AdminForbiddenError";
  }
}

export const requireAdmin = async (req: Request): Promise<void> => {
  const ok = takeToken({
    key: clientKey(req, "admin"),
    capacity: 10,
    refillPerSec: 0.1,
  });
  if (!ok) throw new AdminForbiddenError("Rate limit exceeded");

  const provided = req.headers.get("x-admin-password");
  const hash = env().ADMIN_PASSWORD_HASH;
  if (!hash || !provided) throw new AdminForbiddenError();
  const valid = await verifyAdminPassword(hash, provided);
  if (!valid) throw new AdminForbiddenError();
};
