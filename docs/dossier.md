# CG Portfolio — Complete Project Dossier (imported)

**Source document:** `docs/CG_Portfolio_Complete_Project_Dossier_and_Roadmap.pdf`
**Imported:** 2026-11-22
**Status of the document:** a planning dossier written 22 November 2026. It records *decisions and recommendations* from an earlier conversation branch. Items marked *(unverified)* were never confirmed and must not be treated as fact.

> This markdown copy is a faithful restructuring of the PDF so it is searchable and diffable in the repo.
> The PDF remains the source of truth; if the two disagree, the PDF wins.

---

## 1. Executive summary

CG Portfolio is a premium portfolio website for flute artist **Chinmay Goud** *(spelling per the live site; the dossier writes "Gaurd" — unverified)*. The central creative idea: the visitor enters a living forest and discovers the artist through an immersive environment rather than a conventional musician template.

Homepage vision: a particle-native forest — an ancient moss-covered tree rising from the lower-left, branches extending across the scene, grass, bushes, flowers, a pond and airborne particles forming a calm, richly detailed environment. A bamboo bansuri floats horizontally near the centre. On scroll the flute gradually disassociates into particles and the camera travels through the environment into the portfolio.

The site must balance a comforting, cozy natural atmosphere with premium presentation, and must appeal to wedding and traditional-event organisers, spiritual and cultural programmes, orchestras, concerts, clubs, international events and private clients without locking the artist into one genre.

Recommended arrangement *(recommendation, not current state — see `docs/architecture.md`)*: Hermes Agent as local orchestrator, Codex CLI as primary engineering agent, Blender as procedural 3D workshop, Meshy as optional cloud asset generator. Web stack recommended in the dossier: React + TypeScript, Three.js / React Three Fiber, GSAP ScrollTrigger. Hosting: GitHub + Vercel.

Workstation: Windows 11, Intel Core i5 (generation *(unverified)*), Intel integrated graphics, 16 GB RAM. Cloud-backed model inference rather than a large local model.

Primary success measure: a distinctive, responsive, maintainable portfolio where the forest and flute transitions are genuinely interactive, and where music, biography, performances, journey and inquiry stay easy to discover.

## 2. Creative direction

### 2.1 Inspiration
TIGRIS (jewelry site, attributed in the conversation to Loro Labs) — tiger, ruby structure and particle-transition effects. Take inspiration from the sophistication of particle-based 3D transitions; do not copy design, assets, code or brand.

### 2.2 Confirmed direction
- **Environment:** lush forest, not a generic nature photograph or fantasy-game scene.
- **Tree:** large tree from the lower-left, trunk along the left edge, organic branches toward the right.
- **Vegetation:** moss on trunk and branches, dense grass and bushes along the bottom, ferns, roots, small flowers, natural stones.
- **Pond:** calm irregular pond in the lower-middle, gentle ripples, reflections, occasional floating leaves. *(not yet implemented)*
- **Flute:** recognisable bamboo bansuri floating horizontally near centre — the artist's musical identity, not a product for sale.
- **Particle identity:** the environment's structures are *represented by* particles where practical, not merely decorated with an overlay.
- **Movement:** continuous subtle environmental motion plus cinematic scroll-controlled transitions.
- **Flute transition:** controlled particle disassociation on scroll — not an explosion and not a simple opacity fade; reversible or gracefully resettable.
- **Atmosphere:** wind conveyed by moving leaves, grass, flowers and airborne particles; avoid oversized metallic ribbons or artificial glowing wind streaks.

### 2.3 Palette

| Token | Hex | Use |
|---|---|---|
| Deep forest | `#071A12` | Dark base, deep scene areas |
| Botanical green | `#10291B` | Canopy and background depth |
| Moss green | `#163D28` | Moss, vegetation, tree detail |
| Fern green | `#47734B` | Foliage and environmental accents |
| Muted sage | `#B6C89B` | Soft highlights, readable accents |
| Warm natural highlight | `#D6C99A` | Sunlit accents, restrained warmth |
| Peacock teal | `#167F78` | Subtle colour accent |

Avoid excessive purple, cyberpunk neon, overdone gold glitter, excessive bloom, noisy UI and generic glassmorphism. Extravagance comes from intricate detail, light, depth, material quality and controlled motion.

