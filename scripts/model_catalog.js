const GROUP_DEFINITIONS = {
  frontier: "High-end models for difficult reasoning, agents, and premium quality.",
  budget: "Low-cost models for high-volume routing and commodity workloads.",
  coding: "Models suited for coding, agentic development, and structured code tasks.",
  "local-open": "Open-weight or open-weight-adjacent models useful for local and portable deployments.",
  rag: "Long-context and enterprise retrieval models for documents, knowledge bases, and analysis.",
  multimodal: "Models with vision or multimodal capability flags in the pricing source."
};

const MODEL_TARGETS = [
  {
    name: "GPT-5.5",
    aliases: ["gpt-5.5", "gpt-5.5-2026-04-23", "azure/gpt-5.5"],
    category_tags: ["frontier", "reasoning", "coding", "agents", "long-context", "multimodal", "cache-friendly"],
    model_groups: ["frontier", "coding", "rag", "multimodal"]
  },
  {
    name: "GPT-5.5 Pro",
    aliases: ["gpt-5.5-pro", "gpt-5.5-pro-2026-04-23", "azure/gpt-5.5-pro"],
    category_tags: ["frontier", "premium", "reasoning", "coding", "agents", "long-context", "multimodal", "cache-friendly"],
    model_groups: ["frontier", "coding", "rag", "multimodal"]
  },
  {
    name: "Claude Opus 4.7",
    aliases: ["claude-opus-4-7", "claude-opus-4-7-20260416", "anthropic.claude-opus-4-7"],
    category_tags: ["frontier", "premium", "reasoning", "coding", "agents", "long-context", "multimodal", "cache-friendly"],
    model_groups: ["frontier", "coding", "rag", "multimodal"]
  },
  {
    name: "Claude Sonnet 4.6",
    aliases: ["claude-sonnet-4-6", "anthropic.claude-sonnet-4-6", "global.anthropic.claude-sonnet-4-6"],
    category_tags: ["frontier", "reasoning", "coding", "agents", "enterprise-rag", "cache-friendly"],
    model_groups: ["frontier", "coding", "rag"]
  },
  {
    name: "Claude Haiku 4.5",
    aliases: ["claude-haiku-4-5", "anthropic.claude-haiku-4-5-20251001-v1:0"],
    category_tags: ["fast", "budget", "agents", "enterprise-rag", "cache-friendly"],
    model_groups: ["budget", "rag"]
  },
  {
    name: "Gemini 3.1 Pro Preview",
    aliases: [
      "gemini/gemini-3.1-pro-preview",
      "gemini-3.1-pro-preview",
      "openrouter/google/gemini-3.1-pro-preview"
    ],
    category_tags: ["frontier", "preview", "reasoning", "long-context", "multimodal", "enterprise-rag"],
    model_groups: ["frontier", "rag", "multimodal"]
  },
  {
    name: "Gemini 3.1 Flash-Lite Preview",
    aliases: [
      "gemini/gemini-3.1-flash-lite-preview",
      "gemini-3.1-flash-lite-preview",
      "openrouter/google/gemini-3.1-flash-lite-preview"
    ],
    category_tags: ["budget", "fast", "high-volume", "preview", "multimodal"],
    model_groups: ["budget", "multimodal"]
  },
  {
    name: "DeepSeek V3.2",
    aliases: ["deepseek/deepseek-v3.2", "deepseek.v3.2", "bedrock/us-east-1/deepseek.v3.2"],
    category_tags: ["budget", "high-volume", "coding", "reasoning", "open-weight"],
    model_groups: ["budget", "coding", "local-open"]
  },
  {
    name: "Grok 4.20 Reasoning",
    aliases: [
      "xai/grok-4.20-beta-0309-reasoning",
      "xai/grok-4.20-0309-reasoning",
      "vertex_ai/xai/grok-4.20-reasoning"
    ],
    category_tags: ["frontier", "reasoning", "agents", "long-context", "multimodal"],
    model_groups: ["frontier", "rag", "multimodal"]
  },
  {
    name: "Grok 4.20 Multi-Agent",
    aliases: [
      "xai/grok-4.20-multi-agent-beta-0309",
      "oci/xai.grok-4.20-multi-agent"
    ],
    category_tags: ["frontier", "multi-agent", "agents", "reasoning", "long-context"],
    model_groups: ["frontier", "rag"]
  },
  {
    name: "Qwen3.6 Plus",
    aliases: ["openrouter/qwen/qwen3.6-plus"],
    category_tags: ["coding", "reasoning", "open-weight", "budget"],
    model_groups: ["coding", "local-open", "budget"]
  },
  {
    name: "Qwen3 Max",
    aliases: ["novita/qwen/qwen3-max", "dashscope/qwen3-max", "dashscope/qwen3-max-preview"],
    category_tags: ["frontier", "coding", "reasoning", "agents", "open-weight"],
    model_groups: ["frontier", "coding", "local-open"]
  },
  {
    name: "Mistral Large 3",
    aliases: ["mistral/mistral-large-3", "mistral.mistral-large-3-675b-instruct", "azure_ai/mistral-large-3"],
    category_tags: ["frontier", "coding", "reasoning", "agents", "open-weight", "enterprise"],
    model_groups: ["frontier", "coding", "local-open"]
  },
  {
    name: "Mistral Medium 3",
    aliases: ["mistral/mistral-medium-2505", "mistral/mistral-medium-latest", "azure_ai/mistral-medium-2505"],
    category_tags: ["budget", "coding", "reasoning", "open-weight", "enterprise"],
    model_groups: ["budget", "coding", "local-open"]
  },
  {
    name: "Cohere Command A",
    aliases: ["command-a-03-2025", "vercel_ai_gateway/cohere/command-a", "oci/cohere.command-a-03-2025"],
    category_tags: ["enterprise-rag", "rag", "long-context", "agents"],
    model_groups: ["rag"]
  },
  {
    name: "Cohere Command R7B",
    aliases: ["command-r7b-12-2024"],
    category_tags: ["budget", "high-volume", "enterprise-rag", "rag"],
    model_groups: ["budget", "rag"]
  },
  {
    name: "Llama 4 Maverick",
    aliases: [
      "deepinfra/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
      "groq/meta-llama/llama-4-maverick-17b-128e-instruct",
      "vercel_ai_gateway/meta/llama-4-maverick"
    ],
    category_tags: ["open-weight", "coding", "agents", "multimodal", "long-context"],
    model_groups: ["local-open", "coding", "rag", "multimodal"]
  },
  {
    name: "Llama 4 Scout",
    aliases: [
      "deepinfra/meta-llama/Llama-4-Scout-17B-16E-Instruct",
      "groq/meta-llama/llama-4-scout-17b-16e-instruct",
      "vercel_ai_gateway/meta/llama-4-scout"
    ],
    category_tags: ["budget", "high-volume", "open-weight", "multimodal", "long-context"],
    model_groups: ["budget", "local-open", "rag", "multimodal"]
  }
].map((target) => ({
  pricing_policy: "exclude_if_missing_price",
  required: true,
  ...target
}));

module.exports = {
  GROUP_DEFINITIONS,
  MODEL_TARGETS
};
