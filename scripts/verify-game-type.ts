import { parseGame, isGame } from "../lib/types";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("ok — " + msg);
}

assert(parseGame("wc4") === "wc4", "accepts wc4");
assert(parseGame("gcr") === "gcr", "accepts gcr");
assert(parseGame("ew7") === null, "rejects future games");
assert(parseGame(null) === null, "rejects null");
assert(parseGame(42) === null, "rejects numbers");
assert(parseGame({ game: "wc4" }) === null, "rejects objects");
assert(isGame("wc4") === true, "isGame accepts wc4");
assert(isGame("bad") === false, "isGame rejects bad");

console.log("\nAll Game type guards pass.");