## 3. Experience and content architecture

| Section | Purpose |
|---|---|
| 01 — Home | Immersive forest, artist identity, concise introduction, central flute, invitation to explore |
| 02 — About | Biography, musical background, philosophy, instrument expertise, verified qualifications |
| 03 — Music library | Real recordings, titles, descriptions, categories, playback controls and progress |
| 04 — Performance gallery | Photography and video from events, concerts, orchestras, weddings, international and private appearances |
| 05 — Artist journey | Chronological timeline of training, milestones, performances, achievements, education |
| 06 — Events and bookings | Event types the artist serves, backed by real experience and media |
| 07 — Contact and inquiry | Name, email, phone, event type, date, location, message |

**Do not fabricate** biography, qualifications, awards, performance history, client logos or testimonials. Use clearly marked placeholders until the artist supplies verified details.

### 3.1 Audio experience
- Forest ambience (wind, birds, water) optional and independently enabled/disabled. *(not implemented)*
- Artist recordings with track selection, play/pause, progress and volume.
- **No autoplay** — visitors choose to start sound.
- Optional subtle audio-reactive visuals; avoid exaggerated frequency-driven effects. *(not implemented)*

## 4. Particle-native visual system

| Asset | Requirement | Expected output |
|---|---|---|
| Ancient tree | Organic trunk, twisting branches, twigs, moss, leaf clusters | Blender source, optimised mesh, sampled points/colours |
| Moss | Irregular clumps, variable density and green tones | Reusable geometry/instances and particle samples |
| Leaves | Several shapes/sizes, natural pivots, wind response | Instanced assets + particle samples |
| Grass/ferns | Layered heights, clumps, roots, bushes, stones | Low-poly/instanced assets + density maps |
| Wildflowers | Small cream/white flowers, subtle centres, varied stems | Models, instancing, particle samples |
| Pond | Irregular shore, reflections, ripples, floating leaves | Water shader, shoreline geometry, interaction |
| Atmosphere | Pollen, dust, occasional leaves, soft light motes | GPU-friendly particle systems |
| Bansuri | Accurate bamboo flute, holes, subtle surface imperfections | GLB model, surface samples, morph target points |

### 4.1 Particle data contract
Deterministic point sets for anything that morphs or disassociates: consistent counts, stable indexing, attributes for position, colour, size, velocity, seed, target position, phase and optional surface normal. Keep source geometry and particle samples linked by asset id and version.

### 4.2 Transition states
1. **Assembled** — particles form a recognisable flute silhouette.
2. **Loosening** — positions begin interpolating away from the surface.
3. **Drifting** — controlled wind/flow field with varied velocity and turbulence.
4. **Integrated** — particles blend into the environment or the next state.
5. **Reverse** — scrolling up interpolates back to assembled, or uses a designed reset.

Interpolate between sampled targets with shader-driven motion and scroll progress. Never a one-time particle explosion.

## 5. Technical architecture (as recommended)

| Layer | Technology | Responsibility |
|---|---|---|
| Orchestration | Hermes Agent | Planning, delegation, project memory, tool coordination |
| Coding agent | Codex CLI | Repository inspection, implementation, debugging, tests, refactoring |
| 3D authoring | Blender | Procedural geometry, asset prep, point sampling, GLB export |
| Optional AI assets | Meshy | Initial model generation, selected texturing (cloud, paid) |
| Web application | React + TypeScript | UI, sections, navigation, content |
| 3D rendering | Three.js + R3F + Drei | Scene, camera, geometry, materials, particles |
| Animation | GSAP + ScrollTrigger | Scroll progress, camera choreography, transitions |
| Shaders | GLSL | Custom particle, water and material effects |
| Audio | Web Audio API | Playback, optional subtle audio-reactive interaction |
| Version control | Git + GitHub | Branches, commits, review, recovery |
| Deployment | Vercel | Preview and production hosting |

Principle: keep the particle renderer independent from content and UI — separate scene composition, particle simulation, shader materials, scroll choreography, audio, content data and interface components.

**See `docs/architecture.md` for what is actually implemented in this repository.**

