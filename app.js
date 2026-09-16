/* ═══ June · Dreamforce 26 selfie competition ═══ */
(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────
     TODO: replace with the real eligibility / official-rules page. */
  var RULES_URL = 'https://june.ai/dreamforce';

  var LI_COMPOSER = 'https://www.linkedin.com/feed/?shareActive=true&text=';
  var PIPS = 5;                                  // dots shown in the carousel window
  var POSTS = window.JUNE_POSTS || [];

  /* ── Elements ── */
  var $ = function (id) { return document.getElementById(id); };
  var draft = $('draft'), num = $('num'), pos = $('pos'), total = $('total');
  var pips = $('pips'), hint = $('hint'), resetBtn = $('reset'), status = $('status');
  var prevBtn = $('prev'), nextBtn = $('next'), copyBtn = $('copy'), shareBtn = $('share');
  var preview = $('preview'), tags = $('tags');

  /* ── State ── */
  var i = 0;              // current template
  var edited = false;     // has the visitor changed the caption?
  var armed = false;      // arrow tapped once while edited
  var timer = null;

  /* ── Helpers ── */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function say(msg) {
    status.textContent = msg || '';
    clearTimeout(timer);
    if (msg) timer = setTimeout(function () { status.textContent = ''; }, 2600);
  }

  function grow() {
    draft.style.height = 'auto';
    draft.style.height = draft.scrollHeight + 'px';
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
    return { text: cut.replace(/[,.;:\u2014-]+$/, ''), cut: true };
  }

  function drawPreview(text) {
    var parts = split(text);
    var shown = clip(parts.body, 108);
    preview.textContent = shown.text + (shown.cut ? '\u2026 ' : '');
    if (shown.cut) {
      var more = document.createElement('span');
      more.className = 'more';
      more.textContent = 'see more';
      preview.appendChild(more);
    }
    tags.textContent = parts.tags;
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

  /* ── Render ── */
  function render() {
    draft.value = POSTS[i].text;
    drawPreview(draft.value);
    num.textContent = pad(i + 1);
    pos.textContent = i + 1;
    edited = false;
    armed = false;
    resetBtn.hidden = true;
    hint.textContent = 'Tap the text to make it yours';
    grow();
    drawPips();
  }

  function go(step) {
    /* Guard the visitor's own writing behind a second tap. */
    if (edited && !armed) {
      armed = true;
      say('Tap again to discard your edits');
      return;
    }
    i = (i + step + POSTS.length) % POSTS.length;
    render();
    say('');
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

  /* ── Wiring ── */
  prevBtn.addEventListener('click', function () { go(-1); });
  nextBtn.addEventListener('click', function () { go(1); });

  draft.addEventListener('input', function () {
    grow();
    drawPreview(draft.value);
    armed = false;
    if (!edited) {
      edited = true;
      resetBtn.hidden = false;
      hint.textContent = 'Edited by you';
    }
  });

  resetBtn.addEventListener('click', function () {
    draft.value = POSTS[i].text;
    drawPreview(draft.value);
    edited = false;
    armed = false;
    resetBtn.hidden = true;
    hint.textContent = 'Tap the text to make it yours';
    grow();
    say('Edits undone');
  });

  copyBtn.addEventListener('click', function () {
    copyText(draft.value).then(function () { say('Caption copied'); });
  });

  /* "Open LinkedIn" — the device's own share sheet where there is one
     (picking LinkedIn prefills the composer), otherwise copy the caption
     and open the web composer, so the text is always in hand. */
  shareBtn.addEventListener('click', function () {
    var text = draft.value;

    if (navigator.share) {
      navigator.share({ text: text })['catch'](function (err) {
        if (err && err.name === 'AbortError') return;      // visitor dismissed the sheet
        copyThenOpen(text);
      });
      return;
    }

    copyThenOpen(text);
  });

  window.addEventListener('resize', grow);

  /* ── Start ── */
  $('rules').href = RULES_URL;
  total.textContent = POSTS.length;

  if (!POSTS.length) {
    draft.placeholder = 'No templates loaded.';
    say('No templates loaded');
  } else {
    i = Math.floor(Math.random() * POSTS.length);   // a fresh one for each visitor
    render();
  }

})();
