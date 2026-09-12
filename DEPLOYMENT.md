# BITOMANCY deployment

## Cloudflare Pages
1. Put this project in a GitHub repository.
2. In Cloudflare, open Workers & Pages and create a Pages project from the GitHub repository.
3. Use the root directory as the project directory.
4. This is a static site; no build command is required. If the dashboard requires one, leave it empty.
5. Deploy and test the generated `pages.dev` URL.
6. Add `bitomancy.in` as a custom domain in the project.
7. Follow the DNS instructions Cloudflare displays for your exact account.
8. Keep any existing MX records if you use email on the domain.
9. After DNS is active, test HTTPS, both hostnames, sitemap and robots.txt.

## Important
Before changing DNS, save a screenshot/copy of the current DNS records.
Do not delete MX records or unrelated records.
