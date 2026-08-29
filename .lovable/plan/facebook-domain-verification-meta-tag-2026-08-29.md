# Facebook Domain Verification Meta-Tag

## Goal
Verify the `printezy.money` domain with Facebook/Meta by adding the provided meta-tag to the home page `<head>`.

## Change
Add one meta tag to the `head()` config in `src/routes/index.tsx` (the home page):

```html
<meta name="facebook-domain-verification" content="tbn6gbwzvnlav1zi9hbxkcc1jve6bn" />
```

This renders server-side into the static HTML `<head>`, which satisfies Facebook's requirement that the tag not be loaded dynamically by JavaScript.

## After the change
1. Publish the site so the tag is live on `https://printezy.money/`.
2. Confirm the tag is visible in the page source (View Source → search "facebook-domain-verification").
3. Click **Verify domain** in Facebook Business Settings. Note: Facebook says it can take up to 72 hours, though it usually verifies within minutes once the tag is live.

## Technical details
- Single-file edit: `src/routes/index.tsx`, adding `{ name: "facebook-domain-verification", content: "tbn6gbwzvnlav1zi9hbxkcc1jve6bn" }` to the existing meta array.
- No other pages or code affected.
