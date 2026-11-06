# Production Reminder Cutover Procedure

## Current Route Overrides Historical Migration Steps

For the new independent intake, use [New Intake Cutover Runbook](NEW_INTAKE_CUTOVER_RUNBOOK.md).
Do NOT install legacy code, update the old deployment or migrate the live Sheet merely to
launch the new Sheet. Historical steps 5-7 below apply only to an explicitly approved
legacy compatibility migration, not the current new-intake plan.

Current read-only recheck: owner-visible old Head daily reminder remains ACTIVE; Running
filter showed zero at inspection. The new synthetic project has reminders=false and zero
installable triggers. Neither fact proves the old project is paused globally.

After explicit authority: inventory each owner's matching handler, delete ONLY the approved
old `runTSGFollowUpReminders` trigger, refresh to verify absence, inspect BOTH Running and
Paused executions across writers/owners, allow in-flight work to finish, then recheck through
an agreed quiet interval. No stopping executions, source/property change or setup helper
is implicitly authorized. A false property does not disable old version 2. Cached clients may
still write to the old endpoint; monitor old and new Sheets separately. No data repair.
Restore no reminder automatically on rollback; review the actual Head runner and obtain
separate schedule/recipient/backlog approval before re-creating a trigger or sending mail.

Status: PREPARED ONLY. No trigger, deployment, property, live Sheet or email changed. Every production operation below requires explicit approval.

## Inspected Baseline

Read-only recheck on 16 October 2026:
- Project: 1wCcJh9WBnfpOqtun6gzhR5v-81pOLHJsxtXvwCnDRSTrR1w1kJEAy5YU, signed in as info.theskateguys@gmail.com.
- One owner-visible installable trigger: runTSGFollowUpReminders, Head, Time-based, Day timer, 10am-11am GMT-04:00. Failure notifications: daily. The schedule was inspected in the prior read-only review.
- Last displayed run: 16 October 2026 10:04:04 AM, completed in 6.377 seconds. All nine visible executions over seven days were completed at this recheck. This is a point-in-time owner view, not a guarantee of future/global quiescence or delivered mail.
- Current original legacy code does not honor a reminder-disable property. No script properties existed at the source/settings inspection. Production reminder scheduling is ACTIVE.
- Other owners' installable triggers are not necessarily visible to this account. Ask each relevant owner to audit their triggers; do not infer absence.
- The separate isolated project has TSG_AUTOMATIC_REMINDERS_ENABLED=false and only its unrelated onOpen trigger. Do not use its settings as evidence for production.

## Pause: Only After Explicit Approval

1. Record source/version, trigger handler/owner, schedule/timezone, failure notifications, properties, live Sheet identity and current running executions. Take approved fresh backups before editing. Do not include customer data in public logs.
2. In the production project's Triggers page, use More Options for the recorded runTSGFollowUpReminders trigger and delete that trigger only. Apps Script does not provide a pause toggle here; preserve its recorded schedule for any later restoration. Leave unrelated triggers and deployments unchanged.
3. Verify the handler is absent in each owner's trigger inventory. A false property alone cannot disable the original version-2 code. Do not run its setup/install functions, which recreate the trigger.
4. Inspect Executions with the running-status filter. Let an in-flight reminder finish, or stop it only under separately approved incident/cutover instructions. Deleting the trigger does not cancel work already running. Stop is not a rollback of email or Sheet writes already performed.
5. Install only reviewed safe Head code with an explicit verified live-Sheet property and TSG_AUTOMATIC_REMINDERS_ENABLED=false, after authorization. Verify the installed source/version and keep all reminder entry points fail-closed.
6. Update the legacy deployment to the tested compatibility version at the SAME URL under deployment approval. New legacy requests then use guarded code. Drain or explicitly stop all remaining original-version executions, including doPost tracking/submissions, before strict setup/new deployment or staff status changes during the coordinated cutover window. The old unguarded executions do not acquire the new code's lock.
7. Refresh the execution list after the legacy update. Confirm no old unsafe version is running, reminders remain absent/false, and any already-completed writes are reconciled by Lead ID against the backup/audit history without blindly overwriting legitimate staff edits. Use an approved maintenance window if quiescence cannot be established.

## Verify Paused State

- Current safe Head source and every retained public status writer are verified; no original unsafe execution remains.
- Reminder property is exactly false on safe code and all owners report no reminder triggers.
- No setup/install action recreates a trigger while false; offline tests cover this. Do not test by invoking the unsafe live runner.
- No new scheduled executions occur after the pause, accounting for previously running jobs. Observe actual executions, not only the property.
- Keep reminders paused throughout migration, staged release/fallback tests and rollback. A restore operation is not an automatic part of cutover.

## Restore: A Separate Decision With Email Side Effects

Restoration enables future follow-up emails. Do not restore merely because the prior schedule was active.
1. Obtain explicit approval for reminder activation and the intended recipients/backlog policy. Review old due rows and Last Contacted/status values before enabling; do not send a catch-up batch or reset those fields automatically.
2. Verify the actual current Head code, shared-lock/status guards, protected Confirmed/Paid/Replied checks, pre-send marker writability and the intended live Sheet. The new legacy candidate's reminder tests do NOT validate a later strict Head runner. Strict reminder activation is not accepted by this preparation; review and test that actual runner, including formula/marker preservation and direct helper entry points, before enabling it. Never restore original unsafe version 2 or its installer to resume mail.
3. Under approval, set TSG_AUTOMATIC_REMINDERS_ENABLED=true and install exactly one owner-approved daily runTSGFollowUpReminders trigger for the recorded 10am-11am GMT-04 schedule (America/Puerto_Rico currently; verify any approved timezone change). The reviewed installer may be used only if its schedule matches the approved record. Restore daily failure notifications and audit other owners for duplicates.
4. Do not manually run reminders as a restore test: that could send immediately. Inspect the created handler/Head/schedule and observe the next scheduled execution. Any earlier real-email test requires its own explicit permission.
5. If activation is incorrect or unsafe, use an approved pause again, set false on safe code and remove only the relevant triggers. Preserve Last Contacted/status/notes and sent-message history.

## Rollback Rules

A website or versioned Web App rollback does not revert current Head, properties, trigger ownership or scheduled executions. Leave the compatibility-safe legacy writer in place, reminders false and trigger absent during rollback. Reconcile new leads rather than restoring a pre-release Sheet over them. Resume only through the separate restoration decision above.

References: [installable triggers and ownership](https://developers.google.com/apps-script/guides/triggers/installable), [versioned deployments](https://developers.google.com/apps-script/concepts/deployments), [script locks](https://developers.google.com/apps-script/reference/lock/lock-service).
