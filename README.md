# 🧠 LLM Cost & Arbitrage Hub

**Status:** 🟢 LIVE & OPERATIONAL (Phase 1 & 2 abgeschlossen)
**Architektur:** Zero-Marginal-Cost B2B Micro-SaaS

**Schwesterprojekt:** [Can My GPU Run This LLM](https://can-my-gpu-run-this-llm.vercel.app/) prueft lokale Hardware-Kompatibilitaet, bevor Nutzer eine Cloud/API-Route auswaehlen.

## 🏗️ System-Architektur

Dieses Projekt nutzt eine strikt entkoppelte Architektur ohne klassisches Datenbank-Backend, um Hosting-Kosten auf 0 € zu reduzieren und Ladezeiten zu maximieren.

1. **Frontend (statisches Hosting):**
   * Pures HTML, Vanilla JS und Tailwind CSS.
   * Keine Build-Steps (kein React/Vue), um maximale Wartbarkeit zu garantieren.
   * Das Frontend fetcht asynchron `/api/live-prices`, welches Preise, Metadaten, Tags und Gruppen enthält.
   * **Besonderheit:** Das Frontend nutzt eine Token-Approximation (1 Wort ≈ 1.3 Tokens), berechnet Cache-/Output-Kosten und zeigt eine Context-Fit-Matrix für alle Modelle.

2. **Backend / Data-Pipeline (GitHub Actions + LiteLLM):**
   * Die tagesaktuellen API-Preise werden vollautomatisch vom offiziellen [LiteLLM GitHub Repository](https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json) bezogen.
   * **GitHub Actions:** `.github/workflows/update_llm_prices.yml` läuft täglich und per manuellem `workflow_dispatch`.
   * **Der Transformer:** `scripts/update_pricing_data.js` extrahiert Zielmodelle, rechnet Tokenpreise in `cost_per_1m` um und erzeugt Frontend- und Agent-JSON-Dateien.
   * **Der Marketing-Radar:** `scripts/update_marketing_radar.js` sucht öffentliche Bedarfssignale zu LLM-Kosten, Alternativen und Routing, bewertet diese und erzeugt eine `PENDING_APPROVAL`-Queue.
   * **Der Push:** Die Action commitet nur echte Preisänderungen. Der bestehende FTP-Deploy lädt danach automatisch zu Hostinger hoch.

## 📁 Projektstruktur

* `index.html` - Das Main-Skelett (Dark-Mode UI).
* `js/app.js` - Die asynchrone Berechnungslogik (Slider, Token-Count, API-Costs).
* `data/mock.json` - Der Endpunkt für das Frontend (wird täglich von n8n überschrieben).
* `llms.txt` / `llms-full.txt` - Maschinenlesbare Einstiege für KI-Crawler und Agenten.
* `openapi.yaml` - Tool-Spezifikation für Agenten- und Workflow-Integrationen.
* `api/live-prices`, `api/models`, `api/providers` - Statische JSON-MVP-Endpunkte für Agenten.
* `api/marketing-radar` - Statische Approval-Queue für öffentlich gefundene LLM-Kosten-/Routing-Signale.
* `api/operator-inbox` - Kompakte manuelle Review-Queue fuer das spaetere Gravity Control Center.
* `api/commercial-options` - Maschinenlesbarer Monetarisierungsrahmen fuer Alerts, Premium-Daten und klar markierte Sponsorships.
* `groups/` - Generierte Gruppenseiten fuer frontier, budget, coding, local/open, rag und multimodal.
* `scripts/model_catalog.js` - Zentraler Modellkatalog mit Aliases, Tags, Gruppen und Missing-Price-Policy.
* `scripts/validate_data.js` - Validiert Pflichtmodelle, Preise, Tags, Gruppen und Provider-Zaehlungen.
* `scripts/update_pricing_data.js` - Primärer Pricing-Updater für GitHub Actions.
* `scripts/generate_seo_pages.js` - Generator für Modellseiten, Vergleichsseiten und Sitemap.
* `scripts/update_marketing_radar.js` - Lead-/Demand-Radar für Hermes, ohne automatisches Posting.
* `scripts/n8n_transformer.js` - Legacy-Backup für einen späteren n8n-Fallback.
* `ROADMAP.md` - Priorisierte Todo-Liste fuer den Ausbau von apiroute.dev zum LLM-Entscheidungstool.

## 🚀 Zukünftige Ausbaustufen (Backlog)
* [x] **2026-Modellrefresh:** Zielmodelle auf aktuelle Frontier-, Speed-, Open-Weight- und Enterprise-RAG-Modelle umgestellt.
* [x] **Erweiterung der Modelle:** Weitere Open-Source Modelle (DeepSeek, Mistral) in den Pricing-Transformer aufgenommen.
* [x] **Agentic-Web-MVP:** `llms.txt`, `llms-full.txt`, `openapi.yaml` und statische `/api/...`-Endpunkte bereitstellen.
* [x] **Automatische Pricing-Pipeline:** GitHub Action aktualisiert `data/mock.json` und `/api/...` aus LiteLLM.
* [x] **Context-Window-Kalkulator:** Texteingabe wird gegen alle Modell-Kontextfenster und Output-Limits geprüft.
* [x] **Programmatic SEO:** Statische `/models/...`- und `/compare/...`-Seiten werden aus den Preisdaten generiert.
* [x] **Hermes-Marketing-Radar:** Öffentliche Nachfrage-Signale erkennen, scoren und als manuelle Freigabe-Queue bereitstellen.
* [x] **Monetarisierung V1:** Price-Alert-Waitlist, Premium-API-Interesse und klar markierte Sponsorships vorbereiten, ohne Rankings zu verkaufen.
* [x] **Datenmodell-Skalierung V1:** Zentraler Modellkatalog, Modellgruppen, Missing-Price-Policy und Datenvalidierung fuer 50+ Modelle vorbereitet.
* [x] **Local-AI-Crosslink:** apiroute.dev verweist auf Can My GPU Run This LLM; das lokale Tool verweist bei Cloud-Bedarf zurueck auf apiroute.dev.
* [ ] **Monetarisierung V2:** Echte Leads auswerten und danach entscheiden, ob Alerts, Premium-API oder Sponsorships zuerst produktiv werden.
