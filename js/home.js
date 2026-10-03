/* Home: tyre accent switcher, lights-out reaction test, live circuit backdrop. */
(function () {
  'use strict';

  /* ---------- tyre switcher ---------- */
  var tyres = document.querySelectorAll('.tyre');
  function currentAccent() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase();
    return v || '#ff3b30';
  }
  function markPressed() {
    var now = currentAccent();
    tyres.forEach(function (t) { t.setAttribute('aria-pressed', String(t.getAttribute('data-accent') === now)); });
  }
  tyres.forEach(function (t) {
    t.addEventListener('click', function () {
      var a = t.getAttribute('data-accent');
      document.documentElement.style.setProperty('--accent', a);
      try { localStorage.setItem('accent', a); } catch (e) {}
      markPressed();
    });
  });
  markPressed();

  /* ---------- reaction test ---------- */
  var button = document.getElementById('rt-button');
  var readout = document.getElementById('rt-readout');
  var lights = document.querySelectorAll('.lights i');
  var phase = 'idle';
  var timers = [];
  var t0 = 0;

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function setLit(n) { lights.forEach(function (l, i) { l.classList.toggle('on', i < n); }); }
  function setUi(label, text) { button.textContent = label; readout.textContent = text; }

  button.addEventListener('click', function () {
    if (phase === 'idle' || phase === 'done' || phase === 'jump') {
      clearTimers();
      phase = 'arming';
      setLit(0);
      setUi('Hold…', 'Lights…');
      for (var i = 1; i <= 5; i++) (function (n) { later(function () { setLit(n); }, n * 650); })(i);
      later(function () {
        setLit(0);
        phase = 'go';
        t0 = performance.now();
        setUi('GO!', 'Lights out!');
      }, 5 * 650 + 700 + Math.random() * 1800);
    } else if (phase === 'arming') {
      clearTimers();
      phase = 'jump';
      setLit(0);
      setUi('Try again', 'Jump start');
    } else if (phase === 'go') {
      var ms = Math.round(performance.now() - t0);
      phase = 'done';
      setUi('Go again', ms + ' ms');
    }
  });

  /* ---------- circuit backdrop for the current race weekend ---------- */
  var backdrop = document.getElementById('backdrop');
  var caption = document.getElementById('backdrop-caption');
  if (window.F1 && backdrop && caption) {
    F1.loadSchedule().then(function (rounds) {
      var p = F1.pick(rounds, Date.now());
      var circuit = F1.circuitFor(p.cur);
      if (!circuit) return;
      backdrop.querySelectorAll('path').forEach(function (path) { path.setAttribute('d', circuit.d); });
      backdrop.hidden = false;
      var st = p.seasonOver ? { live: false } : F1.status(p.cur, Date.now());
      caption.textContent = (p.seasonOver ? 'LAST RACE' : st.live ? 'ON TRACK THIS WEEKEND' : 'UP NEXT') + ' · ' + circuit.name.toUpperCase();
    });
  }
})();
