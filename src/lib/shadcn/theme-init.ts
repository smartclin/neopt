// src/lib/shadcn/theme-init.ts
//
// The pre-paint theme initializer. Kept out of `__root.tsx` so that
// file reads as routing + shell only, and so the string can be unit-
// tested in isolation (or linted for banned constructs like
// `eval` / `document.write`).
//
// Contract with `lib/shadcn/theme-utils.ts`:
//   - storage key:   "theme"  (THEME_STORAGE_KEY)
//   - valid values:  "light" | "dark" | "system"  (Theme)
//   - fallback:      "system"
//   - applies:       <html class="light|dark"> + <html style="color-scheme">
//   - does NOT touch: data-theme, meta[theme-color]  (both handled
//     declaratively in `head()` on the root route)
//
// If you change any of the above, change it here AND in theme-utils.ts.
// The two cannot share code (this runs before any module loads), so the
// invariant is documented, not enforced. Add a unit test that asserts
// both files agree — that's the only real guard.

export const THEME_INIT_SCRIPT = `
(function(){
	try{
		var s = localStorage.getItem('theme');
		var m = (s === 'light' || s === 'dark' || s === 'system') ? s : 'system';
		var prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
		var resolved = m === 'system' ? (prefersDark ? 'dark' : 'light') : m;
		var e = document.documentElement;
		e.classList.remove('light', 'dark');
		e.classList.add(resolved);
		e.style.colorScheme = resolved;
	} catch (err) {}
})();
`.replace(/\n\s*/g, "");
