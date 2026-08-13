#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CHILD_PORTRAIT_TEMPLATES } from "../js/data/child-portrait-templates.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "assets/templates/children/index.json");
await writeFile(target, `${JSON.stringify(CHILD_PORTRAIT_TEMPLATES, null, 2)}\n`, "utf8");
console.log(`Wrote ${CHILD_PORTRAIT_TEMPLATES.length} templates to ${target}`);
