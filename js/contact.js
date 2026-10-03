/* Contact: copy-to-clipboard email and a live Waterloo clock. */
(function () {
  'use strict';

  var EMAIL = 'lakshitluhadia2212@gmail.com';
  var button = document.getElementById('copy-mail');
  var state = document.getElementById('copy-state');
  var resetTimer;

  function done(ok) {
    state.textContent = ok ? 'COPIED' : 'PRESS CTRL+C';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () { state.textContent = 'COPY'; }, 2000);
  }

  button.addEventListener('click', function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(function () { done(true); }, fallback);
    } else {
      fallback();
    }
  });

  /* older browsers or blocked clipboard: select the text so it can be copied by hand */
  function fallback() {
    var ok = false;
    try {
      var ta = document.createElement('textarea');
      ta.value = EMAIL;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {}
    done(ok);
  }

  var clock = document.getElementById('clock');
  function tick() {
    try {
      clock.textContent = new Intl.DateTimeFormat('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Toronto' }).format(new Date());
    } catch (e) { clock.textContent = '--:--'; }
  }
  tick();
  setInterval(tick, 15000);
})();
