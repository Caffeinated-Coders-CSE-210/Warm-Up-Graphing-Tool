# Contributing Guidelines

This document describes the contribution workflow our team uses for this project.

## Creating Issues

When creating a new issue, include enough information for another team member to understand the task and know what is required for it to be considered complete.

A typical issue should include:

- A clear title.
- A short description of the problem, task, or improvement.
- A list of tasks or expected changes.
- Acceptance criteria that define when the issue is complete.
- A priority.
- A lead or owner when applicable.

When creating the issue, use GitHub task-list checkboxes for actionable tasks and acceptance criteria. Add relevant labels, priority, and project status when applicable. Keep each issue focused on one task or a closely related set of changes.

### Suggested Issue Format

```text
## Description
Briefly describe the task or problem.

## Tasks
- [ ] Task 1
- [ ] Task 2

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

Priority: Core / Optional
Lead: Team member or role
```

## Contribution Workflow

For each task or issue:

1. Claim the GitHub issue you plan to work on and review its labels, priority, and project status.
2. Create a short-lived branch for the task.
3. Make changes that stay focused on the issue and follow the style of the existing code.
4. Run the relevant automated tests and browser checks.
5. Open a pull request and link the related issue.
6. Identify and request review from at least one teammate.
7. Address any review comments or requested changes.
8. Merge the pull request after it is approved and the required checks pass.
9. Delete the branch after it is merged and no longer needed.

## Branch Naming
For normal development work, avoid committing directly to `main`. Create a separate branch for each focused task or feature, and use a pull request to merge changes back into `main`.

Use the following format:

`<type>/<short-description>`

Common branch types include:

- `feat/` — new features
- `fix/` — bug fixes
- `docs/` — documentation changes
- `test/` — testing-related changes
- `refactor/` — code restructuring that does not change behavior
- `ci/` — CI or workflow changes

Examples:

- `feat/point-editing`
- `fix/csv-line-numbers`
- `docs/contributing-guidelines`
- `test/export-validation`
- `ci/node-tests`

Branch names should be short and descriptive, using lowercase words separated by hyphens. Task branches should usually be short-lived and merged back into the main branch once the work is complete.

## Commit Messages

Use clear commit messages that describe the change.

Recommended format:

`<type>: <short description>`

Common commit types include:

- `feat:` — add a new feature
- `fix:` — fix a bug
- `docs:` — update documentation
- `test:` — add or update tests
- `refactor:` — restructure code without changing behavior
- `ci:` — update CI or automated workflows
- `chore:` — general maintenance work

Examples:

- `feat: add point editing`
- `fix: correct CSV error line numbers`
- `docs: add contributing guidelines`
- `test: add export validation coverage`
- `ci: add GitHub Actions workflow for Node tests`

Try to keep each commit focused on one change.

## Making Changes

Keep changes focused on the issue you are working on.

When modifying existing code:

- Follow the style used by the surrounding code.
- Avoid unrelated refactoring or formatting changes.
- Update documentation if the behavior or usage changes.
- Add or update tests when needed.

If you find an unrelated issue while working, consider creating a separate GitHub issue instead of including it in the same pull request.

## Testing and Verification

Before opening a pull request, run the relevant automated tests for the project.

For the current graphing tool, run:

```bash
node --test tests/*.test.cjs
```

For changes that affect the UI or interactive behavior, also perform the relevant browser checks.

Depending on the change, this may include:

- Checking that the application loads correctly.
- Testing the affected functionality manually.
- Checking relevant edge cases.
- Making sure existing functionality still works.
- Verifying exported files or visual output when applicable.

List the checks you performed in the pull request under **How I checked it**.

## Pull Requests

Each pull request should:

- Open a pull request and link the related issue using `Closes #issue-number`.
- Describe what changed.
- Explain how the change was tested or checked.
- Request review from at least one teammate.
- Keep the pull request focused on the related issue.

Depending on the type of change, also include:

- For visual changes, include before-and-after screenshots when appropriate.
- For bug fixes, include reproduction steps or sample input so the issue can be reproduced.

Use the repository's pull request template when opening a pull request (located at `.github/pull_request_template.md`).

## Code Review

At least one teammate other than the pull request author should review and approve the pull request before it is merged.

Reviewers should check:

- Whether the change addresses the related issue.
- Whether the change works as expected.
- Code readability and consistency.
- Relevant tests or manual checks.
- Whether related documentation also needs to be updated.

If changes are requested, the author should address them before merging.

## Merging

A pull request should only be merged after:

- At least one teammate has approved it.
- Relevant automated checks pass.
- Requested changes have been addressed.
- There are no unresolved merge conflicts.

After the pull request is merged, the task branch should normally be deleted.