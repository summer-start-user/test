/* ==========================================================================
 * campus-app · boot.js
 * 总装配入口：启动路由 / 升级 Toast / 挂载首页各区块入口
 * 加载顺序：core → router → screens-home → screens-community → screens-me → boot
 * ========================================================================== */
(function (global) {
  'use strict';

  var App = global.App;
  var util = App.util, UI = App.UI, Store = App.Store, Router = App.Router, ic = App.ic;

  /* ======================================================================
   * 1. 服务大厅（首页「全部服务」入口）
   * ==================================================================== */
  var SERVICE_HALL = [
    { key: 'grade', name: '学业成绩', icon: 'award', cls: 'q-blue' },
    { key: 'library', name: '图书馆', icon: 'book', cls: 'q-purple' },
    { key: 'payment', name: '校园缴费', icon: 'card', cls: 'q-orange' },
    { key: 'card', name: '校园卡', icon: 'card', cls: 'q-green' },
    { key: 'psy', name: '心理咨询', icon: 'shield', cls: 'q-purple' },
    { key: 'room', name: '空教室查询', icon: 'search', cls: 'q-blue' },
    { key: 'calendar', name: '校历', icon: 'cal', cls: 'q-orange' },
    { key: 'repair', name: '设施报修', icon: 'set', cls: 'q-green' }
  ];

  Router.register('screen-services', {
    title: '全部服务',
    render: function () {
      return '<div class="quick-entry" style="grid-template-columns:repeat(4,1fr);gap:16px 10px">' +
        SERVICE_HALL.map(function (s) {
          return '<button type="button" class="qe-item" data-svc="' + s.key + '">' +
            '<span class="qe-ico ' + s.cls + '">' + ic(s.icon, 22) + '</span>' +
            '<span class="qe-label">' + util.esc(s.name) + '</span></button>';
        }).join('') + '</div>' +
        '<div class="blk-title" style="margin-top:20px;text-align:center">更多校园服务持续接入中</div>';
    },
    mount: function (root) {
      root.querySelector('.app-body').addEventListener('click', function (e) {
        var b = e.target.closest('[data-svc]');
        if (!b) return;
        var key = b.dataset.svc;
        if (key === 'psy') { Router.push('screen-psy'); return; }
        if (App.Data.services[key]) { Router.push('screen-service', { key: key }); return; }
        UI.toast(util.esc(b.querySelector('.qe-label').textContent) + ' · 正在接入中');
      });
    }
  });

  /* ======================================================================
   * 2. 首页入口挂载
   * ==================================================================== */
  function mountHomeEntries() {
    var home = document.getElementById('screen-home');
    if (!home) return;

    /* --- 顶部：搜索 / 消息 / 头像 --- */
    var search = home.querySelector('.search-bar');
    if (search) {
      search.setAttribute('role', 'button');
      search.setAttribute('aria-label', '搜索');
      search.addEventListener('click', function () { Router.push('screen-search'); });
    }
    var bell = home.querySelector('.icon-btn');
    if (bell) {
      bell.setAttribute('role', 'button');
      bell.setAttribute('aria-label', '消息中心');
      bell.addEventListener('click', function () { Router.push('screen-msg'); });
    }
    var ava = home.querySelector('.avatar-btn');
    if (ava) {
      ava.setAttribute('role', 'button');
      ava.setAttribute('aria-label', '个人中心');
      ava.addEventListener('click', function () { Router.goTab('screen-profile'); });
    }

    /* --- 轮播 Banner --- */
    var slides = home.querySelectorAll('.carousel-slide');
    if (slides[0]) bind(slides[0], function () { Router.push('screen-schedule'); });
    if (slides[1]) bind(slides[1], function () { Router.push('screen-notice', { id: 'n1' }); });
    if (slides[2]) bind(slides[2], function () { Router.push('screen-activity'); });

    /* --- 各区块 --- */
    var sections = home.querySelectorAll('.section');

    // 今日课表
    var secCourse = sections[0];
    if (secCourse) {
      bindAction(secCourse, function () { Router.push('screen-schedule'); });
      var courseIds = ['c1', 'c2', 'c3'];
      secCourse.querySelectorAll('.tl-item').forEach(function (item, i) {
        bind(item, function () { Router.push('screen-course', { id: courseIds[i] || 'c1' }); });
      });
    }

    // 校园公告
    var secNotice = sections[1];
    if (secNotice) {
      bindAction(secNotice, function () { Router.push('screen-notices'); });
      var noticeIds = ['n1', 'n2', 'n3'];
      secNotice.querySelectorAll('.notice-item').forEach(function (item, i) {
        bind(item, function () { Router.push('screen-notice', { id: noticeIds[i] || 'n1' }); });
      });
    }

    // 我的校园服务
    var secService = sections[2];
    if (secService) {
      bindAction(secService, function () { Router.push('screen-services'); });
      var svcKeys = ['grade', 'library', 'payment', 'card'];
      secService.querySelectorAll('.svc-card').forEach(function (card, i) {
        bind(card, function () { Router.push('screen-service', { key: svcKeys[i] }); });
      });
    }

    // 社团广场
    var secClub = sections[3];
    if (secClub) {
      bindAction(secClub, function () { Router.push('screen-clubs'); });
      secClub.querySelectorAll('.club-card').forEach(function (card, i) {
        var g = (App.Data.clubs || [])[i];
        bind(card, function () {
          if (g) Router.push('screen-club', { id: g.id });
        });
        var join = card.querySelector('.club-join');
        if (join && g) {
          join.addEventListener('click', function (e) {
            e.stopPropagation();
            App.toggleClubJoin(g);
          });
        }
      });
    }

    function bind(el, fn) {
      if (!el) return;
      el.style.cursor = 'pointer';
      el.addEventListener('click', fn);
    }
    function bindAction(section, fn) {
      var action = section.querySelector('.section-action');
      if (action) {
        action.setAttribute('role', 'button');
        bind(action, fn);
      }
    }
  }

  /** 加入 / 退出社团（首页与社团详情共用） */
  App.toggleClubJoin = function (g) {
    var follows = Store.getFollows();
    var idx = follows.indexOf(g.name);
    if (idx >= 0) {
      UI.confirm({ title: '退出社团', msg: '确定退出「' + g.name + '」？退出后不再接收活动通知。', okText: '退出', danger: true })
        .then(function (ok) {
          if (!ok) return;
          follows.splice(idx, 1);
          Store.set('follows', follows);
          UI.toast('已退出「' + g.name + '」');
          App.syncProfileStats();
        });
    } else {
      follows.push(g.name);
      Store.set('follows', follows);
      UI.toast('已加入「' + g.name + '」', { type: 'success' });
      App.syncProfileStats();
    }
  };

  /* ======================================================================
   * 3. 全局事件委派
   * ==================================================================== */
  function bindGlobalDelegates() {
    // [data-go] → 进入目标屏幕（param 为 JSON 字符串）
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-go]');
      if (!el) return;
      e.stopPropagation();
      var param = {};
      if (el.dataset.param) {
        try { param = JSON.parse(el.dataset.param); } catch (err) { param = {}; }
      }
      Router.push(el.dataset.go, param);
    });
  }

  /* ======================================================================
   * 4. 启动
   * ==================================================================== */
  function boot() {
    // 4.1 Toast 升级为队列版：原实现把提示插入详情页内的容器，
    //     在其他页面调用时不可见，这里统一改为全局图层。
    global.showToast = function (msg, opt) { UI.toast(msg, opt); };

    // 4.2 启动路由（覆盖既有 showScreen，接管 Tab 与二级页）
    Router.boot('screen-home');

    // 4.3 初始化各模块
    App.initCommunity();
    App.initProfile();

    // 4.4 挂载首页各区块入口（搜索 / 轮播 / 课表 / 公告 / 服务 / 社团）
    mountHomeEntries();

    // 4.5 全局委派
    bindGlobalDelegates();

    // 4.6 初始红点与统计
    App.syncHomeBadges();

    // 4.7 底部 Tab 无障碍属性
    document.querySelectorAll('#tab-bar .tab-item').forEach(function (it) {
      it.setAttribute('role', 'tab');
      it.setAttribute('aria-selected', it.classList.contains('active') ? 'true' : 'false');
      it.setAttribute('aria-label', (it.querySelector('span') || {}).textContent || '');
    });

    console.log('%c校园助手 · 模块化增强已加载', 'color:#0A59F7;font-weight:600');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
