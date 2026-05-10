# Components

Split by role, not size. Five folders, one rule each.

## Folders

| Folder      | What goes here                                                                                                         | What doesn't                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `ui/`       | Buttons, badges, tags, generic cards. No logic, no repo calls.                                                         | Domain words, save flows, feature state |
| `layout/`   | Visual shells repeated across screens (modal shell, section header).                                                   | Feature save logic, data transforms     |
| `forms/`    | Input controls: text, decimal, select, readonly, error block.                                                          | Full forms with submit/orchestration    |
| `display/`  | Read-only data blocks: info rows, summary cards, stats.                                                                | Filters, submit handlers, modal control |
| `modals/`   | Overlays for concrete user actions (edit, confirm, export, upload).                                                    | Shared shell → goes in `layout/`        |
| `features/` | Business logic. State, validation, filters, save, domain rules. Split by domain: `perforacion/` `carga/` `supervisor/` | Anything reusable                       |

## Decision

1. Works in many screens with no domain words? → `ui/` or `forms/`
2. Mostly wraps structure? → `layout/`
3. Mostly shows data? → `display/`
4. Opens as overlay? → `modals/`
5. Knows business flow / blast / hole / carga / supervisor? → `features/`

## Rule

Generic folders = reusable pieces. Feature folder = workflow brain. Never mix.