### 5.1 Local vs cloud
- **Local:** Hermes runtime, Codex CLI, Blender, project files, Git, local site development.
- **Cloud-backed:** model inference, Meshy, GitHub, Vercel.
- **Not recommended on this hardware:** a large local LLM alongside Blender, browser sessions and multiple coding agents.

## 6. Workstation profile and constraints *(unverified except OS/RAM)*

| Component | Known | Implication |
|---|---|---|
| OS | Windows 11 64-bit | Native Windows first; WSL2 optional |
| CPU | Intel Core i5, generation unknown | Identify before setting render/build expectations |
| GPU | Intel integrated | Conservative real-time effects, instancing, adaptive particle budgets |
| Memory | 16 GB | Avoid heavy concurrent renders and local model processes |
| Coding | Codex CLI | Primary coding interface inside the repo |
| AI strategy | Cloud-backed | Keep local hardware focused on development and rendering |

Performance posture: Eevee for interactive previews; assume no GPU compute guarantees; instancing and point buffers over thousands of objects; adaptive particle tiers; compressed web exports; simplified fallback if WebGL is missing or the device struggles; test on the real machine early.

## 7. Tools and responsibilities

| Agent/tool | Role | Boundaries |
|---|---|---|
| Hermes lead | Plans, decomposes, coordinates, records decisions | No silent overwrites, credit spend or deployment |
| Codex CLI | Primary engineer: site, shaders, tests, integration | Scoped branches; reports changes and test results |
| Blender | Procedural assets and exports | Test scenes first; keep source `.blend` files |
| Meshy | Optional 3D generation | Cloud credits; approval before paid generation |
| QA | Browser/device testing, performance, accessibility | Reports and proposes; no unapproved production changes |
| GitHub | Source of truth | Branches and review; never commit secrets |
| Vercel | Hosting and previews | Preview first; public deploy needs approval |

Start with three roles: lead (Hermes), graphics engineer (Blender + Codex), frontend engineer (Codex). Add QA after the particle prototype exists.

**Delegation rule:** one primary editor for application code at a time; do not run two agents with write access to the same files.

## 8. Windows installation sequence *(plan, not a guarantee — re-check official docs)*

1. **Preflight audit** — `winver`, `Get-CimInstance Win32_Processor`, `Win32_VideoController`, `Win32_ComputerSystem`, `git --version`, `node --version`, `npm --version`, `python --version`; record exact CPU, GPU/driver, RAM, disk; check for an existing repo and uncommitted work.
2. **Git for Windows** — official site or winget; configure identity only after choosing it.
3. **Node.js LTS** — verify `node`/`npm`.
4. **Codex CLI** — official OpenAI instructions for Windows; authenticate; verify it reads the repo.
5. **Hermes Agent** — official Windows guide; health check; configure provider separately from Codex.
6. **Blender** — stable supported Windows release (dossier targeted 5.1+; re-check compatibility).
7. **Blender integration** — official Hermes marketplace integration; verify with a read-only scene inspection before modifying anything.
8. **Meshy** — defer until the core pipeline works; check credit requirements.
9. **GitHub + Vercel** — connect after ownership, scopes and deploy settings are clear; preview before production.

Authentication separation: Codex auth does not authenticate Hermes; keep keys in the provider's credential store, never in source, commits or `AGENTS.md`.

Blender bridge safety: keep bound to localhost, never expose to LAN/internet, connect only trusted clients, verify the real port and security model from current docs.

## 9. Workspace and repository structure

Use the existing repository; do not create a competing copy or overwrite a working tree. Suggested layout:

```
CG-Portfolio/
├── AGENTS.md
├── README.md
├── docs/            project-brief · visual-direction · architecture ·
│                    particle-system · content-requirements
├── website/
│   ├── src/         components · scenes · particles · shaders ·
│   │                animations · audio · sections
│   └── public/
├── assets/          blender/ models/ textures/ particles/ audio/ images/ videos/
├── scripts/         blender/ particle-generation/ optimization/
├── tests/
└── exports/
```

Keep editable Blender sources separate from optimised web exports. Track asset provenance, licence, source, dimensions, texture sizes and export settings.

## 10. Production roadmap

