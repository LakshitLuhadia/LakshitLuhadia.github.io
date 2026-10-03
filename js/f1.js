/* F1 data + the three race-weekend footers.
   Schedule comes from the free Jolpica API (Ergast successor, no key, CORS open).
   It is cached for 6 hours and falls back to a built-in snapshot if the API is down. */
(function () {
  'use strict';

  var API = 'https://api.jolpi.ca/ergast/f1/current.json';
  var CACHE_KEY = 'f1-schedule-v1';
  var TTL = 6 * 60 * 60 * 1000;
  var DAY = 86400000;

  var FALLBACK = [
    { round: 16, name: 'Bahrain Grand Prix in Malaysia', circuitId: 'sepang', place: 'Kuala Lumpur, Malaysia', sessions: [['FP1', '2026-10-02T04:30:00Z'], ['FP2', '2026-10-02T08:00:00Z'], ['FP3', '2026-10-03T04:30:00Z'], ['Qualifying', '2026-10-03T08:00:00Z'], ['Race', '2026-10-04T07:00:00Z']] },
    { round: 17, name: 'Singapore Grand Prix', circuitId: 'marina_bay', place: 'Marina Bay, Singapore', sessions: [['FP1', '2026-10-09T08:30:00Z'], ['Sprint Qualifying', '2026-10-09T12:30:00Z'], ['Sprint', '2026-10-10T09:00:00Z'], ['Qualifying', '2026-10-10T13:00:00Z'], ['Race', '2026-10-11T12:00:00Z']] },
    { round: 18, name: 'United States Grand Prix', circuitId: 'americas', place: 'Austin, USA', sessions: [['FP1', '2026-10-23T17:30:00Z'], ['FP2', '2026-10-23T21:00:00Z'], ['FP3', '2026-10-24T17:30:00Z'], ['Qualifying', '2026-10-24T21:00:00Z'], ['Race', '2026-10-25T20:00:00Z']] },
    { round: 19, name: 'Mexico City Grand Prix', circuitId: 'rodriguez', place: 'Mexico City, Mexico', sessions: [['FP1', '2026-10-30T18:30:00Z'], ['FP2', '2026-10-30T22:00:00Z'], ['FP3', '2026-10-31T17:30:00Z'], ['Qualifying', '2026-10-31T21:00:00Z'], ['Race', '2026-11-01T20:00:00Z']] },
    { round: 20, name: 'Brazilian Grand Prix', circuitId: 'interlagos', place: 'São Paulo, Brazil', sessions: [['FP1', '2026-11-06T15:30:00Z'], ['FP2', '2026-11-06T19:00:00Z'], ['FP3', '2026-11-07T14:30:00Z'], ['Qualifying', '2026-11-07T18:00:00Z'], ['Race', '2026-11-08T17:00:00Z']] },
    { round: 21, name: 'Las Vegas Grand Prix', circuitId: 'vegas', place: 'Las Vegas, USA', sessions: [['FP1', '2026-11-20T00:30:00Z'], ['FP2', '2026-11-20T04:00:00Z'], ['FP3', '2026-11-21T00:30:00Z'], ['Qualifying', '2026-11-21T04:00:00Z'], ['Race', '2026-11-22T04:00:00Z']] },
    { round: 22, name: 'Qatar Grand Prix', circuitId: 'losail', place: 'Lusail, Qatar', sessions: [['FP1', '2026-11-27T13:30:00Z'], ['FP2', '2026-11-27T17:00:00Z'], ['FP3', '2026-11-28T14:30:00Z'], ['Qualifying', '2026-11-28T18:00:00Z'], ['Race', '2026-11-29T16:00:00Z']] },
    { round: 23, name: 'Abu Dhabi Grand Prix', circuitId: 'yas_marina', place: 'Abu Dhabi, UAE', sessions: [['FP1', '2026-12-04T09:30:00Z'], ['FP2', '2026-12-04T13:00:00Z'], ['FP3', '2026-12-05T10:30:00Z'], ['Qualifying', '2026-12-05T14:00:00Z'], ['Race', '2026-12-06T13:00:00Z']] }
  ];

  /* ---------- schedule ---------- */

  function finish(r) {
    var times = r.sessions.map(function (s) { return new Date(s[1]).getTime(); });
    r.start = Math.min.apply(null, times);
    r.end = Math.max.apply(null, times) + 3 * 3600000; /* race + about 3 hours */
    return r;
  }

  function fromApi(race) {
    var pairs = [
      ['FirstPractice', 'FP1'], ['SecondPractice', 'FP2'], ['ThirdPractice', 'FP3'],
      ['SprintQualifying', 'Sprint Qualifying'], ['Sprint', 'Sprint'], ['Qualifying', 'Qualifying']
    ];
    var sessions = [];
    pairs.forEach(function (p) {
      var o = race[p[0]];
      if (o && o.date) sessions.push([p[1], o.date + 'T' + (o.time || '12:00:00Z')]);
    });
    sessions.push(['Race', race.date + 'T' + (race.time || '12:00:00Z')]);
    sessions.sort(function (a, b) { return new Date(a[1]) - new Date(b[1]); });
    var loc = race.Circuit && race.Circuit.Location ? race.Circuit.Location : {};
    return finish({
      round: parseInt(race.round, 10),
      name: race.raceName,
      circuitId: race.Circuit ? race.Circuit.circuitId : '',
      place: [loc.locality, loc.country].filter(Boolean).join(', '),
      sessions: sessions
    });
  }

  function readCache() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (c && Array.isArray(c.rounds) && c.rounds.length) return c;
    } catch (e) {}
    return null;
  }

  var pending = null;
  function loadSchedule() {
    if (pending) return pending;
    var cached = readCache();
    if (cached && Date.now() - cached.t < TTL) {
      pending = Promise.resolve(cached.rounds);
      return pending;
    }
    pending = new Promise(function (resolve) {
      var done = false;
      function fallback() {
        if (done) return;
        done = true;
        resolve(cached ? cached.rounds : FALLBACK.map(function (r) { return finish(JSON.parse(JSON.stringify(r))); }));
      }
      var timer = setTimeout(fallback, 6000);
      fetch(API, { headers: { Accept: 'application/json' } })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
        .then(function (json) {
          var races = json && json.MRData && json.MRData.RaceTable && json.MRData.RaceTable.Races;
          if (!races || !races.length) throw new Error('empty schedule');
          var rounds = races.map(fromApi);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), rounds: rounds })); } catch (e) {}
          if (!done) { done = true; clearTimeout(timer); resolve(rounds); }
        })
        .catch(function () { clearTimeout(timer); fallback(); });
    });
    return pending;
  }

  /* current = first round that has not finished; next = the one after it */
  function pick(rounds, now) {
    var open = rounds.filter(function (r) { return now <= r.end; });
    var over = open.length === 0;
    var list = over ? rounds.slice(-1) : open;
    return { cur: list[0], next: list[1] || null, seasonOver: over };
  }

  function circuitFor(round) {
    return (round && window.F1_CIRCUITS && window.F1_CIRCUITS[round.circuitId]) || null;
  }

  /* ---------- formatting ---------- */

  function safe(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }

  function shortName(name) { return name.replace('Grand Prix', 'GP'); }

  function fmtDay(d) {
    return safe(function () { return new Intl.DateTimeFormat('en-CA', { weekday: 'short', month: 'short', day: 'numeric' }).format(d).toUpperCase(); }, '');
  }
  function fmtTime(d) {
    return safe(function () { return new Intl.DateTimeFormat('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d); }, '');
  }
  function fmtMonthDay(d) {
    return safe(function () { return new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric' }).format(d).toUpperCase(); }, '');
  }
  function dateRange(r) {
    var a = new Date(r.start), b = new Date(r.end - 3 * 3600000);
    var s = fmtMonthDay(a), e = fmtMonthDay(b);
    if (s === e) return s;
    var sm = s.split(' ')[0], em = e.split(' ')[0];
    return sm === em ? s + '–' + e.split(' ')[1] : s + ' – ' + e;
  }
  function inDays(ms, now) { return Math.ceil((ms - now) / DAY); }
  function status(r, now) {
    if (now >= r.start && now <= r.end) return { text: 'ON TRACK NOW', live: true };
    var d = inDays(r.start, now);
    if (d <= 0) return { text: 'STARTS TODAY', live: false };
    if (d === 1) return { text: 'STARTS TOMORROW', live: false };
    return { text: 'UP NEXT · IN ' + d + ' DAYS', live: false };
  }
  function untilText(ms, now) {
    var mins = Math.max(0, Math.round((ms - now) / 60000));
    if (mins >= 2880) return Math.floor(mins / 1440) + ' days';
    if (mins >= 60) return Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm';
    return mins + ' min';
  }

  /* ---------- tiny DOM helpers (text only, never innerHTML) ---------- */

  var SVGNS = 'http://www.w3.org/2000/svg';
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function add(parent) {
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]);
    return parent;
  }
  function circuitSvg(circuit, cls, aria) {
    if (!circuit) return null;
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 600 400');
    svg.setAttribute('class', cls);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', aria);
    ['sf-track-bed', 'sf-track-line'].forEach(function (c) {
      var p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', circuit.d);
      p.setAttribute('class', c);
      svg.appendChild(p);
    });
    return svg;
  }

  /* ---------- the three footers ---------- */

  function footerHome(host, rounds, now) {
    var p = pick(rounds, now), cur = p.cur, circuit = circuitFor(cur);
    var st = p.seasonOver ? { text: 'SEASON COMPLETE', live: false } : status(cur, now);
    var left = el('div', 'sf-block');
    var label = el('div', 'sf-label');
    label.appendChild(el('span', 'sf-dot' + (st.live ? ' is-live' : '')));
    label.appendChild(document.createTextNode('F1 RACE WEEKEND · ' + st.text));
    add(left, label, el('div', 'sf-title', shortName(cur.name)),
      el('div', 'sf-sub', (circuit ? circuit.name : cur.place) + ' · ' + dateRange(cur)));
    var parts = [left];
    if (p.next) {
      var nx = el('div', 'sf-block sf-sep');
      add(nx, el('div', 'sf-label', 'NEXT'), el('div', 'sf-title sf-title-sm', shortName(p.next.name)),
        el('div', 'sf-sub', dateRange(p.next) + ' · in ' + Math.max(0, inDays(p.next.start, now)) + ' days'));
      parts.push(nx);
    }
    parts.push(circuitSvg(circuit, 'sf-svg', 'Outline of the ' + (circuit ? circuit.name : 'circuit')));
    host.replaceChildren.apply(host, parts.filter(Boolean));
  }

  function footerCircuit(host, rounds, now) {
    var p = pick(rounds, now), cur = p.cur, circuit = circuitFor(cur);
    var left = el('div', 'sf-block');
    add(left, el('div', 'sf-label', 'THE CIRCUIT · ROUND ' + cur.round),
      el('div', 'sf-title', circuit ? circuit.name : shortName(cur.name)), el('div', 'sf-sub', cur.place));
    var parts = [left];
    if (circuit) {
      var dl = el('dl', 'sf-facts sf-sep');
      [['LAP', circuit.km + ' km'], ['ALTITUDE', circuit.alt + ' m'], ['FIRST F1 RACE', String(circuit.first)]].forEach(function (f) {
        var d = el('div');
        add(d, el('dt', 'sf-label', f[0]), el('dd', 'sf-fact', f[1]));
        dl.appendChild(d);
      });
      parts.push(dl);
      var svg = circuitSvg(circuit, 'sf-svg sf-svg-lg is-accent', 'Outline of the ' + circuit.name);
      parts.push(svg);
    }
    host.replaceChildren.apply(host, parts);
  }

  function footerSessions(host, rounds, now) {
    var p = pick(rounds, now), cur = p.cur;
    var tz = safe(function () { return Intl.DateTimeFormat().resolvedOptions().timeZone; }, 'local time');
    var nextIdx = -1;
    cur.sessions.forEach(function (s, i) { if (nextIdx < 0 && new Date(s[1]).getTime() > now) nextIdx = i; });
    var sub = nextIdx >= 0
      ? 'Your time zone: ' + tz + ' · next: ' + cur.sessions[nextIdx][0] + ' in ' + untilText(new Date(cur.sessions[nextIdx][1]).getTime(), now)
      : 'Your time zone: ' + tz + ' · weekend finished';
    var left = el('div', 'sf-block');
    add(left, el('div', 'sf-label', 'WEEKEND SCHEDULE · ROUND ' + cur.round),
      el('div', 'sf-title', shortName(cur.name)), el('div', 'sf-sub', sub));
    var ol = el('ol', 'sf-sessions');
    cur.sessions.forEach(function (s, i) {
      var d = new Date(s[1]);
      var li = el('li', 'sf-session' + (i === nextIdx ? ' is-next' : '') + (d.getTime() <= now ? ' is-past' : ''));
      add(li, el('div', 'sf-label', fmtDay(d)), el('div', 'sf-session-name', s[0]), el('div', 'sf-session-time', fmtTime(d)));
      ol.appendChild(li);
    });
    host.replaceChildren(left, ol);
  }

  var RENDERERS = { home: footerHome, circuit: footerCircuit, sessions: footerSessions };

  function mountFooter(host) {
    var render = RENDERERS[host.getAttribute('data-footer')];
    if (!render) return;
    loadSchedule().then(function (rounds) {
      function draw() { render(host, rounds, Date.now()); }
      draw();
      setInterval(draw, 60000);
    });
  }

  window.F1 = {
    loadSchedule: loadSchedule,
    pick: pick,
    circuitFor: circuitFor,
    status: status,
    shortName: shortName
  };

  document.addEventListener('DOMContentLoaded', function () {
    var hosts = document.querySelectorAll('[data-footer]');
    for (var i = 0; i < hosts.length; i++) mountFooter(hosts[i]);
  });
})();
