/* ═══ June · Dreamforce 26 selfie competition ═══ */
(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────
     TODO: replace with the real eligibility / official-rules page. */
  var RULES_URL = 'https://june.ai/dreamforce';

  var LI_COMPOSER = 'https://www.linkedin.com/feed/?shareActive=true&text=';
  var PIPS = 5;                                   // dots shown in the window
  var POSTS = window.JUNE_POSTS || [];

  var COPY_ICON =
    '<svg class="btn__ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<rect x="8.6" y="8.6" width="11.4" height="12.4" rx="2.6" stroke="currentColor" stroke-width="1.9"/>' +
    '<path d="M15.4 6.2A2.4 2.4 0 0 0 13 3.8H6.4A2.6 2.6 0 0 0 3.8 6.4v6.8a2.4 2.4 0 0 0 2.4 2.4" ' +
    'stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>';

  /* ── Elements ── */
  var $ = function (id) { return document.getElementById(id); };
  var deck = $('deck'), wrap = document.querySelector('.deck-wrap');
  var pos = $('pos'), total = $('total'), pips = $('pips'), status = $('status');
  var shareBtn = $('share');
  var samples = document.querySelectorAll('.samples .li-card');

  /* ── State ── */
  var i = 0;              // active template
  var cards = [];         // one per template
  var timer = null;
  var raf = 0;

  /* ── Helpers ── */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function say(msg) {
    status.textContent = msg || '';
    clearTimeout(timer);
    if (msg) timer = setTimeout(function () { status.textContent = ''; }, 2600);
  }

  function grow(ta) {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  /* Hashtags live on their own trailing line; LinkedIn renders them blue. */
  function split(text) {
    var lines = text.replace(/\s+$/, '').split('\n');
    var tail = [];
    while (lines.length && (lines[lines.length - 1].trim() === '' ||
                            /^#\S/.test(lines[lines.length - 1].trim()))) {
      var line = lines.pop().trim();
      if (line) tail.unshift(line);
    }
    return { body: lines.join('\n').trim(), tags: tail.join(' ') };
  }

  /* Trim to a word boundary, the way the feed clips a long post. */
  function clip(text, max) {
    var flat = text.replace(/\s*\n+\s*/g, ' ').trim();
    if (flat.length <= max) return { text: flat, cut: false };
    var cut = flat.slice(0, max);
    var space = cut.lastIndexOf(' ');
    if (space > max * 0.6) cut = cut.slice(0, space);
    return { text: cut.replace(/[,.;:—-]+$/, ''), cut: true };
  }

  function drawPreview(card, text) {
    var parts = split(text);
    var shown = clip(parts.body, 108);
    var body = card.querySelector('.li-post__text');
    body.textContent = shown.text + (shown.cut ? '\u2026 ' : '');
    if (shown.cut) {
      var more = document.createElement('span');
      more.className = 'more';
      more.textContent = 'see more';
      body.appendChild(more);
    }
    card.querySelector('.li-post__tags').textContent = parts.tags;
  }

  /* Three showcase posts, each a different caption, drawn once at load. */
  function fillSamples() {
    var picks = [], guard = 0;
    while (picks.length < samples.length && guard++ < 400) {
      var k = Math.floor(Math.random() * POSTS.length);
      if (picks.indexOf(k) === -1) picks.push(k);
    }
    for (var s = 0; s < samples.length; s++) {
      drawPreview(samples[s], POSTS[picks[s]].text);
    }
  }

  function drawPips() {
    var n = Math.min(PIPS, POSTS.length);
    var half = Math.floor(n / 2);
    var start = Math.max(0, Math.min(i - half, POSTS.length - n));
    var html = '';
    for (var k = 0; k < n; k++) {
      html += '<i class="' + (start + k === i ? 'is-on' : '') + '"></i>';
    }
    pips.innerHTML = html;
  }

  /* The track is as tall as the card in view, so short captions don't leave
     a gap above the button and long ones aren't cut off. */
  function fitHeight() {
    if (!cards[i]) return;
    deck.style.height = cards[i].el.offsetHeight + 'px';
  }

  function drawFades() {
    var max = deck.scrollWidth - deck.clientWidth;
    wrap.classList.toggle('has-prev', deck.scrollLeft > 4);
    wrap.classList.toggle('has-next', deck.scrollLeft < max - 4);
  }

  /* ── Active card ── */
  function setActive(next) {
    if (next === i || !cards[next]) return;
    cards[i].el.classList.remove('is-on');
    i = next;
    cards[i].el.classList.add('is-on');
    pos.textContent = i + 1;
    drawPips();
    fitHeight();
  }

  /* Which card is nearest the track's left edge? */
  function nearest() {
    var step = cards[0].el.offsetWidth + 11;              // card + gap
    return Math.max(0, Math.min(cards.length - 1, Math.round(deck.scrollLeft / step)));
  }

  deck.addEventListener('scroll', function () {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      drawFades();
      setActive(nearest());
    });
  });

  function scrollTo(k) {
    var step = cards[0].el.offsetWidth + 11;
    deck.scrollTo({ left: k * step, behavior: 'smooth' });
  }

  /* ── Copy ── */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)['catch'](function () { legacyCopy(text); });
    }
    legacyCopy(text);
    return Promise.resolve();
  }

  function copyThenOpen(text) {
    return copyText(text).then(function () {
      say('Caption copied — paste it into LinkedIn');
      window.open(LI_COMPOSER + encodeURIComponent(text), '_blank', 'noopener');
    });
  }

  /* ── Build the deck ── */
  function build() {
    var frag = document.createDocumentFragment();

    POSTS.forEach(function (post, k) {
      var el = document.createElement('article');
      el.className = 'caption';
      el.innerHTML =
        '<p class="caption__n">' + pad(k + 1) + '</p>' +
        '<label class="sr-only" for="draft-' + k + '">Caption ' + (k + 1) + '</label>' +
        '<textarea id="draft-' + k + '" class="caption__text" rows="4" spellcheck="true" ' +
        'autocapitalize="sentences"></textarea>' +
        '<p class="caption__meta">' +
        '<button class="linkish" type="button" hidden>Undo edits</button></p>' +
        '<button class="btn btn--ghost" type="button">' + COPY_ICON + 'Copy text</button>';

      var ta = el.querySelector('textarea');
      var undo = el.querySelector('.linkish');
      var copy = el.querySelector('.btn--ghost');

      ta.value = post.text;

      ta.addEventListener('input', function () {
        grow(ta);
        fitHeight();
        if (undo.hidden) undo.hidden = false;
      });

      undo.addEventListener('click', function () {
        ta.value = post.text;
        undo.hidden = true;
        grow(ta);
        fitHeight();
        say('Edits undone');
      });

      copy.addEventListener('click', function () {
        copyText(ta.value).then(function () { say('Caption copied'); });
      });

      /* Bring a half-visible card fully into view when it's tapped. */
      el.addEventListener('focusin', function () { if (k !== i) scrollTo(k); });

      frag.appendChild(el);
      cards.push({ el: el, ta: ta });
    });

    deck.appendChild(frag);
    cards.forEach(function (c) { grow(c.ta); });
  }

  /* "Open LinkedIn" — the device's own share sheet where there is one
     (picking LinkedIn prefills the composer), otherwise copy the caption
     and open the web composer, so the text is always in hand. */
  shareBtn.addEventListener('click', function () {
    var text = cards[i] ? cards[i].ta.value : '';

    if (navigator.share) {
      navigator.share({ text: text })['catch'](function (err) {
        if (err && err.name === 'AbortError') return;      // visitor dismissed the sheet
        copyThenOpen(text);
      });
      return;
    }

    copyThenOpen(text);
  });

  window.addEventListener('resize', function () {
    cards.forEach(function (c) { grow(c.ta); });
    fitHeight();
    drawFades();
  });

  /* ── Start ── */
  var ruleLinks = document.querySelectorAll('.rules-link');
  for (var r = 0; r < ruleLinks.length; r++) ruleLinks[r].href = RULES_URL;
  total.textContent = POSTS.length;

  if (!POSTS.length) {
    say('No templates loaded');
    return;
  }

  build();
  fillSamples();

  i = Math.floor(Math.random() * POSTS.length);     // a fresh one for each visitor
  cards[i].el.classList.add('is-on');
  pos.textContent = i + 1;
  drawPips();
  fitHeight();
  deck.scrollLeft = i * (cards[0].el.offsetWidth + 11);
  drawFades();

})();
