# Dependency security triage — 2026-06-24

Commands: `npm audit --omit=dev --json` in `web` and `studio`.

| Area | Package/advisory chain | Direct? | Runtime exploit path here | Safe action |
|---|---|---:|---|---|
| Web | `next` → bundled `postcss` XSS | Yes / transitive | Unlikely. The app does not stringify untrusted CSS, and the audit's proposed fix is a destructive downgrade from Next 16 to 9. | Do not apply the downgrade. Track the next patched Next 16 release and upgrade normally. |
| Web + Studio | Sanity CLI/workbench → module-federation → `undici` / `ws` | Transitive build tooling | No public browser runtime path. Exposure is limited to trusted local/CI build and Studio tooling. | Upgrade Sanity/next-sanity when upstream publishes a compatible patched chain; do not downgrade majors. |
| Web + Studio | Sanity preview/CLI → `uuid` / `typeid-js` | Transitive | No: this project does not pass attacker-controlled buffers to UUID v3/v5/v6. | Accept temporarily; remove through a normal upstream patch. |
| Web + Studio | Vercel framework detection → `js-yaml` | Transitive build tooling | No remote YAML ingestion in the deployed app. | Accept temporarily; remove through an upstream CLI update. |
| Web | `next-sanity` / visual-editing chain | Direct / transitive | Preview is not public in the Gate 2 slice; no draft token is shipped. | Keep current compatible major; revisit in Phase 4 preview work. |
| Studio | `sanity` and `@sanity/vision` | Direct | Studio is authenticated; advisories are inherited from the CLI/tooling chains above. | Keep both packages on the same release line and take a tested patch release, not npm's suggested major downgrade. |

Snapshot: web reports 18 production advisories (7 high, 11 moderate); Studio reports 15 (7 high, 8 moderate). No critical advisories. No forced or major-changing audit fix was applied.
