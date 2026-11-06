# TSG Project Instructions

## Model Routing

- Use `gpt-6-astra` as the lead orchestrator. Reserve its substantive work for architecture, conflicting evidence, difficult cross-system failures and final release-decision review.
- Use `gpt-6-luna` for narrow, read-heavy utility tasks: file discovery, fact extraction, checking a specific document and summarising test output.
- Use `gpt-6.1-sol` for scoped implementation, debugging, tests and documentation. Default subagent reasoning effort is `medium`.
- When delegating, explicitly select the assigned model; do not merely describe an agent as Luna or Sol. If a requested model is unavailable or cannot be selected by the available tools, report that limitation instead of silently substituting or claiming it ran.

## Planning And Delegation

At the start of each substantial task, identify:
1. The next concrete step and its dependency.
2. Which parts can run independently.
3. The model assigned to each part and why.
4. The evidence required to call the task complete.

Keep no more than two subagents open concurrently, excluding the primary lead. Delegate only independent work. Assign distinct files or areas; agents must not edit the same files concurrently. Wait for dependent results before beginning dependent work. Do small tasks directly when delegation adds no useful independence.

## Handoffs And Evidence

At each handoff, report completed work, verification evidence, remaining risk, the next action, any decision required from the user and the recommended model for that next action. Distinguish mocked tests, local browser checks, isolated Google tests and actual production verification. Never present a test result as production verification.

## TSG Boundaries

- Preserve existing instructions and unrelated user changes. Inspect the working tree before editing; never reset, stash or overwrite unrelated work to make it clean.
- Keep the booking review branch `codex/single-session-booking-review` separate from the main checkout. Prefer the existing `.review/booking-flow` worktree for booking-review work; verify its branch and status before using it. Do not switch branches or change the approved booking flow without a relevant user task.
- Clearly distinguish the isolated Apps Script test project/deployment and copied test Sheet from the live Sheet and production website. Verify the destination before any external write or test submission.
- Do not push, merge, switch endpoints, deploy or send additional customer emails without explicit user instruction for that action and destination. Design approval or a passing test does not authorize release.
- Keep automatic reminders disabled during isolated tests. Use existing labelled test records where practical, preserve Lead IDs on unchanged retries and disclose any email side effect before a new real submission.
- For setup-only tasks, change only Codex instructions/settings. Do not modify booking logic, lead-capture files, the Google Apps Script endpoint or customer data.
