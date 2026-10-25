// Applies the saved or system theme before the app renders, so there is no flash.
// Kept as a file (not inline) so the Content-Security-Policy can stay strict.
// Mirrors resolveTheme() in src/app/theme.ts.
;(function () {
  var pref = 'system'
  try {
    pref = localStorage.getItem('dq.theme') || 'system'
  } catch (e) {
    // Storage can be blocked; fall back to the system setting.
  }
  var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
  var theme = pref === 'light' || pref === 'dark' ? pref : prefersLight ? 'light' : 'dark'
  var root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
  var meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f4ef' : '#0e1220')
})()
