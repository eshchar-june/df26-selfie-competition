/* ═══ June · Dreamforce '26 LinkedIn post generator ═══ */
(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────
     TODO: replace with the real official-rules page before the show. */
  var RULES_URL = 'https://june.ai/df26-rules';

  var LI_LIMIT = 3000;                                   // LinkedIn post character limit
  var THEMES = ['yellow', 'pink', 'blue', 'sand', 'fog', 'ink'];
  var POSTS = window.JUNE_POSTS || [];

  /* ── Elements ── */
  var $ = function (id) { return document.getElementById(id); };
  var viewIntro = $('view-intro'), viewPost = $('view-post');
  var card = $('card'), chip = $('chip'), draft = $('draft');
  var counter = $('counter'), hint = $('hint'), resetBtn = $('reset');
  var startBtn = $('start'), regenBtn = $('regen'), shareBtn = $('share'), copyBtn = $('copy');
  var status = $('status');

  /* ── State ── */
  var queue = [];            // shuffled indices, drained one at a time
  var current = null;        // the post currently on the card
  var themeIdx = -1;
  var confirmTimer = null;   // "tap again to replace your edits" window

  /* ── Helpers ── */
  function shuffled(n) {
    var a = [], i, j, t;
    for (i = 0; i < n; i++) a.push(i);
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function nextPost() {
    if (!queue.length) {
      queue = shuffled(POSTS.length);
      // Avoid handing back the same post twice in a row across a reshuffle.
      if (current && POSTS[queue[queue.length - 1]] === current && queue.length > 1) {
        var t = queue[queue.length - 1]; queue[queue.length - 1] = queue[0]; queue[0] = t;
      }
    }
    return POSTS[queue.pop()];
  }

  function nextTheme() {
    var i = themeIdx;
    while (i === themeIdx) i = Math.floor(Math.random() * THEMES.length);
    themeIdx = i;
    return THEMES[i];
  }

  function autogrow() {
    draft.style.height = 'auto';
    draft.style.height = draft.scrollHeight + 'px';
  }

  function updateCount() {
    var n = draft.value.length;
    counter.textContent = n;
    counter.parentNode.classList.toggle('is-over', n > LI_LIMIT);
  }

  function markEdited() {
    var edited = draft.value !== current.text;
    resetBtn.hidden = !edited;
    hint.textContent = edited ? 'Edited by you' : 'Tap the text to make it yours';
  }

  function say(msg) {
    status.textContent = msg || '';
    status.classList.toggle('is-on', !!msg);
  }

  function clearConfirm() {
    if (confirmTimer) { clearTimeout(confirmTimer); confirmTimer = null; }
    regenBtn.textContent = 'Generate new';
  }

  /* ── Render a post onto the card ── */
  function render(post) {
    current = post;
    card.setAttribute('data-theme', nextTheme());
    chip.textContent = post.topic;
    draft.value = post.text;
    autogrow();
    updateCount();
    markEdited();
    clearConfirm();
    say('');

    card.classList.remove('is-dealing');
    void card.offsetWidth;            // restart the animation
    card.classList.add('is-dealing');
  }

  /* ── Sharing ── */
  function linkedInFallback(text) {
    copyText(text);
    var win = null;
    try {
      win = window.open(
        'https://www.linkedin.com/feed/?shareActive=true&text=' + encodeURIComponent(text),
        '_blank', 'noopener'
      );
    } catch (e) {}
    // Popup blocked, or running inside a frame that will not open one.
    say(win ? 'Copied — paste into LinkedIn' : 'Copied — open LinkedIn and paste');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)['catch'](legacyCopy.bind(null, text));
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function share() {
    var text = draft.value.trim();
    if (!text) { say('Nothing to share yet'); return; }

    if (navigator.share) {
      navigator.share({ text: text })
        .then(function () { say('Shared — good luck!'); })
        ['catch'](function (err) {
          if (err && err.name === 'AbortError') { say(''); return; }
          linkedInFallback(text);
        });
    } else {
      linkedInFallback(text);
    }
  }

  /* ── Wiring ── */
  startBtn.addEventListener('click', function () {
    viewIntro.classList.remove('is-active');
    viewPost.classList.add('is-active');
    render(nextPost());
    window.scrollTo(0, 0);
  });

  regenBtn.addEventListener('click', function () {
    var edited = current && draft.value !== current.text;

    // One extra tap before we throw away someone's edits.
    if (edited && !confirmTimer) {
      regenBtn.textContent = 'Replace edits?';
      say('Tap again to start a new draft');
      confirmTimer = setTimeout(function () { confirmTimer = null; clearConfirm(); say(''); }, 4000);
      return;
    }

    render(nextPost());
  });

  shareBtn.addEventListener('click', share);

  copyBtn.addEventListener('click', function () {
    copyText(draft.value.trim());
    say('Copied to clipboard');
  });

  resetBtn.addEventListener('click', function () {
    draft.value = current.text;
    autogrow(); updateCount(); markEdited(); clearConfirm();
    say('');
  });

  draft.addEventListener('input', function () {
    autogrow(); updateCount(); markEdited(); clearConfirm(); say('');
  });

  window.addEventListener('resize', autogrow);

  $('rules-intro').href = RULES_URL;
  $('rules-post').href = RULES_URL;
})();
