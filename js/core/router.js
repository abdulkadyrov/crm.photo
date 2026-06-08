export function createHashRouter() {
  const listeners = new Set();

  function parse(hash = window.location.hash) {
    const value = hash.replace(/^#/, "") || "dashboard";
    const studentMatch = value.match(/^student\/(.+)$/);
    if (studentMatch) return { name: "student", params: { id: decodeURIComponent(studentMatch[1]) } };
    return { name: value, params: {} };
  }

  function notify() {
    const route = parse();
    listeners.forEach((listener) => listener(route));
  }

  window.addEventListener("hashchange", notify);

  return {
    current: parse,
    go(route) {
      window.location.hash = route.startsWith("#") ? route : `#${route}`;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
