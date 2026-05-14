const state = {
  models: [],
  selectedModel: null
};

const leaderboard = document.querySelector("#leaderboard");
const modelSelect = document.querySelector("#modelSelect");
const promptInput = document.querySelector("#promptInput");
const cacheSlider = document.querySelector("#cacheSlider");
const cacheValue = document.querySelector("#cacheValue");
const wordCount = document.querySelector("#wordCount");
const tokenCount = document.querySelector("#tokenCount");
const cachedTokens = document.querySelector("#cachedTokens");
const costEstimate = document.querySelector("#costEstimate");

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 6,
  maximumFractionDigits: 6
});

async function loadModels() {
  const response = await fetch("data/mock.json");

  if (!response.ok) {
    throw new Error("Mock-Daten konnten nicht geladen werden.");
  }

  const data = await response.json();
  state.models = data.models;
  state.selectedModel = state.models[0] ?? null;

  renderLeaderboard();
  renderModelOptions();
  calculateCosts();
}

function renderLeaderboard() {
  const sortedModels = [...state.models].sort((a, b) => a.input_cost_per_1m - b.input_cost_per_1m);

  leaderboard.innerHTML = sortedModels
    .map(
      (model) => `
        <tr class="hover:bg-slate-900/80">
          <td class="px-3 py-3 font-medium text-slate-100">${model.name}</td>
          <td class="px-3 py-3 text-slate-400">${model.provider}</td>
          <td class="px-3 py-3 text-right text-emerald-300">$${model.input_cost_per_1m.toFixed(2)}</td>
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

function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function calculateCosts() {
  if (!state.selectedModel) {
    return;
  }

  const words = countWords(promptInput.value);
  const tokens = words * 1.3;
  const cacheRatio = Number(cacheSlider.value) / 100;
  const cached = tokens * cacheRatio;
  const uncached = tokens - cached;
  const inputCost = (uncached / 1_000_000) * state.selectedModel.input_cost_per_1m;
  const cacheCost = (cached / 1_000_000) * state.selectedModel.cache_read_cost_per_1m;
  const totalCost = inputCost + cacheCost;

  cacheValue.textContent = `${cacheSlider.value}%`;
  wordCount.textContent = words.toLocaleString("de-DE");
  tokenCount.textContent = Math.round(tokens).toLocaleString("de-DE");
  cachedTokens.textContent = Math.round(cached).toLocaleString("de-DE");
  costEstimate.textContent = currency.format(totalCost);
}

modelSelect.addEventListener("change", (event) => {
  state.selectedModel = state.models[Number(event.target.value)];
  calculateCosts();
});

promptInput.addEventListener("input", calculateCosts);
cacheSlider.addEventListener("input", calculateCosts);

loadModels().catch((error) => {
  leaderboard.innerHTML = `<tr><td class="px-3 py-4 text-red-300" colspan="3">${error.message}</td></tr>`;
  modelSelect.innerHTML = `<option>Fehler beim Laden</option>`;
});