| Phase | Duration | Workstreams | Exit milestone |
|---|---|---|---|
| 0. Discovery and audit | 1–2 d | Repo, hardware, content, references, constraints | Approved scope and baseline |
| 1. Local AI infrastructure | 2–3 d | Hermes, Codex, Git, Blender, MCP, optional Meshy | Integrations pass tests |
| 2. Design and architecture | 2–4 d | Visual system, UX map, scene composition, particle contract | Approved architecture |
| 3. Asset pipeline | 5–10 d | Tree, moss, grass, flowers, pond, flute, sampling, exports | Optimised asset pack |
| 4. Particle engine prototype | 5–8 d | Point rendering, shader attributes, flow field, morphing, tiers | Interactive test scene passes on target device |
| 5. Homepage | 4–7 d | Scene composition, flute transition, scroll choreography, nav | Responsive immersive homepage |
| 6. Portfolio sections | 5–8 d | About, music, gallery, timeline, events, inquiry form | Complete content experience |
| 7. QA and optimisation | 3–5 d | Desktop/mobile, a11y, performance, reverse scroll, audio, forms | Release candidate |
| 8. Deployment and handover | 1–3 d | Workflow, preview, domain, production, docs | Approved live deployment |

### Phase gates
- **Gate A — infrastructure:** no production asset work until Codex, Hermes and Blender verify independently.
- **Gate B — visual feasibility:** no full asset build until a small tree/leaf/flute prototype runs acceptably on the target machine.
- **Gate C — content readiness:** no fabricated copy; collect verified facts, audio, images and video before final polish.
- **Gate D — release:** no production deployment until forms, audio, responsive layout, accessibility and fallback are tested.

## 11. Asset production specification

- **Tree/canopy:** trunk from lower-left, branches rightward, varied thickness, twisting, bark irregularity, roots, natural silhouettes; moss and leaf/flower clusters as separate reusable assets; particle samples preserving silhouettes at multiple densities.
- **Moss/leaves/ground:** several moss clump shapes and tones (no uniform carpet); leaf variants with size/pivot/wind response; grass clumps, ferns, bushes, roots, mossy stones as instanced assets; density maps to avoid even spacing.
- **Flowers:** small forest flowers in white/cream/muted botanical tones; several varieties with stems and petals; distributed sparingly.
- **Pond:** irregular shoreline, water shader, gentle ripples, subtle reflections, occasional floating leaves; natural and understated, never a flat bright-blue plane.
- **Bansuri:** recognisable Indian bamboo bansuri, accurate proportions, finger holes, subtle surface imperfections, floating horizontally at centre; both a conventional 3D representation and a particle-sampled one; a musical signature, not a product hero shot.
- **Export/handoff:** keep source `.blend`, optimised GLB/GLTF, materials/textures, particle coordinate data, documentation and a preview render per asset; record version, dimensions, polygon count, texture size, licence/source, intended use; produce lower-detail mobile variants.

## 12. Particle engine and scroll choreography

**Renderer:** `BufferGeometry`/`Points` for clouds, `InstancedMesh` for repeats; per-particle position, colour, size, seed, velocity, phase, target; GLSL for vertex motion, size variation, depth and shading; deterministic seeds; spatially varying curl-noise flow field for wind (never animate all particles identically).

**Wind:** legible through environmental response — grass bends, leaves sway, pollen drifts, occasional leaves fall, flowers move at a different frequency from airborne particles. No giant silver ribbons or obvious artificial streaks. Field varies by position and depth.

**Scroll choreography:**
1. Visitor enters the forest; idle motion already active.
2. Camera and scene begin a measured movement as scrolling progresses.
3. Flute stays recognisable, then surface particles gradually detach into the flow field.
4. Particle movement leads the eye into the next section rather than obscuring content.
5. Content panels reveal with calm editorial timing and readable contrast.
6. Reverse scroll returns to a coherent earlier state without popping or reset glitches.

**Rules:** do not hijack normal scrolling; drive state from scroll progress rather than one-off triggers; keep the scene animated when scrolling stops; respect reduced motion with a static/simplified presentation; test wheel, trackpad, touch, keyboard and reverse scroll.

## 13. Portfolio functionality

