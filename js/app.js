const state = {
  models: [],
  metadata: null,
  selectedModel: null,
  leaderboardFilter: "all",
  leaderboardSort: "input"
};

const leaderboard = document.querySelector("#leaderboard");
const leaderboardFilters = document.querySelectorAll("[data-leaderboard-filter]");
const leaderboardSort = document.querySelector("#leaderboardSort");
const leaderboardCount = document.querySelector("#leaderboardCount");
const leaderboardValueHeader = document.querySelector("#leaderboardValueHeader");
const snapshotModelCount = document.querySelector("#snapshotModelCount");
const snapshotUpdatedAt = document.querySelector("#snapshotUpdatedAt");
const snapshotSourceLink = document.querySelector("#snapshotSourceLink");
const snapshotTrustNote = document.querySelector("#snapshotTrustNote");
const modelSelect = document.querySelector("#modelSelect");
const promptInput = document.querySelector("#promptInput");
const promptPresetButtons = document.querySelectorAll("[data-prompt-preset]");
const cacheSlider = document.querySelector("#cacheSlider");
const outputTokenInput = document.querySelector("#outputTokenInput");
const cacheValue = document.querySelector("#cacheValue");
const wordCount = document.querySelector("#wordCount");
const tokenCount = document.querySelector("#tokenCount");
const cachedTokens = document.querySelector("#cachedTokens");
const costEstimate = document.querySelector("#costEstimate");
const copyButtons = document.querySelectorAll("[data-copy-value]");
const routeUseCase = document.querySelector("#routeUseCase");
const routePriority = document.querySelector("#routePriority");
const requireVision = document.querySelector("#requireVision");
const requireTools = document.querySelector("#requireTools");
const preferCaching = document.querySelector("#preferCaching");
const routeSummary = document.querySelector("#routeSummary");
const routeCards = document.querySelector("#routeCards");
const contextMatrix = document.querySelector("#contextMatrix");
const contextMatrixSummary = document.querySelector("#contextMatrixSummary");
const contextMatrixNote = document.querySelector("#contextMatrixNote");
const contextFitsCount = document.querySelector("#contextFitsCount");
const contextOutputCappedCount = document.querySelector("#contextOutputCappedCount");
const contextTooLargeCount = document.querySelector("#contextTooLargeCount");
const radarContainer = document.querySelector("#radarContainer");
const modelDetailTitle = document.querySelector("#modelDetailTitle");
const modelSourceLink = document.querySelector("#modelSourceLink");
const detailOutputCost = document.querySelector("#detailOutputCost");
const detailCacheCost = document.querySelector("#detailCacheCost");
const detailContextWindow = document.querySelector("#detailContextWindow");
const detailMaxOutput = document.querySelector("#detailMaxOutput");
const detailFeatureBadges = document.querySelector("#detailFeatureBadges");
const detailSourceKey = document.querySelector("#detailSourceKey");
const detailLastChecked = document.querySelector("#detailLastChecked");

const modelUrlAliases = {
  "gpt-4o": ["gpt-4o"],
  "claude-3-5-sonnet": ["claude-3-5-sonnet", "claude-3.5-sonnet"],
  "llama-3-70b": ["llama-3-70b", "llama3-70b"],
  "google-gemini-2-5-pro": ["gemini-2.5-pro", "google/gemini-2.5-pro"],
  "deepseek-chat": ["deepseek-chat", "deepseek/deepseek-chat"],
  "mistral-large": ["mistral-large", "mistral/mistral-large-latest"],
  "openai-o1": ["o1", "openai/o1", "o1-preview", "openai/o1-preview"]
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 6,
  maximumFractionDigits: 6
});

const radarCategoryClasses = {
  "Free Tier": "border-emerald-300/20 bg-emerald-400/10 text-emerald-300",
  Education: "border-cyan-300/20 bg-cyan-400/10 text-cyan-300",
  Credits: "border-amber-300/20 bg-amber-400/10 text-amber-200",
  cost_pain: "border-red-300/20 bg-red-400/10 text-red-200",
  alternative_search: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
  routing_interest: "border-cyan-300/20 bg-cyan-400/10 text-cyan-200",
  benchmarking: "border-amber-300/20 bg-amber-400/10 text-amber-200"
};

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1
});

const detailCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 3
});

const routeTypeClasses = {
  cheapest: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
  balanced: "border-violet-300/20 bg-violet-400/10 text-violet-200",
  premium: "border-amber-300/20 bg-amber-400/10 text-amber-200"
};

const useCaseLabels = {
  general: "General chat",
  coding: "Coding",
  rag: "RAG / document analysis",
  translation: "Translation / high volume",
  vision: "Vision",
  agents: "Agents / tool calling"
};

