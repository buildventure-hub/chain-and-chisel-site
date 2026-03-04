/**
 * Site Configuration
 *
 * Toggle platform features here. When deploying to GitHub Pages,
 * set useCloudflare to false. When deploying to Cloudflare Pages,
 * set it to true.
 */
const SITE_CONFIG = {
  platform: "github-pages",   // "cloudflare" or "github-pages"
  useCloudflare: false,        // toggle Turnstile CAPTCHA + /api/order endpoint

  // Fallback mailto address used when Cloudflare is off
  orderEmail: "info@chainandchisel.art",
};
