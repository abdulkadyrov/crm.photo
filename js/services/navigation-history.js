// Each browser entry owns its origin stack; modal entries retain the same id.
export function createNavigationHistory({win, scope, capture, restore}) {
  const key = 'crmNavigation';
  let current = null, returning = false, serial = 0;
  const account = () => String(scope() || 'local');
  const valid = entry => entry?.scope === account() && typeof entry.id === 'string' && Array.isArray(entry.parents);
  const write = (entry, push = false) => {
    win.history[push ? 'pushState' : 'replaceState']({...win.history.state, [key]: entry}, '');
    current = entry;
  };
  win.addEventListener('popstate', event => {
    const entry = event.state?.[key];
    if (!valid(entry)) { current = null; returning = false; return; }
    if (entry.id === current?.id) return; // A dialog closed; its own handler restores it.
    current = entry;
    returning = false;
    restore(entry.snapshot);
  });
  return {
    transition(apply, {replace = false} = {}) {
      returning = false;
      // On fresh app startup the initial screen is the safe root, not a phantom parent.
      if (!current || !valid(current)) {
        apply();
        write({scope:account(), id:`nav-${Date.now()}-${++serial}`, parents:[], snapshot:capture()});
        return;
      }
      const origin = {...current, snapshot:capture()};
      write(origin);
      apply();
      write({scope:account(), id:replace ? origin.id : `nav-${Date.now()}-${++serial}`,
        parents:replace ? origin.parents : [...origin.parents, {id:origin.id, snapshot:origin.snapshot}].slice(-40),
        snapshot:capture()}, !replace);
    },
    canBack() {return valid(current) && current.parents.length > 0;},
    back() {
      if (!valid(current) || !current.parents.length) return false;
      if (!returning) { returning = true; win.history.back(); }
      return true;
    },
    // Restore the current entry after refresh only within the same signed-in account.
    resume() {
      const entry = win.history.state?.[key];
      if (!valid(entry)) return false;
      current = entry;
      restore(entry.snapshot);
      return true;
    }
  };
}