const promptPresets = {
  blogpost: {
    outputTokens: 1200,
    text: "Draft blogpost / article review\n\nPaste or replace this with a long article draft. Ask the model to summarize the structure, identify weak claims, extract key facts, and produce an improved outline for publication."
  },
  pdf: {
    outputTokens: 2500,
    text: "PDF document analysis\n\nPaste extracted PDF text here. Ask the model to summarize the document, list important facts, identify open questions, and produce a decision-ready briefing with citations to sections."
  },
  codebase: {
    outputTokens: 6000,
    text: "Repository / codebase analysis\n\nPaste relevant source files, README sections, errors, and logs here. Ask the model to map the architecture, find risky modules, explain failure modes, and propose a focused implementation plan."
  },
  contract: {
    outputTokens: 3000,
    text: "Contract review\n\nPaste contract text here. Ask the model to summarize obligations, deadlines, unusual clauses, financial exposure, termination rules, and questions for legal review."
  },
  csv: {
    outputTokens: 2000,
    text: "CSV / tabular analysis\n\nPaste CSV rows or a schema sample here. Ask the model to infer columns, detect anomalies, propose cleaning rules, and summarize useful business metrics."
  }
};

const leaderboardSortLabels = {
  input: "Input",
  output: "Output",
  context: "Input",
  cache: "Cache read",
  current: "Est. total"
};

function normalizeModelKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[_\s.]+/g, "-");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRadarCategoryClasses(category) {
  return radarCategoryClasses[category] ?? "border-slate-300/20 bg-slate-400/10 text-slate-200";
}

