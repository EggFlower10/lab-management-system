# Mini Program Backend Domain Setup

## 1. Replace backend domain in code

Edit `miniprogram/config.js`:

```js
const BACKEND_BASE_URL = 'https://your-backend.example.com';
```

Replace it with your own backend origin, for example:

```js
const BACKEND_BASE_URL = 'https://api.your-domain.com';
```

Notes:

- Use `https`.
- Do not add a trailing slash.
- The mini program requests paths like `/api/miniprogram/...`, so only the origin is needed.

## 2. Add the domain to WeChat mini program legal domains

This whitelist is not stored in the project codebase. It must be configured in the WeChat Mini Program admin console:

1. Open WeChat Official Account Platform.
2. Go to `Development` -> `Development Management` -> `Development Settings`.
3. Find `Server Domain`.
4. Add your backend domain to the `request合法域名` list.

Example:

- `https://api.your-domain.com`

Notes:

- The domain must support `HTTPS`.
- The certificate must be valid.
- The domain must not include a path.
- Changes in the admin console can take a short time to take effect.

## 3. Local development

This project has turned off local `urlCheck` in DevTools config so you can debug before the legal domain is fully configured.

Files updated:

- `miniprogram/project.config.json`
- `miniprogram/project.private.config.json`

That only affects local DevTools checks. Real device / production still depends on the legal domain configured in the WeChat admin console.
