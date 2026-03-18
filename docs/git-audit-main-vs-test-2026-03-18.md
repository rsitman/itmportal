# Git audit: `origin/main` vs `origin/test` (2026-03-18)

## Context

This document records a one-time audit of commits present in `origin/main` but not in `origin/test`,
performed on **2026-03-18** for the `portal.itman.cz` internal portal.

Goal: avoid re-triaging the same `main` vs `test` divergence from scratch.

Current scope/decision:
- **Do not port any of the commits listed below to `test` right now.**
- Revisit only if a **specific incident/bug** points to one of these commits, or if we decide to
  intentionally realign `test` with `main` as a separate, planned effort.

## Commits reviewed (in `origin/main` but not in `origin/test`)

Legend:
- **Decision**: do-not-port-now / revisit-on-incident
- **Area**: deploy / auth / dashboard / karat / proxy / debug / historical
- **Note**: short justification

1) `ea2777c` **Clean production state - no secrets**
   - **Decision**: do-not-port-now
   - **Area**: historical / repo housekeeping
   - **Note**: very broad “state/cleanup” style change-set; not a targeted fix for current `test` workflow.

2) `b0a8b9b` **Fix dashboard: add auth token to API calls**
   - **Decision**: do-not-port-now (reviewed)
   - **Area**: dashboard / auth
   - **Note**: alternative dashboard implementation line that hard-depends on token-based fetches; `test` uses a different dashboard structure.

3) `ae41417` **Add authentication to fetchKaratProjectsDirect**
   - **Decision**: do-not-port-now (reviewed)
   - **Area**: karat / auth
   - **Note**: changes auth+caching behavior inside `src/lib/karat-service.ts`; impact unclear without a concrete KARAT auth incident and call-site review.

4) `27af929` **Add Azure AD token auth to KARAT + service-projects APIs**
   - **Decision**: do-not-port-now
   - **Area**: karat / auth / historical
   - **Note**: extremely large change-set touching many areas/files; only revisit for a specific auth incident requiring this exact approach.

5) `dd334d3` **Restore dashboard with complete JSX layout**
   - **Decision**: do-not-port-now (reviewed)
   - **Area**: dashboard
   - **Note**: continues the alternative dashboard line (layout + token-based stats); not aligned with current `test` dashboard.

6) `8158435` **Initial deployment with Azure AD auth and dashboard**
   - **Decision**: do-not-port-now
   - **Area**: deploy / historical
   - **Note**: deployment bootstrap / historical setup; current workflow uses `deploy.sh`.

7) `7eabbf4` **Fixed deployment with legacy-peer-deps**
   - **Decision**: do-not-port-now
   - **Area**: deploy
   - **Note**: touches alternate deploy script(s), not the current `deploy.sh` workflow.

8) `19d4841` **Fixed deployment with full npm install**
   - **Decision**: do-not-port-now
   - **Area**: deploy
   - **Note**: same as above; alternate deploy script evolution.

9) `3265990` **Clean PM2 restart with Azure AD auth**
   - **Decision**: do-not-port-now
   - **Area**: deploy
   - **Note**: deploy script iteration; not used by current process.

10) `8dd161f` **Fix NextAuth deployment - nginx port 3001, debug logging, remove secrets from version control**
   - **Decision**: do-not-port-now
   - **Area**: deploy / auth / debug
   - **Note**: appears tied to a specific nginx/port setup and troubleshooting; current `test` deployment is already stabilized via `deploy.sh`.

11) `8e931ba` **Add NextAuth debug logs and proxy middleware for troubleshooting**
   - **Decision**: do-not-port-now
   - **Area**: debug / proxy
   - **Note**: troubleshooting helpers; only revisit if a concrete proxy/auth incident requires these exact changes.

12) `61d4a7b` **Fix proxy export function name for Next.js 16**
   - **Decision**: revisit-on-incident
   - **Area**: proxy / build
   - **Note**: could matter only if we re-enable/use that proxy module in the current branch topology.

13) `8251757` **Auto deploy to test server**
   - **Decision**: do-not-port-now
   - **Area**: deploy
   - **Note**: automation around alternate deploy scripts; not part of the current controlled deploy (`deploy.sh`).

14) `6a89b77` **Add enhanced debug logging to login form**
   - **Decision**: do-not-port-now
   - **Area**: debug / login
   - **Note**: debug-only logging; not needed unless we have a login incident requiring extra client logging.

15) `10edf23` **Add enhanced debug logging for signIn function**
   - **Decision**: do-not-port-now
   - **Area**: debug / auth
   - **Note**: debug-only; only revisit during a specific sign-in incident.

16) `5a1612b` **Fix deployment script to use ecosystem config with PORT 3001**
   - **Decision**: do-not-port-now
   - **Area**: deploy
   - **Note**: port/ecosystem config for alternate deploy script(s); not used by current `deploy.sh`.

## Summary / decision

**Current decision**: do not port any of the 16 commits above to `origin/test` now.

Revisit only if:
- a specific production/test incident points to one of these commits, or
- we intentionally plan a “main → test realignment” effort with explicit scope and testing.