| Feature | Requirements | Content dependencies |
|---|---|---|
| Biography | Structured intro, philosophy, background | Verified biography, approved portrait |
| Audio library | Tracks, play/pause, progress, volume, selection | Real recordings, titles, rights |
| Video/photo gallery | Responsive gallery and playback | Event media and usage permission |
| Journey timeline | Chronological milestones and education | Dates, venues, credentials, evidence |
| Events | Weddings, traditional, spiritual, cultural, orchestra, club, concert, corporate, private, international as applicable | Verified capabilities |
| Inquiry form | Name, email, phone, event type, date, location, message; validation and states | Chosen backend/provider |

The inquiry form must have a real submission integration, server-side validation, spam protection and honest success/error states. Never show success if submission did not succeed. Collect only what is needed to respond.

## 14. Performance, accessibility and QA

**Performance:** particle budgets by device capability, measured on the real integrated GPU; instancing, LOD, compressed assets, lazy loading; limit transparency/overdraw/shadows/post-processing; light first scene before detail; adaptive quality and WebGL fallback; profile memory, draw calls, texture sizes, shader compile time, initial load.

**Accessibility:** keyboard-accessible navigation and controls; readable contrast over moving backgrounds; respect `prefers-reduced-motion` with a low-motion mode; never autoplay audio; label controls and expose playback state; gallery, timeline and form usable without 3D; meaningful alt text and captions/transcripts.

**QA matrix:**

| Area | Cases |
|---|---|
| Rendering | WebGL available/unavailable, shader compile, low-quality fallback, resize, orientation |
| Particles | Initial formation, wind, disassociation, reverse scroll, no popping, stable memory |
| Scroll | Wheel, trackpad, touch, keyboard, reduced motion, scroll restoration |
| Audio | Play/pause, track change, volume, interruption, no autoplay, mobile restrictions |
| Content | All biography/timeline claims verified; media loads and is licensed |
| Forms | Validation, server response, error, success, spam controls, privacy notice |
| Responsive | Desktop, tablet, small mobile, landscape and portrait |
| Deployment | Env vars, production assets, routes, HTTPS, form delivery, rollback |

## 15. Security, approvals and operational rules

- Audit files and Git status before changes; branch or back up before major work.
- Least privilege for GitHub, Vercel and external services.
- Never expose keys, passwords or tokens in prompts, source, commits or screenshots.
- Keep local MCP bridges on localhost.
- Explicit approval required before deleting/overwriting files, privileged installs, account permission changes, Meshy spend, or public deployment.
- Separate development branch; review before merging.
- No two agents with write access to the same files concurrently.
- Keep a decision log, task ledger and record of failed integration tests.

## 16. Risks and mitigations

| Risk | Why | Mitigation |
|---|---|---|
| Integrated GPU bottleneck | Dense 3D and post-processing may run poorly | Prototype early; adaptive budgets; reduce overdraw |
| 16 GB RAM pressure | Blender, browser and agents compete | No local LLM; heavy tasks sequential |
| Overambitious particle detail | Asset count and shader complexity delay delivery | One representative prototype first |
| Meshy cost/quality | Credits and cleanup | Trial assets; approve spend; refine in Blender |
| Tool integration drift | Plugin commands change | Follow current docs; verify with a small test |
| Content not supplied | Facts and media cannot be invented | Content checklist and placeholders; artist approval |
| Mobile performance | Desktop concept may not translate | Mobile tiers and non-WebGL fallback from the start |
| Scope creep | New effects delay functionality | Protect milestones; prioritise audio, gallery, inquiry |
| Security exposure | Local bridge and credentials are powerful | Localhost-only, least privilege, approvals |

## 17. Milestones

| Milestone | Acceptance criteria |
|---|---|
| M0 — Environment ready | Git, Node, Codex, Hermes, Blender installed; versions recorded; no unresolved critical security issue |
| M1 — Integrations verified | Codex reads project; Hermes provider works; Blender bridge inspects a test scene; Meshy optional |
| M2 — Visual prototype | Tree silhouette, grass/leaf instances, pond placeholder, flute point cloud run acceptably on target PC |
| M3 — Particle engine | Deterministic sampling, wind field, scroll-driven morph, reversible transition, in isolation |
| M4 — Homepage | Composition, navigation, typography, camera motion, responsive fallbacks integrated |
| M5 — Complete portfolio | Biography, player, gallery, timeline, events, inquiry form with real approved content |
| M6 — Release candidate | QA matrix passes; performance and accessibility issues addressed |
| M7 — Production | Deployment live, domain and env configured, rollback path and maintenance docs exist |

