const fs = require("node:fs/promises");
const path = require("node:path");
const { GROUP_DEFINITIONS } = require("./model_catalog");

const projectRoot = path.resolve(__dirname, "..");
const baseUrl = "https://apiroute.dev";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compactNumber(value) {
  const numericValue = Number(value ?? 0);

  if (!numericValue) {
    return "n/a";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(numericValue);
}

function usd(value) {
  return `$${Number(value ?? 0).toFixed(3).replace(/\.?0+$/, "")}`;
}

function usdLong(value) {
  return `$${Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function featureText(model) {
  return [
    model.supports_prompt_caching ? "prompt caching" : null,
    model.supports_function_calling ? "function calling" : null,
    model.supports_vision ? "vision" : null
  ]
    .filter(Boolean)
    .join(", ") || "standard chat completion";
}

function pageShell({ title, description, canonicalPath, body }) {
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  return `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <script>
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/insights/script.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
    <main class="mx-auto max-w-5xl px-5 py-10">
      <nav class="mb-10 flex flex-wrap gap-3 text-sm text-cyan-200">
        <a class="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2" href="/">apiroute.dev</a>
        <a class="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2" href="/models/">Models</a>
        <a class="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2" href="/compare/">Compare</a>
        <a class="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2" href="/api/live-prices">API</a>
      </nav>
      ${body}
    </main>
  </body>
</html>
`;
}

function metricCard(label, value) {
  return `<div class="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
    <span class="block text-xs uppercase text-slate-500">${escapeHtml(label)}</span>
    <strong class="mt-2 block text-2xl text-white">${escapeHtml(value)}</strong>
  </div>`;
}

function miniMetric(label, value) {
  return `<div class="rounded-xl border border-white/10 bg-slate-950/40 p-4">
    <dt class="text-xs uppercase text-slate-500">${escapeHtml(label)}</dt>
    <dd class="mt-2 font-mono text-sm text-slate-100">${escapeHtml(value)}</dd>
  </div>`;
}

function modelSummary(model) {
  return `<div class="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
    <h3 class="text-xl font-semibold text-white">${escapeHtml(model.name)}</h3>
    <p class="mt-2 text-sm text-slate-400">${escapeHtml(model.provider)} · ${escapeHtml(model.source_key)}</p>
    <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-3">
      <div><dt class="text-slate-500">Input</dt><dd class="font-mono text-emerald-300">${usd(model.input_cost_per_1m)}</dd></div>
      <div><dt class="text-slate-500">Output</dt><dd class="font-mono text-cyan-300">${usd(model.output_cost_per_1m)}</dd></div>
      <div><dt class="text-slate-500">Context</dt><dd class="font-mono text-slate-100">${compactNumber(model.context_window)}</dd></div>
    </dl>
  </div>`;
}

function modelPage(model) {
  const slug = slugify(model.name);
  const title = `${model.name} API Pricing, Context Window, and Token Costs`;
  const description = `${model.name} costs ${usd(model.input_cost_per_1m)} per 1M input tokens and ${usd(model.output_cost_per_1m)} per 1M output tokens. Compare context window, cache pricing, and capabilities.`;

  return {
    path: `/models/${slug}/`,
    html: pageShell({
      title,
      description,
      canonicalPath: `/models/${slug}/`,
      body: `<section>
        <p class="text-sm font-semibold uppercase text-cyan-200">Model pricing</p>
        <h1 class="mt-3 text-5xl font-light leading-tight text-white">${escapeHtml(model.name)} API pricing</h1>
        <p class="mt-5 max-w-3xl text-lg leading-8 text-slate-300">${escapeHtml(description)}</p>
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          ${metricCard("Input / 1M tokens", usd(model.input_cost_per_1m))}
          ${metricCard("Output / 1M tokens", usd(model.output_cost_per_1m))}
          ${metricCard("Cache read / 1M", usd(model.cache_read_cost_per_1m))}
          ${metricCard("Context window", compactNumber(model.context_window))}
        </div>
        <section class="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">
          <h2 class="text-2xl font-semibold text-white">When to use ${escapeHtml(model.name)}</h2>
          <p class="mt-4 leading-7">${escapeHtml(model.name)} is listed from ${escapeHtml(model.provider)} with ${escapeHtml(featureText(model))}. Use this page to estimate prompt cost and compare it against alternatives before routing production workloads.</p>
          <p class="mt-4 font-mono text-sm text-slate-400">source_key: ${escapeHtml(model.source_key)}</p>
        </section>
      </section>`
    })
  };
}

function requestCost(model, inputTokens, outputTokens) {
  return (inputTokens / 1_000_000) * Number(model.input_cost_per_1m ?? 0) +
    (outputTokens / 1_000_000) * Number(model.output_cost_per_1m ?? 0);
}

function comparePathFor(first, second, models) {
  const firstIndex = models.findIndex((model) => model.name === first.name);
  const secondIndex = models.findIndex((model) => model.name === second.name);
  const [left, right] = firstIndex <= secondIndex ? [first, second] : [second, first];

  return `/compare/${slugify(left.name)}-vs-${slugify(right.name)}/`;
}

function modelProfile(model) {
  const existingTags = [...(model.category_tags ?? []), ...(model.model_groups ?? [])];

  if (existingTags.length) {
    return [...new Set(existingTags)];
  }

  const text = `${model.name} ${model.provider} ${model.source_key}`.toLowerCase();
  const inputPrice = Number(model.input_cost_per_1m ?? 0);
  const outputPrice = Number(model.output_cost_per_1m ?? 0);
  const contextWindow = Number(model.context_window ?? 0);
  const tags = [];

  if (inputPrice <= 0.35 && outputPrice <= 1.5) tags.push("high-volume");
  if (contextWindow >= 1_000_000) tags.push("long-context");
  if (/claude|gpt|qwen|grok|mistral-large|deepseek/.test(text)) tags.push("coding");
  if (/gpt-5.5|claude|grok|gemini-3.1-pro|qwen3|max|deepseek/.test(text)) tags.push("reasoning");
  if (/llama|deepseek|qwen|mistral/.test(text)) tags.push("open-weight");
  if (model.supports_vision) tags.push("vision");
  if (model.supports_function_calling) tags.push("tools");
  if (model.supports_prompt_caching) tags.push("cache-friendly");

  return tags;
}

function groupPage(groupId, models) {
  const label = groupId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const description = GROUP_DEFINITIONS[groupId] ?? `Models tagged for ${label.toLowerCase()} routing.`;
  const sortedModels = [...models].sort((a, b) => Number(a.input_cost_per_1m ?? 0) - Number(b.input_cost_per_1m ?? 0));

  return {
    path: `/groups/${slugify(groupId)}/`,
    html: pageShell({
      title: `${label} LLM API Models and Pricing`,
      description,
      canonicalPath: `/groups/${slugify(groupId)}/`,
      body: `<section>
        <p class="text-sm font-semibold uppercase text-cyan-200">Model group</p>
        <h1 class="mt-3 text-5xl font-light leading-tight text-white">${escapeHtml(label)} LLM models</h1>
        <p class="mt-5 max-w-3xl text-lg leading-8 text-slate-300">${escapeHtml(description)}</p>
        <div class="mt-8 grid gap-4 md:grid-cols-2">
          ${sortedModels.map(modelSummary).join("")}
        </div>
      </section>`
    })
  };
}

function decisionBullets(model, other) {
  const bullets = [];
  const costAdvantage = requestCost(model, 1_000_000, 200_000) <= requestCost(other, 1_000_000, 200_000);
  const contextAdvantage = Number(model.context_window ?? 0) > Number(other.context_window ?? 0);
  const outputAdvantage = Number(model.max_output_tokens ?? 0) > Number(other.max_output_tokens ?? 0);

  if (costAdvantage) bullets.push(`${model.name} is the better default for cost-sensitive traffic and repeated high-volume calls.`);
  if (contextAdvantage) bullets.push(`${model.name} is safer for long documents, repository analysis, and RAG prompts because it has the larger context window.`);
  if (outputAdvantage) bullets.push(`${model.name} gives more room for long generated answers, reports, or code output.`);
  if (model.supports_prompt_caching && !other.supports_prompt_caching) bullets.push(`${model.name} is stronger when the same large prompt or document is reused because it supports prompt caching.`);
  if (model.supports_vision && !other.supports_vision) bullets.push(`${model.name} is required if images, screenshots, or visual documents are part of the workflow.`);
  if (model.supports_function_calling && !other.supports_function_calling) bullets.push(`${model.name} is the safer pick for tool-calling agents and structured function workflows.`);

  if (!bullets.length) {
    bullets.push(`${model.name} is a reasonable pick when its provider, latency, or integration path fits your stack better.`);
  }

  return bullets.slice(0, 3);
}

function riskBullets(model) {
  const text = `${model.name} ${model.source_key}`.toLowerCase();
  const risks = [];

  if (/preview|beta/.test(text)) risks.push("Preview or beta model: verify availability and pricing before production rollout.");
  if (Number(model.context_window ?? 0) < 200_000) risks.push("Smaller context window: long PDFs, codebases, or RAG prompts may need chunking.");
  if (Number(model.output_cost_per_1m ?? 0) >= 20) risks.push("High output price: cap max tokens for verbose generation workloads.");
  if (!model.supports_prompt_caching) risks.push("No prompt caching in this snapshot: repeated long-context calls may be more expensive.");
  if (!model.supports_function_calling) risks.push("No function-calling flag in this snapshot: test agent/tool workflows first.");

  return risks.length ? risks : ["No major capability risk is flagged in this snapshot, but provider pages should still be verified before production routing."];
}

function costRows(left, right) {
  const workloads = [
    { label: "1M input + 200K output", input: 1_000_000, output: 200_000 },
    { label: "10M input + 2M output", input: 10_000_000, output: 2_000_000 },
    { label: "100M input + 20M output", input: 100_000_000, output: 20_000_000 }
  ];

  return workloads
    .map((workload) => {
      const leftCost = requestCost(left, workload.input, workload.output);
      const rightCost = requestCost(right, workload.input, workload.output);
      const cheaper = leftCost <= rightCost ? left : right;

      return `<tr class="border-t border-white/10">
        <td class="px-4 py-3 text-slate-300">${escapeHtml(workload.label)}</td>
        <td class="px-4 py-3 text-right font-mono text-slate-100">${usdLong(leftCost)}</td>
        <td class="px-4 py-3 text-right font-mono text-slate-100">${usdLong(rightCost)}</td>
        <td class="px-4 py-3 text-right text-emerald-300">${escapeHtml(cheaper.name)}</td>
      </tr>`;
    })
    .join("");
}

function capabilityTable(left, right) {
  return `<dl class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    ${miniMetric(`${left.name} max output`, compactNumber(left.max_output_tokens))}
    ${miniMetric(`${right.name} max output`, compactNumber(right.max_output_tokens))}
    ${miniMetric(`${left.name} features`, featureText(left))}
    ${miniMetric(`${right.name} features`, featureText(right))}
  </dl>`;
}

function similarComparisons(left, right, models) {
  const candidates = [
    [...models].sort((a, b) => requestCost(a, 1_000_000, 200_000) - requestCost(b, 1_000_000, 200_000))[0],
    [...models].sort((a, b) => Number(b.context_window ?? 0) - Number(a.context_window ?? 0))[0],
    models.find((model) => /gpt-5.5 pro/i.test(model.name)) ?? models[0]
  ]
    .filter(Boolean)
    .filter((model) => model.name !== left.name && model.name !== right.name)
    .filter((model, index, array) => array.findIndex((candidate) => candidate.name === model.name) === index)
    .slice(0, 3);

  if (!candidates.length) {
    return "";
  }

  return `<section class="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
    <h2 class="text-2xl font-semibold text-white">Related comparisons</h2>
    <div class="mt-4 grid gap-3 md:grid-cols-3">
      ${candidates
        .map((model) => `<a class="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10" href="${comparePathFor(left, model, models)}">${escapeHtml(left.name)} vs ${escapeHtml(model.name)}</a>`)
        .join("")}
    </div>
  </section>`;
}

function comparePage(left, right, models) {
  const leftSlug = slugify(left.name);
  const rightSlug = slugify(right.name);
  const cheaperInput = left.input_cost_per_1m <= right.input_cost_per_1m ? left : right;
  const cheaperRequest = requestCost(left, 1_000_000, 200_000) <= requestCost(right, 1_000_000, 200_000) ? left : right;
  const largerContext = left.context_window >= right.context_window ? left : right;
  const title = `${left.name} vs ${right.name}: API Pricing and Context Window`;
  const description = `Compare ${left.name} and ${right.name} on input price, output price, cache pricing, context window, and API capabilities.`;

  return {
    path: `/compare/${leftSlug}-vs-${rightSlug}/`,
    html: pageShell({
      title,
      description,
      canonicalPath: `/compare/${leftSlug}-vs-${rightSlug}/`,
      body: `<section>
        <p class="text-sm font-semibold uppercase text-cyan-200">Model comparison</p>
        <h1 class="mt-3 text-5xl font-light leading-tight text-white">${escapeHtml(left.name)} vs ${escapeHtml(right.name)}</h1>
        <p class="mt-5 max-w-3xl text-lg leading-8 text-slate-300">${escapeHtml(description)}</p>
        <div class="mt-8 grid gap-5 lg:grid-cols-2">
          ${modelSummary(left)}
          ${modelSummary(right)}
        </div>
        <section class="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">
          <h2 class="text-2xl font-semibold text-white">Quick take</h2>
          <p class="mt-4 leading-7">${escapeHtml(cheaperInput.name)} has the lower input price at ${usd(cheaperInput.input_cost_per_1m)} per 1M input tokens. ${escapeHtml(cheaperRequest.name)} is cheaper for the example blended workload below. ${escapeHtml(largerContext.name)} has the larger context window at ${compactNumber(largerContext.context_window)} tokens.</p>
        </section>
        <section class="mt-8 grid gap-5 lg:grid-cols-2">
          <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h2 class="text-2xl font-semibold text-white">Choose ${escapeHtml(left.name)} if...</h2>
            <ul class="mt-4 list-disc space-y-3 pl-5 text-slate-300">
              ${decisionBullets(left, right).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h2 class="text-2xl font-semibold text-white">Choose ${escapeHtml(right.name)} if...</h2>
            <ul class="mt-4 list-disc space-y-3 pl-5 text-slate-300">
              ${decisionBullets(right, left).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        </section>
        <section class="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div class="border-b border-white/10 p-6">
            <h2 class="text-2xl font-semibold text-white">Example workload cost</h2>
            <p class="mt-3 text-sm leading-6 text-slate-400">Estimates use input tokens plus 20% output tokens. They exclude provider discounts, cache hits, and tool/search surcharges.</p>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-slate-900/70 text-xs uppercase text-slate-500">
              <tr>
                <th class="px-4 py-3 text-left">Workload</th>
                <th class="px-4 py-3 text-right">${escapeHtml(left.name)}</th>
                <th class="px-4 py-3 text-right">${escapeHtml(right.name)}</th>
                <th class="px-4 py-3 text-right">Cheaper</th>
              </tr>
            </thead>
            <tbody>${costRows(left, right)}</tbody>
          </table>
        </section>
        <section class="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">
          <h2 class="text-2xl font-semibold text-white">Context, output, and capability fit</h2>
          <p class="mt-4 leading-7">${escapeHtml(largerContext.name)} provides the larger context window. Check max output separately when the task needs long reports, code generation, or full-document rewrites.</p>
          ${capabilityTable(left, right)}
          <div class="mt-6 grid gap-5 lg:grid-cols-2">
            <div>
              <h3 class="font-semibold text-white">Risk notes for ${escapeHtml(left.name)}</h3>
              <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">${riskBullets(left).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
            <div>
              <h3 class="font-semibold text-white">Risk notes for ${escapeHtml(right.name)}</h3>
              <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">${riskBullets(right).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </div>
        </section>
        <section class="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 class="text-2xl font-semibold text-white">Routing tags</h2>
          <div class="mt-4 flex flex-wrap gap-2">
            ${[...new Set([...modelProfile(left), ...modelProfile(right)])].map((tag) => `<span class="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </section>
        ${similarComparisons(left, right, models)}
      </section>`
    })
  };
}

function indexPage(title, description, canonicalPath, items) {
  return pageShell({
    title,
    description,
    canonicalPath,
    body: `<section>
      <p class="text-sm font-semibold uppercase text-cyan-200">apiroute.dev</p>
      <h1 class="mt-3 text-5xl font-light leading-tight text-white">${escapeHtml(title)}</h1>
      <p class="mt-5 max-w-3xl text-lg leading-8 text-slate-300">${escapeHtml(description)}</p>
      <div class="mt-8 grid gap-4 md:grid-cols-2">
        ${items
          .map(
            (item) => `<a class="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10" href="${item.href}">
              <span class="font-semibold text-white">${escapeHtml(item.label)}</span>
              <span class="mt-2 block text-sm text-slate-400">${escapeHtml(item.description)}</span>
            </a>`
          )
          .join("")}
      </div>
    </section>`
  });
}

async function removeGeneratedDirectory(relativePath) {
  await fs.rm(path.join(projectRoot, relativePath), {
    recursive: true,
    force: true
  });
}

async function writePage(page) {
  const targetPath = path.join(projectRoot, page.path, "index.html");
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, page.html);
}

async function writeSitemap(paths) {
  const urls = ["/", "/models/", "/compare/", "/llms.txt", "/llms-full.txt", "/openapi.yaml", ...paths];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (urlPath) => `  <url>
    <loc>${baseUrl}${urlPath}</loc>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  await fs.writeFile(path.join(projectRoot, "sitemap.xml"), body);
}

async function main() {
  const data = JSON.parse(await fs.readFile(path.join(projectRoot, "data/mock.json"), "utf8"));
  const models = data.models ?? [];

  if (models.length < 2) {
    throw new Error("At least two models are required for SEO page generation.");
  }

  await removeGeneratedDirectory("models");
  await removeGeneratedDirectory("compare");
  await removeGeneratedDirectory("groups");

  const pages = [];
  const modelPages = models.map(modelPage);
  pages.push(...modelPages);
  const groupPages = Object.keys(GROUP_DEFINITIONS)
    .map((groupId) => {
      const groupModels = models.filter((model) => (model.model_groups ?? []).includes(groupId));
      return groupModels.length ? groupPage(groupId, groupModels) : null;
    })
    .filter(Boolean);
  pages.push(...groupPages);

  for (let leftIndex = 0; leftIndex < models.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < models.length; rightIndex += 1) {
      pages.push(comparePage(models[leftIndex], models[rightIndex], models));
    }
  }

  const modelIndexItems = modelPages.map((page, index) => ({
    href: page.path,
    label: models[index].name,
    description: `${usd(models[index].input_cost_per_1m)} input, ${compactNumber(models[index].context_window)} context`
  }));

  const comparisonItems = pages
    .filter((page) => page.path.startsWith("/compare/"))
    .map((page) => ({
      href: page.path,
      label: page.path.split("/").filter(Boolean).at(-1).replaceAll("-", " "),
      description: "Model pricing and context comparison"
    }));
  const groupItems = groupPages.map((page) => {
    const groupId = page.path.split("/").filter(Boolean).at(-1);
    return {
      href: page.path,
      label: `${groupId.replaceAll("-", " ")} models`,
      description: GROUP_DEFINITIONS[groupId] ?? "Model group"
    };
  });

  await writePage({
    path: "/models/",
    html: indexPage(
      "LLM API model pricing pages",
      "Browse model-specific API pricing pages with token costs, context windows, and feature metadata.",
      "/models/",
      modelIndexItems
    )
  });

  await writePage({
    path: "/compare/",
    html: indexPage(
      "LLM API model comparisons",
      "Compare popular LLM APIs by input price, output price, cache pricing, and context window.",
      "/compare/",
      comparisonItems
    )
  });

  await writePage({
    path: "/groups/",
    html: indexPage(
      "LLM API model groups",
      "Browse grouped LLM APIs for frontier reasoning, budget routing, coding, local/open-weight deployment, RAG, and multimodal work.",
      "/groups/",
      groupItems
    )
  });

  for (const page of pages) {
    await writePage(page);
  }

  await writeSitemap([...pages.map((page) => page.path), "/groups/"]);
  console.log(`Generated ${pages.length + 3} SEO pages.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
