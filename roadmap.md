# Verified event participation
- [x] Use an explicit eventTeams query result throughout TeamRegistration; nine targeted tests pass and build OK. Reported deployed bundle unavailable; live assigned-organiser verification still requires an authorised session.

- [x] Correct organiser signup/login; verify signup, pending assignment, sign-in, reloads, wrong-portal rejection, and independent tabs/browser contexts. Seven targeted tests pass; temporary test account removed.
- [x] Consolidate downloads into one consistent registration workbook with a master student sheet and authorised event sheets; five workbook tests pass.
- [ ] Verify the live admin download; injected preview session does not reach the admin workspace, so an active admin session is still required.
- [x] Replace awards and self-claim credits with verified participation only.
- [x] Add event organiser allocation, private codes and paginated attendance management.
- [x] Refresh student pages and effects; keep the leaderboard available to both roles.
- [x] Test uniqueness, event permissions and exact credits; verify the full attendance flow.
- [x] Add organiser signup with name and roll number; event access waits for admin assignment.
- [x] Separate organiser registration into its own page and verify signup.
- [x] Enforce one event per organiser and attendance-only access.
- [x] Assign Anitha (2023115066) to SEQUEL and verify attendance and shared leaderboard updates.
- [x] Per-event team sizes: CLUEDO 3–5, LOGIC LOCKDOWN 1–3, BRAINBID 1–3, SEQUEL 1–2, others 2–3 — enforced in register_team; organiser page shows dynamic slots. 38 tests pass.
