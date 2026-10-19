<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Roll-number login maps to synthetic emails; signup assigns only student access and privileged user management is admin-checked.
- Event organisers are authorised through a separate event assignment table with unique event and user constraints; registration RPCs reject organisers and admins so attendance-only access is enforced beyond the UI.
- Three separate entry points: student `/auth`, organiser `/organiser-login` → `/organiser-desk` (assigned organisers only), admin `/admin-login` → `/admin` (admins only); each login rejects other roles so portals never mix.
- Registration is idempotent with a unique user/event constraint and a private code; attendance is awarded atomically through an event-authorised, code-verifying RPC, never a student self-claim.
- Only organiser-verified attendance contributes to leaderboard totals; legacy awards and quizzes remain deprecated and unavailable to app users.
- Roster queries search and paginate in the database; leaderboard ranking is database-side with 50-row pages and shared query caching; polling pauses in background tabs to reduce concurrent-user traffic.
- Browser code imports Supabase from `@/lib/supabase-tab`; a sessionStorage adapter preserves reloads while fresh document-specific auth channels isolate duplicated tabs. Server functions use `attachTabAuth`, and logout uses local scope so other tabs/devices remain signed in.
- Organiser account identity comes from protected profile account_type; event assignment is a separate permission. Unassigned organisers stay signed in on the pending-assignment page, never the student dashboard.
- Attendance is marked by organisers via `mark_attendance_by_code(event, student_code)`: one permanent code per student; the scan auto-registers the student for that event, awards credits once, and locks them to that event (profiles.locked_event_id) until the organiser calls `release_student`.
- Exactly one admin: a DB trigger rejects any second admin role and signup never grants admin; organiser eligibility comes from profiles.account_type set at organiser signup.
- Registration exports use one authorised database snapshot RPC and one shared workbook builder; this prevents partial downloads and cross-query concurrency inconsistencies while restricting organiser event data to their assignment.
