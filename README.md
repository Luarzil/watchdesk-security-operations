# WatchDesk Security Operations

WatchDesk V2.2.1 is a static interactive prototype for a security guard reporting workflow.

The deployed site opens from `index.html`, which is the current interactive WatchDesk app.

## What Patrick Can Preview

- Admin dashboard for guards, posts, overdue check-ins, incidents, and live activity.
- Guard app workflow for check-ins, DAR notes, IR notes, offline queue behavior, and shift completion.
- Fixed DAR/IR paths with report-specific activity choices and no redundant UL report dropdown.
- Demo-only guard/shift selection for Jordan Miles, Riley Chen, and Avery Stone; production mode locks UL to the authenticated guard assignment.
- Payroll review with per-guard wage calculations, regular/overtime pay, selected-officer gross, period gross, approvals, and CSV export.
- DAR / IR report list with printable report preview and finalization lock.

## Patrick Review Guides

- [Detailed reference guide](documentation/v2.2.1-patrick-delivery/WatchDesk-V2.2.1-Reference-Guide-Patrick.pdf)
- [Two-page quick reference](documentation/v2.2.1-patrick-delivery/WatchDesk-V2.2.1-Quick-Reference-Patrick.pdf)

Both guides are also provided as editable Word documents in the same folder.

## Local Preview

Open:

```text
index.html
```

or double-click:

```text
OPEN-WATCHDESK-V2-1.cmd
```

## Vercel Deployment

This is a plain static site. On Vercel, import the GitHub repository and use:

- Framework preset: `Other`
- Build command: leave blank
- Output directory: leave blank or `.`
- Install command: leave blank

Every push to the GitHub repo will auto-deploy through Vercel.

## Notes

- Demo state is stored in browser `localStorage`.
- Use **Reset demo** for a fresh walkthrough.
- No backend or login system is connected yet.
