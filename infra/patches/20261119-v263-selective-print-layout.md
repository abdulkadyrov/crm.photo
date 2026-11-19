# Selective print layout follow-up

Apply the adjacent zero-context patch to the v262 production release. Hide open
source menus while selective printing is active and restore them on Back/close.
Collapse the pairing QR when typing a name or opening a camera, leaving room for
service cards on narrow screens. Starting a new camera scan clears the prior
name filter and scan target, so scanning also works after a search. Selection data, private pairing and print logic
are unchanged. The v262 API/database deployment remains in place.

Verified in Chromium/WebKit: exact Back restores the source menu, search and tab;
319px phone layout and actual two-page selected PDF. Physical hardware not tested.
