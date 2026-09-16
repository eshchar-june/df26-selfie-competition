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
  var pips = $('pips'), status = $('status');
  var prevBtn = $('prev'), nextBtn = $('next');
  var navTarget = 0, navUntil = 0;   /* chevron intent, held while a smooth scroll runs */
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

  function drawPreview(card, text, max) {
    var parts = split(text);
    var shown = clip(parts.body, max || 108);
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
      drawPreview(samples[s], POSTS[picks[s]].text, 62);
    }
  }

  function drawPips() {
    var n = Math.min(PIPS, POSTS.length);
    var half = Math.floor(n / 2);
    var start = Math.max(0, Math.min(i - half, POSTS.length - n));
    var html = '';
    for (var k = 0; k < n; k++) {
      var cls = start + k === i ? 'is-on' : '';
      /* Taper the end dots when the window has more behind it, the way a page
         control signals "there is more this way". */
      if (k === 0 && start > 0) cls += ' is-edge';
      if (k === n - 1 && start + n < POSTS.length) cls += ' is-edge';
      html += '<i class="' + cls.trim() + '"></i>';
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
    if (Date.now() > navUntil) navTarget = i;
    drawPips();
    drawNav();
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

  function drawNav() {
    var at = Date.now() > navUntil ? i : navTarget;
    prevBtn.disabled = at === 0;
    nextBtn.disabled = at === cards.length - 1;
  }

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

  /* ── Build the deck ── */
  function build() {
    var frag = document.createDocumentFragment();

    POSTS.forEach(function (post, k) {
      var parts = split(post.text);

      var el = document.createElement('article');
      el.className = 'caption';
      el.innerHTML =
        '<p class="caption__n">Post ' + pad(k + 1) + '</p>' +
        '<label class="sr-only" for="draft-' + k + '">Post ' + (k + 1) + '</label>' +
        '<textarea id="draft-' + k + '" class="caption__text" rows="4" spellcheck="true" ' +
        'autocapitalize="sentences"></textarea>' +
        '<label class="sr-only" for="tags-' + k + '">Hashtags for post ' + (k + 1) + '</label>' +
        '<textarea id="tags-' + k + '" class="caption__tags" rows="1" spellcheck="false" ' +
        'autocapitalize="none"></textarea>' +
        '<p class="caption__meta">' +
        '<button class="linkish" type="button" hidden>Undo edits</button></p>' +
        '<button class="btn btn--ghost" type="button">' + COPY_ICON + 'Copy text</button>';

      var ta = el.querySelector('.caption__text');
      var tags = el.querySelector('.caption__tags');
      var undo = el.querySelector('.linkish');
      var copy = el.querySelector('.btn--ghost');

      ta.value = parts.body;
      tags.value = parts.tags;

      /* The hashtags are a field of their own so they can carry LinkedIn's
         blue — a textarea cannot style part of its own contents. */
      function full() {
        var t = tags.value.trim();
        return ta.value.replace(/\s+$/, '') + (t ? '\n\n' + t : '');
      }

      function touched() {
        grow(ta); grow(tags); fitHeight();
        if (undo.hidden) undo.hidden = false;
      }

      ta.addEventListener('input', touched);
      tags.addEventListener('input', touched);

      undo.addEventListener('click', function () {
        ta.value = parts.body;
        tags.value = parts.tags;
        undo.hidden = true;
        grow(ta); grow(tags); fitHeight();
        say('Edits undone');
      });

      copy.addEventListener('click', function () {
        copyText(full()).then(function () { say('Post copied'); });
      });

      /* Bring a half-visible card fully into view when it's tapped. */
      el.addEventListener('focusin', function () { if (k !== i) scrollTo(k); });

      frag.appendChild(el);
      cards.push({ el: el, ta: ta, tags: tags, full: full });
    });

    deck.appendChild(frag);
    cards.forEach(function (c) { grow(c.ta); grow(c.tags); });
  }

  /* "Open LinkedIn" is a real link, not a scripted window.open: a popup
     raised from a promise has lost the click that authorised it and browsers
     swallow it, which left the button doing nothing. The handler only points
     the link at the composer holding the post on show — setting href
     during the click is honoured by the navigation that follows — and puts
     the same text on the clipboard, since LinkedIn no longer reliably
     prefills it and the visitor needs it in hand either way. */
  shareBtn.addEventListener('click', function () {
    var text = cards[i] ? cards[i].full() : '';

    shareBtn.href = LI_COMPOSER + encodeURIComponent(text);
    copyText(text).then(function () {
      say('Post copied — paste it into LinkedIn');
    });
  });

  /* Text areas are sized from scrollHeight, which is measured against whatever
     font is active at the time. The brand face arrives later and reflows the
     text taller, so measure again once it has loaded or the card clips. */
  function regrow() {
    cards.forEach(function (c) { grow(c.ta); grow(c.tags); });
    fitHeight();
    drawFades();
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(regrow);
  window.addEventListener('load', regrow);

  /* A smooth scroll takes a moment to settle, and i only catches up when it
     does. Stepping from i alone means a second tap recomputes from the old
     card and goes nowhere, so the chevrons step from their own target and
     hand it back to the scroll position once the movement has finished. */
  function step(by) {
    navTarget = Math.max(0, Math.min(cards.length - 1, navTarget + by));
    navUntil = Date.now() + 700;
    scrollTo(navTarget);
    drawNav();
  }

  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });

  window.addEventListener('resize', function () {
    cards.forEach(function (c) { grow(c.ta); grow(c.tags); });
    fitHeight();
    drawFades();
  });

  /* ── The sample deck is dealt as it comes into view ──
     Marking the deck is what arms the animation: the stylesheet leaves the
     cards at rest until data-deal appears, so a visitor with no script, an
     old browser, or reduced motion asked for gets the finished deck rather
     than three cards that never arrive. */
  function dealSamples() {
    var deckEl = document.querySelector('.samples');
    if (!deckEl || !window.IntersectionObserver) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    deckEl.setAttribute('data-deal', 'wait');

    var fallback = 0;
    function deal() {
      clearTimeout(fallback);
      deckEl.setAttribute('data-deal', 'in');
      if (io) io.disconnect();
    }

    var io = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) {
        if (entries[k].isIntersecting) return deal();
      }
    }, { rootMargin: '0px 0px -12% 0px' });   /* a little past the top edge, not the whole deck */
    io.observe(deckEl);

    /* Nothing here may end with three invisible cards. If the observer has not
       reported by now — a browser quirk, an odd scroll container — deal them
       anyway and lose only the animation. */
    fallback = setTimeout(deal, 6000);
  }

  /* ── Start ── */
  var ruleLinks = document.querySelectorAll('.rules-link');
  for (var r = 0; r < ruleLinks.length; r++) ruleLinks[r].href = RULES_URL;

  dealSamples();

  if (!POSTS.length) {
    say('No templates loaded');
    return;
  }

  build();
  fillSamples();

  i = Math.floor(Math.random() * POSTS.length);     // a fresh one for each visitor
  cards[i].el.classList.add('is-on');
  navTarget = i;
  drawPips();
  drawNav();
  fitHeight();
  deck.scrollLeft = i * (cards[0].el.offsetWidth + 11);
  drawFades();

})();
