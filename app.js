(function () {
  'use strict';

  // ---------- memória local (pode falhar em aba privada) ----------
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('lash.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('lash.' + k, JSON.stringify(v)); } catch (e) {} }
  };

  var body = document.body;
  var views = document.querySelectorAll('.view');
  var navLinks = document.querySelectorAll('.nav-a');
  var title = document.querySelector('.topbar .ttl');
  var mods = Array.prototype.map.call(document.querySelectorAll('.view[data-mod]'), function (v) { return v.id.slice(2); });

  // ---------- tamanho do texto ----------
  var fs = store.get('fs', 1);
  function setFs(v) { fs = Math.max(0.9, Math.min(1.36, Math.round(v * 100) / 100)); document.documentElement.style.setProperty('--fs', fs); store.set('fs', fs); }
  setFs(fs);
  document.querySelector('.small-a').addEventListener('click', function () { setFs(fs - 0.08); });
  document.querySelector('.big-a').addEventListener('click', function () { setFs(fs + 0.08); });

  // ---------- menu lateral ----------
  function closeNav() { body.classList.remove('nav-open'); }
  document.querySelector('.menu-btn').addEventListener('click', function () { body.classList.toggle('nav-open'); });
  document.querySelector('.scrim').addEventListener('click', closeNav);

  // ---------- módulos concluídos ----------
  var done = store.get('done', {});
  function paintDone() {
    navLinks.forEach(function (a) { a.classList.toggle('done', !!done[a.getAttribute('data-v')]); });
    document.querySelectorAll('.mod-card').forEach(function (c) { c.classList.toggle('done', !!done[c.getAttribute('data-v')]); });
    document.querySelectorAll('[data-done]').forEach(function (b) {
      var on = !!done[b.getAttribute('data-done')];
      b.classList.toggle('done', on); b.classList.toggle('ghost', !on);
      b.textContent = on ? '✓ Módulo dado' : 'Marcar módulo como dado';
    });
    var n = mods.filter(function (m) { return done[m]; }).length;
    var bar = document.querySelector('.progress .bar i'); if (bar) bar.style.width = (n / mods.length * 100) + '%';
    var txt = document.querySelector('.progress .txt'); if (txt) txt.textContent = n + ' de ' + mods.length + ' módulos dados';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-done]'); if (!b) return;
    var k = b.getAttribute('data-done'); done[k] = !done[k]; store.set('done', done); paintDone();
  });
  var reset = document.querySelector('.reset-progress');
  if (reset) reset.addEventListener('click', function () { done = {}; store.set('done', done); paintDone(); });
  paintDone();

  // ---------- navegação por endereço (#m3 ou #m3/2) ----------
  function route() {
    var h = (location.hash || '#inicio').slice(1).split('/');
    var id = h[0] || 'inicio';
    var view = document.getElementById('v-' + id) || document.getElementById('v-inicio');
    id = view.id.slice(2);
    views.forEach(function (v) { v.classList.toggle('on', v === view); });
    navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-v') === id); });
    title.textContent = view.getAttribute('data-title') || 'Lash Design';
    closeNav();
    if (view.hasAttribute('data-mod')) store.set('last', id);
    var target = h[1] ? document.getElementById(id + '-' + h[1]) : null;
    if (target) target.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
    var cont = document.querySelector('.continue');
    if (cont) { var last = store.get('last', null); cont.style.display = last ? '' : 'none'; if (last) cont.href = '#' + last; }
  }
  window.addEventListener('hashchange', route);
  route();
  // as imagens carregam depois e empurram o conteúdo: reposiciona na seção pedida
  window.addEventListener('load', function () { if ((location.hash || '').indexOf('/') > -1) route(); });

  // ---------- listas de conferência ----------
  var checks = store.get('checks', {});
  document.querySelectorAll('ul.check').forEach(function (ul, i) {
    ul.querySelectorAll('li').forEach(function (li, j) {
      var k = i + '.' + j;
      if (checks[k]) li.classList.add('on');
      li.addEventListener('click', function () { li.classList.toggle('on'); checks[k] = li.classList.contains('on'); store.set('checks', checks); });
    });
  });

  // ---------- tabelas roláveis ----------
  document.querySelectorAll('.sec table.tbl').forEach(function (t) {
    var w = document.createElement('div'); w.className = 'tw'; t.parentNode.insertBefore(w, t); w.appendChild(t);
  });

  // ---------- ampliar imagem ----------
  var lb = document.querySelector('.lightbox'), lbImg = lb.querySelector('img');
  document.addEventListener('click', function (e) {
    var img = e.target.closest('.sec img, .hero .op-img img');
    if (!img) return;
    lbImg.src = img.currentSrc || img.src; lb.classList.add('on');
  });
  lb.addEventListener('click', function () { lb.classList.remove('on'); });

  // ---------- revisão ----------
  var quiz = document.querySelector('.quiz');
  if (quiz) {
    var qs = quiz.querySelectorAll('.q'), right = 0, answered = 0;
    var sc = quiz.querySelector('.score .val');
    function paint() { sc.textContent = right + ' certas de ' + answered + ' respondidas · ' + qs.length + ' perguntas'; }
    qs.forEach(function (q) {
      var ans = q.getAttribute('data-a');
      q.querySelectorAll('.opt').forEach(function (o) {
        o.addEventListener('click', function () {
          if (q.classList.contains('answered')) return;
          q.classList.add('answered'); answered++;
          if (o.getAttribute('data-k') === ans) { o.classList.add('ok'); right++; }
          else { o.classList.add('no'); q.querySelector('.opt[data-k="' + ans + '"]').classList.add('ok'); }
          paint();
        });
      });
    });
    quiz.querySelector('.redo').addEventListener('click', function () {
      right = 0; answered = 0;
      qs.forEach(function (q) { q.classList.remove('answered'); q.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('ok', 'no'); }); });
      paint(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    paint();
  }

  // ---------- glossário ----------
  var search = document.querySelector('.search');
  if (search) {
    var items = document.querySelectorAll('.gl p'), empty = document.querySelector('.empty');
    var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    search.addEventListener('input', function () {
      var q = norm(search.value.trim()), n = 0;
      items.forEach(function (p) { var hit = !q || norm(p.textContent).indexOf(q) > -1; p.style.display = hit ? '' : 'none'; if (hit) n++; });
      empty.style.display = n ? 'none' : 'block';
    });
  }

  // ---------- funcionar sem internet ----------
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
    // quando sair uma versão nova do guia, recarrega uma vez para mostrar o conteúdo atualizado
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (hadController) location.reload(); });
  }
})();
