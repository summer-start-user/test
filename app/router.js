/* ==========================================================================
 * campus-app · router.js
 * 路由层：屏幕注册 / 栈式导航 / 系统返回键 / Tab 行为
 * 依赖：core.js（App.util、App.UI）
 * 说明：
 *   1. 兼容 index.html 既有内联脚本：覆盖全局 showScreen，使旧调用走统一路由。
 *   2. 一级 Tab 之间切换清空栈；二级页面入栈，返回按钮与系统返回键共用出栈逻辑。
 * ========================================================================== */
(function (global) {
  'use strict';

  var App = global.App;
  var util = App.util;

  /* 一级 Tab（栈底，切换时重置） */
  var TABS = ['screen-home', 'screen-map', 'screen-community', 'screen-profile'];

  /* 既有内联脚本中的原生屏幕（DOM 已存在，不参与渲染） */
  var NATIVE = ['screen-home', 'screen-map', 'screen-community', 'screen-profile',
                'screen-post', 'screen-compose', 'screen-myposts'];

  var _registry = {};   // id -> cfg
  var _stack = [];      // [{ id, params }]
  var _exitAt = 0;      // 「再按一次退出」计时
  var _booted = false;

  var Router = App.Router = {

    TABS: TABS,

    /**
     * 注册一个屏幕
     * @param {string} id    屏幕 DOM id
     * @param {object} cfg   { title, render(params), mount(root,params), actions:[], full:boolean }
     */
    register: function (id, cfg) {
      _registry[id] = cfg || {};
      return Router;
    },

    /** 批量注册 */
    registerAll: function (map) {
      Object.keys(map).forEach(function (id) { Router.register(id, map[id]); });
      return Router;
    },

    /** 当前栈顶 */
    current: function () {
      return _stack.length ? _stack[_stack.length - 1] : null;
    },

    /** 栈深 */
    depth: function () { return _stack.length; },

    /**
     * 进入二级页面（入栈）
     * @param {string} id
     * @param {object} [params]
     */
    push: function (id, params) {
      if (!_registry[id] && NATIVE.indexOf(id) === -1) {
        console.warn('[Router] 未注册的屏幕：' + id);
        return;
      }
      _stack.push({ id: id, params: params || {} });
      _activate(_stack[_stack.length - 1]);
      _syncHistory();
    },

    /**
     * 切换一级 Tab（清空栈）
     * @param {string} id
     * @param {object} [params]
     */
    goTab: function (id, params) {
      if (TABS.indexOf(id) === -1) return Router.push(id, params);
      _stack = [{ id: id, params: params || {} }];
      _activate(_stack[0]);
      _syncHistory(true);
      _syncTabBar(id);
    },

    /**
     * 进入模态级页面（入栈但不写入 history）
     * 适用于「发布预览」这类不应产生独立返回记录的中间页。
     */
    pushModal: function (id, params) {
      if (!_registry[id]) {
        console.warn('[Router] 未注册的屏幕：' + id);
        return;
      }
      _stack.push({ id: id, params: params || {}, modal: true });
      _activate(_stack[_stack.length - 1]);
    },

    /** 返回上一级（供返回按钮调用，交给浏览器统一处理 popstate） */
    back: function () {
      // 模态页：仅出栈重绘，不产生 history 回退
      var top = Router.current();
      if (top && top.modal) {
        _stack.pop();
        var next = Router.current();
        if (next) _activate(next);
        return;
      }
      if (_stack.length > 1) {
        history.back();
      } else {
        var now = Date.now();
        if (now - _exitAt < 2000) {
          App.UI.toast('演示原型，暂不支持退出');
        } else {
          _exitAt = now;
          App.UI.toast('再按一次退出应用');
        }
      }
    },

    /** 用新页面替换栈顶（如：保存资料后回到上一层并刷新） */
    replace: function (id, params) {
      _stack.pop();
      Router.push(id, params);
    },

    /** 重新渲染当前屏幕（数据变更后刷新视图） */
    reload: function () {
      var top = Router.current();
      if (top) _activate(top, true);
    },

    /** 初始化：接管既有 showScreen，绑定返回键 */
    boot: function (initialId) {
      if (_booted) return;
      _booted = true;

      // 兼容旧调用：一级 Tab 走 goTab，其余走 push
      global.showScreen = function (id) {
        if (TABS.indexOf(id) >= 0) Router.goTab(id);
        else Router.push(id);
      };

      history.replaceState({ depth: 0 }, '');
      Router.goTab(initialId || 'screen-home');

      window.addEventListener('popstate', _onPopState);
    }
  };

  /* ======================================================================
   * 内部实现
   * ==================================================================== */

  /** popstate：以 history 中的深度为准回退栈 */
  function _onPopState(e) {
    var depth = (e.state && typeof e.state.depth === 'number') ? e.state.depth : 0;
    while (_stack.length - 1 > depth && _stack.length > 1) _stack.pop();
    var top = Router.current();
    if (top) {
      _activate(top);
      if (TABS.indexOf(top.id) >= 0) _syncTabBar(top.id);
    }
  }

  /** 同步 history 深度 */
  function _syncHistory(isReplace) {
    var depth = _stack.length - 1;
    try {
      if (isReplace) history.replaceState({ depth: depth }, '');
      else history.pushState({ depth: depth }, '');
    } catch (err) { /* 忽略 file:// 下的限制 */ }
  }

  /** 同步底部 Tab 高亮 */
  function _syncTabBar(id) {
    var items = document.querySelectorAll('#tab-bar .tab-item');
    items.forEach(function (it) {
      var on = it.dataset.target === id;
      it.classList.toggle('active', on);
      it.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  /** 激活某个屏幕 */
  function _activate(entry, silentScroll) {
    var id = entry.id;

    // 1) 隐藏全部已注册 + 原生屏幕
    Object.keys(_registry).forEach(function (k) {
      var el = document.getElementById(k);
      if (el) el.classList.remove('active');
    });
    NATIVE.forEach(function (k) {
      var el = document.getElementById(k);
      if (el) el.classList.remove('active');
    });

    // 2) 取得（或创建）目标元素
    var el = _ensureEl(id);
    if (!el) return;

    // 3) 动态屏幕：每次进入重新渲染，保证数据最新
    var cfg = _registry[id];
    if (cfg && typeof cfg.render === 'function') {
      var body = el.querySelector('.app-body');
      body.innerHTML = cfg.render(entry.params || {}) || '';
    }

    el.classList.add('active');
    if (!silentScroll) el.scrollTop = 0;

    // 4) 生命周期钩子
    if (cfg && typeof cfg.mount === 'function') {
      try { cfg.mount(el, entry.params || {}); } catch (err) { console.error('[Router] mount 失败：' + id, err); }
    }

    // 5) 既有内联脚本需要的副作用（社区分页校正 / 首页顶栏复位）
    _legacySideEffects(id);

    // 6) 底部 Tab 与悬浮球显隐：一级 Tab 显示，二级页隐藏
    var isTab = TABS.indexOf(id) >= 0;
    var tabBar = document.getElementById('tab-bar');
    if (tabBar) tabBar.style.display = isTab ? '' : 'none';

    var ball = document.querySelector('.floating-ball');
    if (ball) {
      ball.style.display = (id === 'screen-home') ? '' : 'none';
      if (id !== 'screen-home') ball.classList.remove('expanded');
    }
  }

  /** 创建动态屏幕骨架（顶部栏 + 内容区） */
  function _ensureEl(id) {
    var el = document.getElementById(id);
    if (el) return el;

    var cfg = _registry[id];
    if (!cfg) return null;

    el = document.createElement('section');
    el.className = 'screen screen-app' + (cfg.full ? ' screen-full' : '');
    el.id = id;

    var actionsHTML = (cfg.actions || []).map(function (a, i) {
      return '<button type="button" class="app-act" data-act-i="' + i + '" aria-label="' +
        util.esc(a.label || '操作') + '">' + (a.icon || util.esc(a.text || '')) + '</button>';
    }).join('');

    el.innerHTML =
      '<div class="app-bar">' +
        '<button type="button" class="app-back" aria-label="返回">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>' +
        '</button>' +
        '<h2 class="app-title">' + util.esc(cfg.title || '') + '</h2>' +
        '<div class="app-acts">' + actionsHTML + '</div>' +
      '</div>' +
      '<div class="app-body">' + (cfg.loading ? App.UI.skeletonHTML(4) : '') + '</div>';

    // 返回按钮 → 统一出栈
    el.querySelector('.app-back').addEventListener('click', function () { Router.back(); });

    // 右侧操作按钮
    el.querySelectorAll('.app-act').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var a = (cfg.actions || [])[+btn.dataset.actI];
        if (a && typeof a.onClick === 'function') a.onClick(el, entryParamsOf(id));
      });
    });

    var app = document.getElementById('app');
    app.appendChild(el);
    return el;
  }

  /** 取当前屏幕上记录的 params（供 actions 使用） */
  function entryParamsOf(id) {
    var cur = Router.current();
    return (cur && cur.id === id && cur.params) || {};
  }

  /** 兼容既有内联脚本的副作用 */
  function _legacySideEffects(id) {
    // 回到社区页时重校分页位置
    if (id === 'screen-community' && typeof global.setPage === 'function' && typeof global.currentPage !== 'undefined') {
      try { global.setPage(global.currentPage, false); } catch (e) {}
    }
    // 回到首页时复位顶栏折叠态
    if (id === 'screen-home') {
      var homeTop = document.getElementById('homeTop');
      if (homeTop) homeTop.classList.remove('collapsed');
      var screenHome = document.getElementById('screen-home');
      if (screenHome) screenHome.scrollTop = 0;
    }
  }

  /* ======================================================================
   * 全局委派：空状态按钮 / 通用返回
   * ==================================================================== */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-empty-act]');
    if (!btn) return;
    var act = btn.dataset.emptyAct;
    App.Router && App.Router.push(act);
  });

})(window);
