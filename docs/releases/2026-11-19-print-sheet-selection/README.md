# Print sheet selection, production v256

Adds an expandable list of individual sheets/copies to the photo print preview, Select all, Remove blanks and Clear. Existing group separator sheets remain selected initially; users can exclude them for a one-photo print. Only selected sheets remain in the printable iframe DOM flow. The final selected sheet suppresses trailing page breaks, including when trailing separators are hidden. Printing is disabled until images decode and at least one sheet is selected. No order or print status changes occur from selection.

Scoped patch base: production `20261119-v254-result-actions-compare`; deployed release: `20261119-v256-print-page-selection`. This branch archives the exact production delta separately from unrelated uncommitted checkout features.

Validation: staged JS syntax; browser fixture with four sheets (two blanks and two photos): Remove blanks hides both separators; selecting one photo enables single-sheet printing; clearing disables print. Live group Средняя группа reproduced three sheets for one photograph, and Remove blanks leaves exactly one visible/printable sheet. Narrow viewport 319x617 checked. Physical printer output not tested.
