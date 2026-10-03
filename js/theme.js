/* Applies the saved tyre accent before first paint so pages don't flash the default colour. */
(function () {
  try {
    var a = localStorage.getItem('accent');
    if (a && /^#[0-9a-f]{6}$/i.test(a)) document.documentElement.style.setProperty('--accent', a);
  } catch (e) {}
})();
