# Desktop Merch — workspace instructions

Directory: `C:/Users/infot/OneDrive/Documents/Dylon/.review/desktop-merch`
Branch: `codex/desktop-merch`
Base: `5592c39bfd6a0f8db850b048e83b770bdd64e402`
Commit trailer: `Codex-Workspace: Desktop-Merch`

This workspace starts from the published WhatsApp-only source. The original uncommitted colour-selector draft remains in the original root checkout and the verified transfer ZIP. It has NOT been overlaid here: compare and port only requested changes in a later implementation task.

Read AGENTS.md first. Before work, run `git status --short --branch` and verify the directory/branch above. Keep all edits and staging inside this worktree. Include a clear task description in each commit message. The local Git hook adds the workspace trailer; confirm it in `git log -1 --format=full` before any separately authorized push.

GitHub changes only after a push. This setup does not authorize pushing. Vercel Git deployments remain enabled at project level; these new branches are LOCAL ONLY and have no newly added deployment-disable file. Do not push them without checking the Vercel implications and explicit authorization. The transfer branch has its own deployment disable, which must not be assumed to apply here.

The author remains the actual configured Git author. This label identifies the working area, not a verified Codex login. If working on a different computer/clone, the local hook is not transferred automatically; read the handoff and set up a separate worktree and label there before work.

## Reference

Transfer branch: https://github.com/theskateguys/The-Skate-Guys-Site/tree/codex/transfer-handoff
Handoff: https://github.com/theskateguys/The-Skate-Guys-Site/blob/codex/transfer-handoff/HANDOFF.md
Existing merch ZIP: C:/Users/infot/OneDrive/Documents/Dylon/output/transfer/tsg-merch-uncommitted-2026-11-06.zip

No website code was changed as part of workspace setup. AGENTS.md and this file are local uncommitted instructions.
