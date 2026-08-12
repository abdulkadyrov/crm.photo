# ImageGen prompt set

The four source sheets were generated with the built-in ImageGen path as
`photorealistic-natural` synthetic QA fixtures.

Shared requirements for every sheet:

- exactly ten fictional primary-school children;
- rigid landscape contact sheet with five columns and two rows;
- five boys and five girls of North Caucasus / Chechen appearance;
- one child per cell, front-facing, head and shoulders, eyes at camera;
- ordinary modest school clothes, neutral studio background and even light;
- every face visibly unique;
- no adults, text, labels, logos, watermarks, hats or hands over the face.

Per-sheet variants:

1. `bachiyurt-1a.png`: ages 7–8, warm light-gray background.
2. `bachiyurt-2a.png`: ages 8–9, pale blue-gray background; green, burgundy,
   cream, blue and mustard clothes.
3. `mayrtup-1b.png`: ages 7–8, light beige background and varied everyday
   school fabrics.
4. `mayrtup-2b.png`: ages 8–9, pale warm-gray background; navy, rust, sage,
   cream and plum clothes.

The generated sheets were split into individual portraits. Every final work is
then produced as a separate built-in ImageGen edit with two references:

1. Image 1 is the identity reference and source child portrait.
2. Image 2 is the selected character service and edit target.

Shared identity-preserve requirements for every final work:

- keep Image 2's costume, body, pose, props, background, framing and depth;
- replace only the character identity with the exact child from Image 1;
- preserve age, face shape, eyes, eyebrows, nose, mouth, cheeks, jaw, ears,
  skin tone and expression from Image 1 without averaging the identities;
- reconstruct the hairline, jaw-to-neck transition, pores, shadows and
  occlusion; match Image 2's light direction, temperature and sharpness;
- avoid pasted edges, double features, changed identity, wrong head scale,
  plastic skin, text, logos and watermarks.

The accepted originals are stored under `neural-results/`. The fixture builder
requires all 40 neural edits and intentionally has no local `face-mask`
fallback.
