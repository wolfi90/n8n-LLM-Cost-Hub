const fs = require("node:fs/promises");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;
const MAX_SIGNALS = 24;

const QUERIES = [
  "GPT-5.5 API cost",
  "Claude Opus 4.7 expensive",
  "Claude Sonnet 4.6 cost",
  "Gemini 3.1 pricing",
  "Grok 4.20 pricing",
  "DeepSeek V3.2 cheap API",
  "Qwen3 API pricing",
  "Mistral Large 3 cost",
  "LLM API costs",
  "reduce LLM costs",
  "LLM routing costs",
  "OpenRouter pricing"
];

const SUBREDDITS = ["LocalLLaMA", "OpenAI", "ChatGPT", "ArtificialInteligence", "ClaudeAI"];

const INTENT_RULES = [
  {
    intent: "cost_pain",
    keywords: ["too expensive", "expensive", "cost", "costs", "pricing", "bill", "billing", "spend", "budget"]
  },
  {
    intent: "alternative_search",
    keywords: ["alternative", "cheaper", "cheap", "replace", "switch", "instead of", "open source"]
  },
  {
    intent: "routing_interest",
    keywords: ["routing", "router", "gateway", "openrouter", "provider", "providers", "fallback"]
  },
  {
    intent: "benchmarking",
    keywords: ["benchmark", "latency", "comparison", "compare", "best model", "quality"]
  }
];

const HIGH_VALUE_TERMS = [
  "openai",
  "claude",
  "gpt",
  "gemini",
  "grok",
  "qwen",
  "deepseek",
  "sonnet",
  "api",
  "tokens",
  "rag",
  "production"
];

const RISK_RANK = {
  low: 0,
  medium: 1,
  high: 2
};

