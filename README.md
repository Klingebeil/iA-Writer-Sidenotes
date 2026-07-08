# Sidenotes iA Writer Template

Custom iA Writer template with generated sidenotes for markdown footnotes.

## Package File Structure

```text
.
|-- Sidenotes.iatemplate/
    `-- Contents/
        |-- Info.plist
        `-- Resources/
            |-- document.html
            |-- LICENSE.txt
            |-- sidenotes-markdown-dark.css
            |-- sidenotes-markdown-light.css
            |-- sidenotes.css
            |-- sidenotes.html
            `-- sidenotes.js
```

## Install / Reload (macOS)

1. Install the `.iatemplate` bundle in iA Writer Preferences.
2. iA Writer copies templates on install, so source edits are not live.
3. After changes, reinstall the template or edit the installed copy.
4. In Preview, use `Shift + Cmd + R` to hard-reload.

## Notes

- Sidenotes are generated from footnote references by `sidenotes.js`.
- Typography and layout variables live at the top of `sidenotes.css`.
- Print behavior is configured in the `@media print` section.

## Limitations

- Print/PDF layout with floating sidenotes is constrained by WebKit pagination and can still show vertical jumps near page breaks.
- Preventing sidenote collisions and minimizing vertical jumps is a tradeoff; the current setup prioritizes non-overlapping notes.
- Sidenote generation depends on JavaScript execution in iA Writer preview/export.
- Installed templates are copied by iA Writer, so source edits require reinstalling or editing the installed bundle.
