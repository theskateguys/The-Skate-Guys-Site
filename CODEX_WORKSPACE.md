# Other Chat Booking — workspace instructions

Directory: `C:/Users/infot/OneDrive/Documents/Dylon/.review/other-chat-booking`
Branch: `codex/other-chat-booking`
Base: `b4c6ada1ff26141d324786cc5276ee69b88456ff`
Commit trailer: `Codex-Workspace: Other-Chat-Booking`

This workspace starts from the unactivated booking-review source. It is separate from the original review worktree. Existing history/branch guards remain unchanged and may reject this new branch; do not bypass them. Any booking implementation, Google submission or release needs a separately scoped task.

Read AGENTS.md first. Before work, run `git status --short --branch` and verify the directory/branch above. Keep all edits and staging inside this worktree. Include a clear task description in each commit message. The local Git hook adds the workspace trailer; confirm it in `git log -1 --format=full` before any separately authorized push.

GitHub changes only after a push. This setup does not authorize pushing. Vercel Git deployments remain enabled at project level; these new branches are LOCAL ONLY and have no newly added deployment-disable file. Do not push them without checking the Vercel implications and explicit authorization. The transfer branch has its own deployment disable, which must not be assumed to apply here.

The author remains the actual configured Git author. This label identifies the working area, not a verified Codex login. If working on a different computer/clone, the local hook is not transferred automatically; read the handoff and set up a separate worktree and label there before work.

## Reference

Transfer branch: https://github.com/theskateguys/The-Skate-Guys-Site/tree/codex/transfer-handoff
Handoff: https://github.com/theskateguys/The-Skate-Guys-Site/blob/codex/transfer-handoff/HANDOFF.md
Existing merch ZIP: C:/Users/infot/OneDrive/Documents/Dylon/output/transfer/tsg-merch-uncommitted-2026-11-06.zip

No website code was changed as part of workspace setup. AGENTS.md and this file are local uncommitted instructions.
