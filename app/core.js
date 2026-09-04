/* ==========================================================================
 * campus-app · core.js
 * 基础层：工具函数 / 数据层 Store / 通用 UI 组件（Toast·确认框·面板·提示）
 * 依赖：无。需在 index.html 内联脚本之后加载。
 * 约定：统一挂在 window.App 命名空间下，不污染全局。
 * ========================================================================== */
(function (global) {
  'use strict';

  var App = global.App = global.App || {};

  /* ======================================================================
   * 1. 工具函数 App.util
   * ==================================================================== */
  var util = App.util = {

    /** HTML 转义，所有用户输入渲染到 DOM 前必须经过 */
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },

    /** 生成唯一 id */
    uid: function (prefix) {
      return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    },

    /** 相对时间：时间戳 → 「刚刚 / N分钟前 / 昨天 / MM-DD」 */
    fmtTime: function (ts) {
      if (!ts) return '';
      var diff = Date.now() - ts;
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
      if (diff < 86400000 * 2) return '昨天';
      if (diff < 86400000 * 7) return Math.floor(diff / 86400000) + '天前';
      var d = new Date(ts), now = new Date();
      var mm = ('0' + (d.getMonth() + 1)).slice(-2), dd = ('0' + d.getDate()).slice(-2);
      return (d.getFullYear() === now.getFullYear() ? '' : d.getFullYear() + '-') + mm + '-' + dd;
    },

    /** 字节数 → 可读体积 */
    fmtSize: function (n) {
      if (n < 1024) return n + ' B';
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
      return (n / 1024 / 1024).toFixed(2) + ' MB';
    },

    /** 防抖 */
    debounce: function (fn, wait) {
      var t = null;
      return function () {
        var args = arguments, self = this;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(self, args); }, wait || 200);
      };
    },

    /** 区间约束 */
    clamp: function (v, min, max) { return Math.max(min, Math.min(max, v)); },

    /** 从字符串中提取 #话题 */
    pickTopics: function (text) {
      var out = [], re = /#([^\s#@，。,.!！?？]{1,20})/g, m;
      while ((m = re.exec(text || '')) !== null) out.push(m[1]);
      return out;
    },

    /** 简易高亮：把关键词包成 <em>，输入需已转义 */
    highlight: function (text, kw) {
      if (!kw) return util.esc(text);
      var safe = util.esc(text);
      var safeKw = util.esc(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return safe.replace(new RegExp(safeKw, 'gi'), function (s) { return '<em class="hl">' + s + '</em>'; });
    }
  };

  /* ======================================================================
   * 2. 数据层 App.Store
   * 统一 localStorage 读写，集中处理配额异常与命名空间。
   * 兼容历史 key（ws_community_posts / post-stats:: / campus-comments:: / likes::）
   * ==================================================================== */
  var NS = 'campus-app:';

  // 本项目在 localStorage 中产生的全部 key 前缀 → 分类（供缓存清理使用）
  var KEY_GROUPS = [
    { prefix: 'ws_community_posts', group: 'posts', label: '帖子与图片数据' },
    { prefix: 'post-stats::', group: 'posts', label: '帖子互动数据' },
    { prefix: 'campus-comments::', group: 'posts', label: '评论数据' },
    { prefix: 'likes::', group: 'posts', label: '评论点赞数据' },
    { prefix: 'blockedUsers', group: 'profile', label: '黑名单' }
  ];

  var DEFAULTS = {
    profile: {
      name: 'Summer', gender: '女', grade: '大三', major: '数字媒体技术',
      bio: '记录校园生活的每一天 ✨', birthday: '2004-06-18',
      avatar: '',           // 空 = 使用首字母头像；否则为图片 dataURL
      avatarPreset: '',     // 系统头像编号 a-1 … a-6
      level: 3, points: 62  // 等级进度百分比
    },
    settings: {
      // 通知偏好
      notifyMaster: true, notifyComment: true, notifyLike: true,
      notifySystem: true, notifyClub: true,
      dndEnabled: false, dndStart: '23:00', dndEnd: '07:30',
      sound: true, vibration: true,
      // 隐私
      onlineVisible: true, postVisibility: 'school', searchable: true,
      recommendOn: true, statsPublic: true,
      // 通用
      theme: 'light', fontSize: 'normal', language: 'zh-CN'
    },
    security: {
      phone: '138****8888', realNamed: false,
      twoStep: false, loginAlert: true
    }
  };

  var Store = App.Store = {

    /** 读取（带默认值，JSON 解析失败安全回退） */
    get: function (key, def) {
      try {
        var raw = localStorage.getItem(NS + key);
        if (raw === null) return def;
        return JSON.parse(raw);
      } catch (e) { return def; }
    },

    /** 写入，返回是否成功；配额超限时给出明确提示 */
    set: function (key, val) {
      try {
        localStorage.setItem(NS + key, JSON.stringify(val));
        return true;
      } catch (e) {
        App.UI.toast('存储空间不足，请到「设置 → 清除缓存」清理后重试', { type: 'error' });
        return false;
      }
    },

    del: function (key) {
      try { localStorage.removeItem(NS + key); } catch (e) {}
    },

    /** 读取带默认结构的对象（浅合并默认项，向后兼容新增字段） */
    getObject: function (key, defKey) {
      var def = DEFAULTS[defKey] || {};
      var val = Store.get(key, null);
      if (!val || typeof val !== 'object') return JSON.parse(JSON.stringify(def));
      var out = JSON.parse(JSON.stringify(def));
      Object.keys(val).forEach(function (k) { out[k] = val[k]; });
      return out;
    },

    /** 取数组型集合 */
    list: function (key) {
      var v = Store.get(key, []);
      return Array.isArray(v) ? v : [];
    },

    /* ---------------- 业务集合快捷访问 ---------------- */

    getProfile: function () { return Store.getObject('profile', 'profile'); },
    saveProfile: function (p) { Store.set('profile', p); },

    getSettings: function () { return Store.getObject('settings', 'settings'); },
    saveSettings: function (s) { Store.set('settings', s); },
    /** 更新单项设置 */
    setSetting: function (k, v) {
      var s = Store.getSettings();
      s[k] = v;
      Store.saveSettings(s);
      return s;
    },

    getSecurity: function () { return Store.getObject('security', 'security'); },
    saveSecurity: function (s) { Store.set('security', s); },

    /** 兼容旧实现的帖子集合（与 index.html 内联脚本共用同一 key） */
    getPosts: function () {
      try { return JSON.parse(localStorage.getItem('ws_community_posts')) || []; }
      catch (e) { return []; }
    },
    savePosts: function (arr) {
      try { localStorage.setItem('ws_community_posts', JSON.stringify(arr)); return true; }
      catch (e) { App.UI.toast('存储空间不足，无法保存', { type: 'error' }); return false; }
    },

    getFavorites: function () { return Store.list('favorites'); },
    getHistory: function () { return Store.list('history'); },
    getSearchHistory: function () { return Store.list('search-history'); },
    getFollows: function () { return Store.list('follows'); },
    getBlockedUsers: function () {
      try { return JSON.parse(localStorage.getItem('blockedUsers')) || []; } catch (e) { return []; }
    },
    getHiddenPosts: function () { return Store.list('hidden-posts'); },
    getReports: function () { return Store.get('reports', {}); },

    /** 写入浏览历史（同一对象去重后置顶，最多 100 条） */
    pushHistory: function (item) {
      var list = Store.getHistory().filter(function (x) { return x.id !== item.id; });
      list.unshift(Object.assign({ ts: Date.now() }, item));
      Store.set('history', list.slice(0, 100));
    },

    /** 写入搜索历史（去重后置顶，最多 12 条） */
    pushSearchHistory: function (kw) {
      kw = String(kw || '').trim();
      if (!kw) return;
      var list = Store.getSearchHistory().filter(function (x) { return x !== kw; });
      list.unshift(kw);
      Store.set('search-history', list.slice(0, 12));
    },

    /* ---------------- 占用统计与清理 ---------------- */

    /** 扫描全部 localStorage，按分组统计本项目占用 */
    usage: function () {
      var groups = {
        posts: { label: '帖子与图片数据', size: 0, keys: [] },
        history: { label: '浏览与搜索历史', size: 0, keys: [] },
        profile: { label: '个人资料与设置', size: 0, keys: [] },
        other: { label: '其他缓存', size: 0, keys: [] }
      };
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          var v = localStorage.getItem(k) || '';
          var size = (k.length + v.length) * 2; // UTF-16 近似字节
          var g = resolveGroup(k);
          groups[g].size += size;
          groups[g].keys.push(k);
        }
      } catch (e) {}
      var total = 0;
      Object.keys(groups).forEach(function (g) { total += groups[g].size; });
      return { total: total, groups: groups };
    },

    /** 清理指定分组（或全部） */
    clearGroup: function (group) {
      var keys = [];
      try {
        if (!group) {
          for (var i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
        } else {
          for (var j = 0; j < localStorage.length; j++) {
            var k = localStorage.key(j);
            if (resolveGroup(k) === group) keys.push(k);
          }
        }
        keys.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
      return keys.length;
    }
  };

  /** key → 分组名 */
  function resolveGroup(key) {
    for (var i = 0; i < KEY_GROUPS.length; i++) {
      if (key.indexOf(KEY_GROUPS[i].prefix) === 0) return KEY_GROUPS[i].group;
    }
    if (key.indexOf(NS) === 0) {
      if (key === NS + 'history' || key === NS + 'search-history') return 'history';
      return 'profile';
    }
    return 'other';
  }

  /* ======================================================================
   * 3. 通用 UI 组件 App.UI
   * ==================================================================== */
  var UI = App.UI = {

    /* ---------------- Toast（串行队列，互不覆盖） ---------------- */
    _toastQueue: [],
    _toastBusy: false,

    /**
     * @param {string} msg   文案
     * @param {object} [opt] { type:'info'|'success'|'error', duration:number }
     */
    toast: function (msg, opt) {
      opt = opt || {};
      UI._toastQueue.push({ msg: msg, type: opt.type || 'info', duration: opt.duration || 1800 });
      UI._drainToast();
    },

    _drainToast: function () {
      if (UI._toastBusy || !UI._toastQueue.length) return;
      UI._toastBusy = true;
      var item = UI._toastQueue.shift();
      var layer = document.getElementById('ui-toast-layer');
      if (!layer) { UI._toastBusy = false; return; }

      var el = document.createElement('div');
      el.className = 'ui-toast ui-toast-' + item.type;
      el.setAttribute('role', 'status');
      el.textContent = item.msg;
      layer.appendChild(el);
      requestAnimationFrame(function () { el.classList.add('show'); });

      setTimeout(function () {
        el.classList.remove('show');
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
          UI._toastBusy = false;
          UI._drainToast();
        }, 220);
      }, item.duration);
    },

    /* ---------------- 二次确认框 ---------------- */
    /**
     * @returns {Promise<boolean>}
     */
    confirm: function (opt) {
      opt = opt || {};
      return new Promise(function (resolve) {
        UI._dialog({
          className: 'ui-confirm',
          html:
            '<div class="ui-dlg-title">' + util.esc(opt.title || '请确认') + '</div>' +
            (opt.msg ? '<div class="ui-dlg-msg">' + util.esc(opt.msg) + '</div>' : ''),
          actions: [
            { text: opt.cancelText || '取消', kind: 'cancel', value: false },
            { text: opt.okText || '确认', kind: opt.danger ? 'danger' : 'primary', value: true }
          ],
          onClose: resolve
        });
      });
    },

    /* ---------------- 输入弹窗 ---------------- */
    /**
     * @returns {Promise<string|null>} 取消时返回 null
     */
    prompt: function (opt) {
      opt = opt || {};
      return new Promise(function (resolve) {
        UI._dialog({
          className: 'ui-prompt',
          html:
            '<div class="ui-dlg-title">' + util.esc(opt.title || '请输入') + '</div>' +
            (opt.msg ? '<div class="ui-dlg-msg">' + util.esc(opt.msg) + '</div>' : '') +
            '<input class="ui-dlg-input" type="text" value="' + util.esc(opt.value || '') +
            '" placeholder="' + util.esc(opt.placeholder || '') + '"' +
            (opt.maxlength ? ' maxlength="' + opt.maxlength + '"' : '') + ' />' +
            '<div class="ui-dlg-err" style="display:none"></div>',
          actions: [
            { text: '取消', kind: 'cancel', value: null },
            { text: opt.okText || '确定', kind: 'primary', value: '__ok__' }
          ],
          focus: '.ui-dlg-input',
          onClose: resolve
        });
      });
    },

    /** 单选列表弹窗 */
    choose: function (opt) {
      opt = opt || {};
      return new Promise(function (resolve) {
        var items = (opt.items || []).map(function (it, i) {
          return '<div class="ui-dlg-opt' + (it.value === opt.value ? ' sel' : '') + '" data-i="' + i + '">' +
            '<span>' + util.esc(it.label) + '</span>' +
            (it.desc ? '<span class="ui-dlg-opt-desc">' + util.esc(it.desc) + '</span>' : '') +
            '<svg class="ui-dlg-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">' +
            '<polyline points="20 6 9 17 4 12"/></svg></div>';
        }).join('');
        UI._dialog({
          className: 'ui-choose',
          html: '<div class="ui-dlg-title">' + util.esc(opt.title || '请选择') + '</div><div class="ui-dlg-opts">' + items + '</div>',
          actions: [{ text: '取消', kind: 'cancel', value: null }],
          onMount: function (root, close) {
            root.querySelectorAll('.ui-dlg-opt').forEach(function (el) {
              el.addEventListener('click', function () {
                close((opt.items || [])[+el.dataset.i].value);
              });
            });
          },
          onClose: resolve
        });
      });
    },

    /* ---------------- 底部面板 ActionSheet ---------------- */
    /**
     * @returns {Promise<string|null>} 被点击项的 value
     */
    sheet: function (opt) {
      opt = opt || {};
      return new Promise(function (resolve) {
        var items = (opt.items || []).map(function (it) {
          return '<button type="button" class="ui-sheet-item' + (it.danger ? ' danger' : '') + '" data-v="' +
            util.esc(it.value) + '"' + (it.disabled ? ' disabled' : '') + '>' +
            (it.icon ? '<span class="ui-sheet-ico">' + it.icon + '</span>' : '') +
            '<span class="ui-sheet-text">' + util.esc(it.label) + '</span>' +
            (it.desc ? '<span class="ui-sheet-desc">' + util.esc(it.desc) + '</span>' : '') +
            '</button>';
        }).join('');

        var mask = document.createElement('div');
        mask.className = 'ui-mask ui-mask-sheet';
        mask.innerHTML =
          '<div class="ui-sheet">' +
          (opt.title ? '<div class="ui-sheet-head">' + util.esc(opt.title) + '</div>' : '') +
          '<div class="ui-sheet-body">' + items + '</div>' +
          '<button type="button" class="ui-sheet-cancel">取消</button>' +
          '</div>';

        var layer = document.getElementById('ui-modal-layer');
        layer.appendChild(mask);
        requestAnimationFrame(function () { mask.classList.add('show'); });

        var settled = false;
        function close(v) {
          if (settled) return;
          settled = true;
          mask.classList.remove('show');
          setTimeout(function () { if (mask.parentNode) mask.parentNode.removeChild(mask); }, 240);
          resolve(v);
        }

        mask.addEventListener('click', function (e) {
          if (e.target === mask) return close(null);
          var item = e.target.closest('.ui-sheet-item');
          if (item && !item.disabled) return close(item.dataset.v);
          if (e.target.closest('.ui-sheet-cancel')) return close(null);
        });
      });
    },

    /* ---------------- 弹窗底座 ---------------- */
    _dialog: function (cfg) {
      var mask = document.createElement('div');
      mask.className = 'ui-mask ui-mask-dialog';
      mask.innerHTML =
        '<div class="ui-dialog ' + (cfg.className || '') + '" role="dialog" aria-modal="true">' +
        '<div class="ui-dlg-body">' + (cfg.html || '') + '</div>' +
        '<div class="ui-dlg-actions"></div>' +
        '</div>';

      var layer = document.getElementById('ui-modal-layer');
      layer.appendChild(mask);
      requestAnimationFrame(function () { mask.classList.add('show'); });

      var settled = false;
      function close(v) {
        if (settled) return;
        settled = true;
        mask.classList.remove('show');
        setTimeout(function () { if (mask.parentNode) mask.parentNode.removeChild(mask); }, 200);
        cfg.onClose && cfg.onClose(v);
      }

      var actions = mask.querySelector('.ui-dlg-actions');
      (cfg.actions || []).forEach(function (a) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ui-dlg-btn ui-dlg-btn-' + a.kind;
        b.textContent = a.text;
        b.addEventListener('click', function () {
          if (a.value === '__ok__') {
            var input = mask.querySelector('.ui-dlg-input');
            var err = mask.querySelector('.ui-dlg-err');
            var val = input ? input.value.trim() : '';
            if (cfg.validate) {
              var message = cfg.validate(val);
              if (message) {
                err.textContent = message;
                err.style.display = 'block';
                input && input.focus();
                return;
              }
            }
            return close(val);
          }
          close(a.value);
        });
        actions.appendChild(b);
      });

      mask.addEventListener('click', function (e) {
        if (e.target === mask) close(null);
      });

      if (cfg.focus) {
        var el = mask.querySelector(cfg.focus);
        el && setTimeout(function () { el.focus(); }, 60);
      }
      cfg.onMount && cfg.onMount(mask, close);
    },

    /* ---------------- 空状态 ---------------- */
    emptyHTML: function (opt) {
      opt = opt || {};
      return '<div class="ui-empty">' +
        '<div class="ui-empty-ico">' + (opt.icon || UI._defaultEmptyIcon()) + '</div>' +
        '<p class="ui-empty-title">' + util.esc(opt.title || '这里还什么都没有') + '</p>' +
        (opt.desc ? '<p class="ui-empty-desc">' + util.esc(opt.desc) + '</p>' : '') +
        (opt.action ? '<button type="button" class="ui-empty-btn" data-empty-act="' + util.esc(opt.action) + '">' + util.esc(opt.actionText || '去看看') + '</button>' : '') +
        '</div>';
    },

    _defaultEmptyIcon: function () {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M8 4v4M16 4v4"/>' +
        '<path d="m9 16 2 2 4-4" opacity=".4"/></svg>';
    },

    /** 骨架屏占位 */
    skeletonHTML: function (n) {
      var s = '';
      for (var i = 0; i < (n || 3); i++) {
        s += '<div class="ui-skel"><div class="ui-skel-ava"></div>' +
          '<div class="ui-skel-lines"><i style="width:38%"></i><i style="width:88%"></i><i style="width:64%"></i></div></div>';
      }
      return s;
    }
  };

  /* ======================================================================
   * 4. 挂载 UI 图层
   * 挂在 #app 内部，随手机外壳等比缩放，避免 fixed 脱离容器。
   * ==================================================================== */
  function mountLayers() {
    var app = document.getElementById('app');
    if (!app || document.getElementById('ui-toast-layer')) return;

    var toastLayer = document.createElement('div');
    toastLayer.id = 'ui-toast-layer';
    toastLayer.className = 'ui-toast-layer';

    var modalLayer = document.createElement('div');
    modalLayer.id = 'ui-modal-layer';
    modalLayer.className = 'ui-modal-layer';

    app.appendChild(modalLayer);
    app.appendChild(toastLayer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountLayers);
  } else {
    mountLayers();
  }

})(window);
