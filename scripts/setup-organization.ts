import process from "node:process";
import { parseArgs } from "node:util";

// Creates a clinic and its first admin: there is no public sign-up, so this is
// how a clinic comes to exist. It posts to the server's setup endpoint
// (`src/server/clinic-setup.ts`) with SETUP_SECRET, and the clinic's record
// creates the admin in the auth provider and in its member table.
// A second run for the same clinic name changes nothing and says so.
//
// The password is a starting one: the admin must replace it at first sign-in.

const usage =
  'usage: bun run setup:clinic --url <server url> --clinic "<name>" --name "<admin name>" --email <admin email> --password <starting password>';

const { values } = parseArgs({
  options: {
    url: { type: "string" },
    clinic: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
    password: { type: "string" },
  },
});

const { url, clinic, name, email, password } = values;
if (!url || !clinic || !name || !email || !password) {
  console.error(usage);
  process.exit(1);
}

let endpoint: URL;
try {
  endpoint = new URL("/api/setup", url);
} catch {
  console.error(`invalid --url "${url}": must be an absolute URL, e.g. https://clinic.example.com`);
  process.exit(1);
}

const secret = process.env.SETUP_SECRET;
if (!secret) {
  console.error(
    "SETUP_SECRET is required: set it with the deployment's secret command (wrangler secret put / env var)",
  );
  process.exit(1);
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    authorization: `Bearer ${secret}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    clinicName: clinic,
    adminName: name,
    adminEmail: email,
    password,
  }),
});

if (response.status === 404 || response.status === 401) {
  console.error(
    `setup refused (${response.status}): the server has no SETUP_SECRET, or a different one`,
  );
  process.exit(1);
}

const result = (await response.json()) as
  | { ok: true; clinicId: string; userId: string }
  | { ok: false; reason: string };
if (result.ok) {
  console.log(`created clinic ${result.clinicId} with admin ${result.userId}`);
} else if (result.reason === "alreadySetUp") {
  console.log(`clinic "${clinic}" already exists; nothing changed`);
} else if (result.reason === "invalidClinicName") {
  console.error(`setup refused: "${clinic}" needs a letter or digit for its id`);
  process.exitCode = 1;
} else {
  console.error(`setup refused: ${result.reason}`);
  process.exitCode = 1;
}
