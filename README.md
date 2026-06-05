# WatchDesk Security Operations

WatchDesk is a static interactive prototype for a security guard reporting workflow.

The deployed site opens from `index.html`, which is the current interactive WatchDesk app.

## What Patrick Can Preview

- Admin dashboard for guards, posts, overdue check-ins, incidents, and live activity.
- Guard app workflow for check-ins, DAR notes, IR notes, offline queue behavior, and shift completion.
- Payroll review with check-in counts, missed check-ins, incident counts, approvals, and CSV export.
- DAR / IR report list with printable report preview and finalization lock.

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
