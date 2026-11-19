# Result actions and comparison, production v254

Collapses each final result action list into Actions and adds Compare. The existing scanner viewer displays camera original and final result side by side, with shared zoom and pan. Individual images in the result dialog also open that viewer. History closes nested viewers before returning to the card. Expanded menus survive sync renders.

This scoped patch applies to the existing production release `20261119-v251-scanner-reset`, not the older Git main snapshot. It records only this task, preserving unrelated uncommitted features in the working checkout. No automatic deployment from this documentation branch.

Production: `/srv/crm-photo/releases/20261119-v254-result-actions-compare`.
Rollback: `/srv/crm-photo/releases/20261119-v251-scanner-reset`.

Validation: seven targeted unit tests passed; staged JS syntax passed. Live browser: Actions menu, direct comparison, zoom 1 to 1.25, nested comparison Back, restored menu, 319x617 viewport without horizontal overflow. Physical phone pinch was not tested. Impeccable detector could not attach without a CDP port; manual mobile screenshot inspection completed.

Apply `release.patch` only against the documented production base and bump asset cache version for any later release. Deployment used guarded hashes and an atomic release switch.
