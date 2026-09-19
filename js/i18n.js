/**
 * ForumCore site i18n: lang switcher and same-origin marketing href localize.
 * Cookie/codes SSOT: window.ForumCoreLocale from locale-boot.js (loaded first, no defer).
 */
(function (global) {
  var core = global.ForumCoreLocale || null;

  var LOCALES = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
    { code: 'it', label: 'Italiano' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'pt-BR', label: 'Português (BR)' },
    { code: 'pt-PT', label: 'Português (PT)' },
    { code: 'sv', label: 'Svenska' },
    { code: 'da', label: 'Dansk' },
    { code: 'nb', label: 'Norsk bokmål' },
    { code: 'fi', label: 'Suomi' },
    { code: 'pl', label: 'Polski' },
    { code: 'cs', label: 'Čeština' },
    { code: 'hu', label: 'Magyar' },
    { code: 'ro', label: 'Română' },
    { code: 'uk', label: 'Українська' },
    { code: 'ru', label: 'Русский' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'el', label: 'Ελληνικά' },
    { code: 'he', label: 'עברית', rtl: true },
    { code: 'ar', label: 'العربية', rtl: true },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'zh-Hans', label: '简体中文' },
    { code: 'zh-Hant', label: '繁體中文' },
    { code: 'id', label: 'Indonesia' },
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'th', label: 'ไทย' },
    { code: 'hi', label: 'हिन्दी' },
  ];

  var LOCALE_CODES = {};
  LOCALES.forEach(function (L) {
    LOCALE_CODES[L.code] = L;
  });

  var SKIP_LOCALIZE = /^\/(js|css|img|fonts|favicon|site\.webmanifest)(\/|\.html|$|\?|#)/i;

  function setLocaleCookie(code) {
    if (core && typeof core.setCookie === 'function') {
      core.setCookie(code);
      return;
    }
  }

  function getCookie() {
    return (core && core.getCookie && core.getCookie()) || '';
  }

  function isLegalPath(pathname) {
    if (core && typeof core.isLegalPath === 'function') return core.isLegalPath(pathname);
    return /\/betterctrlv\/(privacy|terms)\.html$/i.test(String(pathname || '/'));
  }

  function detectLocale() {
    var path = (global.location && location.pathname) || '/';
    if (core && typeof core.pathLocale === 'function') {
      var fromPath = core.pathLocale(path);
      if (fromPath) return fromPath;
    }
    if (isLegalPath(path)) return getCookie() || 'en';
    return 'en';
  }

  function stripLocalePrefix(pathname) {
    if (core && typeof core.stripLocale === 'function') {
      return core.stripLocale(pathname);
    }
    return pathname || '/';
  }

  function prefix(code) {
    if (core && typeof core.prefix === 'function') return core.prefix(code);
    if (!code || code === 'en') return '';
    return '/' + code;
  }

  function pageKeyFromPath(pathname) {
    var bare = stripLocalePrefix(pathname);
    if (/\/betterctrlv\/privacy\.html$/i.test(bare)) return 'privacy';
    if (/\/betterctrlv\/terms\.html$/i.test(bare)) return 'terms';
    if (/^\/betterctrlv(\/|\/index\.html)?$/i.test(bare)) return 'product';
    return 'home';
  }

  function pathFor(locale, pageKey, hash) {
    var key = pageKey == null ? pageKeyFromPath((location && location.pathname) || '/') : pageKey;
    var h = hash || '';
    if (h && h.charAt(0) !== '#') h = '#' + h;
    if (key === 'privacy') return '/betterctrlv/privacy.html' + h;
    if (key === 'terms') return '/betterctrlv/terms.html' + h;
    var p = prefix(locale);
    if (key === 'product') return (p || '') + '/betterctrlv/' + h;
    var home = p ? p + '/' : '/';
    return home + h;
  }

  function localizeHref(href, locale) {
    if (!href || !locale || locale === 'en') return href;
    if (href.charAt(0) !== '/') return href;
    if (href.indexOf('//') === 0) return href;
    if (SKIP_LOCALIZE.test(href)) return href;

    var hash = '';
    var query = '';
    var pathOnly = href;
    var hashAt = pathOnly.indexOf('#');
    if (hashAt >= 0) {
      hash = pathOnly.slice(hashAt);
      pathOnly = pathOnly.slice(0, hashAt);
    }
    var qAt = pathOnly.indexOf('?');
    if (qAt >= 0) {
      query = pathOnly.slice(qAt);
      pathOnly = pathOnly.slice(0, qAt);
    }

    var bare = stripLocalePrefix(pathOnly || '/');
    if (isLegalPath(bare)) return href;

    var key = pageKeyFromPath(bare);
    if (key !== 'home' && key !== 'product') return href;

    var next = pathFor(locale, key, hash || null);
    if (query) {
      if (hash) next = pathFor(locale, key, null) + query + hash;
      else next = next + query;
    }
    return next;
  }

  function wireLocalHrefs(root) {
    var locale = detectLocale();
    if (locale === 'en') return;
    var scope = root && root.querySelectorAll ? root : document;
    if (!scope || !scope.querySelectorAll) return;
    var nodes = scope.querySelectorAll('a[href^="/"], a[href^="https://forumcore.ai/"]');
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      if (a.getAttribute('data-locale-stick')) continue;
      if (a.getAttribute('data-locale-href') === 'keep') continue;
      var href = a.getAttribute('href') || '';
      var path = href;
      if (href.indexOf('https://forumcore.ai/') === 0) {
        path = href.slice('https://forumcore.ai'.length) || '/';
      }
      var next = localizeHref(path, locale);
      if (!next || next === path) continue;
      if (href.indexOf('https://forumcore.ai/') === 0) {
        a.setAttribute('href', 'https://forumcore.ai' + next);
      } else {
        a.setAttribute('href', next);
      }
    }
  }

  function applyDocumentDir(locale) {
    var path = (global.location && location.pathname) || '/';
    if (isLegalPath(path)) return;
    var L = LOCALE_CODES[locale];
    if (!L || !document || !document.documentElement) return;
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', L.rtl ? 'rtl' : 'ltr');
  }

  function mountSwitcher(el) {
    if (!el) return;
    var locale = detectLocale();
    var pageKey = pageKeyFromPath((location && location.pathname) || '/');
    var hash = (location && location.hash) || '';
    el.classList.add('lang-switch');
    el.setAttribute('role', 'navigation');
    var label = el.getAttribute('aria-label') || 'Language';
    el.setAttribute('aria-label', label);

    var select = document.createElement('select');
    select.className = 'lang-switch-select';
    select.setAttribute('aria-label', label);
    LOCALES.forEach(function (L) {
      var opt = document.createElement('option');
      opt.value = L.code;
      opt.textContent = L.label;
      if (L.code === locale) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', function () {
      var next = select.value;
      setLocaleCookie(next);
      var dest = pathFor(next, pageKey, hash);
      var search = (location && location.search) || '';
      if (search) dest += search;
      location.href = dest;
    });
    el.textContent = '';
    el.appendChild(select);
  }

  function bindLocaleStick(a, code) {
    if (!a || !LOCALE_CODES[code]) return;
    function stick() {
      setLocaleCookie(code);
    }
    a.addEventListener('click', stick);
    a.addEventListener('auxclick', function (ev) {
      if (ev.button === 1) stick();
    });
  }

  function wireLocaleStickLinks() {
    var marked = document.querySelectorAll('a[data-locale-stick]');
    for (var i = 0; i < marked.length; i++) {
      bindLocaleStick(marked[i], marked[i].getAttribute('data-locale-stick'));
    }
  }

  function boot() {
    var locale = detectLocale();
    var path = (global.location && location.pathname) || '/';
    if (!isLegalPath(path)) setLocaleCookie(locale);
    applyDocumentDir(locale);
    wireLocalHrefs(document);
    var nodes = document.querySelectorAll('[data-lang-switch]');
    for (var i = 0; i < nodes.length; i++) mountSwitcher(nodes[i]);
    wireLocaleStickLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.ForumCoreI18n = {
    LOCALES: LOCALES,
    detectLocale: detectLocale,
    stripLocalePrefix: stripLocalePrefix,
    pageKeyFromPath: pageKeyFromPath,
    pathFor: pathFor,
    localizeHref: localizeHref,
    setLocaleCookie: setLocaleCookie,
  };
})(typeof window !== 'undefined' ? window : globalThis);
