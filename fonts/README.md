# Fonts

Be Vietnam Pro and Lora, self-hosted. They used to load from Google on a render-blocking
stylesheet — the only external dependency in an app whose premise is a cellar with no
signal, and the last thing standing between the moderator and a first paint.

Latin and Vietnamese subsets only, which is every character the app can render. 148 KB
across ten files, all precached by `sw.js`.

| Family | Weights | Files |
|---|---|---|
| Be Vietnam Pro (`--ui`) | 400, 500, 600, 700 | static, 8 |
| Lora (`--disp`) | 400–700 | variable, 2 |

Lora is the variable file, so one `@font-face` per subset covers the whole range. Be
Vietnam Pro is served as static instances, one per weight the app asks for.

Both are SIL Open Font License 1.1 — see `OFL-Lora.txt` and `OFL-BeVietnamPro.txt`.

## Replacing or adding a weight

These are Google's own subsets, taken verbatim from the URLs its CSS API serves, so they
are byte-identical to what the app used to fetch at runtime.

```bash
# find the URL and unicode-range for the weight and subset you want
curl -A 'Mozilla/5.0 Chrome/120' \
  'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap'
```

Then download the `woff2`, add the `@font-face` pair (latin + vietnamese) to
`css/app.css`, and add both files to `FONT_FILES` in `sw.js`. A test in
`tests/deploy-test.js` checks every face the stylesheet asks for is one the worker
caches, so forgetting the second half fails the suite rather than the first cold launch.

`FONTS` in `sw.js` is a separate cache from the versioned shell, because these files do
not change between releases and re-downloading them on every deploy is pure waste. Bump
its name if you replace a file, or clients keep serving the old one.
