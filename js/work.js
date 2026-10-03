/* Work: timing-tower project list with a story panel. */
(function () {
  'use strict';

  var PROJECTS = [
    {
      id: 'shape-up', name: 'Shape Up', tag: 'Web app · ML', color: '#ff3b30',
      problem: 'Working out a face shape from a photo is easy to get wrong, especially across different faces, and uploading personal photos to a server adds a privacy risk.',
      built: 'A web app that analyses the photo entirely in your browser, so it never leaves your device. A classifier blends several measurements instead of trusting one, and I checked it for bias across a range of demographic groups. A second implementation in Python is used to confirm the web version gives the same answers.',
      stack: 'React · Vite · Tailwind · Python · MediaPipe',
      href: 'https://shape-up.net/', linkLabel: 'Visit the site'
    },
    {
      id: 'bell-mila', name: 'Bell × Mila AI Safety', tag: 'AI safety', color: '#ffd60a',
      problem: 'A mental health chatbot for young people can do real harm if it says the wrong thing. The hackathon challenge was to make it safer.',
      built: 'A classifier that flags unsafe replies, a set of adversarial prompts that look for where the chatbot breaks, and guardrails that limit what it is allowed to say. The classifier was fine-tuned on GPUs during the event.',
      stack: 'Python · mmBERT · PyTorch · CUDA'
    },
    {
      id: 'meta-llama', name: 'Meta-Llama Hackathon', tag: 'Document Q&A', color: '#22c55e',
      problem: 'Long PDFs are slow to search, and language models tend to invent answers when they are not grounded in the source.',
      built: 'A web app where you upload a PDF and ask questions. It splits the document into pieces, finds the ones that match your question and hands them to Llama 3.2 to answer from. Answers can also be read aloud.',
      stack: 'Llama-3.2 · Flask · SQLite · JavaScript',
      href: 'https://github.com/HweyTH/meta-llama-2024', linkLabel: 'View repo'
    },
    {
      id: 'kaggle-pipeline', name: 'Kaggle Trends Pipeline', tag: 'Data engineering', color: '#a855f7',
      problem: 'Raw data from many sources arrives in different shapes and needs repeatable cleaning before anyone can use it.',
      built: 'A containerized pipeline that collects the datasets, cleans and reshapes them in batches on a schedule, and serves the results through a small API. Every run is logged and monitored.',
      stack: 'PySpark · AWS S3/EC2 · Airflow · PostgreSQL · Docker · Flask',
      href: 'https://github.com/LakshitLuhadia/Kaggle-trends-pipeline', linkLabel: 'View repo'
    },
    {
      id: 'mistral-pi', name: 'Mistral-7B on a Pi', tag: 'Edge computing', color: '#f4f4f5',
      problem: 'Running a modern language model usually assumes a powerful machine.',
      built: 'A step-by-step guide to running Mistral-7B on a Raspberry Pi 4 using Ollama.',
      stack: 'Ollama · Raspberry Pi 4 · Mistral-7B',
      href: 'https://github.com/LakshitLuhadia/Mistral-7b', linkLabel: 'Read the guide'
    }
  ];

  var tower = document.getElementById('tower');
  var sortOrder = document.getElementById('sort-order');
  var sortName = document.getElementById('sort-name');
  var sort = 'order';
  var selected = PROJECTS[0].id;

  var hash = decodeURIComponent(location.hash.replace('#', ''));
  if (PROJECTS.some(function (p) { return p.id === hash; })) selected = hash;

  function byId(id) { return PROJECTS.filter(function (p) { return p.id === id; })[0]; }

  function renderTower() {
    var list = sort === 'name' ? PROJECTS.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }) : PROJECTS;
    tower.replaceChildren();
    list.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(p.id === selected));
      var pos = document.createElement('span'); pos.className = 'pos'; pos.textContent = String(i + 1);
      var stripe = document.createElement('span'); stripe.className = 'stripe'; stripe.style.setProperty('--c', p.color);
      var name = document.createElement('span'); name.className = 'name'; name.textContent = p.name;
      var tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = p.tag;
      b.append(pos, stripe, name, tag);
      b.addEventListener('click', function () {
        selected = p.id;
        try { history.replaceState(null, '', '#' + p.id); } catch (e) {}
        renderTower();
        renderDetail();
      });
      tower.appendChild(b);
    });
    sortOrder.setAttribute('aria-pressed', String(sort === 'order'));
    sortName.setAttribute('aria-pressed', String(sort === 'name'));
  }

  function renderDetail() {
    var p = byId(selected);
    document.getElementById('d-tag').textContent = 'PROJECT · ' + p.tag.toUpperCase();
    document.getElementById('d-name').textContent = p.name;
    document.getElementById('d-problem').textContent = p.problem;
    document.getElementById('d-built').textContent = p.built;
    document.getElementById('d-stack').textContent = p.stack;
    var link = document.getElementById('d-link');
    if (p.href) {
      link.href = p.href;
      link.textContent = p.linkLabel + ' →';
      link.hidden = false;
    } else {
      link.hidden = true;
    }
  }

  sortOrder.addEventListener('click', function () { sort = 'order'; renderTower(); });
  sortName.addEventListener('click', function () { sort = 'name'; renderTower(); });

  renderTower();
  renderDetail();
})();