function formatCount(value) {
  const numericValue = Number(value ?? 0);
  return numericValue > 0 ? compactNumber.format(numericValue) : "n/a";
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function renderFeatureBadge(label, enabled) {
  const classes = enabled
    ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
    : "border-slate-300/10 bg-slate-500/10 text-slate-500";

  return `<span class="rounded-full border px-3 py-1 text-xs font-semibold ${classes}">${label}</span>`;
}

function getInputStats() {
  const words = countWords(promptInput.value);
  const tokens = words * 1.3;
  const cacheRatio = Number(cacheSlider.value) / 100;
  const cached = tokens * cacheRatio;
  const uncached = tokens - cached;
  const outputTokens = Math.max(0, Number(outputTokenInput?.value ?? 0) || 0);

  return {
    words,
    tokens,
    cacheRatio,
    cached,
    uncached,
    outputTokens
  };
}

function estimateModelCost(model, stats) {
  const inputCost = (stats.uncached / 1_000_000) * model.input_cost_per_1m;
  const cacheCost = (stats.cached / 1_000_000) * model.cache_read_cost_per_1m;
  const outputCost = (stats.outputTokens / 1_000_000) * model.output_cost_per_1m;

  return inputCost + cacheCost + outputCost;
}

function estimateUncachedCost(model, stats) {
  const inputCost = (stats.tokens / 1_000_000) * model.input_cost_per_1m;
  const outputCost = (stats.outputTokens / 1_000_000) * model.output_cost_per_1m;

  return inputCost + outputCost;
}

function estimateCachedRepeatCost(model, stats) {
  const cacheReadCost = model.supports_prompt_caching
    ? Number(model.cache_read_cost_per_1m ?? 0)
    : Number(model.input_cost_per_1m ?? 0);
  const inputCost = (stats.tokens / 1_000_000) * cacheReadCost;
  const outputCost = (stats.outputTokens / 1_000_000) * model.output_cost_per_1m;

  return inputCost + outputCost;
}

function normalizedModelText(model) {
  return `${model.name} ${model.provider} ${model.source_key}`.toLowerCase();
}

function getRouteRequirements() {
  const useCase = routeUseCase?.value ?? "general";
  const requiresVision = Boolean(requireVision?.checked || useCase === "vision");
  const requiresTools = Boolean(requireTools?.checked || useCase === "agents");

  return {
    useCase,
    priority: routePriority?.value ?? "balanced",
    requireVision: requiresVision,
    requireTools: requiresTools,
    preferCaching: Boolean(preferCaching?.checked)
  };
}

function getModelQualityScore(model) {
  const text = normalizedModelText(model);
  let score = 45;

  if (text.includes("gpt-5.5-pro")) score += 45;
  else if (text.includes("claude-opus-4.7")) score += 43;
  else if (text.includes("gpt-5.5")) score += 38;
  else if (text.includes("claude-sonnet-4.6")) score += 36;
  else if (text.includes("gemini-3.1-pro")) score += 34;
  else if (text.includes("grok-4.20")) score += 30;
  else if (text.includes("qwen3-max")) score += 28;
  else if (text.includes("mistral-large-3")) score += 26;
  else if (text.includes("qwen3.6")) score += 24;
  else if (text.includes("llama-4-maverick")) score += 22;
  else if (text.includes("gemini-3.1-flash-lite")) score += 18;
  else if (text.includes("deepseek-v3.2")) score += 16;

  if (model.supports_function_calling) score += 5;
  if (model.supports_vision) score += 4;
  if (model.supports_prompt_caching) score += 3;
  if (Number(model.context_window ?? 0) >= 1_000_000) score += 5;

  return score;
}

function getUseCaseFitScore(model, useCase) {
  const text = normalizedModelText(model);
  const contextWindow = Number(model.context_window ?? 0);
  const inputPrice = Number(model.input_cost_per_1m ?? 0);
  const outputPrice = Number(model.output_cost_per_1m ?? 0);
  let score = 20;

  if (useCase === "coding") {
    if (/claude|gpt|qwen|grok|mistral-large/.test(text)) score += 28;
    if (model.supports_function_calling) score += 8;
  }

  if (useCase === "rag") {
    if (contextWindow >= 1_000_000) score += 28;
    else if (contextWindow >= 250_000) score += 16;
    if (/grok|gpt|gemini|claude|llama-4/.test(text)) score += 10;
    if (model.supports_prompt_caching) score += 8;
  }

  if (useCase === "translation") {
    if (inputPrice <= 0.3 && outputPrice <= 1.5) score += 30;
    if (/llama-4-scout|command-r7b|deepseek-v3.2|flash-lite/.test(text)) score += 20;
  }

  if (useCase === "vision") {
    if (model.supports_vision) score += 35;
    if (/gpt|claude|gemini|grok/.test(text)) score += 12;
  }

  if (useCase === "agents") {
    if (model.supports_function_calling) score += 25;
    if (/grok|claude|gpt|qwen|mistral/.test(text)) score += 18;
    if (contextWindow >= 1_000_000) score += 6;
  }

  if (useCase === "general") {
    if (/gpt|claude|gemini|grok|mistral|qwen|llama/.test(text)) score += 12;
    if (inputPrice <= 1 && outputPrice <= 5) score += 8;
  }

  return score;
}

function getFitStatus(model, stats) {
  const contextWindow = Number(model.context_window ?? 0);
  const maxOutputTokens = Number(model.max_output_tokens ?? 0);

  if (contextWindow > 0 && stats.tokens > contextWindow) {
    return {
      label: "Too Large",
      className: "border-red-300/20 bg-red-400/10 text-red-200"
    };
  }

  if (maxOutputTokens > 0 && stats.outputTokens > maxOutputTokens) {
    return {
      label: "Output Cap",
      className: "border-amber-300/20 bg-amber-400/10 text-amber-200"
    };
  }

  return {
    label: "Fits",
    className: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
  };
}

function renderRadar(deals) {
  if (!radarContainer) {
    return;
  }

  radarContainer.innerHTML = deals
    .map(
      (deal) => `
        <a
          href="${escapeHtml(deal.url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-inner transition duration-200 hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-white/[0.06] hover:shadow-[0_18px_48px_rgba(8,145,178,0.16)]"
        >
          <span class="mb-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRadarCategoryClasses(deal.category)}">
            ${escapeHtml(deal.category)}
          </span>
          <h3 class="font-display text-xl font-medium text-white transition group-hover:text-cyan-100">
            ${escapeHtml(deal.title)}
          </h3>
          <p class="mt-3 text-sm leading-6 text-slate-300">
            ${escapeHtml(deal.description)}
          </p>
          <span class="mt-5 inline-flex text-sm font-semibold text-cyan-200 transition group-hover:translate-x-1">
            View deal →
          </span>
        </a>
      `
    )
    .join("");
}

function formatSourceLabel(signal) {
  if (signal.community) {
    return `${signal.source} / ${signal.community}`;
  }

  return signal.source ?? "unknown source";
}

function renderMarketingRadar(snapshot) {
  if (!radarContainer) {
    return;
  }

  const signals = snapshot.signals ?? [];

  if (!signals.length) {
    radarContainer.innerHTML = `
      <div class="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-6 text-slate-300">
        No high-intent demand signals found in the latest scan.
      </div>
    `;
    return;
  }

  radarContainer.innerHTML = signals
    .slice(0, 6)
    .map(
      (signal) => `
        <a
          href="${escapeHtml(signal.url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-inner transition duration-200 hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-white/[0.06] hover:shadow-[0_18px_48px_rgba(8,145,178,0.16)]"
        >
          <div class="mb-4 flex flex-wrap items-center gap-2">
            <span class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRadarCategoryClasses(signal.intent)}">
              ${escapeHtml(signal.intent)}
            </span>
            <span class="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 font-mono text-xs text-slate-300">
              score ${escapeHtml(signal.score)}
            </span>
            <span class="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              ${escapeHtml(signal.status)}
            </span>
          </div>
          <h3 class="font-display text-xl font-medium text-white transition group-hover:text-cyan-100">
            ${escapeHtml(signal.title)}
          </h3>
          <p class="mt-3 text-sm leading-6 text-slate-300">
            ${escapeHtml(signal.excerpt || "No excerpt available.")}
          </p>
          <div class="mt-4 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-xs leading-5 text-slate-300">
            <strong class="text-cyan-100">Operator angle:</strong>
            ${escapeHtml(signal.suggested_reply)}
          </div>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>${escapeHtml(formatSourceLabel(signal))}</span>
            <span>${escapeHtml(formatDateTime(signal.created_at))}</span>
          </div>
        </a>
      `
    )
    .join("");
}

function getRecommendationCandidates(stats, requirements) {
  const reasonCounts = {
    context: 0,
    output: 0,
    vision: 0,
    tools: 0
  };

  const candidates = state.models
    .map((model) => {
      const contextWindow = Number(model.context_window ?? 0);
      const maxOutputTokens = Number(model.max_output_tokens ?? 0);
      const totalCost = estimateModelCost(model, stats);
      const qualityScore = getModelQualityScore(model);
      const useCaseScore = getUseCaseFitScore(model, requirements.useCase);
      const contextReserve =
        contextWindow > 0 ? Math.max(0, 1 - stats.tokens / contextWindow) : 0;
      const cachingBoost = requirements.preferCaching && model.supports_prompt_caching ? 8 : 0;

      return {
        model,
        totalCost,
        qualityScore,
        useCaseScore,
        contextReserve,
        balancedScore:
          qualityScore * 0.34 +
          useCaseScore * 0.38 +
          contextReserve * 20 -
          Math.log10(totalCost + 0.000001) * 4 +
          cachingBoost
      };
    })
    .filter((candidate) => {
      const { model } = candidate;
      const contextWindow = Number(model.context_window ?? 0);
      const maxOutputTokens = Number(model.max_output_tokens ?? 0);

      if (contextWindow > 0 && stats.tokens > contextWindow) {
        reasonCounts.context += 1;
        return false;
      }

      if (maxOutputTokens > 0 && stats.outputTokens > maxOutputTokens) {
        reasonCounts.output += 1;
        return false;
      }

      if (requirements.requireVision && !model.supports_vision) {
        reasonCounts.vision += 1;
        return false;
      }

      if (requirements.requireTools && !model.supports_function_calling) {
        reasonCounts.tools += 1;
        return false;
      }

      return true;
    });

  return {
    candidates,
    reasonCounts
  };
}

function explainNoRoute(reasonCounts) {
  const reasons = [];

  if (reasonCounts.context > 0) reasons.push("prompt exceeds context windows");
  if (reasonCounts.output > 0) reasons.push("expected output exceeds model caps");
  if (reasonCounts.vision > 0) reasons.push("vision requirement is too strict");
  if (reasonCounts.tools > 0) reasons.push("tool-calling requirement is too strict");

  return reasons.length
    ? `No model fits because ${reasons.join(", ")}.`
    : "No model fits the current route requirements.";
}

function buildRouteRecommendations() {
  const stats = getInputStats();
  const requirements = getRouteRequirements();
  const { candidates, reasonCounts } = getRecommendationCandidates(stats, requirements);

  if (!candidates.length) {
    const emptyRoute = {
      model: null,
      totalCost: 0,
      reason: explainNoRoute(reasonCounts)
    };

    return {
      requirements,
      stats,
      routes: {
        cheapest: emptyRoute,
        balanced: emptyRoute,
        premium: emptyRoute
      }
    };
  }

  const byCost = [...candidates].sort((a, b) => a.totalCost - b.totalCost);
  const byQuality = [...candidates].sort((a, b) => b.qualityScore - a.qualityScore || a.totalCost - b.totalCost);
  const byBalanced = [...candidates].sort((a, b) => b.balancedScore - a.balancedScore || a.totalCost - b.totalCost);

  return {
    requirements,
    stats,
    routes: {
      cheapest: {
        ...byCost[0],
        reason: "Lowest estimated cost that fits the selected requirements."
      },
      balanced: {
        ...byBalanced[0],
        reason: "Best mix of use-case fit, quality score, context reserve, and cost."
      },
      premium: {
        ...byQuality[0],
        reason: "Highest quality score among matching models."
      }
    }
  };
}

function routeTitle(type) {
  if (type === "cheapest") return "Cheapest Route";
  if (type === "premium") return "Premium Route";
  return "Balanced Route";
}

function routePreferenceText(type, priority) {
  return type === priority ? "Selected priority" : "Alternative";
}

function renderRouteCard(type, route, priority) {
  const badgeClass = routeTypeClasses[type] ?? routeTypeClasses.balanced;

  if (!route.model) {
    return `
      <div class="rounded-2xl border border-red-300/20 bg-red-400/10 p-5">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h3 class="font-display text-xl font-medium text-white">${routeTitle(type)}</h3>
          <span class="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200">No match</span>
        </div>
        <p class="text-sm leading-6 text-red-100">${escapeHtml(route.reason)}</p>
      </div>
    `;
  }

  const model = route.model;
  const contextWindow = Number(model.context_window ?? 0);
  const reserve = contextWindow > 0 ? `${Math.max(0, route.contextReserve * 100).toFixed(1)}%` : "n/a";

  return `
    <div class="rounded-2xl border border-white/10 bg-slate-950/45 p-5 shadow-inner">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 class="font-display text-xl font-medium text-white">${routeTitle(type)}</h3>
        <span class="rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}">
          ${routePreferenceText(type, priority)}
        </span>
      </div>
      <p class="font-display text-2xl font-semibold text-white">${escapeHtml(model.name)}</p>
      <p class="mt-1 text-sm text-slate-400">${escapeHtml(model.provider)} · ${escapeHtml(model.source_key)}</p>
      <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div class="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <dt class="text-slate-500">Est. total</dt>
          <dd class="mt-1 font-mono text-emerald-300">${currency.format(route.totalCost)}</dd>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <dt class="text-slate-500">Context reserve</dt>
          <dd class="mt-1 font-mono text-cyan-200">${reserve}</dd>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <dt class="text-slate-500">Quality score</dt>
          <dd class="mt-1 font-mono text-slate-100">${Math.round(route.qualityScore)}</dd>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <dt class="text-slate-500">Use-case fit</dt>
          <dd class="mt-1 font-mono text-slate-100">${Math.round(route.useCaseScore)}</dd>
        </div>
      </dl>
      <p class="mt-4 text-sm leading-6 text-slate-300">${escapeHtml(route.reason)}</p>
    </div>
  `;
}

function renderRouteRecommendations() {
  if (!routeCards) {
    return;
  }

  if (!state.models.length) {
    routeCards.innerHTML = `<div class="rounded-2xl border border-white/10 bg-slate-950/45 p-5 text-sm text-slate-400">Loading routes...</div>`;
    return;
  }

  const recommendations = buildRouteRecommendations();
  const { requirements, routes } = recommendations;

  if (routeSummary) {
    routeSummary.textContent = `${useCaseLabels[requirements.useCase] ?? "Selected use case"} routing suggestions. Recommendations update from prompt size, output tokens, cache share, and requirements.`;
  }

  routeCards.innerHTML = ["cheapest", "balanced", "premium"]
    .map((type) => renderRouteCard(type, routes[type], requirements.priority))
    .join("");
}

async function loadRadar() {
  if (!radarContainer) {
    return;
  }

  const response = await fetch("data/marketing-radar.json?v=radar");

  if (!response.ok) {
    throw new Error("Radar data could not be loaded.");
  }

  const data = await response.json();
  renderMarketingRadar(data);
}

async function loadModels() {
  const response = await fetch("/api/live-prices");

  if (!response.ok) {
    throw new Error("Model data could not be loaded.");
  }

  const data = await response.json();
  state.models = data.models ?? [];
  state.metadata = data.metadata ?? null;
  state.selectedModel = state.models[0] ?? null;

  renderSnapshotMetadata();
  renderLeaderboard();
  renderModelOptions();
  applyUrlModelSelection();
  renderModelDetails();
  calculateCosts();
  renderRouteRecommendations();
  renderContextMatrix();
}

function renderSnapshotMetadata() {
  const metadata = state.metadata ?? {};
  const modelCount = Number(metadata.model_count ?? state.models.length ?? 0);
  const sourceLabel = metadata.source ? metadata.source.replace(" model_prices_and_context_window.json", "") : "pricing API";
  const sourceUrl = metadata.source_url || "/api/live-prices";
  const updatedAt = metadata.generated_at ? formatDateTime(metadata.generated_at) : "unknown";
  const trustNote =
    metadata.note ||
    "Prices are comparison data transformed from pricing metadata. Verify provider pages before production routing or purchasing decisions.";

  if (snapshotModelCount) {
    snapshotModelCount.textContent = modelCount > 0 ? `${modelCount} models` : "unknown";
  }

  if (snapshotUpdatedAt) {
    snapshotUpdatedAt.textContent = updatedAt;
  }

  if (snapshotSourceLink) {
    snapshotSourceLink.href = sourceUrl;
    snapshotSourceLink.textContent = sourceLabel;
  }

  if (snapshotTrustNote) {
    snapshotTrustNote.textContent = trustNote;
  }
}

function getModelFilterTags(model) {
  const text = normalizedModelText(model);
  const inputPrice = Number(model.input_cost_per_1m ?? 0);
  const outputPrice = Number(model.output_cost_per_1m ?? 0);
  const contextWindow = Number(model.context_window ?? 0);
  const tags = new Set(["all", ...(model.category_tags ?? []), ...(model.model_groups ?? [])]);

  if (inputPrice <= 0.35 || outputPrice <= 0.6) tags.add("cheapest");
  if (contextWindow >= 1_000_000) tags.add("long-context");
  if (/claude|gpt|qwen|grok|mistral-large|deepseek/.test(text)) tags.add("coding");
  if (/gpt-5.5|claude|grok|gemini-3.1-pro|qwen3|max|deepseek/.test(text)) tags.add("reasoning");
  if (inputPrice <= 0.3 && outputPrice <= 1.5) tags.add("high-volume");
  if (/llama-4-scout|command-r7b|deepseek-v3.2|flash-lite/.test(text)) tags.add("high-volume");
  if (model.supports_vision) tags.add("vision");
  if (model.supports_function_calling) tags.add("tools");
  if (/llama|deepseek|qwen|mistral/.test(text)) tags.add("open-weight");
  if (/cohere|command|claude|gemini|gpt|grok/.test(text) && contextWindow >= 200_000) tags.add("enterprise-rag");

  return tags;
}

function getLeaderboardValue(model, sortKey) {
  if (sortKey === "output") return Number(model.output_cost_per_1m ?? 0);
  if (sortKey === "context") return Number(model.context_window ?? 0);
  if (sortKey === "cache") {
    return model.supports_prompt_caching ? Number(model.cache_read_cost_per_1m ?? 0) : Number.POSITIVE_INFINITY;
  }
  if (sortKey === "current") return estimateModelCost(model, getInputStats());

  return Number(model.input_cost_per_1m ?? 0);
}

function formatLeaderboardValue(model, sortKey) {
  const value = getLeaderboardValue(model, sortKey);

  if (sortKey === "context") return `$${Number(model.input_cost_per_1m ?? 0).toFixed(2)}`;
  if (sortKey === "current") return currency.format(value);
  if (sortKey === "cache" && !Number.isFinite(value)) return "n/a";

  return `$${value.toFixed(2)}`;
}

function getFilteredLeaderboardRows() {
  const sortKey = state.leaderboardSort;

  return state.models
    .filter((model) => getModelFilterTags(model).has(state.leaderboardFilter))
    .sort((a, b) => {
      const aValue = getLeaderboardValue(a, sortKey);
      const bValue = getLeaderboardValue(b, sortKey);

      if (sortKey === "context") return bValue - aValue;
      return aValue - bValue;
    });
}

function renderLeaderboardFilters() {
  leaderboardFilters.forEach((button) => {
    const isActive = button.dataset.leaderboardFilter === state.leaderboardFilter;
    button.className = isActive
      ? "rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 font-semibold text-cyan-100 transition hover:border-cyan-200/40"
      : "rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 font-semibold text-slate-300 transition hover:border-cyan-200/30 hover:text-cyan-100";
  });

  if (leaderboardSort) {
    leaderboardSort.value = state.leaderboardSort;
  }
}

function renderLeaderboard() {
  const rows = getFilteredLeaderboardRows();
  const sortKey = state.leaderboardSort;

  renderLeaderboardFilters();

  if (leaderboardValueHeader) {
    leaderboardValueHeader.textContent = leaderboardSortLabels[sortKey] ?? "Input";
  }

  if (leaderboardCount) {
    leaderboardCount.textContent = `${rows.length} of ${state.models.length} models`;
  }

  if (!rows.length) {
    leaderboard.innerHTML = `<tr><td class="px-4 py-4 text-slate-400" colspan="4">No models match this filter.</td></tr>`;
    return;
  }

  leaderboard.innerHTML = rows
    .map(
      (model) => `
        <tr class="hover:bg-slate-900/80">
          <td class="px-3 py-3 font-medium text-slate-100">${escapeHtml(model.name)}</td>
          <td class="px-3 py-3 text-slate-400">${escapeHtml(model.provider)}</td>
          <td class="px-3 py-3 text-right text-cyan-200">${formatCount(model.context_window)}</td>
          <td class="px-3 py-3 text-right text-emerald-300">${formatLeaderboardValue(model, sortKey)}</td>
        </tr>
      `
    )
    .join("");
}

function renderModelOptions() {
  modelSelect.innerHTML = state.models
    .map((model, index) => `<option value="${index}">${model.name}</option>`)
    .join("");
}

function updateDocumentTitle() {
  if (!state.selectedModel) {
    return;
  }

  document.title = `${state.selectedModel.name} API Pricing Calculator & Costs`;
}

function modelMatchesUrlParam(model, requestedKey) {
  const modelKey = normalizeModelKey(model.name);
  const aliases = modelUrlAliases[modelKey] ?? [];
  const candidates = [model.name, ...aliases].map(normalizeModelKey);

  return candidates.some((candidate) => candidate === requestedKey || candidate.includes(requestedKey));
}

function setSelectedModel(index, shouldUpdateTitle = true) {
  state.selectedModel = state.models[index] ?? state.models[0] ?? null;
  modelSelect.value = String(index);

  if (shouldUpdateTitle) {
    updateDocumentTitle();
  }

  renderModelDetails();
}

function applyUrlModelSelection() {
  const params = new URLSearchParams(window.location.search);
  const requestedModel = params.get("model");

  if (!requestedModel) {
    return;
  }

  const requestedKey = normalizeModelKey(requestedModel);
  const modelIndex = state.models.findIndex((model) => modelMatchesUrlParam(model, requestedKey));

  if (modelIndex >= 0) {
    setSelectedModel(modelIndex);
  }
}

function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function refreshCalculatorViews() {
  calculateCosts();
  renderLeaderboard();
  renderRouteRecommendations();
  renderContextMatrix();
}

function calculateCosts() {
  if (!state.selectedModel) {
    return;
  }

  const stats = getInputStats();
  const totalCost = estimateModelCost(state.selectedModel, stats);

  cacheValue.textContent = `${cacheSlider.value}%`;
  wordCount.textContent = stats.words.toLocaleString("de-DE");
  tokenCount.textContent = Math.round(stats.tokens).toLocaleString("de-DE");
  cachedTokens.textContent = Math.round(stats.cached).toLocaleString("de-DE");
  costEstimate.textContent = currency.format(totalCost);
}

function renderContextMatrix() {
  if (!contextMatrix) {
    return;
  }

  const stats = getInputStats();

  if (!state.models.length || stats.tokens === 0) {
    contextMatrixSummary.textContent = "Waiting for text";
    if (contextMatrixNote) {
      contextMatrixNote.textContent = "Paste text or choose a preset to compare document fit, output limits, and one-time versus cached analysis costs.";
    }
    if (contextFitsCount) contextFitsCount.textContent = "0";
    if (contextOutputCappedCount) contextOutputCappedCount.textContent = "0";
    if (contextTooLargeCount) contextTooLargeCount.textContent = "0";
    contextMatrix.innerHTML = `<tr><td class="px-4 py-4 text-slate-400" colspan="5">Enter text to compare all models.</td></tr>`;
    return;
  }

  const rows = [...state.models]
    .map((model) => {
      const contextWindow = Number(model.context_window ?? 0);
      const contextUsed = contextWindow > 0 ? stats.tokens / contextWindow : 0;
      const fitStatus = getFitStatus(model, stats);

      return {
        model,
        contextUsed,
        fitStatus,
        oneTimeCost: estimateUncachedCost(model, stats),
        cachedRepeatCost: estimateCachedRepeatCost(model, stats)
      };
    })
    .sort((a, b) => {
      const order = { Fits: 0, "Output Cap": 1, "Too Large": 2 };
      return (order[a.fitStatus.label] ?? 3) - (order[b.fitStatus.label] ?? 3) || a.oneTimeCost - b.oneTimeCost;
    });

  const fittingModels = rows.filter((row) => row.fitStatus.label === "Fits").length;
  const outputCappedModels = rows.filter((row) => row.fitStatus.label === "Output Cap").length;
  const tooLargeModels = rows.filter((row) => row.fitStatus.label === "Too Large").length;
  const cheapestFit = rows.find((row) => row.fitStatus.label === "Fits");
  const outputWarning = outputCappedModels > 0
    ? ` ${outputCappedModels} model${outputCappedModels === 1 ? "" : "s"} cannot provide the requested output length.`
    : "";

  contextMatrixSummary.textContent = `${fittingModels}/${rows.length} models fit`;
  if (contextFitsCount) contextFitsCount.textContent = String(fittingModels);
  if (contextOutputCappedCount) contextOutputCappedCount.textContent = String(outputCappedModels);
  if (contextTooLargeCount) contextTooLargeCount.textContent = String(tooLargeModels);
  if (contextMatrixNote) {
    contextMatrixNote.textContent = cheapestFit
      ? `${Math.round(stats.tokens).toLocaleString("en-US")} estimated input tokens. Cheapest fitting model: ${cheapestFit.model.name} at ${currency.format(cheapestFit.oneTimeCost)} one-time or ${currency.format(cheapestFit.cachedRepeatCost)} for a cached repeat.${outputWarning}`
      : `${Math.round(stats.tokens).toLocaleString("en-US")} estimated input tokens. No model fits both context and output limits.${outputWarning}`;
  }
  contextMatrix.innerHTML = rows
    .map(
      ({ model, contextUsed, fitStatus, oneTimeCost, cachedRepeatCost }) => `
        <tr>
          <td class="px-4 py-3 font-medium text-slate-100">${escapeHtml(model.name)}</td>
          <td class="px-3 py-3">
            <span class="rounded-full border px-2 py-1 text-xs font-semibold ${fitStatus.className}">
              ${fitStatus.label}
            </span>
          </td>
          <td class="px-3 py-3 text-right text-cyan-200">${contextUsed > 0 ? `${Math.min(contextUsed * 100, 999).toFixed(1)}%` : "n/a"}</td>
          <td class="px-3 py-3 text-right text-emerald-300">${currency.format(oneTimeCost)}</td>
          <td class="px-3 py-3 text-right text-sky-200">${currency.format(cachedRepeatCost)}</td>
        </tr>
      `
    )
    .join("");
}

function renderModelDetails() {
  const model = state.selectedModel;

  if (!model || !modelDetailTitle) {
    return;
  }

  modelDetailTitle.textContent = `${model.name} metadata`;
  modelSourceLink.href = model.pricing_source_url || "/api/live-prices";
  modelSourceLink.textContent = model.pricing_source_url ? "Pricing source" : "API source";
  detailOutputCost.textContent = detailCurrency.format(model.output_cost_per_1m ?? 0);
  detailCacheCost.textContent = detailCurrency.format(model.cache_read_cost_per_1m ?? 0);
  detailContextWindow.textContent = formatCount(model.context_window);
  detailMaxOutput.textContent = formatCount(model.max_output_tokens);
  detailFeatureBadges.innerHTML = [
    renderFeatureBadge("Prompt cache", model.supports_prompt_caching),
    renderFeatureBadge("Function calling", model.supports_function_calling),
    renderFeatureBadge("Vision", model.supports_vision)
  ].join("");
  detailSourceKey.textContent = `source_key: ${model.source_key ?? "unknown"}`;
  detailLastChecked.textContent = `checked: ${formatDateTime(model.last_checked_at)}`;
}

modelSelect.addEventListener("change", (event) => {
  setSelectedModel(Number(event.target.value));
  calculateCosts();
  renderRouteRecommendations();
  renderContextMatrix();
});

promptInput.addEventListener("input", () => {
  refreshCalculatorViews();
});
cacheSlider.addEventListener("input", () => {
  refreshCalculatorViews();
});
outputTokenInput?.addEventListener("input", () => {
  refreshCalculatorViews();
});
promptPresetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const preset = promptPresets[button.dataset.promptPreset];

    if (!preset) {
      return;
    }

    promptInput.value = preset.text;
    if (outputTokenInput) {
      outputTokenInput.value = String(preset.outputTokens);
    }
    refreshCalculatorViews();
  });
});
leaderboardFilters.forEach((button) => {
  button.addEventListener("click", () => {
    state.leaderboardFilter = button.dataset.leaderboardFilter ?? "all";
    renderLeaderboard();
  });
});
leaderboardSort?.addEventListener("change", (event) => {
  state.leaderboardSort = event.target.value;
  renderLeaderboard();
});
copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copyValue ?? "";
    const originalLabel = button.textContent;

    try {
      await navigator.clipboard.writeText(value);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Copy failed";
    }

    window.setTimeout(() => {
      button.textContent = originalLabel;
    }, 1600);
  });
});
routeUseCase?.addEventListener("change", renderRouteRecommendations);
routePriority?.addEventListener("change", renderRouteRecommendations);
requireVision?.addEventListener("change", renderRouteRecommendations);
requireTools?.addEventListener("change", renderRouteRecommendations);
preferCaching?.addEventListener("change", renderRouteRecommendations);

loadModels().catch((error) => {
  leaderboard.innerHTML = `<tr><td class="px-3 py-4 text-red-300" colspan="4">${error.message}</td></tr>`;
  modelSelect.innerHTML = `<option>Loading failed</option>`;
});

loadRadar().catch((error) => {
  if (radarContainer) {
    radarContainer.innerHTML = `<div class="rounded-2xl border border-red-300/20 bg-red-400/10 p-5 text-sm text-red-200">${error.message}</div>`;
  }
});
