# BlogSphere Mag AdSense readiness patch

This patch prepares the application for an AdSense application. It does not guarantee approval and does not add a publisher ID.

## Before deploying

1. Apply for an AdSense account and add `blogspheremag.com`.
2. Once AdSense supplies your publisher ID, set the Cloudflare Pages production build variable:
   - `REACT_APP_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX`
3. Set the existing site/API variables:
   - `REACT_APP_SITE_URL=https://blogspheremag.com`
   - `SITE_URL=https://blogspheremag.com`
   - `REACT_APP_API_URL=https://blogsphere-api-odr7.onrender.com/api/v1`
4. Rebuild and deploy. The postbuild script adds the account-verification meta tag to the generated static HTML and adds the matching Google seller record to `build/ads.txt`.
5. Verify the deployed source HTML and `https://blogspheremag.com/ads.txt` before submitting the site for review.

Do not invent a publisher ID or publish the placeholder in the public ads.txt template.

## Editorial quality response

Article create/update API responses now include a `qualityReview` object. It is a deterministic editorial preflight, not a plagiarism detector, AI detector, medical/legal fact checker, or AdSense approval predictor. It flags review prompts such as missing source links, sparse headings, short content, missing image alt text, and incomplete author profiles.

A human editor must verify accuracy, originality, usefulness, references, and image licences before publication. The 500-word signal is a review prompt, not a Google content-length requirement.

## Publishing permissions

Non-admin writers may save drafts and submit articles for review. Only administrators may set an article to published, rejected, or archived. Confirm that the owner/editor account has the admin role before using the publish action.
