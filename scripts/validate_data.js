const fs = require("node:fs/promises");
const path = require("node:path");
const { GROUP_DEFINITIONS, MODEL_TARGETS } = require("./model_catalog");

const projectRoot = path.resolve(__dirname, "..");

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(projectRoot, relativePath), "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertPositiveNumber(value, fieldName, modelName) {
  assert(typeof value === "number" && Number.isFinite(value) && value > 0, `${modelName}: ${fieldName} must be a positive number.`);
}

function assertNonNegativeNumber(value, fieldName, modelName) {
  assert(typeof value === "number" && Number.isFinite(value) && value >= 0, `${modelName}: ${fieldName} must be a non-negative number.`);
}

async function main() {
  const livePrices = await readJson("api/live-prices");
  const modelData = await readJson("api/models");
  const providerData = await readJson("api/providers");
  const models = livePrices.models ?? [];
  const modelNames = new Set(models.map((model) => model.name));
  const sourceKeys = new Set();
  const validGroups = new Set(Object.keys(GROUP_DEFINITIONS));

  assert(Array.isArray(models), "api/live-prices.models must be an array.");
  assert(models.length >= 18, `Expected at least 18 active models, got ${models.length}.`);
  assert(livePrices.metadata?.model_count === models.length, "metadata.model_count must match active model count.");
  assert(Array.isArray(livePrices.metadata?.excluded_models), "metadata.excluded_models must be present.");
  assert(livePrices.metadata?.missing_price_policy, "metadata.missing_price_policy must explain missing price handling.");

  for (const target of MODEL_TARGETS.filter((model) => model.required)) {
    assert(modelNames.has(target.name), `Required model is missing from active pricing data: ${target.name}`);
  }

  for (const model of models) {
    assert(model.name, "Every model needs a name.");
    assert(model.provider, `${model.name}: provider is required.`);
    assert(model.source_key, `${model.name}: source_key is required.`);
    assert(!sourceKeys.has(model.source_key), `${model.name}: duplicate source_key ${model.source_key}.`);
    sourceKeys.add(model.source_key);
    assertPositiveNumber(model.input_cost_per_1m, "input_cost_per_1m", model.name);
    assertPositiveNumber(model.output_cost_per_1m, "output_cost_per_1m", model.name);
    assertNonNegativeNumber(model.cache_read_cost_per_1m, "cache_read_cost_per_1m", model.name);
    assertNonNegativeNumber(model.context_window, "context_window", model.name);
    assertNonNegativeNumber(model.max_output_tokens, "max_output_tokens", model.name);
    assert(Array.isArray(model.category_tags) && model.category_tags.length > 0, `${model.name}: category_tags must be a non-empty array.`);
    assert(Array.isArray(model.model_groups) && model.model_groups.length > 0, `${model.name}: model_groups must be a non-empty array.`);

    for (const groupId of model.model_groups) {
      assert(validGroups.has(groupId), `${model.name}: unknown model group "${groupId}".`);
    }
  }

  assert(JSON.stringify(modelData.models) === JSON.stringify(models), "api/models must match api/live-prices.models.");

  const providerCounts = new Map();
  for (const model of models) {
    providerCounts.set(model.provider, (providerCounts.get(model.provider) ?? 0) + 1);
  }

  for (const provider of providerData.providers ?? []) {
    assert(providerCounts.get(provider.name) === provider.model_count, `Provider count mismatch for ${provider.name}.`);
  }

  console.log(`Validated ${models.length} active models, ${providerCounts.size} providers, and ${validGroups.size} model groups.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
