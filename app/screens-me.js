/* ==========================================================================
 * campus-app · screens-me.js
 * 「我的」模块：个人中心 / 设置（账号安全·隐私·通知·通用）/
 *              数据管理（缓存清理·历史·导出·注销）/ 帮助与关于
 * 依赖：core.js、router.js、screens-home.js、screens-community.js
 * ========================================================================== */
(function (global) {
  'use strict';

  var App = global.App;
  var util = App.util, UI = App.UI, Store = App.Store, Router = App.Router, ic = App.ic;
  var row = App.tpl.row, block = App.tpl.block;

  /* ======================================================================
   * 1. 主题与字号
   * ==================================================================== */

  /** 应用深色模式（light / dark / system） */
  function applyTheme() {
    var t = Store.getSettings().theme || 'light';
    var app = document.getElementById('app');
    if (!app) return;
    if (t === 'system') {
      var dark = global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches;
      if (dark) app.setAttribute('data-theme', 'dark');
      else app.removeAttribute('data-theme');
    } else if (t === 'dark') {
      app.setAttribute('data-theme', 'dark');
    } else {
      app.removeAttribute('data-theme');
    }
  }
  App.applyTheme = applyTheme;

  /**
   * 应用字号缩放：遍历样式表，把所有 font-size 声明按倍率放大后注入覆盖样式。
   * 这样无需改动既有 CSS 也能全局生效。
   */
  var FS_SCALE = { normal: 1, large: 1.08, xlarge: 1.16 };

  function applyFontScale() {
    var mode = Store.getSettings().fontSize || 'normal';
    var scale = FS_SCALE[mode] || 1;
    var app = document.getElementById('app');
    if (app) app.setAttribute('data-fs', mode);

    var old = document.getElementById('fs-override');
    if (old) old.parentNode.removeChild(old);
    if (scale === 1) return;

    var css = [];
    try {
      for (var i = 0; i < document.styleSheets.length; i++) {
        var sheet = document.styleSheets[i];
        var rules;
        try { rules = sheet.cssRules; } catch (e) { continue; }
        if (!rules) continue;
        collect(rules, scale, css);
      }
    } catch (e) { return; }

    if (!css.length) return;
    var style = document.createElement('style');
    style.id = 'fs-override';
    style.textContent = css.join('\n');
    document.head.appendChild(style);
  }
  App.applyFontScale = applyFontScale;

  function collect(rules, scale, out) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.cssRules && r.cssRules.length) { collect(r.cssRules, scale, out); continue; }
      if (!r.style) continue;
      var fs = r.style.getPropertyValue('font-size');
      if (!fs) continue;
      var sel = r.selectorText;
      if (!sel) continue;
      var scaled = scaleValue(fs, scale);
      if (scaled) out.push(sel + ' { font-size: ' + scaled + ' !important; }');
    }
  }

  function scaleValue(v, scale) {
    v = String(v).trim();
    if (/^-?[\d.]+px$/.test(v)) {
      return (parseFloat(v) * scale).toFixed(2) + 'px';
    }
    if (v.indexOf('calc(') === 0 && v.charAt(v.length - 1) === ')') {
      var inner = v.slice(5, -1);
      return 'calc((' + inner + ') * ' + scale + ')';
    }
    return '';
  }

  /* ======================================================================
   * 2. 设置项读写（统一路径：settings.xxx / security.xxx）
   * ==================================================================== */
  function getSetting(path) {
    var parts = path.split('.');
    var obj = parts[0] === 'security' ? Store.getSecurity() : Store.getSettings();
    return obj[parts[1]];
  }
  function setSetting(path, val) {
    var parts = path.split('.');
    if (parts[0] === 'security') {
      var sec = Store.getSecurity();
      sec[parts[1]] = val;
      Store.saveSecurity(sec);
    } else {
      Store.setSetting(parts[1], val);
    }
  }

  /* ======================================================================
   * 3. 通用开关：全局事件委派（data-sw = "settings.xxx" / "security.xxx"）
   * ==================================================================== */
  document.addEventListener('click', function (e) {
    var sw = e.target.closest('[data-sw]');
    if (!sw || sw.disabled) return;
    e.stopPropagation();
    var path = sw.dataset.sw;
    var next = !getSetting(path);
    setSetting(path, next);
    sw.classList.toggle('on', next);
    sw.setAttribute('aria-checked', next ? 'true' : 'false');

    if (path.indexOf('theme') >= 0 || path.indexOf('fontSize') >= 0) {
      applyTheme();
      applyFontScale();
    }
    if (path === 'settings.notifyMaster') Router.reload();
    UI.toast((next ? '已开启：' : '已关闭：') + (sw.dataset.label || '该选项'));
  });

  /* ======================================================================
   * 4. 业务数据（我的活动 / 获赞 / 设备）
   * ==================================================================== */
  var MeData = App.MeData = {
    myActivities: [
      { id: 'a1', name: '第十六届校园歌手大赛', role: '参赛选手', time: '2026-09-20 19:00', place: '大学生活动中心', status: '报名成功' },
      { id: 'a2', name: '秋日校园外拍', role: '参与者', time: '2026-09-12 15:00', place: '图书馆前广场', status: '待参加' },
      { id: 'a3', name: '智能车冬令营选拔', role: '候补', time: '2026-09-20 09:00', place: '计算机楼 301', status: '候补中' }
    ],
    myLikes: [
      { id: 'k1', title: '图书馆二楼新到一批设计类书籍', from: '小蓝', ts: Date.now() - 3600000, n: 12 },
      { id: 'k2', title: '求组队！明天下午篮球场3v3', from: '小莫', ts: Date.now() - 7200000, n: 8 },
      { id: 'k3', title: '二手出9成新iPad + 笔', from: '小美', ts: Date.now() - 86400000, n: 5 }
    ],
    devices: [
      { id: 'd1', name: 'iPhone 15 Pro', place: '江苏·南京', time: '当前设备', current: true },
      { id: 'd2', name: 'HUAWEI Mate 60', place: '江苏·南京', time: '3 天前', current: false },
      { id: 'd3', name: 'Windows Chrome', place: '江苏·南京', time: '2 周前', current: false }
    ],
    faq: [
      { q: '如何修改我的课表？', a: '课表由教务系统自动同步，如需调整请联系教务处。若发现课程信息有误，可在「首页 → 今日课表 → 课程详情」中提交纠错。' },
      { q: '发布的内容可以删除吗？', a: '可以。进入「我的 → 我的发布」，点击对应卡片右下角的「删除」按钮即可，删除后本机数据同步清除，不可恢复。' },
      { q: '为什么我发布的图片看不到了？', a: '原型中所有图片均以本地方式保存在浏览器存储中。若清理了浏览器缓存或执行了「清除缓存」，图片将一并被清除。' },
      { q: '如何隐藏我的在线状态？', a: '进入「设置 → 隐私设置」，关闭「在线状态可见」开关即可，他人将无法看到你的在线状态与最后活跃时间。' },
      { q: '忘记密码怎么办？', a: '在登录页点击「忘记密码」，通过已绑定的手机号接收验证码后重置。若手机号已停用，请联系学校信息中心处理。' },
      { q: '如何申请注销账号？', a: '进入「设置 → 账号安全 → 账号注销」，按页面提示完成风险确认即可。注销后有 7 天冷静期，期间重新登录可自动撤销。' }
    ],
    changelog: [
      { v: 'v1.1.0', d: '2026-09-04', t: '新增搜索、消息中心、设置与数据管理模块；社区支持发布预览与举报。' },
      { v: 'v1.0.2', d: '2026-08-28', t: '优化社区滑动体验，修复评论计数不一致问题。' },
      { v: 'v1.0.1', d: '2026-08-20', t: '新增图片查看器与匿名发布能力。' },
      { v: 'v1.0.0', d: '2026-08-10', t: '首个版本发布，包含课表、公告、社区与地图。' }
    ]
  };

  /* ======================================================================
   * 5. 头像预设
   * ==================================================================== */
  var AVATAR_PRESETS = [
    { k: 'p1', text: 'S', bg: 'linear-gradient(135deg,#3A8BFF,#7B5CFF)' },
    { k: 'p2', text: '夏', bg: 'linear-gradient(135deg,#34D399,#059669)' },
    { k: 'p3', text: 'U', bg: 'linear-gradient(135deg,#FBBF24,#EA580C)' },
    { k: 'p4', text: '星', bg: 'linear-gradient(135deg,#A78BFA,#7C3AED)' },
    { k: 'p5', text: 'X', bg: 'linear-gradient(135deg,#F472B6,#DB2777)' },
    { k: 'p6', text: '鹿', bg: 'linear-gradient(135deg,#2DD4BF,#0D9488)' },
    { k: 'p7', text: 'A', bg: 'linear-gradient(135deg,#60A5FA,#1D4ED8)' },
    { k: 'p8', text: '阳', bg: 'linear-gradient(135deg,#FCD34D,#F59E0B)' }
  ];

  /** 渲染头像（返回 HTML 片段） */
  function avatarHTML(p, cls) {
    if (p.avatar) return '<img src="' + p.avatar + '" alt="头像" />';
    if (p.avatarPreset) {
      var pre = AVATAR_PRESETS.filter(function (x) { return x.k === p.avatarPreset; })[0];
      if (pre) return util.esc(pre.text);
    }
    return util.esc((p.name || 'S').charAt(0));
  }
  App.avatarHTML = avatarHTML;

  /* ======================================================================
   * 6. 注册「我的」相关屏幕
   * ==================================================================== */
  Router.registerAll({

    /* ------------------------- 编辑资料 ------------------------- */
    'screen-edit-profile': {
      title: '编辑资料',
      actions: [{ label: '保存', text: '保存', onClick: saveProfile }],
      render: function () {
        var p = Store.getProfile();
        return '<div class="blk-card">' +
          frmRow('昵称', '<input class="frm-input" id="fName" maxlength="16" value="' + util.esc(p.name) + '" placeholder="2-16 字" />') +
          frmRow('性别', '<div class="frm-seg" id="fGender">' +
            ['女', '男', '保密'].map(function (g) {
              return '<button type="button" class="frm-seg-btn' + (p.gender === g ? ' on' : '') + '" data-v="' + g + '">' + g + '</button>';
            }).join('') + '</div>') +
          frmRow('年级', '<input class="frm-input" id="fGrade" maxlength="10" value="' + util.esc(p.grade) + '" placeholder="如：大三" />') +
          frmRow('专业', '<input class="frm-input" id="fMajor" maxlength="24" value="' + util.esc(p.major) + '" placeholder="所在专业" />') +
          frmRow('生日', '<input class="frm-input" id="fBirth" type="date" value="' + util.esc(p.birthday) + '" />') +
          '</div>' +
          '<div class="blk" style="margin-top:16px"><div class="blk-title">个性签名</div>' +
          '<div class="blk-card"><div class="frm-row" style="align-items:flex-start">' +
          '<textarea class="frm-textarea" id="fBio" maxlength="50" placeholder="介绍一下自己…">' + util.esc(p.bio) + '</textarea></div>' +
          '<div style="display:flex;justify-content:flex-end;padding:6px 14px 10px">' +
          '<span class="frm-count" id="fBioCount">' + (p.bio || '').length + '/50</span></div></div></div>' +
          '<div class="blk"><div class="blk-card">' +
          row({ icon: 'camera', iconClass: 'c-blue', label: '更换头像', value: '点击管理', go: 'screen-avatar' }) +
          '</div></div>';
      },
      mount: function (root) {
        var bio = root.querySelector('#fBio');
        var cnt = root.querySelector('#fBioCount');
        bio.addEventListener('input', function () {
          cnt.textContent = bio.value.length + '/50';
          cnt.classList.toggle('over', bio.value.length >= 50);
        });
        root.querySelector('#fGender').addEventListener('click', function (e) {
          var b = e.target.closest('[data-v]');
          if (!b) return;
          this.querySelectorAll('.frm-seg-btn').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
        });
      }
    },

    /* ------------------------- 头像管理 ------------------------- */
    'screen-avatar': {
      title: '头像管理',
      render: function () {
        var p = Store.getProfile();
        return '<div class="pf-hero">' +
          '<div class="pf-ava-big" id="bigAva">' + avatarHTML(p) + '</div>' +
          '<div class="pf-name">' + util.esc(p.name) + '</div>' +
          '<div class="pf-sub">点击头像可上传本地图片</div></div>' +
          '<div class="blk"><div class="blk-title">系统头像</div><div class="ava-grid">' +
          AVATAR_PRESETS.map(function (a) {
            return '<button type="button" class="ava-cell' + (p.avatarPreset === a.k ? ' sel' : '') +
              '" data-preset="' + a.k + '" style="background:' + a.bg + '">' + util.esc(a.text) + '</button>';
          }).join('') + '</div></div>' +
          '<div class="blk"><div class="blk-card">' +
          row({ icon: 'img', iconClass: 'c-purple', label: '从相册上传', onClick: 'upload', arrow: true }) +
          row({ icon: 'user', iconClass: 'c-blue', label: '使用昵称首字', onClick: 'reset' }) +
          '</div></div>' +
          '<input type="file" id="avaFile" accept="image/*" hidden />';
      },
      mount: function (root) {
        var p = Store.getProfile();
        function refresh() {
          var np = Store.getProfile();
          root.querySelector('#bigAva').innerHTML = avatarHTML(np);
          root.querySelectorAll('.ava-cell').forEach(function (c) {
            c.classList.toggle('sel', c.dataset.preset === np.avatarPreset && !np.avatar);
          });
        }
        root.querySelector('.ava-grid').addEventListener('click', function (e) {
          var c = e.target.closest('[data-preset]');
          if (!c) return;
          var np = Store.getProfile();
          np.avatarPreset = c.dataset.preset;
          np.avatar = '';
          Store.saveProfile(np);
          refresh();
          App.syncProfileHeader();
          UI.toast('头像已更新', { type: 'success' });
        });
        var file = root.querySelector('#avaFile');
        file.addEventListener('change', function () {
          var f = this.files && this.files[0];
          if (!f) return;
          var reader = new FileReader();
          reader.onload = function () {
            var np = Store.getProfile();
            np.avatar = reader.result;
            np.avatarPreset = '';
            Store.saveProfile(np);
            refresh();
            App.syncProfileHeader();
            UI.toast('头像已上传', { type: 'success' });
          };
          reader.readAsDataURL(f);
          this.value = '';
        });
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var act = e.target.closest('[data-act]');
          if (!act) return;
          if (act.dataset.act === 'upload') { file.click(); }
          if (act.dataset.act === 'reset') {
            var np = Store.getProfile();
            np.avatar = ''; np.avatarPreset = '';
            Store.saveProfile(np);
            refresh();
            App.syncProfileHeader();
            UI.toast('已恢复为默认头像');
          }
        });
        root.querySelector('#bigAva').addEventListener('click', function () { file.click(); });
      }
    },

    /* ------------------------- 我的收藏 ------------------------- */
    'screen-favs': {
      title: '我的收藏',
      render: function () {
        var list = Store.getFavorites();
        if (!list.length) {
          return UI.emptyHTML({
            title: '还没有收藏内容', desc: '在社区看到感兴趣的帖子，点一下收藏就会保存在这里',
            action: 'screen-community', actionText: '去社区逛逛'
          });
        }
        return '<div class="blk-card">' + list.map(function (f) {
          return '<div class="lst-item"><div class="lst-main"><div class="rec-item">' +
            '<div class="rec-title">' + util.esc(f.title) + '</div>' +
            (f.text ? '<div class="rec-text">' + util.esc(f.text) + '</div>' : '') +
            '<div class="rec-meta"><span class="rec-tag">' + util.esc(App.DataSvc.tagLabel(f.tag)) + '</span>' +
            '<span>' + util.esc(f.author || '') + '</span><span>' + util.fmtTime(f.ts) + '</span></div>' +
            '</div></div><button type="button" class="rec-del" data-del="' + util.esc(f.id) + '">移除</button></div>';
        }).join('') + '</div>' +
          '<div class="blk" style="margin-top:16px"><div class="blk-card">' +
          '<div class="lst-item" data-clear="1"><span class="lst-ico c-gray">' + ic('trash', 17) + '</span>' +
          '<div class="lst-main"><div class="lst-label" style="color:#DC2626">清空全部收藏</div></div></div></div></div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          if (e.target.closest('[data-clear]')) {
            UI.confirm({ title: '清空收藏', msg: '将移除全部 ' + Store.getFavorites().length + ' 条收藏，不可恢复。', okText: '清空', danger: true })
              .then(function (ok) {
                if (!ok) return;
                Store.set('favorites', []);
                UI.toast('已清空收藏');
                Router.reload();
                App.syncProfileStats();
              });
            return;
          }
          var d = e.target.closest('[data-del]');
          if (!d) return;
          Store.set('favorites', Store.getFavorites().filter(function (x) { return x.id !== d.dataset.del; }));
          UI.toast('已取消收藏');
          Router.reload();
          App.syncProfileStats();
        });
      }
    },

    /* ------------------------- 浏览历史 ------------------------- */
    'screen-history': {
      title: '浏览历史',
      actions: [{ label: '管理', text: '管理', onClick: function () { Router.push('screen-history-manage'); } }],
      render: function () {
        var list = Store.getHistory();
        if (!list.length) {
          return UI.emptyHTML({ title: '暂无浏览记录', desc: '浏览过的帖子会出现在这里，方便你随时找回', action: 'screen-community', actionText: '去社区看看' });
        }
        return '<div class="blk-card">' + list.map(function (h) {
          return '<div class="lst-item"><div class="lst-main"><div class="rec-item">' +
            '<div class="rec-title">' + util.esc(h.title) + '</div>' +
            (h.text ? '<div class="rec-text">' + util.esc(h.text) + '</div>' : '') +
            '<div class="rec-meta"><span>' + util.esc(h.author || '') + '</span>' +
            '<span>' + util.fmtTime(h.ts) + '</span></div></div></div>' +
            '<button type="button" class="rec-del" data-del="' + util.esc(h.id) + '">删除</button></div>';
        }).join('') + '</div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var d = e.target.closest('[data-del]');
          if (!d) return;
          Store.set('history', Store.getHistory().filter(function (x) { return x.id !== d.dataset.del; }));
          UI.toast('已删除该记录');
          Router.reload();
        });
      }
    },

    /* ------------------------- 历史记录管理 ------------------------- */
    'screen-history-manage': {
      title: '历史记录管理',
      render: function () {
        var hist = Store.getHistory();
        var search = Store.getSearchHistory();
        return block('浏览历史', row({ icon: 'clock', iconClass: 'c-blue', label: '浏览帖子记录', value: hist.length + ' 条' }) +
          row({ icon: 'trash', iconClass: 'c-gray', label: '清空浏览历史', onClick: 'clearHistory', danger: true })) +
          block('搜索历史', row({ icon: 'search', iconClass: 'c-purple', label: '搜索关键词', value: search.length + ' 条' }) +
            row({ icon: 'trash', iconClass: 'c-gray', label: '清空搜索历史', onClick: 'clearSearch', danger: true })) +
          '<div class="blk"><div class="blk-card">' +
          row({ icon: 'refresh', iconClass: 'c-orange', label: '恢复演示数据', sub: '重新生成一组示例历史记录，便于继续评审', onClick: 'restore' }) +
          '</div></div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var act = e.target.closest('[data-act]');
          if (!act) return;
          var a = act.dataset.act;
          if (a === 'clearHistory') {
            UI.confirm({ title: '清空浏览历史', msg: '将删除全部浏览记录，不可恢复。', okText: '清空', danger: true })
              .then(function (ok) { if (ok) { Store.set('history', []); UI.toast('已清空浏览历史'); Router.reload(); } });
          } else if (a === 'clearSearch') {
            Store.set('search-history', []);
            UI.toast('已清空搜索历史');
            Router.reload();
          } else if (a === 'restore') {
            var demo = [
              { id: 'demo1', type: 'post', title: '求组队！明天下午篮球场3v3', text: '想找个队友一起打，有想法的宝子可以私聊我！', author: '小莫', tag: 'sport', ts: Date.now() - 3600000 },
              { id: 'demo2', type: 'post', title: '图书馆二楼新到一批设计类书籍', text: 'UX、设计心理学、设计中的设计都有，需要的同学赶紧去借～', author: '小蓝', tag: 'study', ts: Date.now() - 7200000 },
              { id: 'demo3', type: 'post', title: '食堂三楼新开的麻辣烫怎么样？', text: '今天中午去尝鲜，听说很不错，求推荐！', author: '小黄', tag: 'campus', ts: Date.now() - 86400000 }
            ];
            Store.set('history', demo);
            Store.set('search-history', ['期末复习', '二手 iPad', '篮球 3v3']);
            UI.toast('演示数据已恢复', { type: 'success' });
            Router.reload();
          }
        });
      }
    },

    /* ------------------------- 我的活动 ------------------------- */
    'screen-activity-mine': {
      title: '我的活动',
      render: function () {
        var list = MeData.myActivities;
        var signed = Store.get('activity-signed', null);
        if (!list.length && !signed) {
          return UI.emptyHTML({ title: '还没有参加活动', desc: '去社区「活动」分类看看，或者报名校园歌手大赛', action: 'screen-activity', actionText: '查看热门活动' });
        }
        var html = '';
        if (signed) {
          html += block('已报名', '<div class="lst-item static"><span class="lst-ico c-purple">' + ic('star', 17) + '</span>' +
            '<div class="lst-main"><div class="lst-label">' + util.esc(signed.name) + '</div>' +
            '<div class="lst-sub">校园歌手大赛 · ' + (signed.type === 'solo' ? '个人参赛' : '组合参赛') + '</div></div>' +
            '<span class="lst-value" style="color:var(--accent-green)">报名成功</span></div>');
        }
        html += block('全部活动', list.map(function (a) {
          var color = a.status === '报名成功' ? 'var(--accent-green)' : a.status === '候补中' ? 'var(--accent-orange)' : 'var(--text-light)';
          return '<div class="lst-item static"><span class="lst-ico c-orange">' + ic('cal', 17) + '</span>' +
            '<div class="lst-main"><div class="lst-label">' + util.esc(a.name) + '</div>' +
            '<div class="lst-sub">' + util.esc(a.time) + ' · ' + util.esc(a.place) + ' · ' + util.esc(a.role) + '</div></div>' +
            '<span class="lst-value" style="color:' + color + '">' + util.esc(a.status) + '</span></div>';
        }).join(''));
        return html;
      }
    },

    /* ------------------------- 关注列表 ------------------------- */
    'screen-follows': {
      title: '我的关注',
      render: function () {
        var list = Store.getFollows();
        if (!list.length) {
          return UI.emptyHTML({ title: '还没有关注任何人', desc: '在帖子详情页点击「+ 关注」，或在社团主页加入社团', action: 'screen-community', actionText: '去发现' });
        }
        var clubs = (App.Data.clubs || []).map(function (c) { return c.name; });
        return '<div class="blk-card">' + list.map(function (n) {
          var isClub = clubs.indexOf(n) >= 0;
          return '<div class="lst-item"><span class="lst-ico ' + (isClub ? 'c-green' : 'c-blue') + '">' +
            ic(isClub ? 'users' : 'user', 17) + '</span>' +
            '<div class="lst-main"><div class="lst-label">' + util.esc(n) + '</div>' +
            '<div class="lst-sub">' + (isClub ? '社团' : '用户') + '</div></div>' +
            '<button type="button" class="rec-del" data-un="' + util.esc(n) + '">取消关注</button></div>';
        }).join('') + '</div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var b = e.target.closest('[data-un]');
          if (!b) return;
          Store.set('follows', Store.getFollows().filter(function (x) { return x !== b.dataset.un; }));
          UI.toast('已取消关注');
          Router.reload();
          App.syncProfileStats();
        });
      }
    },

    /* ------------------------- 获赞记录 ------------------------- */
    'screen-likes': {
      title: '获赞记录',
      render: function () {
        return block('最近获赞', MeData.myLikes.map(function (k) {
          return '<div class="lst-item static"><span class="lst-ico c-pink">' + ic('heart', 17, true) + '</span>' +
            '<div class="lst-main"><div class="lst-label">' + util.esc(k.title) + '</div>' +
            '<div class="lst-sub">' + util.esc(k.from) + ' 等 ' + k.n + ' 人赞了你 · ' + util.fmtTime(k.ts) + '</div></div>' +
            '<span class="lst-value">+' + k.n + '</span></div>';
        }).join(''));
      }
    },

    /* ------------------------- 设置首页 ------------------------- */
    'screen-settings': {
      title: '设置',
      render: function () {
        var s = Store.getSettings();
        var themeLabel = { light: '浅色', dark: '深色', system: '跟随系统' }[s.theme] || '浅色';
        var fsLabel = { normal: '标准', large: '大', xlarge: '超大' }[s.fontSize] || '标准';
        return block('账号', row({ icon: 'shield', iconClass: 'c-blue', label: '账号安全', sub: '手机号、密码、登录设备', go: 'screen-security', arrow: true })) +
          block('偏好', row({ icon: 'eye', iconClass: 'c-green', label: '隐私设置', sub: '在线状态、可见范围、黑名单', go: 'screen-privacy', arrow: true }) +
            row({ icon: 'bell', iconClass: 'c-orange', label: '通知偏好', sub: s.notifyMaster ? '已开启' : '已全部关闭', go: 'screen-notify', arrow: true }) +
            row({ icon: 'type', iconClass: 'c-purple', label: '通用', sub: themeLabel + ' · 字号' + fsLabel, go: 'screen-general', arrow: true })) +
          block('数据', row({ icon: 'folder', iconClass: 'c-teal', label: '数据与存储', sub: '缓存清理、历史记录、导出', go: 'screen-cache', arrow: true }) +
            row({ icon: 'down', iconClass: 'c-gray', label: '导出我的数据', onClick: 'export' })) +
          block('关于', row({ icon: 'help', iconClass: 'c-blue', label: '帮助与反馈', go: 'screen-help', arrow: true }) +
            row({ icon: 'info', iconClass: 'c-purple', label: '关于我们', value: 'v1.1.0', go: 'screen-about', arrow: true })) +
          '<div class="blk"><div class="blk-card">' +
          '<div class="lst-item" data-act="logout"><span class="lst-ico c-gray">' + ic('out', 17) + '</span>' +
          '<div class="lst-main"><div class="lst-label" style="color:#DC2626">退出登录</div></div></div></div></div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var act = e.target.closest('[data-act]');
          if (!act) return;
          if (act.dataset.act === 'export') App.exportData();
          if (act.dataset.act === 'logout') App.handleLogout();
        });
      }
    },

    /* ------------------------- 账号安全 ------------------------- */
    'screen-security': {
      title: '账号安全',
      render: function () {
        var sec = Store.getSecurity();
        return '<div class="hero h-blue"><h3>账号安全等级：良好</h3>' +
          '<p>建议开启两步验证，并定期更新登录密码</p></div>' +
          '<div style="height:16px"></div>' +
          block('登录信息', row({ icon: 'phone', iconClass: 'c-blue', label: '手机号', value: sec.phone, onClick: 'phone', arrow: true }) +
            row({ icon: 'lock', iconClass: 'c-purple', label: '登录密码', sub: '建议每 90 天更换一次', onClick: 'pwd', arrow: true }) +
            row({ icon: 'shield', iconClass: 'c-green', label: '实名认证', value: sec.realNamed ? '已认证' : '未认证', onClick: 'realname', arrow: true })) +
          block('保护设置', row({ icon: 'key', iconClass: 'c-teal', label: '两步验证', sub: '异地登录需短信验证', switch: 'security.twoStep', on: sec.twoStep, label2: '两步验证' }) +
            row({ icon: 'bell', iconClass: 'c-orange', label: '登录提醒', sub: '新设备登录时通知我', switch: 'security.loginAlert', on: sec.loginAlert, label2: '登录提醒' }) +
            row({ icon: 'device', iconClass: 'c-gray', label: '登录设备管理', sub: MeData.devices.length + ' 台设备', go: 'screen-devices', arrow: true })) +
          block('危险操作', row({ icon: 'warn', iconClass: 'c-pink', label: '账号注销', sub: '注销后数据将被清除，7 天内可撤销', go: 'screen-deactivate', arrow: true }));
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var act = e.target.closest('[data-act]');
          if (!act) return;
          var a = act.dataset.act;
          var sec = Store.getSecurity();

          if (a === 'phone') {
            UI.prompt({
              title: '更换手机号', msg: '当前绑定：' + sec.phone, placeholder: '请输入新的手机号',
              maxlength: 11, validate: function (v) { return /^1\d{10}$/.test(v) ? '' : '请输入正确的 11 位手机号'; }
            }).then(function (v) {
              if (v === null) return;
              UI.prompt({ title: '短信验证码', msg: '已向 ' + v + ' 发送验证码（演示：任意 4 位）', placeholder: '请输入验证码', maxlength: 4,
                validate: function (c) { return /^\d{4}$/.test(c) ? '' : '请输入 4 位数字验证码'; } })
                .then(function (code) {
                  if (code === null) return;
                  sec.phone = v.slice(0, 3) + '****' + v.slice(7);
                  Store.saveSecurity(sec);
                  UI.toast('手机号更换成功', { type: 'success' });
                  Router.reload();
                });
            });
          } else if (a === 'pwd') {
            UI.prompt({ title: '修改登录密码', msg: '请输入当前密码', placeholder: '当前密码', maxlength: 20,
              validate: function (v) { return v ? '' : '请输入当前密码'; } })
              .then(function (old) {
                if (old === null) return;
                UI.prompt({ title: '设置新密码', msg: '8-20 位，需同时包含字母与数字', placeholder: '新密码', maxlength: 20,
                  validate: function (v) { return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(v) ? '' : '需 8-20 位且包含字母与数字'; } })
                  .then(function (np) {
                    if (np === null) return;
                    UI.toast('密码修改成功', { type: 'success' });
                  });
              });
          } else if (a === 'realname') {
            if (sec.realNamed) { UI.toast('你已完成实名认证'); return; }
            UI.confirm({ title: '实名认证', msg: '将使用学号与身份证信息完成认证，仅用于校内身份核验。', okText: '开始认证' })
              .then(function (ok) {
                if (!ok) return;
                UI.prompt({ title: '学号', placeholder: '请输入学号', maxlength: 20,
                  validate: function (v) { return v ? '' : '学号不能为空'; } })
                  .then(function (sid) {
                    if (sid === null) return;
                    sec.realNamed = true;
                    Store.saveSecurity(sec);
                    UI.toast('实名认证已提交，1 个工作日内完成审核', { type: 'success' });
                    Router.reload();
                  });
              });
          }
        });
      }
    },

    /* ------------------------- 登录设备 ------------------------- */
    'screen-devices': {
      title: '登录设备管理',
      render: function () {
        return '<div class="blk-card">' + MeData.devices.map(function (d) {
          return '<div class="lst-item' + (d.current ? ' static' : '') + '">' +
            '<span class="lst-ico ' + (d.current ? 'c-green' : 'c-gray') + '">' + ic('device', 17) + '</span>' +
            '<div class="lst-main"><div class="lst-label">' + util.esc(d.name) +
            (d.current ? ' <span class="dt-badge">当前</span>' : '') + '</div>' +
            '<div class="lst-sub">' + util.esc(d.place) + ' · ' + util.esc(d.time) + '</div></div>' +
            (d.current ? '' : '<button type="button" class="rec-del" data-kick="' + d.id + '">移除</button>') + '</div>';
        }).join('') + '</div>' +
          '<div class="blk-title" style="margin-top:12px">移除设备后，该设备上的登录状态将立即失效。</div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var b = e.target.closest('[data-kick]');
          if (!b) return;
          var d = MeData.devices.filter(function (x) { return x.id === b.dataset.kick; })[0];
          UI.confirm({ title: '移除设备', msg: '确定移除「' + d.name + '」的登录状态？', okText: '移除', danger: true })
            .then(function (ok) {
              if (!ok) return;
              MeData.devices = MeData.devices.filter(function (x) { return x.id !== b.dataset.kick; });
              UI.toast('已移除该设备');
              Router.reload();
            });
        });
      }
    },

    /* ------------------------- 隐私设置 ------------------------- */
    'screen-privacy': {
      title: '隐私设置',
      render: function () {
        var s = Store.getSettings();
        var visLabel = { all: '所有人', school: '仅本校', follow: '仅关注的人', self: '仅自己' }[s.postVisibility] || '仅本校';
        var blocked = Store.getBlockedUsers().length;
        var hidden = Store.getHiddenPosts().length;
        var reports = Object.keys(Store.getReports()).length;

        return block('可见性', row({ icon: 'eye', iconClass: 'c-blue', label: '在线状态可见', sub: '关闭后他人看不到你的在线状态', switch: 'settings.onlineVisible', on: s.onlineVisible, label2: '在线状态可见' }) +
          row({ icon: 'globe', iconClass: 'c-teal', label: '允许被搜索到', sub: '关闭后他人无法通过昵称找到你', switch: 'settings.searchable', on: s.searchable, label2: '允许被搜索' }) +
          row({ icon: 'user', iconClass: 'c-purple', label: '动态可见范围', value: visLabel, onClick: 'vis', arrow: true })) +
          block('内容偏好', row({ icon: 'star', iconClass: 'c-orange', label: '个性化内容推荐', sub: '关闭后按时间顺序推荐', switch: 'settings.recommendOn', on: s.recommendOn, label2: '个性化推荐' }) +
            row({ icon: 'heart', iconClass: 'c-pink', label: '公开展示获赞与收藏数', switch: 'settings.statsPublic', on: s.statsPublic, label2: '公开展示获赞' })) +
          block('管理', row({ icon: 'ban', iconClass: 'c-gray', label: '黑名单', value: blocked ? blocked + ' 人' : '无', go: 'screen-blacklist', arrow: true }) +
            row({ icon: 'eyeOff', iconClass: 'c-gray', label: '已屏蔽的内容', value: hidden ? hidden + ' 条' : '无', go: 'screen-blocked-posts', arrow: true }) +
            row({ icon: 'flag', iconClass: 'c-gray', label: '我的举报记录', value: reports ? reports + ' 条' : '无', go: 'screen-report-list', arrow: true }));
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var act = e.target.closest('[data-act]');
          if (!act || act.dataset.act !== 'vis') return;
          UI.choose({
            title: '动态可见范围',
            value: Store.getSettings().postVisibility,
            items: [
              { value: 'all', label: '所有人', desc: '校内校外用户均可见' },
              { value: 'school', label: '仅本校', desc: '仅本校认证用户可见' },
              { value: 'follow', label: '仅关注的人', desc: '仅互相关注的用户可见' },
              { value: 'self', label: '仅自己', desc: '仅自己可见' }
            ]
          }).then(function (v) {
            if (v === null) return;
            Store.setSetting('postVisibility', v);
            UI.toast('可见范围已更新');
            Router.reload();
          });
        });
      }
    },

    /* ------------------------- 黑名单 ------------------------- */
    'screen-blacklist': {
      title: '黑名单',
      render: function () {
        var list = Store.getBlockedUsers();
        if (!list.length) {
          return UI.emptyHTML({ title: '黑名单为空', desc: '在评论长按菜单中选择「屏蔽」，被屏蔽的用户将无法与你互动' });
        }
        return '<div class="blk-card">' + list.map(function (n) {
          return '<div class="lst-item"><span class="lst-ico c-gray">' + n.charAt(0) + '</span>' +
            '<div class="lst-main"><div class="lst-label">' + util.esc(n) + '</div>' +
            '<div class="lst-sub">已屏蔽</div></div>' +
            '<button type="button" class="rec-del" data-un="' + util.esc(n) + '">取消屏蔽</button></div>';
        }).join('') + '</div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var b = e.target.closest('[data-un]');
          if (!b) return;
          var arr = Store.getBlockedUsers().filter(function (x) { return x !== b.dataset.un; });
          try { localStorage.setItem('blockedUsers', JSON.stringify(arr)); } catch (err) {}
          UI.toast('已取消屏蔽 ' + b.dataset.un);
          Router.reload();
        });
      }
    },

    /* ------------------------- 已屏蔽内容 ------------------------- */
    'screen-blocked-posts': {
      title: '已屏蔽内容',
      render: function () {
        var list = Store.getHiddenPosts();
        if (!list.length) return UI.emptyHTML({ title: '没有屏蔽任何内容', desc: '在帖子详情右上角的菜单中选择「屏蔽」' });
        return '<div class="blk-card">' + list.map(function (k, i) {
          var parts = k.split('::');
          return '<div class="lst-item"><span class="lst-ico c-gray">' + ic('eyeOff', 17) + '</span>' +
            '<div class="lst-main"><div class="lst-label">' + util.esc(parts[1] || k) + '</div>' +
            '<div class="lst-sub">' + util.esc(parts[0] || '') + '</div></div>' +
            '<button type="button" class="rec-del" data-idx="' + i + '">恢复</button></div>';
        }).join('') + '</div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var b = e.target.closest('[data-idx]');
          if (!b) return;
          var list = Store.getHiddenPosts();
          list.splice(+b.dataset.idx, 1);
          Store.set('hidden-posts', list);
          UI.toast('已恢复显示，刷新页面后生效');
          Router.reload();
        });
      }
    },

    /* ------------------------- 举报记录 ------------------------- */
    'screen-report-list': {
      title: '我的举报',
      render: function () {
        var reports = Store.getReports();
        var keys = Object.keys(reports);
        if (!keys.length) return UI.emptyHTML({ title: '暂无举报记录', desc: '你举报的内容会在这里显示处理进度' });
        return '<div class="blk-card">' + keys.map(function (k) {
          var parts = k.split('::');
          var title = parts[2] || parts[1] || k;
          var pending = Date.now() - reports[k] < 24 * 3600000;
          return '<div class="lst-item static"><span class="lst-ico ' + (pending ? 'c-orange' : 'c-green') + '">' + ic('flag', 17) + '</span>' +
            '<div class="lst-main"><div class="lst-label">' + util.esc(title) + '</div>' +
            '<div class="lst-sub">提交于 ' + util.fmtTime(reports[k]) + '</div></div>' +
            '<span class="lst-value" style="color:' + (pending ? 'var(--accent-orange)' : 'var(--accent-green)') + '">' +
            (pending ? '处理中' : '已处理') + '</span></div>';
        }).join('') + '</div>';
      }
    },

    /* ------------------------- 通知偏好 ------------------------- */
    'screen-notify': {
      title: '通知偏好',
      render: function () {
        var s = Store.getSettings();
        var off = !s.notifyMaster;
        var dis = function (k) { return off ? ' disabled' : ''; };
        return block('总开关', row({ icon: 'bell', iconClass: 'c-orange', label: '接收新消息通知', sub: '关闭后以下分项将全部暂停', switch: 'settings.notifyMaster', on: s.notifyMaster, label2: '接收新消息通知' })) +
          block('消息分类',
            row({ icon: 'chat', iconClass: 'c-blue', label: '评论与回复', switch: 'settings.notifyComment', on: s.notifyComment, label2: '评论与回复', disabled: off }) +
            row({ icon: 'heart', iconClass: 'c-pink', label: '点赞与收藏', switch: 'settings.notifyLike', on: s.notifyLike, label2: '点赞与收藏', disabled: off }) +
            row({ icon: 'bell', iconClass: 'c-green', label: '系统公告', sub: '重要通知，建议保持开启', switch: 'settings.notifySystem', on: s.notifySystem, label2: '系统公告', disabled: off }) +
            row({ icon: 'users', iconClass: 'c-purple', label: '社团与活动', switch: 'settings.notifyClub', on: s.notifyClub, label2: '社团与活动', disabled: off })) +
          block('免打扰', row({ icon: 'clock', iconClass: 'c-gray', label: '免打扰时段', sub: '开启后仅在该时段静音', switch: 'settings.dndEnabled', on: s.dndEnabled, label2: '免打扰时段' }) +
            (s.dndEnabled ? row({ icon: 'clock', iconClass: 'c-teal', label: '设置时间段', value: s.dndStart + ' - ' + s.dndEnd, onClick: 'dnd', arrow: true }) : '')) +
          block('提醒方式', row({ icon: 'bell', iconClass: 'c-orange', label: '声音', switch: 'settings.sound', on: s.sound, label2: '声音', disabled: off }) +
            row({ icon: 'device', iconClass: 'c-gray', label: '震动', switch: 'settings.vibration', on: s.vibration, label2: '震动', disabled: off }));
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var act = e.target.closest('[data-act]');
          if (!act || act.dataset.act !== 'dnd') return;
          var s = Store.getSettings();
          UI.prompt({ title: '免打扰开始时间', msg: '格式 HH:MM，例如 23:00', value: s.dndStart, maxlength: 5,
            validate: function (v) { return /^\d{2}:\d{2}$/.test(v) ? '' : '请按 HH:MM 格式填写'; } })
            .then(function (start) {
              if (start === null) return;
              UI.prompt({ title: '免打扰结束时间', msg: '格式 HH:MM，例如 07:30', value: s.dndEnd, maxlength: 5,
                validate: function (v) { return /^\d{2}:\d{2}$/.test(v) ? '' : '请按 HH:MM 格式填写'; } })
                .then(function (end) {
                  if (end === null) return;
                  Store.setSetting('dndStart', start);
                  Store.setSetting('dndEnd', end);
                  UI.toast('免打扰时段：' + start + ' - ' + end, { type: 'success' });
                  Router.reload();
                });
            });
        });
      }
    },

    /* ------------------------- 通用设置 ------------------------- */
    'screen-general': {
      title: '通用',
      render: function () {
        var s = Store.getSettings();
        return block('外观', row({ icon: 'moon', iconClass: 'c-purple', label: '深色模式',
            value: { light: '浅色', dark: '深色', system: '跟随系统' }[s.theme] || '浅色', onClick: 'theme', arrow: true }) +
          row({ icon: 'type', iconClass: 'c-blue', label: '字号大小',
            value: { normal: '标准', large: '大', xlarge: '超大' }[s.fontSize] || '标准', onClick: 'font', arrow: true })) +
          block('地区', row({ icon: 'globe', iconClass: 'c-green', label: '语言',
            value: s.language === 'en-US' ? 'English' : '简体中文', onClick: 'lang', arrow: true }));
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var act = e.target.closest('[data-act]');
          if (!act) return;
          var a = act.dataset.act;
          var s = Store.getSettings();
          if (a === 'theme') {
            UI.choose({
              title: '深色模式', value: s.theme,
              items: [
                { value: 'light', label: '浅色', desc: '始终使用浅色主题' },
                { value: 'dark', label: '深色', desc: '始终使用深色主题' },
                { value: 'system', label: '跟随系统', desc: '根据系统设置自动切换' }
              ]
            }).then(function (v) {
              if (v === null) return;
              Store.setSetting('theme', v);
              applyTheme();
              UI.toast('主题已切换');
              Router.reload();
            });
          } else if (a === 'font') {
            UI.choose({
              title: '字号大小', value: s.fontSize,
              items: [
                { value: 'normal', label: '标准', desc: '默认字号' },
                { value: 'large', label: '大', desc: '放大 8%' },
                { value: 'xlarge', label: '超大', desc: '放大 16%' }
              ]
            }).then(function (v) {
              if (v === null) return;
              Store.setSetting('fontSize', v);
              applyFontScale();
              UI.toast('字号已调整');
              Router.reload();
            });
          } else if (a === 'lang') {
            UI.choose({
              title: '语言', value: s.language,
              items: [{ value: 'zh-CN', label: '简体中文' }, { value: 'en-US', label: 'English（演示）' }]
            }).then(function (v) {
              if (v === null) return;
              Store.setSetting('language', v);
              UI.toast(v === 'zh-CN' ? '已切换为简体中文' : '英文文案为演示占位，暂未完整翻译');
              Router.reload();
            });
          }
        });
      }
    },

    /* ------------------------- 数据与存储 ------------------------- */
    'screen-cache': {
      title: '数据与存储',
      render: function () {
        var u = Store.usage();
        var colors = { posts: '#3B82F6', history: '#10B981', profile: '#F59E0B', other: '#9CA3AF' };
        var labels = { posts: '帖子与图片', history: '浏览与搜索历史', profile: '资料与设置', other: '其他缓存' };
        var total = Math.max(u.total, 1);

        var bar = Object.keys(u.groups).map(function (k) {
          var w = (u.groups[k].size / total * 100).toFixed(1);
          return u.groups[k].size ? '<i class="cache-seg" style="width:' + w + '%;background:' + colors[k] + '"></i>' : '';
        }).join('');

        var legend = '<div class="cache-legend">' + Object.keys(u.groups).map(function (k) {
          return '<span class="cache-legend-item"><i class="cache-dot" style="background:' + colors[k] + '"></i>' +
            labels[k] + ' ' + util.fmtSize(u.groups[k].size) + '</span>';
        }).join('') + '</div>';

        return '<div class="blk-card"><div class="cache-total">' +
          '<div class="cache-total-val">' + util.fmtSize(u.total) + '</div>' +
          '<div class="cache-total-lab">本机已占用存储空间</div></div>' +
          '<div style="padding:0 16px"><div class="cache-bar">' + bar + '</div></div>' + legend + '</div>' +

          block('分类清理', Object.keys(u.groups).map(function (k) {
            return row({
              icon: k === 'posts' ? 'file' : k === 'history' ? 'clock' : k === 'profile' ? 'user' : 'folder',
              iconClass: k === 'posts' ? 'c-blue' : k === 'history' ? 'c-green' : k === 'profile' ? 'c-orange' : 'c-gray',
              label: '清理' + labels[k], value: util.fmtSize(u.groups[k].size), onClick: 'clear:' + k, arrow: true
            });
          }).join('')) +

          block('历史记录', row({ icon: 'clock', iconClass: 'c-teal', label: '历史记录管理', sub: '浏览历史与搜索历史', go: 'screen-history-manage', arrow: true }) +
            row({ icon: 'down', iconClass: 'c-blue', label: '导出我的数据', sub: '帖子、评论与收藏导出为 JSON', onClick: 'export' })) +

          '<div class="blk"><div class="blk-card">' +
          row({ icon: 'trash', iconClass: 'c-pink', label: '清空全部数据', sub: '恢复应用至初始状态，不可撤销', onClick: 'clearAll', danger: true }) +
          '</div></div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var act = e.target.closest('[data-act]');
          if (!act) return;
          var a = act.dataset.act;
          if (a.indexOf('clear:') === 0) {
            var g = a.slice(6);
            var labels = { posts: '帖子与图片', history: '浏览与搜索历史', profile: '资料与设置', other: '其他缓存' };
            UI.confirm({
              title: '清理' + labels[g], msg: '该分类下的本地数据将被删除，帖子数据清理后信息流将恢复为示例内容。',
              okText: '清理', danger: true
            }).then(function (ok) {
              if (!ok) return;
              var n = Store.clearGroup(g);
              UI.toast('已清理 ' + n + ' 项数据', { type: 'success' });
              setTimeout(function () { location.reload(); }, 900);
            });
          } else if (a === 'clearAll') {
            UI.confirm({
              title: '清空全部数据', msg: '将删除本机上的全部个人数据（含已发布帖子、收藏、历史与设置），应用将恢复至初始状态。',
              okText: '确认清空', danger: true
            }).then(function (ok) {
              if (!ok) return;
              Store.clearGroup();
              UI.toast('已清空全部数据，正在重启…', { type: 'success' });
              setTimeout(function () { location.reload(); }, 900);
            });
          } else if (a === 'export') {
            App.exportData();
          }
        });
      }
    },

    /* ------------------------- 帮助与反馈 ------------------------- */
    'screen-help': {
      title: '帮助与反馈',
      render: function () {
        var faq = MeData.faq.map(function (f) {
          return '<div class="faq-item"><button type="button" class="faq-q">' + util.esc(f.q) +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' +
            '</button><div class="faq-a">' + util.esc(f.a) + '</div></div>';
        }).join('');

        return '<div class="blk"><div class="blk-title">常见问题</div><div class="blk-card">' + faq + '</div></div>' +
          '<div class="blk"><div class="blk-title">意见反馈</div><div class="blk-card">' +
          '<div style="padding:14px"><textarea class="frm-textarea" id="fbText" maxlength="300" placeholder="描述你遇到的问题或改进建议…"></textarea>' +
          '<div style="display:flex;justify-content:flex-end;margin-top:6px"><span class="frm-count" id="fbCount">0/300</span></div></div>' +
          row({ icon: 'img', iconClass: 'c-purple', label: '添加截图', value: '选填', onClick: 'shot' }) +
          row({ icon: 'phone', iconClass: 'c-green', label: '联系方式', value: '选填', onClick: 'contact' }) +
          '</div></div>' +
          '<div class="pv-foot"><button type="button" class="pv-btn primary" data-submit="1">提交反馈</button></div>';
      },
      mount: function (root) {
        var ta = root.querySelector('#fbText');
        var cnt = root.querySelector('#fbCount');
        ta.addEventListener('input', function () {
          cnt.textContent = ta.value.length + '/300';
          cnt.classList.toggle('over', ta.value.length >= 300);
        });
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var act = e.target.closest('[data-act]');
          if (act && act.dataset.act === 'shot') { UI.toast('截图上传为演示功能'); }
          if (act && act.dataset.act === 'contact') {
            UI.prompt({ title: '联系方式', placeholder: '手机号或邮箱，便于我们回复你', maxlength: 40 })
              .then(function (v) { if (v) UI.toast('已记录：' + v); });
          }
          var q = e.target.closest('.faq-q');
          if (q) { q.parentElement.classList.toggle('open'); return; }
          if (e.target.closest('[data-submit]')) {
            if (!ta.value.trim()) { UI.toast('请先描述你的问题或建议', { type: 'error' }); return; }
            UI.toast('反馈已提交，感谢你的建议', { type: 'success' });
            ta.value = ''; cnt.textContent = '0/300';
          }
        });
      }
    },

    /* ------------------------- 关于我们 ------------------------- */
    'screen-about': {
      title: '关于我们',
      render: function () {
        return '<div class="pf-hero"><div class="pf-ava-big" style="background:var(--primary-grad)">校</div>' +
          '<div class="pf-name">校园助手</div><div class="pf-sub">版本 v1.1.0 · 2026-09-04</div></div>' +
          block('更新日志', MeData.changelog.map(function (c) {
            return '<div class="lst-item static"><div class="lst-main">' +
              '<div class="lst-label">' + util.esc(c.v) + ' <span class="dt-badge">' + util.esc(c.d) + '</span></div>' +
              '<div class="lst-sub">' + util.esc(c.t) + '</div></div></div>';
          }).join('')) +
          block('相关协议', row({ icon: 'file', iconClass: 'c-blue', label: '用户服务协议', onClick: 'tos', arrow: true }) +
            row({ icon: 'shield', iconClass: 'c-green', label: '隐私政策', onClick: 'pp', arrow: true }) +
            row({ icon: 'info', iconClass: 'c-purple', label: '开源许可说明', onClick: 'lic', arrow: true })) +
          '<div class="blk-title" style="text-align:center;margin-top:18px">本应用为校园生活服务原型演示<br/>所有数据仅保存在你的本机浏览器</div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var act = e.target.closest('[data-act]');
          if (!act) return;
          var text = {
            tos: '用户服务协议（摘要）：本应用仅供校内学习生活使用，请勿发布违法违规内容，违规者将被限制发布权限。',
            pp: '隐私政策（摘要）：我们仅在本地存储你的内容与偏好设置，不会上传任何个人数据到服务器。',
            lic: '开源许可说明：本项目为教学演示用途，使用的图标基于 MIT 协议，字体使用系统默认字体。'
          }[act.dataset.act];
          if (text) {
            UI.confirm({ title: '条款说明', msg: text, okText: '我知道了', cancelText: '关闭' }).then(function () {});
          }
        });
      }
    },

    /* ------------------------- 账号注销 ------------------------- */
    'screen-deactivate': {
      title: '账号注销',
      render: function () {
        return '<div class="danger-card"><div class="danger-title">注销前请仔细阅读</div>' +
          '<ul class="danger-list">' +
          '<li>账号下全部发布的帖子、评论与回复将被永久删除</li>' +
          '<li>我的收藏、浏览历史与搜索历史将被清空</li>' +
          '<li>个人资料、头像与全部偏好设置将被重置</li>' +
          '<li>已报名的活动与社团关系将自动解除</li>' +
          '<li>注销后有 7 天冷静期，期间重新登录可自动撤销</li>' +
          '</ul></div>' +
          '<div class="blk" style="margin-top:16px"><div class="blk-title">请确认以下事项</div><div class="blk-card">' +
          '<div class="agree-row"><button type="button" class="cbx" id="agreeBox" role="checkbox" aria-checked="false">' +
          ic('check', 12) + '</button><span>我已了解注销的全部后果，并已备份需要保留的内容。</span></div>' +
          '<div style="padding:4px 14px 14px"><div class="frm-count">请输入「注销」两字以完成验证</div>' +
          '<input class="frm-input" id="delConfirm" style="text-align:left;margin-top:8px;padding:10px 12px;background:var(--bg-soft);border-radius:var(--r-sm)" placeholder="在此输入：注销" /></div>' +
          '</div></div>' +
          '<button type="button" class="btn-danger" id="btnDeactivate" disabled>确认注销账号</button>';
      },
      mount: function (root) {
        var box = root.querySelector('#agreeBox');
        var input = root.querySelector('#delConfirm');
        var btn = root.querySelector('#btnDeactivate');

        function sync() {
          var ok = box.classList.contains('on') && input.value.trim() === '注销';
          btn.disabled = !ok;
        }
        box.addEventListener('click', function () {
          var on = box.classList.toggle('on');
          box.setAttribute('aria-checked', on ? 'true' : 'false');
          sync();
        });
        input.addEventListener('input', sync);

        btn.addEventListener('click', function () {
          UI.confirm({
            title: '最后确认',
            msg: '注销后将进入 7 天冷静期。演示原型将立即清除本机数据并恢复初始状态，是否继续？',
            okText: '确认注销', danger: true
          }).then(function (ok) {
            if (!ok) return;
            Store.clearGroup();
            UI.toast('账号已注销，正在恢复初始状态…', { type: 'success' });
            setTimeout(function () { location.reload(); }, 1000);
          });
        });
      }
    },

    /* ------------------------- 心理咨询（修复死链） ------------------------- */
    'screen-psy': {
      title: '心理咨询',
      render: function () {
        return '<div class="hero h-purple"><h3>心灵驿站</h3>' +
          '<p>专业心理咨询师在线，为你的情绪提供一个安全的出口</p>' +
          '<div class="hero-tags"><span class="hero-tag">严格保密</span><span class="hero-tag">免费</span></div></div>' +
          block('快速服务', row({ icon: 'cal', iconClass: 'c-purple', label: '预约咨询', sub: '近 3 天可约 · 每次 50 分钟', onClick: 'book', arrow: true }) +
            row({ icon: 'edit', iconClass: 'c-blue', label: '情绪自评量表', sub: '2 分钟快速评估近期状态', onClick: 'scale', arrow: true }) +
            row({ icon: 'chat', iconClass: 'c-green', label: '匿名倾诉', sub: '无需预约，随时写下你的感受', onClick: 'talk', arrow: true })) +
          block('紧急支持', row({ icon: 'phone', iconClass: 'c-orange', label: '校内心理援助热线', value: '025-8888 6666', onClick: 'hotline' }) +
            row({ icon: 'clock', iconClass: 'c-gray', label: '服务时间', value: '每天 09:00-21:00' }));
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var act = e.target.closest('[data-act]');
          if (!act) return;
          var a = act.dataset.act;
          if (a === 'book') {
            UI.choose({
              title: '选择咨询时段',
              items: [
                { value: 't1', label: '今天 15:00-15:50', desc: '王老师 · 认知行为方向' },
                { value: 't2', label: '明天 10:00-10:50', desc: '李老师 · 情绪管理方向' },
                { value: 't3', label: '后天 19:00-19:50', desc: '张老师 · 人际关系方向' }
              ]
            }).then(function (v) {
              if (v === null) return;
              UI.confirm({ title: '预约确认', msg: '预约成功后请准时到达大学生活动中心 305 室。', okText: '确认预约' })
                .then(function (ok) { if (ok) UI.toast('预约成功，请准时前往', { type: 'success' }); });
            });
          } else if (a === 'scale') {
            UI.toast('量表加载中（演示）…');
            setTimeout(function () {
              UI.sheet({
                title: '近两周，你的整体情绪状态是？',
                items: [
                  { value: '1', label: '很好，几乎没有困扰' },
                  { value: '2', label: '还行，偶有波动' },
                  { value: '3', label: '一般，有些疲惫' },
                  { value: '4', label: '较差，建议预约咨询' }
                ]
              }).then(function (v) {
                if (v === null) return;
                if (+v >= 3) {
                  UI.toast('建议预约一次咨询，聊聊会好一些', { type: 'error' });
                } else {
                  UI.toast('状态不错，继续保持', { type: 'success' });
                }
              });
            }, 600);
          } else if (a === 'talk') {
            UI.prompt({ title: '匿名倾诉', msg: '内容仅你可见，写下来本身也是一种疗愈', placeholder: '想说点什么…', maxlength: 500 })
              .then(function (v) { if (v) UI.toast('已保存，谢谢你愿意说出来', { type: 'success' }); });
          } else if (a === 'hotline') {
            UI.confirm({ title: '拨打援助热线', msg: '025-8888 6666（校内心理援助热线，24 小时）', okText: '拨打' })
              .then(function (ok) { if (ok) UI.toast('正在呼叫（演示）'); });
          }
        });
      }
    }
  });

  /* ======================================================================
   * 7. 表单行模板
   * ==================================================================== */
  function frmRow(label, controlHTML) {
    return '<div class="frm-row"><div class="frm-lab">' + util.esc(label) + '</div>' +
      '<div class="frm-ctl">' + controlHTML + '</div></div>';
  }

  /* ======================================================================
   * 8. 保存资料
   * ==================================================================== */
  function saveProfile(root) {
    var name = (root.querySelector('#fName') || {}).value || '';
    var genderBtn = root.querySelector('#fGender .frm-seg-btn.on');
    var grade = (root.querySelector('#fGrade') || {}).value || '';
    var major = (root.querySelector('#fMajor') || {}).value || '';
    var birth = (root.querySelector('#fBirth') || {}).value || '';
    var bio = (root.querySelector('#fBio') || {}).value || '';

    if (name.trim().length < 2) { UI.toast('昵称至少需要 2 个字', { type: 'error' }); return; }

    var p = Store.getProfile();
    p.name = name.trim();
    p.gender = genderBtn ? genderBtn.dataset.v : p.gender;
    p.grade = grade.trim();
    p.major = major.trim();
    p.birthday = birth;
    p.bio = bio.trim();
    Store.saveProfile(p);

    App.syncProfileHeader();
    UI.toast('资料已保存', { type: 'success' });
    Router.back();
  }

  /* ======================================================================
   * 9. 数据导出
   * ==================================================================== */
  App.exportData = function () {
    var data = {
      exportedAt: new Date().toISOString(),
      profile: Store.getProfile(),
      settings: Store.getSettings(),
      posts: Store.getPosts(),
      favorites: Store.getFavorites(),
      history: Store.getHistory(),
      follows: Store.getFollows()
    };
    var text = JSON.stringify(data, null, 2);
    try {
      var blob = new Blob([text], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'campus-app-data-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        document.body.removeChild(a);
      }, 100);
      UI.toast('数据已导出为 JSON 文件', { type: 'success' });
    } catch (e) {
      UI.toast('导出失败，请检查浏览器下载权限', { type: 'error' });
    }
  };

  /* ======================================================================
   * 10. 个人中心入口处理器（替换 index.html 中的 toast 占位）
   * ==================================================================== */

  /** 菜单项 */
  App.handleProfileMenu = function (action) {
    var map = {
      '消息': 'screen-msg',
      '活动': 'screen-activity-mine',
      '校园卡': 'screen-service',
      '成绩': 'screen-service',
      '心理咨询': 'screen-psy',
      '帮助': 'screen-help',
      '关于': 'screen-about',
      '设置': 'screen-settings'
    };
    var keyMap = { '校园卡': 'card', '成绩': 'grade' };
    var id = map[action];
    if (!id) { UI.toast(action + ' · 功能开发中'); return; }
    Router.push(id, keyMap[action] ? { key: keyMap[action] } : {});
  };

  /** 「我的」页快捷入口：我的发布 / 收藏 / 浏览历史 */
  App.handleQuickItem = function (action, el) {
    if (action === '发布') {
      if (global.__openMyPosts) global.__openMyPosts();
      else UI.toast('功能加载中');
      return;
    }
    if (action === '收藏') { Router.push('screen-favs'); return; }
    if (action === '历史') { Router.push('screen-history'); return; }
  };

  /** 统计数据下钻 */
  App.handleStat = function (label) {
    if (label === '发布') {
      if (global.__openMyPosts) global.__openMyPosts();
      return;
    }
    if (label === '收藏') { Router.push('screen-favs'); return; }
    if (label === '关注') { Router.push('screen-follows'); return; }
    if (label === '获赞') { Router.push('screen-likes'); return; }
  };

  /** 头部图标（扫一扫 / 设置） */
  App.handleHeaderIcon = function (tip) {
    if (tip === '设置') { Router.push('screen-settings'); return; }
    if (tip === '扫一扫') {
      UI.sheet({
        title: '扫一扫',
        items: [
          { value: 'add', label: '添加好友', desc: '扫描对方二维码名片', icon: ic('plus', 20) },
          { value: 'club', label: '加入社团', desc: '扫描社团招新海报', icon: ic('users', 20) },
          { value: 'sign', label: '活动签到', desc: '扫描活动现场签到码', icon: ic('check', 20) }
        ]
      }).then(function (v) {
        if (!v) return;
        UI.toast('正在识别二维码（演示）…');
        setTimeout(function () {
          if (v === 'club') { Router.push('screen-clubs'); }
          else UI.toast('已识别：' + ({ add: '小莫', sign: '校园歌手大赛' }[v] || '未知内容'));
        }, 700);
      });
      return;
    }
    UI.toast(tip || '操作');
  };

  /** 退出登录 */
  App.handleLogout = function () {
    UI.confirm({ title: '退出登录', msg: '退出后需要重新登录才能使用完整功能。', okText: '退出', danger: true })
      .then(function (ok) {
        if (!ok) return;
        UI.toast('已退出登录（演示）');
        setTimeout(function () { Router.goTab('screen-home'); }, 600);
      });
  };

  /* ======================================================================
   * 11. 同步个人中心展示
   * ==================================================================== */
  App.syncProfileHeader = function () {
    var p = Store.getProfile();
    var scope = document.getElementById('screen-profile');
    if (!scope) return;

    var nameEl = scope.querySelector('.profile-name');
    if (nameEl) nameEl.textContent = p.name;
    var metaEl = scope.querySelector('.profile-meta');
    if (metaEl) metaEl.textContent = p.grade + ' · ' + p.major;
    var bioEl = scope.querySelector('.profile-bio');
    if (bioEl) bioEl.textContent = p.bio || '这个人很懒，什么都没写';
    var avaEl = scope.querySelector('.profile-avatar');
    if (avaEl) {
      if (p.avatar) {
        avaEl.innerHTML = '<img src="' + p.avatar + '" alt="头像" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />';
      } else if (p.avatarPreset) {
        var pre = AVATAR_PRESETS.filter(function (x) { return x.k === p.avatarPreset; })[0];
        avaEl.textContent = pre ? pre.text : p.name.charAt(0);
      } else {
        avaEl.textContent = p.name.charAt(0);
      }
    }
    // 首页问候语与头像字母
    var greet = document.querySelector('#screen-home .greet-name');
    if (greet) greet.textContent = p.name;
    var homeAva = document.querySelector('#screen-home .avatar-btn');
    if (homeAva) {
      homeAva.textContent = p.avatar ? '' : p.name.charAt(0);
      if (p.avatar) {
        homeAva.innerHTML = '<img src="' + p.avatar + '" alt="头像" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />';
      }
    }
  };

  /* ======================================================================
   * 12. 初始化
   * ==================================================================== */
  App.initProfile = function () {
    applyTheme();
    applyFontScale();
    App.syncProfileHeader();
    App.syncProfileStats();

    // 编辑资料 / 头像 入口
    var edit = document.querySelector('#screen-profile .profile-edit');
    if (edit) edit.addEventListener('click', function () { Router.push('screen-edit-profile'); });
    var ava = document.querySelector('#screen-profile .profile-avatar');
    if (ava) {
      ava.style.cursor = 'pointer';
      ava.addEventListener('click', function () { Router.push('screen-avatar'); });
    }
  };

})(window);
