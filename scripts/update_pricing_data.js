const fs = require("node:fs/promises");
const path = require("node:path");
const { SOURCE_URL, buildDatasets } = require("./pricing_transformer");

const projectRoot = path.resolve(__dirname, "..");

async function writeJson(relativePath, value) {
  const targetPath = path.join(projectRoot, relativePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`);
}

async function readJson(relativePath) {
  try {
    const targetPath = path.join(projectRoot, relativePath);
    return JSON.parse(await fs.readFile(targetPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function comparableSnapshot(snapshot) {
  if (!snapshot) {
    return null;
  }

  return JSON.stringify({
    metadata: {
      ...snapshot.metadata,
      generated_at: undefined
    },
    models: (snapshot.models ?? []).map((model) => ({
      ...model,
      last_checked_at: undefined
    }))
  });
}

async function fetchLiteLlmPricing() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "apiroute.dev-pricing-updater"
    }
  });

  if (!response.ok) {
    throw new Error(`LiteLLM pricing fetch failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  const input = await fetchLiteLlmPricing();
  const previousSnapshot = await readJson("api/live-prices");
  let generatedAt = process.env.APIROUTE_GENERATED_AT || new Date().toISOString();
  let datasets = buildDatasets(input, generatedAt);

  if (
    previousSnapshot?.metadata?.generated_at &&
    comparableSnapshot(previousSnapshot) === comparableSnapshot(datasets.livePrices)
  ) {
    generatedAt = previousSnapshot.metadata.generated_at;
    datasets = buildDatasets(input, generatedAt);
  }

  await writeJson("data/mock.json", datasets.models);
  await writeJson("api/live-prices", datasets.livePrices);
  await writeJson("api/live-prices.json", datasets.livePrices);
  await writeJson("api/models", datasets.models);
  await writeJson("api/models.json", datasets.models);
  await writeJson("api/providers", datasets.providers);
  await writeJson("api/providers.json", datasets.providers);

  console.log(`Updated ${datasets.livePrices.models.length} model pricing entries from LiteLLM.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
