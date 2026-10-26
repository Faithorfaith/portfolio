# Architectural portfolio integration

## Existing contracts inspected before implementation

The repository contains the frontend, Supabase data services, authenticated content-management routes, schema migrations, storage policies and session proxy. Public reads were verified against the connected project.

| Approved feature | Existing model/contract | Frontend consumer |
| --- | --- | --- |
| Identity, social links and arrival media | profiles: full_name, bio, contact_email, whatsapp_url, x_url, linkedin_url, gallery_images, hero_image_1–3, train_video_1 | Gallery host, shared social dropdown, arrival frames |
| Project doors and presentations | Published case_studies: id, title, slug, excerpt, thumbnail_url, video_url, sections, order_index | Room signage, presentation adapter, case-study board |
| Motion exhibition | portfolio_works: media_type=video, media_url, thumbnail_url, title, type | Nine fixed wall displays and single video-texture controller |
| Public media | Existing portfolio-uploads storage URLs and read rules | Texture/image/video loaders |
| Editing | Existing authenticated admin and upload routes | Existing admin UI; no new write behavior |

No database model, API endpoint, storage policy or authentication contract was introduced. The gallery batches three anonymous, published-content reads and caches the presentation payload. Gallery static assets bypass session refresh; protected routes retain their existing checks.

## Final presentation behavior

- Arrival uses portrait grayscale media. The Motion Room sits beyond a side kitchen at the far end of the corridor.
- Nine fixed video displays play directly on their wall surfaces, with sound enabled on user interaction. A shared video element prevents overlapping playback; attached monitor lights focus the selected display.
- Case studies start with their original cover and transform existing text/images into separate introduction, text and visual slides. Empty sections are omitted. Inter headings and DM Sans body text use a dark, high-contrast board; body leading is 150%, with 4% tracking where canvas supports it.
- Case-study images and Motion Room media retain full colour. Images have no enlargement modal, white overlay or exposure tone mapping.
- The creator control opens a transparent dropdown with the same social destinations used by the existing homepage contact UI. No reader or creator modal is exposed.
- UI icons use installed Lucide assets at consistent sizes; navigation and case controls follow the requested compact 32px styling.
- Three.js is the prototype's existing runtime, vendored with its MIT licence. Fonts are self-hosted with their licences.

## Deliberately unused backend capabilities

Writings, narration/import, workflow downloads, testimonials, unrelated project links and content revisions are not exposed in the architectural gallery. Existing routes remain available.

## Content and verification limits

Missing video thumbnails are identified rather than replaced with invented work. A missing research section does not produce a placeholder slide. No research claims or outcomes are fabricated.

Automated checks cover content mapping, fixed exhibit placement, camera alignment, navigation, exit-door picking, image/text separation, cover-first ordering, media ownership, unmuted initial state, colour settings and focused lights. Production compilation and TypeScript are checked separately.

Media and renderer behavior is simulated in the automated tests. Actual visual/browser verification is still required: this session's browser automation became unavailable and macOS blocked replacement browser processes. No new screenshot, measured FPS result or completed hardware/WebXR acceptance is claimed.

Neue Montreal remains a declared heading family with a system fallback because licensed font files were not supplied.
