const MODEL_TARGETS = [
  {
    name: "GPT-4o",
    aliases: ["gpt-4o", "openai/gpt-4o"]
  },
  {
    name: "Claude 3.5 Sonnet",
    aliases: ["claude-3-5-sonnet", "claude-3.5-sonnet", "anthropic/claude-3-5-sonnet"]
  },
  {
    name: "Llama 3 70B",
    aliases: ["llama-3-70b", "llama3-70b", "meta-llama/llama-3-70b", "meta/llama-3-70b"]
  },
  {
    name: "Google Gemini 1.5 Pro",
    aliases: ["gemini-1.5-pro", "google/gemini-1.5-pro"]
  },
  {
    name: "DeepSeek V2",
    aliases: ["deepseek-chat", "deepseek/deepseek-chat"]
  },
  {
    name: "Mistral Large",
    aliases: ["mistral-large", "mistral/mistral-large-latest"]
  },
  {
    name: "OpenAI o1",
    aliases: ["o1-preview", "openai/o1-preview", "o1-mini", "openai/o1-mini"]
  }
];

const PRICE_FIELDS = [
  "input_cost_per_token",
  "output_cost_per_token",
  "cache_read_cost_per_token"
];

function normalizeKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[_\s.]+/g, "-");
}

function getInputObject() {
  if (typeof items !== "undefined" && Array.isArray(items) && items[0]?.json) {
    return items[0].json;
  }

  if (typeof $input !== "undefined") {
    const firstItem = $input.first();
    if (firstItem?.json) {
      return firstItem.json;
    }
  }

  return {};
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

function findModelEntry(entries, target) {
  const normalizedAliases = target.aliases.map(normalizeKey);

  return entries.find(([key, value]) => {
    const candidates = [
      key,
      value?.model,
      value?.model_name,
      value?.name,
      value?.litellm_provider ? `${value.litellm_provider}/${key}` : ""
    ].map(normalizeKey);

    return normalizedAliases.some((alias) =>
      candidates.some((candidate) => candidate.includes(alias) || alias.includes(candidate))
    );
  });
}

function validatePrice(value, fieldName, modelName) {
  const numericValue = Number(value ?? 0);

  if (Number.isNaN(numericValue) || numericValue < 0) {
    throw new Error(`Invalid price for ${modelName}: ${fieldName} must be non-negative and numeric.`);
  }

  return numericValue;
}

function pricePerMillion(value, fieldName, modelName) {
  return validatePrice(value, fieldName, modelName) * 1_000_000;
}

function transformPricing(input) {
  const entries = getPricingEntries(input);

  return MODEL_TARGETS.map((target) => {
    const entry = findModelEntry(entries, target);

    if (!entry) {
      throw new Error(`Missing pricing entry for ${target.name}.`);
    }

    const [, pricing] = entry;

    PRICE_FIELDS.forEach((fieldName) => {
      validatePrice(pricing?.[fieldName], fieldName, target.name);
    });

    return {
      name: target.name,
      provider: pricing.litellm_provider ?? pricing.provider ?? "unknown",
      input_cost_per_1m: pricePerMillion(pricing.input_cost_per_token, "input_cost_per_token", target.name),
      output_cost_per_1m: pricePerMillion(pricing.output_cost_per_token, "output_cost_per_token", target.name),
      cache_read_cost_per_1m: pricePerMillion(
        pricing.cache_read_cost_per_token,
        "cache_read_cost_per_token",
        target.name
      )
    };
  });
}

const models = transformPricing(getInputObject());

return [{ json: { models } }];
