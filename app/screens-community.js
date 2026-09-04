/* ==========================================================================
 * campus-app · screens-community.js
 * 社区增强模块：搜索入口 / 发布预览与校验 / 分享 / 举报 / 屏蔽 /
 *               私信会话 / 收藏同步 / 浏览历史 / 发布后定位
 * 依赖：core.js、router.js、screens-home.js
 * ========================================================================== */
(function (global) {
  'use strict';

  var App = global.App;
  var util = App.util, UI = App.UI, Store = App.Store, Router = App.Router, ic = App.ic;

  /* ======================================================================
   * 1. 配置：违禁词与举报理由
   * ==================================================================== */
  var BAD_WORDS = ['代考', '替考', '答案出售', '刷单', '博彩'];
  var REPORT_REASONS = [
    { value: 'ad', label: '垃圾广告', desc: '营销、扫码、引流内容' },
    { value: 'abuse', label: '人身攻击', desc: '辱骂、歧视、引战' },
    { value: 'fake', label: '不实信息', desc: '谣言、虚假承诺' },
    { value: 'porn', label: '违规内容', desc: '低俗、暴力、违法信息' },
    { value: 'other', label: '其他问题', desc: '请在补充说明中描述' }
  ];
  var REPORT_COOLDOWN = 24 * 3600 * 1000;

  /* ======================================================================
   * 2. 修复社区时间戳（让「最新」分类排序生效）
   * ==================================================================== */
  function fixTimestamps() {
    var cards = document.querySelectorAll('.community-page[data-tag="all"] .feed-card');
    var base = Date.now();
    Array.prototype.forEach.call(cards, function (c, i) {
      if (!c.getAttribute('data-ts')) {
        c.setAttribute('data-ts', String(base - i * 3 * 3600000));
      }
    });
    if (typeof global.filterCommunityPages === 'function') {
      global.filterCommunityPages();
    }
  }

  /* ======================================================================
   * 3. 读取发布表单草稿
   * ==================================================================== */
  var BOARD_MAP = { '校园': 'campus', '学习': 'study', '运动': 'sport', '二手': 'trade', '活动': 'activity' };

  function readDraft() {
    var boardText = (document.getElementById('boardName') || {}).textContent || '校园';
    var visEl = document.getElementById('visPill');
    var imgs = Array.prototype.map.call(
      document.querySelectorAll('#composeImgs img'), function (i) { return i.src; }
    );
    return {
      boardLabel: boardText.trim(),
      tag: BOARD_MAP[boardText.trim()] || 'campus',
      title: (document.getElementById('composeTitle') || {}).value || '',
      content: (document.getElementById('composeContent') || {}).value || '',
      images: imgs,
      visibility: visEl ? (visEl.dataset.vis || 'public') : 'public'
    };
  }
  App.readDraft = readDraft;

  /** 校验草稿，返回错误文案；通过返回空串 */
  function validateDraft(d) {
    if (!d.content.trim()) return '请填写动态内容';
    if (d.content.trim().length > 500) return '正文不能超过 500 字';
    if (d.title.length > 40) return '标题不能超过 40 字';
    if (d.images.length > 9) return '最多上传 9 张图片';
    var hit = BAD_WORDS.filter(function (w) { return d.content.indexOf(w) >= 0 || d.title.indexOf(w) >= 0; });
    if (hit.length) return '内容包含违规词：' + hit.join('、');
    return '';
  }
  App.validateDraft = validateDraft;

  /** 以真实 feed 卡片样式渲染帖子（预览 / 收藏 / 历史共用） */
  function feedCardHTML(d, opt) {
    opt = opt || {};
    var isAnon = d.visibility === 'anon';
    var author = isAnon ? '匿名' : '我';
    var avatar = isAnon ? '匿' : (opt.avatar || '我');
    var imgs = (d.images && d.images.length)
      ? '<div class="feed-imgs">' + d.images.map(function (s) { return '<img src="' + s + '" alt="" />'; }).join('') + '</div>'
      : '';
    var topics = util.pickTopics(d.content);
    var tags = topics.length
      ? '<div class="feed-tags">' + topics.map(function (t) { return '<span class="feed-tag">#' + util.esc(t) + '</span>'; }).join('') + '</div>'
      : '';
    return '<div class="feed-card" data-tag="' + util.esc(d.tag) + '">' +
      '<div class="feed-header"><div class="feed-avatar ' + (isAnon ? 'anon' : 'a-1') + '">' + util.esc(avatar) + '</div>' +
      '<div class="feed-meta"><div class="feed-author">' + util.esc(author) +
      (isAnon ? '<span class="feed-badge b-anon">匿名</span>' : '') + '</div>' +
      '<div class="feed-time">' + util.esc(opt.time || '刚刚') + '</div></div></div>' +
      (d.title ? '<div class="feed-title">' + util.esc(d.title) + '</div>' : '') +
      imgs + tags +
      '<div class="feed-content">' + util.esc(d.content) + '</div>' +
      '<div class="feed-actions">' +
      '<div class="feed-action" data-action="like"><span>0</span></div>' +
      '<div class="feed-action" data-action="comment"><span>0</span></div>' +
      '<div class="feed-action" data-action="favorite"><span>0</span></div>' +
      '</div></div>';
  }
  App.feedCardHTML = feedCardHTML;

  /* ======================================================================
   * 4. 注册社区相关屏幕
   * ==================================================================== */
  Router.registerAll({

    /* ------------------------- 发布预览 ------------------------- */
    'screen-preview': {
      title: '发布预览',
      render: function () {
        var d = readDraft();
        var err = validateDraft(d);
        var imgs = d.images.length;
        var topics = util.pickTopics(d.content);

        return '<div class="pv-tip">' + ic('eye', 15) +
          '<span>以下是你的动态在社区中的真实展示效果，确认无误后点击「确认发布」。</span></div>' +
          (err ? '<div class="pv-tip" style="background:#FEE2E2;color:#DC2626">' + ic('warn', 15) +
            '<span>' + util.esc(err) + '</span></div>' : '') +
          '<div class="pv-card">' + feedCardHTML(d) + '</div>' +
          '<div class="blk" style="margin-top:16px"><div class="blk-title">发布信息</div><div class="blk-card">' +
          App.tpl.row({ icon: 'pin', iconClass: 'c-blue', label: '发布到', value: d.boardLabel }) +
          App.tpl.row({ icon: 'eye', iconClass: 'c-green', label: '可见性', value: d.visibility === 'anon' ? '匿名' : '公开' }) +
          App.tpl.row({ icon: 'img', iconClass: 'c-purple', label: '图片', value: imgs ? imgs + ' 张' : '无' }) +
          App.tpl.row({ icon: 'star', iconClass: 'c-orange', label: '话题', value: topics.length ? '#' + topics.join(' #') : '无' }) +
          '</div></div>' +
          '<div class="pv-foot">' +
          '<button type="button" class="pv-btn ghost" data-edit="1">返回编辑</button>' +
          '<button type="button" class="pv-btn primary" data-publish="1"' + (err ? ' disabled style="opacity:.5"' : '') + '>确认发布</button>' +
          '</div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          if (e.target.closest('[data-edit]')) { Router.back(); return; }
          if (e.target.closest('[data-publish]')) {
            var err = validateDraft(readDraft());
            if (err) { UI.toast(err, { type: 'error' }); return; }
            var btn = document.getElementById('composePublish');
            if (!btn) return;
            // 复用既有发布逻辑，保证数据结构一致：
            // 第一次 back 退出预览（模态层，不写 history），第二次 back 退出发布页回到社区
            btn.click();
            setTimeout(function () { Router.back(); }, 40);
          }
        });
      }
    },

    /* ------------------------- 私信会话 ------------------------- */
    'screen-chat': {
      title: '私信',
      render: function (params) {
        var name = params.name || 'TA';
        var msgs = Store.get('chat::' + name, []);
        if (!msgs.length) {
          msgs = [{ from: 'them', text: '你好！看到你在社区发的帖子，想交流一下～', ts: Date.now() - 600000 }];
          Store.set('chat::' + name, msgs);
        }
        var html = msgs.map(function (m) {
          return '<div class="chat-row ' + (m.from === 'me' ? 'me' : '') + '">' +
            '<div class="chat-bubble">' + util.esc(m.text) + '</div>' +
            '<div class="chat-time">' + util.fmtTime(m.ts) + '</div></div>';
        }).join('');

        var quick = ['在吗？', '能便宜一点吗？', '什么时候方便面交？', '好的，谢谢！'];
        return '<div class="chat-wrap">' + html + '</div>' +
          '<div class="chat-quick">' + quick.map(function (q) {
            return '<button type="button" class="chip" data-quick="' + util.esc(q) + '">' + util.esc(q) + '</button>';
          }).join('') + '</div>' +
          '<div class="chat-bar">' +
          '<input class="chat-input" id="chatInput" type="text" placeholder="说点什么…" />' +
          '<button type="button" class="chat-send" id="chatSend">发送</button></div>';
      },
      mount: function (root, params) {
        var name = params.name || 'TA';
        var input = root.querySelector('#chatInput');
        var wrap = root.querySelector('.chat-wrap');

        function scrollBottom() { wrap.scrollTop = wrap.scrollHeight; }

        function send(text) {
          text = (text || '').trim();
          if (!text) return;
          var msgs = Store.get('chat::' + name, []);
          msgs.push({ from: 'me', text: text, ts: Date.now() });
          Store.set('chat::' + name, msgs);
          input.value = '';
          Router.reload();
          // 模拟对方回复
          setTimeout(function () {
            var list = Store.get('chat::' + name, []);
            list.push({ from: 'them', text: '收到，我看看哈～', ts: Date.now() });
            Store.set('chat::' + name, list);
            Router.reload();
          }, 1600);
        }

        root.querySelector('#chatSend').addEventListener('click', function () { send(input.value); });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); send(input.value); }
        });
        root.querySelector('.chat-quick').addEventListener('click', function (e) {
          var q = e.target.closest('[data-quick]');
          if (q) send(q.dataset.quick);
        });
        setTimeout(scrollBottom, 50);
      }
    },

    /* ------------------------- 举报结果页（占位说明） ------------------------- */
    'screen-report': {
      title: '举报',
      render: function () {
        return '<div class="dt-card">' +
          '<div class="dt-title">举报已提交</div>' +
          '<div class="dt-content"><p>我们会在 24 小时内完成核实，处理结果将通过「消息中心 → 通知」告知你。</p>' +
          '<p>你也可以在「设置 → 隐私 → 举报记录」中查看历史举报的处理进度。</p></div></div>';
      }
    }
  });

  /* ======================================================================
   * 5. 帖子「更多」菜单：屏蔽 / 举报 / 分享
   * 由 index.html 内联脚本转调至此（替换原有的 alert 占位）
   * ==================================================================== */
  App.handlePostMore = function (act) {
    if (act === 'share') {
      var card = document.querySelector('#postBody .feed-card');
      var title = card ? (card.querySelector('.feed-title') || {}).textContent || '校园动态' : '校园动态';
      App.shareSheet({ title: title, text: title });
      return;
    }
    if (act === 'report') { App.reportPost(); return; }
    if (act === 'block') { App.blockPost(); return; }
  };

  /** 举报当前帖子 */
  App.reportPost = function () {
    var key = currentPostKey();
    if (!key) { UI.toast('请先打开一条帖子'); return; }

    var reports = Store.getReports();
    var last = reports[key] || 0;
    if (Date.now() - last < REPORT_COOLDOWN) {
      UI.toast('该内容你已举报过，请耐心等待处理');
      return;
    }

    UI.sheet({
      title: '请选择举报理由',
      items: REPORT_REASONS.map(function (r) {
        return { value: r.value, label: r.label, desc: r.desc, icon: ic('flag', 20) };
      })
    }).then(function (v) {
      if (!v) return;
      UI.prompt({
        title: '补充说明',
        msg: '可简要描述问题，便于我们更快核实（选填）',
        placeholder: '例如：该帖在多个分类重复发布',
        maxlength: 200
      }).then(function (desc) {
        if (desc === null) return;   // 取消则不提交
        reports[key] = Date.now();
        Store.set('reports', reports);
        Router.push('screen-report');
      });
    });
  };

  /** 屏蔽当前帖子 */
  App.blockPost = function () {
    var card = document.querySelector('#postBody .feed-card');
    if (!card) { UI.toast('请先打开一条帖子'); return; }
    var author = (card.querySelector('.feed-author') || {}).textContent || '';
    var title = (card.querySelector('.feed-title') || {}).textContent || '';

    UI.confirm({
      title: '屏蔽这条内容',
      msg: '屏蔽后你将不再看到该帖子，此操作可在「设置 → 隐私 → 屏蔽内容」中撤销。',
      okText: '屏蔽', danger: true
    }).then(function (ok) {
      if (!ok) return;
      var hidden = Store.getHiddenPosts();
      var key = author.trim() + '::' + title.trim();
      if (hidden.indexOf(key) === -1) hidden.push(key);
      Store.set('hidden-posts', hidden);

      // 从所有分类页移除该卡片
      document.querySelectorAll('.community-page .feed-card').forEach(function (c) {
        var a = (c.querySelector('.feed-author') || {}).textContent || '';
        var t = (c.querySelector('.feed-title') || {}).textContent || '';
        if (a.trim() + '::' + t.trim() === key) c.remove();
      });
      UI.toast('已屏蔽，将减少类似内容', { type: 'success' });
      Router.back();
    });
  };

  /** 取当前打开帖子的存储键 */
  function currentPostKey() {
    var card = document.querySelector('#postBody .feed-card');
    if (card && typeof global.postKey === 'function') {
      try { return global.postKey(card); } catch (e) {}
    }
    return '';
  }

  /* ======================================================================
   * 6. 私信 / 关注
   * ==================================================================== */
  App.handlePm = function (name) {
    Router.push('screen-chat', { name: name });
  };

  App.handleFollow = function (btn) {
    var card = btn.closest('.feed-card');
    var name = card ? ((card.querySelector('.feed-author') || {}).textContent || '').replace('楼主', '').trim() : '';
    if (!name) return;
    var follows = Store.getFollows();
    var idx = follows.indexOf(name);
    var following = idx === -1;
    if (following) follows.push(name); else follows.splice(idx, 1);
    Store.set('follows', follows);

    btn.classList.toggle('following', following);
    btn.textContent = following ? '已关注' : '+ 关注';
    UI.toast(following ? '已关注 ' + name : '已取消关注 ' + name);
    App.syncProfileStats();
  };

  /* ======================================================================
   * 7. 收藏同步到 Store
   * ==================================================================== */
  function syncFavorites() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.feed-action[data-action="favorite"]');
      if (!btn) return;
      var card = btn.closest('.feed-card');
      if (!card) return;
      var title = ((card.querySelector('.feed-title') || {}).textContent || '').trim();
      var content = ((card.querySelector('.feed-content') || {}).textContent || '').trim();
      var author = ((card.querySelector('.feed-author') || {}).textContent || '').trim();
      if (!title && !content) return;

      var id = card.dataset.id || (author + '::' + title);
      var faved = btn.classList.contains('favorited');
      var list = Store.getFavorites();

      if (faved) {
        var exist = list.filter(function (x) { return x.id === id; })[0];
        if (!exist) {
          list.unshift({
            id: id, title: title || content.slice(0, 20), text: content,
            author: author, tag: card.dataset.tag || '', ts: Date.now()
          });
        }
      } else {
        list = list.filter(function (x) { return x.id !== id; });
      }
      Store.set('favorites', list);
      App.syncProfileStats();
    });
  }

  /* ======================================================================
   * 8. 浏览历史：包装既有 openPost
   * ==================================================================== */
  function wrapOpenPost() {
    if (typeof global.openPost !== 'function') return;
    var orig = global.openPost;
    global.openPost = function (card) {
      orig(card);
      try {
        var title = ((card.querySelector('.feed-title') || {}).textContent || '').trim();
        var content = ((card.querySelector('.feed-content') || {}).textContent || '').trim();
        var author = ((card.querySelector('.feed-author') || {}).textContent || '').trim();
        Store.pushHistory({
          id: card.dataset.id || (author + '::' + title),
          type: 'post',
          title: title || content.slice(0, 20),
          text: content,
          author: author,
          tag: card.dataset.tag || ''
        });
      } catch (e) {}
    };
  }

  /* ======================================================================
   * 9. 发布后定位到新帖
   * ==================================================================== */
  var _lastPostCount = 0;

  function locateNewPost(p) {
    if (!p) return;
    // 1) 切到所属分类
    var tabs = document.querySelectorAll('.community-tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].dataset.tag === p.tag) {
        if (typeof global.setPage === 'function') { global.setPage(i, false); break; }
      }
    }
    // 2) 列表回到顶部
    var area = document.querySelector('.community-scroll-area');
    if (area) area.scrollTop = 0;
    var page = document.querySelector('.community-page.active') ||
               document.querySelector('.community-page[data-tag="' + p.tag + '"]');
    if (page) page.scrollTop = 0;

    // 3) 新卡片高亮
    setTimeout(function () {
      var card = document.querySelector('.community-page .feed-card[data-id="' + p.id + '"]');
      if (card) {
        card.classList.add('flash');
        setTimeout(function () { card.classList.remove('flash'); }, 1600);
      }
    }, 120);
  }
  App.locateNewPost = locateNewPost;

  function watchPublish() {
    var btn = document.getElementById('composePublish');
    if (!btn) return;
    _lastPostCount = Store.getPosts().length;

    // 后注册的监听器在原发布逻辑之后执行，此时 localStorage 已更新
    btn.addEventListener('click', function () {
      var before = _lastPostCount;
      setTimeout(function () {
        var arr = Store.getPosts();
        if (arr.length > before) {
          _lastPostCount = arr.length;
          locateNewPost(arr[0]);
        }
      }, 20);
    });
  }

  /* ======================================================================
   * 10. 发布页增强：注入「预览」按钮 + 输入校验提示
   * ==================================================================== */
  function enhanceCompose() {
    var body = document.querySelector('#screen-compose .compose-body');
    if (!body) return;

    // 注入预览入口
    if (!document.getElementById('composePreviewBtn')) {
      var tip = body.querySelector('.compose-tip');
      var bar = document.createElement('div');
      bar.className = 'pv-foot';
      bar.style.cssText = 'position:static;padding:14px 0 4px;background:none';
      bar.innerHTML = '<button type="button" class="pv-btn ghost" id="composePreviewBtn">' +
        ic('eye', 16) + ' 预览效果</button>';
      if (tip) body.insertBefore(bar, tip);
      else body.appendChild(bar);

      document.getElementById('composePreviewBtn').addEventListener('click', function () {
        var d = readDraft();
        if (!d.content.trim() && !d.title.trim()) {
          UI.toast('先写点内容再预览吧');
          return;
        }
        // 预览为模态层：不入 history，返回时直接回到发布页
        Router.pushModal('screen-preview');
      });
    }

    // 输入实时校验提示（防抖）
    var cc = document.getElementById('composeContent');
    if (cc) {
      var warn = util.debounce(function () {
        var d = readDraft();
        if (d.content.length >= 480) {
          UI.toast('正文已达上限 ' + d.content.length + '/500');
        }
        var hit = BAD_WORDS.filter(function (w) { return d.content.indexOf(w) >= 0; });
        if (hit.length) UI.toast('注意：内容包含违规词「' + hit[0] + '」，将无法发布', { type: 'error' });
      }, 700);
      cc.addEventListener('input', warn);
    }

    // 标题字数
    var ct = document.getElementById('composeTitle');
    if (ct) {
      ct.addEventListener('input', function () {
        if (ct.value.length >= 40) UI.toast('标题已达 40 字上限');
      });
    }
  }

  /* ======================================================================
   * 11. 社区页入口绑定
   * ==================================================================== */
  function bindCommunityEntries() {
    // 社区搜索
    var searchBtn = document.querySelector('#screen-community .community-icon-btn');
    if (searchBtn) {
      searchBtn.setAttribute('role', 'button');
      searchBtn.setAttribute('aria-label', '搜索社区内容');
      searchBtn.addEventListener('click', function () {
        Router.push('screen-search', { tab: 'post' });
      });
    }
    // 社区活动横幅
    var banner = document.querySelector('#screen-community .community-banner');
    if (banner) {
      banner.setAttribute('role', 'button');
      banner.setAttribute('aria-label', '查看活动详情');
      banner.addEventListener('click', function () {
        Router.push('screen-activity');
      });
    }
  }

  /* ======================================================================
   * 12. 初始化（由 boot.js 调用）
   * ==================================================================== */
  App.initCommunity = function () {
    fixTimestamps();
    syncFavorites();
    wrapOpenPost();
    watchPublish();
    enhanceCompose();
    bindCommunityEntries();
    App.syncProfileStats();
  };

})(window);
