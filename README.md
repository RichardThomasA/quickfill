QuickFill — local dev & test

Commands

Install dev deps:

```bash
npm install
```

Run Vite dev server (for UI pages):

```bash
npm run dev
```

Build extension (bundles UI then copies extension files to `dist/`):

```bash
npm run build
```

Run tests (Vitest):

```bash
npm test
```

Notes
- Source extension modules live under `src/extension/`.
- Unit tests live under `tests/unit/` and are excluded from `dist/`.

**Project Structure**

The tree below shows the recommended project layout: source for the extension lives under `src/extension/`, tests are kept under `tests/unit/` (and are never copied into `dist/`), and `dist/` contains the final extension package ready to load as an unpacked extension.

```
package.json
vite.config.ts
vitest.config.ts
tsconfig.json (optional)
README.md
.gitignore
src/
	extension/
		manifest.json
		background.js
		content.js
		icons/
		popup/
			popup.html
			popup.js
			popup.css
		options/
			options.html
			options.runtime.js   # runtime script used by the extension UI
			options.js           # testable module imported by Vitest
			options.css
		samples/
			sample.json
	ui-assets/              # optional shared UI entrypoints
public/                   # static assets for dev server
tests/
	unit/
		options/
			options.test.js
		popup/
			popup.test.js
scripts/
	copy-extension.js       # copies only extension assets into dist/
dist/                     # build output (load as unpacked extension)
.vscode/                  # optional workspace settings/tasks
```

