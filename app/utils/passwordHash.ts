export const passwordHash = async (
  preSalt: string,
  postSalt: string,
  password: string
) => {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-512",
    new TextEncoder().encode(preSalt + password + postSalt)
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
};
