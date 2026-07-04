process.env.JWT_SECRET = process.env.JWT_SECRET || "test-access-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";

import jwt from "jsonwebtoken";
import { resolveHandshakeUserId } from "../middleware/websocket";

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    console.error(`  ✗ ${name}`);
    failures++;
  }
}

const USER_A: string = "11111111-1111-1111-1111-111111111111";
const USER_B: string = "22222222-2222-2222-2222-222222222222";

const accessA = jwt.sign({ id: USER_A, role: "user" }, process.env.JWT_SECRET!, { algorithm: "HS256", expiresIn: "5m" });
const refreshA = jwt.sign({ id: USER_A, email: "a@test.dev" }, process.env.JWT_REFRESH_SECRET!, { algorithm: "HS256", expiresIn: "30d" });
const forgedA = jwt.sign({ id: USER_A }, "attacker-guessed-secret", { algorithm: "HS256" });

console.log("WebSocket handshake auth:");

assert("connect with no token/cookie is rejected", resolveHandshakeUserId({ headers: {} }) === null);

assert("connect with a non-JWT token is rejected", resolveHandshakeUserId({ auth: { token: "not-a-jwt" }, headers: {} }) === null);

assert("connect with a forged token is rejected", resolveHandshakeUserId({ auth: { token: forgedA }, headers: {} }) === null);

assert("valid access token resolves to its own user", resolveHandshakeUserId({ auth: { token: accessA }, headers: {} }) === USER_A);

assert("valid Bearer header resolves to its own user", resolveHandshakeUserId({ headers: { authorization: `Bearer ${accessA}` } }) === USER_A);

assert("valid lot_r1 cookie resolves to its own user", resolveHandshakeUserId({ headers: { cookie: `lot_r1=${refreshA}; other=x` } }) === USER_A);

const resolved = resolveHandshakeUserId({ auth: { token: accessA }, headers: {} });
assert("authenticated-as-A can never resolve to B's id", resolved === USER_A && resolved !== USER_B);

const forgedRefresh = jwt.sign({ id: USER_B }, "wrong-refresh-secret", { algorithm: "HS256" });
assert("connect with a forged lot_r1 cookie is rejected", resolveHandshakeUserId({ headers: { cookie: `lot_r1=${forgedRefresh}` } }) === null);

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("\nAll WebSocket auth assertions passed.");
