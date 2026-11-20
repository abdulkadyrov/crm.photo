# Service status filters and unique-service billing (v268)

In «Оплата и выдача», independently filter by payment, work status, group, selected services and unit price. The default work status shows children with printed services; ready/generated and delivered modes provide their own totals. A price bucket can be clicked to narrow the children and billed services to that price. Totals and sorted price buckets (for example 350/800/1200 RUB) reflect only eligible services under the filters. The picked pane continues to show all picked children and calculates their full service set; outside-filter picks remain labelled.

Billing follows the user's rule: one child + service is charged once, even with duplicate order entries, duplicate result files or multiple copies. Two different services count separately. No result/pending work and open corrections are excluded. Saved parent prices take precedence over the catalog; absent prices stay unknown and are flagged, not guessed as zero. Zero-priced services remain valid. This is a read-only calculation; it does not change payment/status records.

The ordinary group roster adds multiple service checkboxes (OR within services, combined with the existing other filters). Checkbox focus, open filter details and roster filter state survive rendering and nested navigation. Monetary values remain gated by the existing money permission.

The adjacent production overlay targets v267 and preserves the standard scanner scope fix plus all newer print/media paths. Deploy the two standalone pricing/service-filter modules and the staged UI/loader files as an immutable v268 release, then switch its frontend symlink. No API/database migration. Rollback is the previous frontend symlink.

Validation: 310 JavaScript tests pass on clean main. Chromium and WebKit fixtures at 319px cover unique service billing, pending exclusion, 350/800/1200 buckets, payment/status/service/price intersections, clickable prices and hidden money mode. Verify the actual deployed payment panel and ordinary roster before reporting completion.