## 18. Immediate next actions

1. Run the Windows preflight audit; record exact Core i5 model, Intel graphics adapter and driver, RAM, disk.
2. Inspect the existing repo and Git status; preserve existing work.
3. Install or verify Git and Node LTS.
4. Install and authenticate Codex CLI; verify it can inspect the repo without modifying files.
5. Install Hermes via the official Windows guide; project profile; separate provider auth.
6. Install Blender; verify it opens and saves a test scene.
7. Install the official Hermes Blender integration; read-only inspection, then a controlled test-scene change.
8. Defer Meshy until pipeline and asset spec are approved.
9. Build the first browser prototype: one tree silhouette, instanced leaves/grass, atmospheric particles, particle bansuri.
10. Measure performance on the actual PC; adjust particle budget before producing the full environment.

> The first technical prototype is the most important early proof — it prevents spending days generating assets that cannot run smoothly on the target hardware.

## Appendix A — Codex project instructions (suggested `AGENTS.md`)

The repository's `AGENTS.md` is derived from this appendix, updated to describe the stack that is actually in use.

## Appendix B — Hermes orchestration brief

Hermes is the central coordinator: audit environment and repo first, then coordinate Codex, Blender and optional Meshy. Verify integrations rather than assume success. Do not modify or delete existing project files, spend credits, change permissions or deploy publicly without explicit approval.

## Appendix C — Verification checklist

| Check | Evidence | Done |
|---|---|---|
| Hardware audit | Exact CPU, GPU/driver, RAM, disk recorded | ☐ |
| Git | Version output; repo status understood | ☐ |
| Node/npm | Supported versions verified | ☐ |
| Codex CLI | Starts, authenticates, reads AGENTS.md, inspects repo | ☐ |
| Hermes | Starts, health check passes, provider configured | ☐ |
| Blender | Opens, saves, reopens a test `.blend` | ☐ |
| Blender integration | Read-only inspection works; test action verified | ☐ |
| Meshy optional | Plugin authenticated; credit policy understood | ☐ |
| Repository safety | Branch/backup created; no unknown destructive changes | ☐ |
| Prototype | Tree/grass/flute particle test runs and is measured | ☐ |
| Release readiness | Responsive, accessibility, audio, form and deployment checks pass | ☐ |

## Appendix D — Cost and deployment notes

Local tools may be free, but model usage, asset generation, hosting, domains and third-party integrations carry costs or limits. Check current pricing and entitlements before enabling paid usage: Codex CLI (ChatGPT plan/API), Hermes (local software, provider inference costs), Blender (open source), Meshy (credits), GitHub (plan-dependent; private repo if content is not public), Vercel (plan/bandwidth terms), domain and form/email services (recurring).

**Official documentation starting points:** Hermes Agent · hermes-agent.nousresearch.com · OpenAI Codex · developers.openai.com/codex · Blender · blender.org/download · Three.js · threejs.org/docs · React Three Fiber · r3f.docs.pmnd.rs · GSAP · gsap.com/docs · Meshy · meshy.ai · GitHub · docs.github.com · Vercel · vercel.com/docs

---

## Import notes — divergence from the current repository

The dossier is a *recommendation* document. As of import day, the repository differs in several ways. Future work should treat `docs/architecture.md` as the description of reality and this file as the intent.

1. **Stack:** implemented as vanilla ES modules + Vite + a hand-written 2D canvas particle renderer (`src/scene.js`, `src/intro.js`), with GSAP/ScrollTrigger for scroll choreography and Lenis for smoothing. The dossier recommends React + TypeScript + Three.js/R3F. No migration is planned unless requested.
2. **Missing environment features:** pond, wildflowers, ferns, bushes, stones and forest ambience audio are not implemented. Tree, branch, vines, grass, flute and atmosphere particles are.
3. **Flute transition:** currently a scroll-driven disassociation with a musical-note burst on release; the dossier's five states (assembled → loosening → drifting → integrated → reverse) are only partially expressed.
4. **Artist name spelling** in the dossier body is "Gaurd"; the live site uses "Goud". Treat the live site as correct.
5. **Content:** all biography, qualification, venue and performance claims remain placeholders pending verified artist material. Do not fill them from the dossier.
