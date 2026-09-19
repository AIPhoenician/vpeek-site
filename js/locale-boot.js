/**
 * ForumCore locale core + sync boot (no defer).
 *
 * Cookie: forumcore_locale=<code> (1y, Path=/, SameSite=Lax; Secure on https)
 * Path locale wins. Search bots never redirect.
 * privacy.html and terms.html stay English and are never redirected.
 */
(function (global) {
  'use strict';

  var COOKIE = 'forumcore_locale';
  var MAX_AGE = 31536000;
  var BOT_UA =
    /Googlebot|Bingbot|DuckDuckBot|Slurp|Yandex(Bot|Images)|Applebot|GPTBot|ClaudeBot|anthropic-ai|Bytespider|CCBot|facebookexternalhit|Twitterbot|LinkedInBot|Discordbot/i;

  var CODES = {
    en: 1,
    de: 1,
    fr: 1,
    es: 1,
    it: 1,
    nl: 1,
    'pt-BR': 1,
    'pt-PT': 1,
    sv: 1,
    da: 1,
    nb: 1,
    fi: 1,
    pl: 1,
    cs: 1,
    hu: 1,
    ro: 1,
    uk: 1,
    ru: 1,
    tr: 1,
    el: 1,
    he: 1,
    ar: 1,
    ja: 1,
    ko: 1,
    'zh-Hans': 1,
    'zh-Hant': 1,
    id: 1,
    vi: 1,
    th: 1,
    hi: 1,
  };

  function canonical(code) {
    if (!code) return '';
    if (CODES[code]) return code;
    var lower = String(code).toLowerCase();
    for (var k in CODES) {
      if (k.toLowerCase() === lower) return k;
    }
    return '';
  }

  function isCode(code) {
    return !!canonical(code);
  }

  function setCookie(code) {
    var canon = canonical(code);
    if (!canon) return;
    try {
      var secure =
        global.location && String(global.location.protocol) === 'https:' ? '; Secure' : '';
      global.document.cookie =
        COOKIE +
        '=' +
        encodeURIComponent(canon) +
        '; Max-Age=' +
        MAX_AGE +
        '; Path=/; SameSite=Lax' +
        secure;
    } catch (_) {}
  }

  function getCookie() {
    try {
      var parts = String(global.document.cookie || '').split(';');
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].replace(/^\s+/, '');
        if (p.indexOf(COOKIE + '=') === 0) {
          return canonical(decodeURIComponent(p.slice(COOKIE.length + 1)));
        }
      }
    } catch (_) {}
    return '';
  }

  function pathLocale(pathname) {
    var parts = String(pathname || '/').replace(/\/+/g, '/').split('/');
    var maybe = canonical(parts[1] || '');
    if (maybe && maybe !== 'en') return maybe;
    return '';
  }

  function stripLocale(pathname) {
    var path = String(pathname || '/').replace(/\/+/g, '/');
    var parts = path.split('/');
    var maybe = canonical(parts[1] || '');
    if (maybe && maybe !== 'en') {
      var rest = '/' + parts.slice(2).join('/');
      if (rest === '/' || rest === '') return '/';
      return rest;
    }
    return path === '' ? '/' : path;
  }

  function prefix(code) {
    var canon = canonical(code);
    if (!canon || canon === 'en') return '';
    return '/' + canon;
  }

  function matchNavigator() {
    var list = [];
    try {
      if (global.navigator && global.navigator.languages && global.navigator.languages.length) {
        for (var i = 0; i < global.navigator.languages.length; i++) {
          list.push(global.navigator.languages[i]);
        }
      } else if (global.navigator && global.navigator.language) {
        list.push(global.navigator.language);
      }
    } catch (_) {}
    for (var j = 0; j < list.length; j++) {
      var raw = String(list[j] || '')
        .toLowerCase()
        .replace(/_/g, '-');
      if (!raw) continue;
      if (
        raw.indexOf('zh-tw') === 0 ||
        raw.indexOf('zh-hk') === 0 ||
        raw.indexOf('zh-mo') === 0 ||
        raw.indexOf('zh-hant') === 0
      ) {
        return 'zh-Hant';
      }
      if (
        raw === 'zh' ||
        raw.indexOf('zh-cn') === 0 ||
        raw.indexOf('zh-sg') === 0 ||
        raw.indexOf('zh-hans') === 0
      ) {
        return 'zh-Hans';
      }
      if (raw === 'pt-pt') return 'pt-PT';
      if (raw.indexOf('pt') === 0) return 'pt-BR';
      if (raw === 'nb' || raw.indexOf('nb-') === 0 || raw === 'nn' || raw.indexOf('nn-') === 0 || raw === 'no' || raw.indexOf('no-') === 0) {
        return 'nb';
      }
      var primary = raw.split('-')[0];
      var hit = canonical(raw) || canonical(primary);
      if (hit) return hit;
    }
    return 'en';
  }

  function isLegalPath(pathname) {
    return /\/betterctrlv\/(privacy|terms)\.html$/i.test(String(pathname || '/'));
  }

  function isDocumentPath(pathname) {
    var p = String(pathname || '/');
    if (p.indexOf('/js/') === 0 || p.indexOf('/css/') === 0 || p.indexOf('/img/') === 0 || p.indexOf('/fonts/') === 0) {
      return false;
    }
    if (/\.(js|css|png|jpe?g|gif|webp|svg|ico|woff2?|txt|xml|json|webmanifest|map)$/i.test(p)) {
      return false;
    }
    return true;
  }

  function isSearchBot() {
    try {
      return BOT_UA.test(String((global.navigator && global.navigator.userAgent) || ''));
    } catch (_) {
      return false;
    }
  }

  global.ForumCoreLocale = {
    COOKIE: COOKIE,
    CODES: CODES,
    canonical: canonical,
    isCode: isCode,
    setCookie: setCookie,
    getCookie: getCookie,
    pathLocale: pathLocale,
    stripLocale: stripLocale,
    prefix: prefix,
    matchNavigator: matchNavigator,
    isLegalPath: isLegalPath,
  };

  try {
    var path = (global.location && global.location.pathname) || '/';
    if (!isDocumentPath(path)) return;
    if (isSearchBot()) return;
    if (isLegalPath(path)) return;

    var fromPath = pathLocale(path);
    if (fromPath) {
      setCookie(fromPath);
      return;
    }

    var pref = getCookie();
    if (!pref) {
      pref = matchNavigator() || 'en';
      if (isCode(pref)) setCookie(pref);
    }

    pref = canonical(pref);
    if (!pref || pref === 'en') return;

    var bare = stripLocale(path);
    if (bare !== '/' && !/\/$/.test(bare) && !/\.[a-z0-9]+$/i.test(bare)) {
      bare += '/';
    }
    var dest = prefix(pref) + (bare === '/' ? '/' : bare);
    var search = (global.location && global.location.search) || '';
    var hash = (global.location && global.location.hash) || '';
    global.location.replace(dest + search + hash);
  } catch (_) {}
})(typeof window !== 'undefined' ? window : globalThis);