async function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(path.join(projectRoot, relativePath), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

async function writeJson(relativePath, value) {
  const targetPath = path.join(projectRoot, relativePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`);
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWhitespace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function truncateText(value, maxLength = 560) {
  const text = normalizeWhitespace(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function canonicalKey(candidate) {
  return `${candidate.source}:${candidate.source_id || candidate.url || candidate.title}`.toLowerCase();
}

function daysOld(createdAt) {
  const timestamp = new Date(createdAt).getTime();

  if (Number.isNaN(timestamp)) {
    return 30;
  }

  return Math.max(0, (Date.now() - timestamp) / 86_400_000);
}

function findMatches(text, keywords) {
  const lowerText = text.toLowerCase();
  return keywords.filter((keyword) => lowerText.includes(keyword));
}

function classifySignal(candidate) {
  const text = `${candidate.title} ${candidate.excerpt}`.toLowerCase();
  const intentMatches = INTENT_RULES.map((rule) => ({
    intent: rule.intent,
    matches: findMatches(text, rule.keywords)
  })).filter((entry) => entry.matches.length > 0);
  const matched_keywords = [...new Set(intentMatches.flatMap((entry) => entry.matches))];
  const highValueMatches = findMatches(text, HIGH_VALUE_TERMS);
  const agePenalty = Math.min(12, Math.floor(daysOld(candidate.created_at)));
  const score = Math.max(0, matched_keywords.length * 12 + highValueMatches.length * 5 - agePenalty);
  const intent = intentMatches[0]?.intent ?? "market_noise";
  const outreach_risk = score >= 45 ? "low" : score >= 24 ? "medium" : "high";

  return {
    ...candidate,
    excerpt: truncateText(candidate.excerpt),
    intent,
    matched_keywords,
    score,
    outreach_risk,
    status: "PENDING_APPROVAL"
  };
}

function findModel(models, matcher) {
  return models.find((model) => matcher(`${model.name} ${model.source_key} ${model.provider}`.toLowerCase()));
}

function buildSuggestedReply(signal, models) {
  const cheapest = [...models].sort((a, b) => a.input_cost_per_1m - b.input_cost_per_1m)[0];
  const gpt = findModel(models, (text) => text.includes("gpt-5.5") && !text.includes("pro"));
  const claude = findModel(models, (text) => text.includes("claude sonnet 4.6"));
  const gemini = findModel(models, (text) => text.includes("gemini 3.1 pro"));
  const signalText = `${signal.title} ${signal.excerpt}`;
  const expensiveReference = /claude|sonnet/i.test(signalText)
    ? claude
    : /gemini/i.test(signalText)
      ? gemini
      : gpt || claude || gemini;

  if (!cheapest || !expensiveReference) {
    return "Helpful angle: answer the concrete cost question first, then mention that apiroute.dev has a live model-price comparison if they want to sanity-check alternatives.";
  }

  return [
    "Helpful angle:",
    `The spread is pretty large right now. ${cheapest.name} is around $${cheapest.input_cost_per_1m.toFixed(2)}/1M input tokens, while ${expensiveReference.name} is around $${expensiveReference.input_cost_per_1m.toFixed(2)}/1M input tokens.`,
    "If the workload can tolerate routing by task, separating cheap/default traffic from frontier/reasoning calls can save real money.",
    "Optional mention only if it fits the thread: apiroute.dev keeps a compact comparison snapshot, but provider pages should be verified before production routing."
  ].join(" ");
}

function sortSignalsByUtilityAndRisk(signals) {
  return signals.sort((a, b) => {
    const riskDelta = (RISK_RANK[a.outreach_risk] ?? 9) - (RISK_RANK[b.outreach_risk] ?? 9);

    return riskDelta || b.score - a.score || new Date(b.created_at) - new Date(a.created_at);
  });
}

function refreshSignalForCurrentModels(signal, models) {
  return {
    ...signal,
    suggested_reply: buildSuggestedReply(signal, models),
    operator_note: "Review the source manually before posting. Do not post if the thread bans promotion or if the reply would not add concrete help."
  };
}

function mergeWithPreviousQueue(signals, previousSignals = [], models = []) {
  const seen = new Set(signals.map(canonicalKey));
  const merged = [...signals];

  for (const previousSignal of previousSignals) {
    const key = canonicalKey(previousSignal);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(refreshSignalForCurrentModels({
      ...previousSignal,
      freshness: "preserved_from_previous_queue"
    }, models));

    if (merged.length >= MAX_SIGNALS) {
      break;
    }
  }

  return sortSignalsByUtilityAndRisk(merged).slice(0, MAX_SIGNALS);
}

function buildOperatorInbox(snapshot) {
  const items = (snapshot.signals ?? []).map((signal, index) => ({
    id: canonicalKey(signal),
    priority: index + 1,
    status: signal.status,
    source: signal.source,
    community: signal.community ?? null,
    title: signal.title,
    excerpt: signal.excerpt,
    url: signal.url,
    created_at: signal.created_at,
    author: signal.author ?? null,
    query: signal.query ?? null,
    intent: signal.intent,
    matched_keywords: signal.matched_keywords ?? [],
    score: signal.score,
    outreach_risk: signal.outreach_risk,
    suggested_reply: signal.suggested_reply,
    operator_note: signal.operator_note
  }));

  return {
    metadata: {
      generated_at: snapshot.metadata.generated_at,
      freshness: snapshot.metadata.freshness,
      source: "apiroute_marketing_radar",
      status_policy: "manual_review_required_no_auto_posting",
      total_items: items.length,
      source_errors: snapshot.metadata.source_errors ?? [],
      next_action: "Wolfgang reviews each candidate, edits the reply, and approves manually outside this feed."
    },
    items
  };
}

async function fetchJson(url, label) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "apiroute.dev-marketing-radar/0.1 (+https://apiroute.dev)"
    }
  });

  if (!response.ok) {
    throw new Error(`${label} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchHackerNewsSignals() {
  const minTimestamp = Math.floor(Date.now() / 1000) - ONE_WEEK_SECONDS;
  const candidates = [];

  for (const query of QUERIES) {
    const params = new URLSearchParams({
      query,
      tags: "story,comment",
      hitsPerPage: "12"
    });
    params.append("numericFilters", `created_at_i>${minTimestamp}`);

    const data = await fetchJson(`https://hn.algolia.com/api/v1/search_by_date?${params}`, `HN query "${query}"`);

    for (const hit of data.hits ?? []) {
      const storyId = hit.story_id || hit.objectID;
      candidates.push({
        source: "hacker_news",
        source_id: String(hit.objectID),
        title: normalizeWhitespace(hit.title || hit.story_title || "Hacker News discussion"),
        excerpt: stripHtml(hit.comment_text || hit.story_text || hit.title || hit.story_title),
        url: hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${storyId}`,
        created_at: hit.created_at,
        author: hit.author || null,
        query
      });
    }
  }

  return candidates;
}

async function fetchRedditSignals() {
  const candidates = [];

  for (const subreddit of SUBREDDITS) {
    for (const query of QUERIES.slice(0, 5)) {
      const params = new URLSearchParams({
        q: query,
        restrict_sr: "1",
        sort: "new",
        t: "week",
        limit: "8",
        raw_json: "1"
      });

      const data = await fetchJson(`https://www.reddit.com/r/${subreddit}/search.json?${params}`, `Reddit r/${subreddit} "${query}"`);

      for (const child of data.data?.children ?? []) {
        const post = child.data;
        candidates.push({
          source: "reddit",
          source_id: post.id,
          title: normalizeWhitespace(post.title),
          excerpt: normalizeWhitespace(post.selftext || post.public_description || ""),
          url: `https://www.reddit.com${post.permalink}`,
          created_at: new Date((post.created_utc ?? 0) * 1000).toISOString(),
          author: post.author || null,
          community: `r/${subreddit}`,
          query
        });
      }
    }
  }

  return candidates;
}

function dedupe(candidates) {
  const seen = new Set();
  const unique = [];

  for (const candidate of candidates) {
    const key = canonicalKey(candidate);

    if (!candidate.title || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(candidate);
  }

  return unique;
}

async function collectSignals() {
  const errors = [];
  const sourceRuns = [
    ["hacker_news", fetchHackerNewsSignals],
    ["reddit", fetchRedditSignals]
  ];
  const candidates = [];

  for (const [source, runner] of sourceRuns) {
    try {
      candidates.push(...(await runner()));
    } catch (error) {
      errors.push({
        source,
        message: error.message
      });
    }
  }

  return {
    candidates,
    errors
  };
}

async function main() {
  const pricingData = await readJson("data/mock.json", { models: [] });
  const previousSnapshot = await readJson("data/marketing-radar.json", null);
  const models = pricingData.models ?? [];
  const generatedAt = process.env.APIROUTE_GENERATED_AT || new Date().toISOString();
  const { candidates, errors } = await collectSignals();

  if (!candidates.length && errors.length && previousSnapshot?.signals?.length) {
    const refreshedSignals = sortSignalsByUtilityAndRisk(
      previousSnapshot.signals.map((signal) => refreshSignalForCurrentModels(signal, models))
    ).slice(0, MAX_SIGNALS);
    const preservedSnapshot = {
      ...previousSnapshot,
      metadata: {
        ...previousSnapshot.metadata,
        generated_at: generatedAt,
        freshness: "stale_preserved_after_source_error",
        source_errors: errors
      },
      signals: refreshedSignals
    };

    await writeJson("data/marketing-radar.json", preservedSnapshot);
    await writeJson("api/marketing-radar", preservedSnapshot);
    await writeJson("api/marketing-radar.json", preservedSnapshot);
    const operatorInbox = buildOperatorInbox(preservedSnapshot);
    await writeJson("data/operator-inbox.json", operatorInbox);
    await writeJson("api/operator-inbox", operatorInbox);
    await writeJson("api/operator-inbox.json", operatorInbox);
    console.log("Marketing radar source scan failed without candidates; preserved previous approval queue.");
    return;
  }

  const freshSignals = dedupe(candidates)
    .map(classifySignal)
    .filter((signal) => signal.score >= 12)
    .sort((a, b) => b.score - a.score || new Date(b.created_at) - new Date(a.created_at))
    .slice(0, MAX_SIGNALS)
    .map((signal) => ({
      ...signal,
      suggested_reply: buildSuggestedReply(signal, models),
      operator_note: "Review the source manually before posting. Do not post if the thread bans promotion or if the reply would not add concrete help."
    }));
  const signals = errors.length ? mergeWithPreviousQueue(freshSignals, previousSnapshot?.signals ?? [], models) : sortSignalsByUtilityAndRisk(freshSignals);

  const snapshot = {
    metadata: {
      generated_at: generatedAt,
      freshness: "auto_generated",
      status_policy: "human_approval_required",
      sources: ["hacker_news_algolia", "reddit_public_search"],
      source_errors: errors,
      queries: QUERIES,
      total_candidates: candidates.length,
      total_signals: signals.length
    },
    signals
  };

  await writeJson("data/marketing-radar.json", snapshot);
  await writeJson("api/marketing-radar", snapshot);
  await writeJson("api/marketing-radar.json", snapshot);
  const operatorInbox = buildOperatorInbox(snapshot);
  await writeJson("data/operator-inbox.json", operatorInbox);
  await writeJson("api/operator-inbox", operatorInbox);
  await writeJson("api/operator-inbox.json", operatorInbox);

  console.log(`Updated marketing radar with ${signals.length} approval candidates from ${candidates.length} raw candidates.`);
  console.log(`Updated operator inbox with ${operatorInbox.items.length} manual-review items.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
