import fs from "node:fs";
import path from "node:path";
import { DossierSchema, type Dossier } from "./schema";

const dir = path.join(process.cwd(), "content", "machines");

// Runs on the server at build time. Invalid data throws, so a bad dossier can never ship.
export function loadDossiers(): Dossier[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => DossierSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))));
}
