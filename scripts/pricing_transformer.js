const SOURCE_URL =
  "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";

const { GROUP_DEFINITIONS, MODEL_TARGETS } = require("./model_catalog");

function normalizeKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[_\s.]+/g, "-");
}

function getPricingEntries(input) {
  if (Array.isArray(input)) {
    return input.map((value, index) => [String(index), value]);
  }

  if (input?.models && Array.isArray(input.models)) {
    return input.models.map((model) => [model.model_name ?? model.name, model]);
  }

  if (input?.model_prices && typeof input.model_prices === "object") {
    return Object.entries(input.model_prices);
  }

  if (input && typeof input === "object") {
    return Object.entries(input);
  }

  return [];
}

function getCandidates(key, value) {
  return [
    key,
    value?.model,
    value?.model_name,
    value?.name,
    value?.litellm_provider ? `${value.litellm_provider}/${key}` : ""
  ];
}

function findModelEntry(entries, target) {
  const normalizedAliases = target.aliases.map(normalizeKey);

  for (const alias of target.aliases) {
    const exact = entries.find(([key]) => key === alias);
    if (exact) {
      return exact;
    }
  }

  const normalizedMatch = entries.find(([key, value]) => {
    const candidates = getCandidates(key, value).map(normalizeKey);
    return normalizedAliases.some((alias) => candidates.includes(alias));
  });

  if (normalizedMatch) {
    return normalizedMatch;
  }

  return entries.find(([key, value]) => {
    const candidates = getCandidates(key, value).map(normalizeKey);
    return normalizedAliases.some((alias) =>
      candidates.some((candidate) => candidate.includes(alias) || alias.includes(candidate))
    );
  });
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function numericPrice(value, fieldName, modelName) {
  const numericValue = Number(value ?? 0);

  if (Number.isNaN(numericValue) || numericValue < 0) {
    throw new Error(`Invalid price for ${modelName}: ${fieldName} must be non-negative and numeric.`);
  }

  return numericValue;
}

function pricePerMillion(value, fieldName, modelName) {
  return Number((numericPrice(value, fieldName, modelName) * 1_000_000).toFixed(6));
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function hasRequiredPrice(pricing) {
  return pricing?.input_cost_per_token !== undefined && pricing?.output_cost_per_token !== undefined;
}

function excludedModel(target, reason, sourceKey = null) {
  return {
    name: target.name,
    aliases: target.aliases,
    pricing_policy: target.pricing_policy,
    reason,
    source_key: sourceKey,
    category_tags: target.category_tags ?? [],
    model_groups: target.model_groups ?? []
  };
}

function transformPricing(input, generatedAt = new Date().toISOString()) {
  const entries = getPricingEntries(input);
  const excludedModels = [];
  const models = [];

  for (const target of MODEL_TARGETS) {
    const entry = findModelEntry(entries, target);

    if (!entry) {
      excludedModels.push(excludedModel(target, "missing_source_entry"));
      continue;
    }

    const [sourceKey, pricing] = entry;
    if (!hasRequiredPrice(pricing)) {
      excludedModels.push(excludedModel(target, "missing_required_price", sourceKey));
      continue;
    }

    const inputCost = firstDefined(pricing.input_cost_per_token);
    const outputCost = firstDefined(pricing.output_cost_per_token);
    const cacheReadCost = firstDefined(
      pricing.cache_read_input_token_cost,
      pricing.cache_read_cost_per_token,
      pricing.input_cost_per_token_cache_hit,
      0
    );

    const model = {
      name: target.name,
      provider: pricing.litellm_provider ?? pricing.provider ?? "unknown",
      source_key: sourceKey,
      input_cost_per_1m: pricePerMillion(inputCost, "input_cost_per_token", target.name),
      output_cost_per_1m: pricePerMillion(outputCost, "output_cost_per_token", target.name),
      cache_read_cost_per_1m: pricePerMillion(cacheReadCost, "cache_read_input_token_cost", target.name),
      context_window: Number(pricing.max_input_tokens ?? pricing.max_tokens ?? 0),
      max_output_tokens: Number(pricing.max_output_tokens ?? pricing.max_tokens ?? 0),
      supports_prompt_caching: Boolean(pricing.supports_prompt_caching || cacheReadCost),
      supports_function_calling: Boolean(pricing.supports_function_calling),
      supports_vision: Boolean(pricing.supports_vision),
      category_tags: uniqueValues(target.category_tags ?? []),
      model_groups: uniqueValues(target.model_groups ?? []),
      pricing_status: "active",
      pricing_policy: target.pricing_policy,
      pricing_source_url: pricing.source ?? SOURCE_URL,
      last_checked_at: generatedAt
    };
    models.push(model);
  }

  return {
    metadata: {
      source: "LiteLLM model_prices_and_context_window.json",
      source_url: SOURCE_URL,
      generated_at: generatedAt,
      freshness: "auto_generated",
      currency: "USD",
      unit: "per 1 million tokens",
      model_count: models.length,
      target_model_count: MODEL_TARGETS.length,
      excluded_model_count: excludedModels.length,
      excluded_models: excludedModels,
      model_groups: GROUP_DEFINITIONS,
      missing_price_policy: "Models with missing source entries or missing input/output prices are excluded from public ranking data and listed in metadata.excluded_models.",
      note: "Prices are transformed from LiteLLM metadata. Verify provider pages before purchasing or production-routing decisions."
    },
    models
  };
}

function buildProviderSummary(models) {
  const providerCounts = new Map();

  for (const model of models) {
    providerCounts.set(model.provider, (providerCounts.get(model.provider) ?? 0) + 1);
  }

  return {
    providers: [...providerCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, modelCount]) => ({
        name,
        model_count: modelCount
      }))
  };
}

function buildDatasets(input, generatedAt = new Date().toISOString()) {
  const livePrices = transformPricing(input, generatedAt);

  return {
    livePrices,
    models: { models: livePrices.models },
    providers: buildProviderSummary(livePrices.models)
  };
}

module.exports = {
  GROUP_DEFINITIONS,
  MODEL_TARGETS,
  SOURCE_URL,
  buildDatasets,
  buildProviderSummary,
  transformPricing
};
