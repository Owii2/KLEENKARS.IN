import bcrypt from "bcryptjs";

export async function hashPassword(
  password: string
) {

  return bcrypt.hash(password, 10);

}

export async function comparePassword(
  password: string,
  hashed: string
) {
  if (!hashed || (!hashed.startsWith("$2a$") && !hashed.startsWith("$2b$") && !hashed.startsWith("$2y$"))) {
    return password === hashed;
  }
  try {
    return await bcrypt.compare(password, hashed);
  } catch {
    return false;
  }
}