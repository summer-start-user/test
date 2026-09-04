/* ==========================================================================
 * campus-app · screens-home.js
 * 首页相关模块：全局搜索 / 消息中心 / 公告 / 课表 / 校园服务 / 社团
 * 依赖：core.js、router.js
 * ========================================================================== */
(function (global) {
  'use strict';

  var App = global.App;
  var util = App.util, UI = App.UI, Store = App.Store, Router = App.Router;

  /* ======================================================================
   * 1. 图标库（线性图标，统一 24 视框）
   * ==================================================================== */
  var P = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>',
    pin: '<path d="M21 10c0 7-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19"/><path d="M6.6 6.6A18.5 18.5 0 0 0 2 11s3.5 7 10 7a9.7 9.7 0 0 0 4.4-1.03"/><path d="m2 2 20 20"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    trash2: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
    set: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    ban: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    camera: '<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
    refresh: '<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>',
    warn: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
    key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    device: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>'
  };

  /** 生成线性图标；fill=true 时使用填充风格 */
  function ic(name, size, fill) {
    var d = P[name] || '';
    var s = size || 18;
    return '<svg viewBox="0 0 24 24" fill="' + (fill ? 'currentColor' : 'none') + '" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:' + s + 'px;height:' + s + 'px">' + d + '</svg>';
  }
  App.ic = ic;
  App.ICON_PATHS = P;

  /* ======================================================================
   * 2. 静态业务数据（原型内置，后续可替换为接口数据）
   * ==================================================================== */
  var H = 3600000, D = 86400000;
  var now = Date.now();

  var Data = App.Data = {

    /** 校园公告 */
    notices: [
      {
        id: 'n1', title: '2026秋季选课系统开放通知', source: '教务处', tag: '教务',
        ts: now - 2 * H, unread: true,
        content: [
          '2026 年秋季学期选课将于 9 月 8 日 10:00 正式开放，请同学们提前完成培养方案核对与选课计划。',
          '一、选课时间：9 月 8 日 10:00 — 9 月 15 日 22:00',
          '二、选课方式：登录教务系统 → 选课管理 → 本学期选课',
          '三、注意事项：请务必在规定时间内完成选课，逾期系统关闭不再补选。'
        ],
        attach: { name: '2026秋季选课操作指南.pdf', size: '1.2 MB' }
      },
      {
        id: 'n2', title: '暑期图书馆开放时间调整公告', source: '图书馆', tag: '图书',
        ts: now - 1 * D, unread: true,
        content: [
          '根据学校暑期安排，图书馆开放时间调整如下：',
          '周一至周五：08:00 — 22:00',
          '周六、周日：09:00 — 17:00',
          '自习区 24 小时开放，需刷校园卡进入。'
        ],
        attach: null
      },
      {
        id: 'n3', title: '校园歌手大赛报名已开启', source: '校团委', tag: '活动',
        ts: now - 3 * D, unread: true,
        content: [
          '第十六届校园歌手大赛正式启动报名，欢迎各年级同学踊跃参与。',
          '报名截止：8 月 15 日 24:00',
          '初赛时间：9 月 20 日 19:00，地点：大学生活动中心。'
        ],
        attach: null
      },
      {
        id: 'n4', title: '关于 2026 学年期末考试安排的通知', source: '教务处', tag: '教务',
        ts: now - 7 * D, unread: false,
        content: [
          '本学期期末考试将于 12 月 28 日至 1 月 8 日进行，具体科目安排详见附件。',
          '请同学们提前做好复习规划，注意考试时间与考场地点。'
        ],
        attach: { name: '期末考试安排表.xlsx', size: '328 KB' }
      },
      {
        id: 'n5', title: '校园网暑期升级维护通知', source: '信息中心', tag: '通知',
        ts: now - 14 * D, unread: false,
        content: [
          '为提升校园网服务质量，信息中心将于本周六 00:00—06:00 对核心设备进行升级。',
          '维护期间校园网将短暂中断，请提前做好准备。'
        ],
        attach: null
      }
    ],

    /** 课程（day: 1=周一 … 7=周日；sec: 起始节次） */
    courses: [
      { id: 'c1', name: '高等数学（上）', teacher: '李老师', room: '理科楼 305', day: 1, sec: 1, len: 2, color: 1, credit: 5, intro: '函数、极限与连续，导数与微分，积分学基础。' },
      { id: 'c2', name: '用户体验研究方法', teacher: '王老师', room: '设计楼 201', day: 5, sec: 3, len: 2, color: 4, credit: 3, intro: '定性研究与定量研究方法，用户访谈、可用性测试与数据分析。' },
      { id: 'c3', name: '设计心理学', teacher: '张老师', room: '设计楼 108', day: 5, sec: 5, len: 2, color: 5, credit: 3, intro: '认知与情感设计，用户心理模型与行为驱动设计。' },
      { id: 'c4', name: '大学英语（三）', teacher: '刘老师', room: '外语楼 402', day: 2, sec: 3, len: 2, color: 2, credit: 4, intro: '学术英语读写与跨文化交际。' },
      { id: 'c5', name: '数据结构', teacher: '陈老师', room: '计算机楼 301', day: 3, sec: 1, len: 2, color: 3, credit: 4, intro: '线性表、树与图，排序与查找算法。' },
      { id: 'c6', name: '数字媒体技术导论', teacher: '赵老师', room: '设计楼 305', day: 4, sec: 5, len: 2, color: 1, credit: 3, intro: '数字媒体采集、处理与发布的完整技术链路。' },
      { id: 'c7', name: '体育（篮球）', teacher: '孙老师', room: '东体育场', day: 4, sec: 7, len: 2, color: 2, credit: 1, intro: '篮球基本技术与战术配合，体能训练。' }
    ],

    /** 课时节次表 */
    sections: [
      { s: 1, t: '08:00' }, { s: 2, t: '08:55' }, { s: 3, t: '10:00' }, { s: 4, t: '10:55' },
      { s: 5, t: '14:00' }, { s: 6, t: '14:55' }, { s: 7, t: '16:00' }, { s: 8, t: '16:55' }
    ],

    /** 校园服务详情 */
    services: {
      grade: {
        title: '学业成绩', heroClass: 'h-blue', icon: 'award',
        desc: '2025-2026 学年 · 第 3 周',
        stats: [{ v: '3.82', l: 'GPA' }, { v: '前 15%', l: '专业排名' }, { v: '21', l: '已修学分' }],
        rowsTitle: '本学期课程',
        rows: [
          { k: '用户体验研究方法', v: '92', s: '4.0' },
          { k: '设计心理学', v: '88', s: '3.7' },
          { k: '数据结构', v: '85', s: '3.3' },
          { k: '大学英语（三）', v: '90', s: '4.0' }
        ]
      },
      library: {
        title: '图书馆', heroClass: 'h-purple', icon: 'book',
        desc: '当前借阅 2 本 · 可借 8 本',
        stats: [{ v: '2', l: '在借' }, { v: '1', l: '即将到期' }, { v: '0.00', l: '欠费' }],
        rowsTitle: '在借图书',
        rows: [
          { k: '设计中的设计', v: '7 天后到期', s: '续借', warn: true },
          { k: '用户体验要素', v: '21 天后到期', s: '续借' }
        ]
      },
      payment: {
        title: '校园缴费', heroClass: 'h-orange', icon: 'card',
        desc: '暂无待缴费用',
        stats: [{ v: '¥ 0.00', l: '待缴金额' }, { v: '3', l: '历史账单' }, { v: '¥ 1,280', l: '累计缴纳' }],
        rowsTitle: '历史账单',
        rows: [
          { k: '2026 学年学费', v: '已缴', s: '¥ 5,000' },
          { k: '2026 学年住宿费', v: '已缴', s: '¥ 1,200' },
          { k: '教材费', v: '已缴', s: '¥ 380' }
        ]
      },
      card: {
        title: '校园卡', heroClass: 'h-green', icon: 'card',
        desc: '卡号 6214 **** 3392',
        stats: [{ v: '¥ 86.50', l: '卡余额' }, { v: '¥ 18.00', l: '本月补助' }, { v: '正常', l: '卡状态' }],
        rowsTitle: '近期消费',
        rows: [
          { k: '第三食堂 · 午餐', v: '今天 12:14', s: '-¥ 12.50' },
          { k: '教育超市', v: '今天 09:32', s: '-¥ 8.00' },
          { k: '补助发放', v: '昨天 08:00', s: '+¥ 18.00', add: true },
          { k: '图书馆打印', v: '昨天 15:47', s: '-¥ 2.00' }
        ]
      }
    },

    /** 社团 */
    clubs: [
      { id: 'g1', name: '摄影协会', tag: '文艺', badge: '招新中', members: 236, desc: '用镜头记录校园四季光影', intro: '摄影协会成立于 2008 年，是校内规模最大的文艺类社团。每学期组织 4 次外拍、2 次暗房教学与 1 次年度影展。', color: 'h-blue', joined: false, act: '秋日校园外拍 · 9月12日' },
      { id: 'g2', name: '篮球社', tag: '体育', badge: '热门', members: 512, desc: '每周训练 · 校际联赛常驻', intro: '篮球社常年参加省大学生篮球联赛，每周二、四、六晚固定训练，欢迎各水平同学加入。', color: 'h-orange', joined: true, act: '新生 3v3 挑战赛 · 9月8日' },
      { id: 'g3', name: '吉他社', tag: '音乐', badge: '招新中', members: 189, desc: '弹唱排练 · 迎新音乐会', intro: '零基础可入社，提供免费入门教学与琴房预约。每年 12 月举办迎新音乐会。', color: 'h-purple', joined: false, act: '迎新音乐会筹备 · 每周三' },
      { id: 'g4', name: '机器人协会', tag: '科技', badge: '竞赛', members: 97, desc: '算法竞赛 · 智能车战队', intro: '下设算法组、机械组与电控组，常年参加全国大学生智能汽车竞赛与 RoboMaster 机甲大师赛。', color: 'h-green', joined: false, act: '智能车冬令营选拔 · 9月20日' },
      { id: 'g5', name: '辩论社', tag: '人文', badge: '招新中', members: 143, desc: '思辨训练 · 校辩论赛', intro: '每周一次的辩论工作坊与模拟赛，承办校内"思辨杯"辩论赛。', color: 'h-blue', joined: false, act: '思辨杯初赛 · 9月15日' },
      { id: 'g6', name: '志愿者协会', tag: '公益', badge: '', members: 728, desc: '支教 · 社区服务 · 赛事志愿', intro: '校级五星社团，负责校内大型赛事志愿服务与周边社区支教项目，志愿时长可计入实践学分。', color: 'h-orange', joined: true, act: '周末社区支教 · 长期招募' }
    ],

    /** 校内地点（搜索 / 地图共用） */
    locations: [
      { id: 'l1', name: '第三教学楼', cat: '教学楼', desc: '公共课主要授课楼，共 5 层', dist: '180m' },
      { id: 'l2', name: '学生食堂', cat: '食堂', desc: '三层，含清真窗口与风味小吃', dist: '350m' },
      { id: 'l3', name: '图书馆', cat: '图书馆', desc: '馆藏 210 万册，自习区 24h', dist: '420m' },
      { id: 'l4', name: '行政楼', cat: '教学楼', desc: '教务处、学生处办公地点', dist: '540m' },
      { id: 'l5', name: '校医院', cat: '商铺', desc: '门诊 8:00-17:00，急诊 24h', dist: '620m' },
      { id: 'l6', name: '东体育场', cat: '运动场', desc: '标准塑胶跑道 + 篮球场 6 片', dist: '700m' },
      { id: 'l7', name: '设计楼', cat: '教学楼', desc: '设计学院专业教室与机房', dist: '260m' },
      { id: 'l8', name: '理科楼', cat: '教学楼', desc: '数学与物理实验中心', dist: '410m' }
    ],

    /** 消息中心 */
    messages: [
      { id: 'm1', type: 'notice', name: '教务处', text: '2026秋季选课系统将于 9 月 8 日 10:00 开放，请提前完成培养方案核对。', ts: now - 2 * H, unread: true },
      { id: 'm2', type: 'notice', name: '图书馆', text: '你借阅的《设计中的设计》将在 7 天后到期，记得及时归还或续借。', ts: now - 5 * H, unread: true },
      { id: 'm3', type: 'notice', name: '校团委', text: '校园歌手大赛报名已开启，截止 8 月 15 日。', ts: now - 3 * D, unread: true },
      { id: 'm4', type: 'comment', name: '小美', text: '回复了你的帖子「二手出9成新iPad + 笔」：还在吗？能当面验货吗？', ts: now - 40 * 60000, unread: true },
      { id: 'm5', type: 'comment', name: '阿阳', text: '评论了你的帖子：这个我也想要，求带', ts: now - 6 * H, unread: false },
      { id: 'm6', type: 'like', name: '小蓝', text: '赞了你的帖子「图书馆二楼新到一批设计类书籍」', ts: now - 1 * D, unread: false },
      { id: 'm7', type: 'like', name: '小黄', text: '收藏了你的帖子', ts: now - 2 * D, unread: false },
      { id: 'm8', type: 'chat', name: '小莫', text: '明天下午三点篮球场，记得带球！', ts: now - 25 * 60000, unread: true },
      { id: 'm9', type: 'chat', name: '摄影协会', text: '本周六外拍活动报名已开始，请在群内接龙。', ts: now - 2 * D, unread: false }
    ],

    /** 热搜词 */
    hotWords: ['期末复习', '校园歌手大赛', '二手 iPad', '选课系统', '图书馆开放时间', '篮球 3v3', '考研资料', '失物招领'],

    /** 活动详情（首页轮播跳转） */
    activity: {
      id: 'a1', title: '第十六届校园歌手大赛', source: '校团委',
      deadline: '报名截止 8 月 15 日', ts: now - 3 * D,
      desc: '校内规模最大的文艺赛事，设初赛、复赛与总决赛三轮，总冠军将获得 5000 元奖金与校内演出推荐资格。',
      detail: [
        '参赛对象：全体在校本科生、研究生',
        '赛程安排：初赛 9 月 20 日 / 复赛 10 月 12 日 / 决赛 11 月 2 日',
        '比赛地点：大学生活动中心（初赛）、学校大礼堂（决赛）',
        '报名方式：本页点击「立即报名」，填写曲目与伴奏信息'
      ]
    },

    /** 消息分组定义 */
    msgTabs: [
      { k: 'all', label: '全部' },
      { k: 'notice', label: '通知' },
      { k: 'comment', label: '评论' },
      { k: 'like', label: '赞和收藏' },
      { k: 'chat', label: '私信' }
    ]
  };

  /* ======================================================================
   * 3. 通用模板
   * ==================================================================== */

  /** 可跳转列表行 */
  function row(o) {
    var attrs = o.go ? ' data-go="' + o.go + '"' + (o.param ? ' data-param=\'' + JSON.stringify(o.param) + '\'' : '') : '';
    return '<div class="lst-item' + (o.go || o.onClick ? '' : ' static') + '"' + attrs +
      (o.onClick ? ' data-act="' + o.onClick + '"' : '') + '>' +
      (o.icon ? '<span class="lst-ico ' + (o.iconClass || 'c-blue') + '">' + ic(o.icon, 17) + '</span>' : '') +
      '<div class="lst-main"><div class="lst-label">' + util.esc(o.label) + '</div>' +
      (o.sub ? '<div class="lst-sub">' + util.esc(o.sub) + '</div>' : '') + '</div>' +
      (o.value ? '<span class="lst-value">' + util.esc(o.value) + '</span>' : '') +
      (o.switch ? '<button type="button" class="sw' + (o.on ? ' on' : '') + '" role="switch" aria-checked="' +
        (o.on ? 'true' : 'false') + '" data-sw="' + o.switch + '" data-label="' + util.esc(o.label) + '"' +
        (o.disabled ? ' disabled' : '') + '><i></i></button>' : '') +
      (o.arrow ? '<span class="lst-arrow"></span>' : '') +
      '</div>';
  }

  /** 区块容器 */
  function block(title, inner, cls) {
    return '<div class="blk' + (cls ? ' ' + cls : '') + '">' +
      (title ? '<div class="blk-title">' + util.esc(title) + '</div>' : '') +
      '<div class="blk-card">' + inner + '</div></div>';
  }

  App.tpl = { row: row, block: block };

  /* ======================================================================
   * 4. 数据访问器
   * ==================================================================== */
  var DataSvc = App.DataSvc = {
    /** 已读公告 id 列表 */
    readNotices: function () { return Store.list('notices-read'); },
    markNoticeRead: function (id) {
      var list = DataSvc.readNotices();
      if (list.indexOf(id) === -1) { list.push(id); Store.set('notices-read', list); }
      App.syncHomeBadges();
    },
    unreadNoticeCount: function () {
      var read = DataSvc.readNotices();
      return Data.notices.filter(function (n) { return n.unread && read.indexOf(n.id) === -1; }).length;
    },
    /** 已读消息 id 列表 */
    readMessages: function () { return Store.list('messages-read'); },
    markMessageRead: function (id) {
      var list = DataSvc.readMessages();
      if (list.indexOf(id) === -1) { list.push(id); Store.set('messages-read', list); }
      App.syncHomeBadges();
    },
    unreadMessageCount: function () {
      var read = DataSvc.readMessages();
      return Data.messages.filter(function (m) { return m.unread && read.indexOf(m.id) === -1; }).length;
    },
    markAllMessagesRead: function () {
      Store.set('messages-read', Data.messages.map(function (m) { return m.id; }));
      App.syncHomeBadges();
    },
    /** 社区帖子索引（以「全部」页为唯一数据源） */
    postIndex: function () {
      var scope = document.querySelector('.community-page[data-tag="all"]');
      if (!scope) return [];
      return Array.prototype.map.call(scope.querySelectorAll('.feed-card'), function (card) {
        var t = card.querySelector('.feed-title'), a = card.querySelector('.feed-author'), c = card.querySelector('.feed-content');
        return {
          id: card.dataset.id || (t ? t.textContent : ''),
          title: t ? t.textContent.trim() : '',
          author: a ? a.textContent.trim() : '',
          content: c ? c.textContent.trim() : '',
          tag: card.dataset.tag || '',
          ts: parseInt(card.dataset.ts || '0', 10),
          el: card
        };
      });
    },
    tagLabel: function (k) {
      return { study: '学习', campus: '校园', sport: '运动', trade: '二手', activity: '活动', latest: '最新', all: '热门' }[k] || '校园';
    }
  };

  /* ======================================================================
   * 5. 屏幕：全局搜索
   * ==================================================================== */
  var SCOPE_TABS = [
    { k: 'all', label: '全部' }, { k: 'post', label: '帖子' }, { k: 'notice', label: '公告' },
    { k: 'course', label: '课程' }, { k: 'location', label: '地点' }, { k: 'club', label: '社团' }
  ];

  function searchData(kw) {
    var k = kw.toLowerCase();
    var hit = function (s) { return String(s || '').toLowerCase().indexOf(k) >= 0; };
    return {
      post: DataSvc.postIndex().filter(function (p) { return hit(p.title) || hit(p.content) || hit(p.author); }),
      notice: Data.notices.filter(function (n) { return hit(n.title) || hit(n.source) || hit(n.content.join('')); }),
      course: Data.courses.filter(function (c) { return hit(c.name) || hit(c.teacher) || hit(c.room); }),
      location: Data.locations.filter(function (l) { return hit(l.name) || hit(l.cat) || hit(l.desc); }),
      club: Data.clubs.filter(function (g) { return hit(g.name) || hit(g.tag) || hit(g.desc); })
    };
  }

  var searchState = { kw: '', tab: 'all' };

  function renderSearchResults() {
    var kw = searchState.kw, tab = searchState.tab;
    if (!kw) {
      // 未输入：展示历史与热搜
      var hist = Store.getSearchHistory();
      var histHTML = hist.length
        ? '<div class="chips">' + hist.map(function (w) {
            return '<span class="chip" data-kw="' + util.esc(w) + '">' + util.esc(w) + '</span>';
          }).join('') + '</div>'
        : '<div class="chips"><span class="chip" style="opacity:.6">暂无搜索历史</span></div>';
      var hotHTML = '<div class="chips">' + Data.hotWords.map(function (w) {
          return '<span class="chip hot" data-kw="' + util.esc(w) + '">' + util.esc(w) + '</span>';
        }).join('') + '</div>';
      return '<div class="srch-block"><div class="srch-block-head"><span>搜索历史</span>' +
        (hist.length ? '<button data-clear-hist="1">' + ic('trash', 13) + '清空</button>' : '') +
        '</div>' + histHTML + '</div>' +
        '<div class="srch-block"><div class="srch-block-head"><span>热门搜索</span></div>' + hotHTML + '</div>';
    }

    var res = searchData(kw);
    var total = res.post.length + res.notice.length + res.course.length + res.location.length + res.club.length;
    if (!total) {
      return UI.emptyHTML({
        title: '没有找到「' + kw + '」相关内容',
        desc: '换个关键词试试，或去社区发布一条提问',
        action: 'screen-community', actionText: '去社区发帖'
      });
    }

    var tabs = '<div class="srch-tabs">' + SCOPE_TABS.map(function (t) {
      var n = t.k === 'all' ? total : res[t.k].length;
      return '<button type="button" class="srch-tab' + (tab === t.k ? ' active' : '') + '" data-tab="' + t.k + '">' +
        util.esc(t.label) + (n ? ' ' + n : '') + '</button>';
    }).join('') + '</div>';

    var list = '';
    var show = function (k) { return tab === 'all' || tab === k; };

    if (show('post') && res.post.length) {
      list += block('帖子 · ' + res.post.length, res.post.map(function (p) {
        return '<div class="lst-item" data-post-id="' + util.esc(p.id) + '"><div class="lst-main">' +
          '<div class="srch-res-item">' +
          '<div class="srch-res-title">' + util.highlight(p.title || p.content.slice(0, 24), kw) + '</div>' +
          (p.content ? '<div class="srch-res-desc">' + util.highlight(p.content, kw) + '</div>' : '') +
          '<div class="srch-res-meta">' + util.esc(p.author) + ' · ' + DataSvc.tagLabel(p.tag) + '</div>' +
          '</div></div><span class="lst-arrow"></span></div>';
      }).join(''));
    }
    if (show('notice') && res.notice.length) {
      list += block('公告 · ' + res.notice.length, res.notice.map(function (n) {
        return '<div class="lst-item" data-go="screen-notice" data-param=\'{"id":"' + n.id + '"}\'>' +
          '<span class="lst-ico c-orange">' + ic('bell', 17) + '</span><div class="lst-main">' +
          '<div class="srch-res-item"><div class="srch-res-title">' + util.highlight(n.title, kw) + '</div>' +
          '<div class="srch-res-meta">' + util.esc(n.source) + ' · ' + util.fmtTime(n.ts) + '</div></div></div>' +
          '<span class="lst-arrow"></span></div>';
      }).join(''));
    }
    if (show('course') && res.course.length) {
      list += block('课程 · ' + res.course.length, res.course.map(function (c) {
        return '<div class="lst-item" data-go="screen-course" data-param=\'{"id":"' + c.id + '"}\'>' +
          '<span class="lst-ico c-purple">' + ic('book', 17) + '</span><div class="lst-main">' +
          '<div class="srch-res-item"><div class="srch-res-title">' + util.highlight(c.name, kw) + '</div>' +
          '<div class="srch-res-meta">' + util.esc(c.teacher) + ' · ' + util.esc(c.room) + '</div></div></div>' +
          '<span class="lst-arrow"></span></div>';
      }).join(''));
    }
    if (show('location') && res.location.length) {
      list += block('地点 · ' + res.location.length, res.location.map(function (l) {
        return '<div class="lst-item" data-loc-id="' + l.id + '">' +
          '<span class="lst-ico c-teal">' + ic('pin', 17) + '</span><div class="lst-main">' +
          '<div class="srch-res-item"><div class="srch-res-title">' + util.highlight(l.name, kw) + '</div>' +
          '<div class="srch-res-desc">' + util.esc(l.desc) + '</div>' +
          '<div class="srch-res-meta">' + util.esc(l.cat) + ' · 距你 ' + util.esc(l.dist) + '</div></div></div>' +
          '<span class="lst-value">查看</span></div>';
      }).join(''));
    }
    if (show('club') && res.club.length) {
      list += block('社团 · ' + res.club.length, res.club.map(function (g) {
        return '<div class="lst-item" data-go="screen-club" data-param=\'{"id":"' + g.id + '"}\'>' +
          '<span class="lst-ico c-green">' + ic('users', 17) + '</span><div class="lst-main">' +
          '<div class="srch-res-item"><div class="srch-res-title">' + util.highlight(g.name, kw) + '</div>' +
          '<div class="srch-res-meta">' + util.esc(g.tag) + ' · ' + g.members + ' 人</div></div></div>' +
          '<span class="lst-arrow"></span></div>';
      }).join(''));
    }
    return tabs + list;
  }

  /* ======================================================================
   * 6. 屏幕：消息中心
   * ==================================================================== */
  var msgTab = 'all';

  function renderMessages() {
    var read = DataSvc.readMessages();
    var list = Data.messages.filter(function (m) { return msgTab === 'all' || m.type === msgTab; });
    var unread = DataSvc.unreadMessageCount();

    var tabs = '<div class="msg-tabs">' + Data.msgTabs.map(function (t) {
      var n = t.k === 'all' ? unread : Data.messages.filter(function (m) {
        return m.type === t.k && m.unread && read.indexOf(m.id) === -1;
      }).length;
      return '<button type="button" class="msg-tab' + (msgTab === t.k ? ' active' : '') + '" data-mtab="' + t.k + '">' +
        util.esc(t.label) + (n ? '<span class="dot">' + n + '</span>' : '') + '</button>';
    }).join('') + '</div>';

    if (!list.length) {
      return tabs + UI.emptyHTML({ title: '暂无消息', desc: '有新的互动会第一时间通知你' });
    }

    var avaClass = { notice: 'm-blue', comment: 'm-green', like: 'm-pink', chat: 'm-purple' };
    var body = list.map(function (m) {
      var isRead = read.indexOf(m.id) >= 0;
      return '<div class="lst-item msg-item' + (isRead ? ' read' : '') + '" data-msg-id="' + m.id + '">' +
        (isRead ? '' : '<span class="msg-unread"></span>') +
        '<div class="msg-ava ' + (avaClass[m.type] || 'm-blue') + '">' + util.esc(m.name.charAt(0)) + '</div>' +
        '<div class="lst-main"><div class="msg-name">' + util.esc(m.name) + '</div>' +
        '<div class="msg-text">' + util.esc(m.text) + '</div>' +
        '<div class="msg-time">' + util.fmtTime(m.ts) + '</div></div></div>';
    }).join('');

    return tabs +
      (unread ? '<div class="blk" style="margin-bottom:0"><div class="blk-card">' +
        '<div class="lst-item" data-mark-all="1"><span class="lst-ico c-gray">' + ic('check', 17) + '</span>' +
        '<div class="lst-main"><div class="lst-label">全部标记为已读</div></div></div></div></div>' +
        '<div style="height:14px"></div>' : '<div style="height:10px"></div>') +
      '<div class="blk-card">' + body + '</div>';
  }

  /* ======================================================================
   * 7. 注册全部首页相关屏幕
   * ==================================================================== */
  Router.registerAll({

    /* ------------------------- 全局搜索 ------------------------- */
    'screen-search': {
      title: '搜索',
      render: function (params) {
        searchState.kw = '';
        searchState.tab = params.tab || 'all';
        return '<div class="srch-bar">' +
          '<div class="srch-input-wrap">' + ic('search', 17) +
          '<input class="srch-input" id="srchInput" type="search" placeholder="搜索课程、地点、公告、帖子、社团" autocomplete="off" />' +
          '<button type="button" class="srch-clear" id="srchClear">×</button></div>' +
          '</div><div id="srchResult">' + renderSearchResults() + '</div>';
      },
      mount: function (root, params) {
        var input = root.querySelector('#srchInput');
        var clear = root.querySelector('#srchClear');
        var box = root.querySelector('#srchResult');

        setTimeout(function () { input && input.focus(); }, 80);

        function refresh() {
          box.innerHTML = renderSearchResults();
          clear.classList.toggle('show', !!searchState.kw);
        }

        input.addEventListener('input', function () {
          searchState.kw = input.value.trim();
          refresh();
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && input.value.trim()) {
            input.blur();
            Store.pushSearchHistory(input.value.trim());
          }
        });
        clear.addEventListener('click', function () {
          input.value = ''; searchState.kw = ''; refresh(); input.focus();
        });

        box.addEventListener('click', function (e) {
          // 历史 / 热搜词
          var chip = e.target.closest('[data-kw]');
          if (chip) {
            input.value = chip.dataset.kw;
            searchState.kw = chip.dataset.kw;
            Store.pushSearchHistory(chip.dataset.kw);
            refresh();
            return;
          }
          if (e.target.closest('[data-clear-hist]')) {
            Store.set('search-history', []);
            UI.toast('已清空搜索历史');
            refresh();
            return;
          }
          // 结果分类 Tab
          var tab = e.target.closest('[data-tab]');
          if (tab) { searchState.tab = tab.dataset.tab; refresh(); return; }

          // 帖子 → 打开详情
          var post = e.target.closest('[data-post-id]');
          if (post) {
            var target = DataSvc.postIndex().filter(function (p) { return p.id === post.dataset.postId; })[0];
            if (target && typeof global.openPost === 'function') {
              Store.pushHistory({ id: target.id, type: 'post', title: target.title });
              global.openPost(target.el);
            } else {
              UI.toast('内容暂不可查看');
            }
            return;
          }
          // 地点 → 跳地图
          var loc = e.target.closest('[data-loc-id]');
          if (loc) {
            var l = Data.locations.filter(function (x) { return x.id === loc.dataset.locId; })[0];
            Router.goTab('screen-map');
            if (l) UI.toast('已在地图定位：' + l.name);
          }
        });
      }
    },

    /* ------------------------- 消息中心 ------------------------- */
    'screen-msg': {
      title: '消息中心',
      render: function () { return renderMessages(); },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var tab = e.target.closest('[data-mtab]');
          if (tab) { msgTab = tab.dataset.mtab; Router.reload(); return; }

          if (e.target.closest('[data-mark-all]')) {
            DataSvc.markAllMessagesRead();
            UI.toast('已全部标记为已读');
            Router.reload();
            App.syncHomeBadges();
            return;
          }
          var item = e.target.closest('[data-msg-id]');
          if (!item) return;
          var id = item.dataset.msgId;
          var msg = Data.messages.filter(function (m) { return m.id === id; })[0];
          DataSvc.markMessageRead(id);
          Router.reload();
          App.syncHomeBadges();
          if (msg && msg.type === 'notice') {
            UI.toast('已读：' + msg.name);
          } else if (msg) {
            UI.sheet({
              title: msg.name,
              items: [
                { value: 'reply', label: '回复消息', icon: ic('chat', 20) },
                { value: 'copy', label: '复制内容', icon: ic('copy', 20) },
                { value: 'del', label: '删除该消息', icon: ic('trash', 20), danger: true }
              ]
            }).then(function (v) {
              if (v === 'copy') {
                copyText(msg.text).then(function () { UI.toast('复制成功'); });
              } else if (v === 'reply') {
                Router.goTab('screen-community');
                UI.toast('已跳转到社区，可在帖子下回复');
              } else if (v === 'del') {
                UI.toast('已删除该消息（演示）');
              }
            });
          }
        });
      }
    },

    /* ------------------------- 公告列表 ------------------------- */
    'screen-notices': {
      title: '校园公告',
      render: function () {
        var read = DataSvc.readNotices();
        if (!Data.notices.length) return UI.emptyHTML({ title: '暂无公告' });
        return '<div class="blk-card">' + Data.notices.map(function (n) {
          var isRead = read.indexOf(n.id) >= 0;
          return '<div class="lst-item" data-go="screen-notice" data-param=\'{"id":"' + n.id + '"}\'>' +
            '<span class="lst-ico ' + (isRead ? 'c-gray' : 'c-orange') + '">' + ic('bell', 17) + '</span>' +
            '<div class="lst-main"><div class="lst-label">' + util.esc(n.title) +
            (isRead ? '' : ' <span class="dt-badge">新</span>') + '</div>' +
            '<div class="lst-sub">' + util.esc(n.source) + ' · ' + util.fmtTime(n.ts) + '</div></div>' +
            '<span class="lst-arrow"></span></div>';
        }).join('') + '</div>';
      }
    },

    /* ------------------------- 公告详情 ------------------------- */
    'screen-notice': {
      title: '公告详情',
      render: function (params) {
        var n = Data.notices.filter(function (x) { return x.id === params.id; })[0];
        if (!n) return UI.emptyHTML({ title: '公告不存在或已撤回' });
        return '<div class="dt-card">' +
          '<div class="dt-title">' + util.esc(n.title) + '</div>' +
          '<div class="dt-meta"><span class="dt-badge">' + util.esc(n.tag) + '</span>' +
          '<span>' + util.esc(n.source) + '</span><span>' + util.fmtTime(n.ts) + '</span></div>' +
          '<div class="dt-content">' + n.content.map(function (p) { return '<p>' + util.esc(p) + '</p>'; }).join('') + '</div>' +
          (n.attach ? '<div class="dt-attach" data-attach="1">' + ic('file', 20) +
            '<span class="dt-attach-name">' + util.esc(n.attach.name) + '</span>' +
            '<span class="dt-attach-size">' + util.esc(n.attach.size) + '</span></div>' : '') +
          '</div>' +
          '<div class="blk" style="margin-top:16px"><div class="blk-card">' +
          row({ icon: 'share', iconClass: 'c-blue', label: '分享给同学', onClick: 'share', arrow: true }) +
          row({ icon: 'star', iconClass: 'c-orange', label: '收藏该公告', onClick: 'fav' }) +
          '</div></div>';
      },
      mount: function (root, params) {
        DataSvc.markNoticeRead(params.id);
        App.syncHomeBadges();
        root.querySelector('.app-body').addEventListener('click', function (e) {
          if (e.target.closest('[data-attach]')) { UI.toast('附件下载功能演示中'); return; }
          var act = e.target.closest('[data-act]');
          if (!act) return;
          var n = Data.notices.filter(function (x) { return x.id === params.id; })[0];
          if (act.dataset.act === 'share') {
            App.shareSheet({ title: n.title, text: n.content[0] });
          } else if (act.dataset.act === 'fav') {
            UI.toast('已收藏该公告');
          }
        });
      }
    },

    /* ------------------------- 活动详情 ------------------------- */
    'screen-activity': {
      title: '活动详情',
      render: function () {
        var a = Data.activity;
        return '<div class="hero h-purple"><h3>' + util.esc(a.title) + '</h3>' +
          '<p>' + util.esc(a.desc) + '</p>' +
          '<div class="hero-tags"><span class="hero-tag">' + util.esc(a.deadline) + '</span>' +
          '<span class="hero-tag">' + util.esc(a.source) + '</span></div></div>' +
          '<div class="dt-card" style="margin-top:14px">' +
          '<div class="blk-title" style="padding-left:0">活动细则</div>' +
          '<div class="dt-content">' + a.detail.map(function (p) { return '<p>' + util.esc(p) + '</p>'; }).join('') + '</div>' +
          '</div>' +
          '<div class="pv-foot"><button type="button" class="pv-btn primary" data-signup="1">立即报名</button></div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          if (!e.target.closest('[data-signup]')) return;
          UI.sheet({
            title: '报名信息确认',
            items: [
              { value: 'solo', label: '个人参赛', desc: '以个人身份报名', icon: ic('user', 20) },
              { value: 'team', label: '组合参赛', desc: '2 人及以上组合', icon: ic('users', 20) }
            ]
          }).then(function (v) {
            if (!v) return;
            UI.prompt({
              title: v === 'solo' ? '参赛曲目' : '组合名称',
              placeholder: v === 'solo' ? '请输入你的参赛曲目' : '请输入组合名称',
              maxlength: 30,
              validate: function (val) { return val ? '' : '内容不能为空'; }
            }).then(function (val) {
              if (val === null || val === undefined) return;
              UI.toast('报名成功：' + val, { type: 'success' });
              Store.set('activity-signed', { type: v, name: val, ts: Date.now() });
            });
          });
        });
      }
    },

    /* ------------------------- 周课表 ------------------------- */
    'screen-schedule': {
      title: '我的课表',
      render: function (params) {
        var week = params.week || 3;
        var dayNames = ['一', '二', '三', '四', '五', '六', '日'];
        var todayIdx = (function () { var d = new Date().getDay(); return d === 0 ? 7 : d; })();

        var head = '<div class="wk-hd"></div>' + dayNames.map(function (d, i) {
          return '<div class="wk-hd' + (i + 1 === todayIdx ? ' today' : '') + '">' + d +
            '<small>' + (i + 1) + '</small></div>';
        }).join('');

        var grid = '';
        Data.sections.forEach(function (sec) {
          grid += '<div class="wk-num">' + sec.s + '</div>';
          for (var d = 1; d <= 7; d++) {
            var course = null;
            for (var i = 0; i < Data.courses.length; i++) {
              var c = Data.courses[i];
              if (c.day === d && sec.s >= c.sec && sec.s < c.sec + c.len) { course = c; break; }
            }
            // 只在起始节次渲染课程块，避免重复
            if (course && sec.s === course.sec) {
              grid += '<div class="wk-slot"><button type="button" class="wk-cls k' + course.color +
                '" data-go="screen-course" data-param=\'{"id":"' + course.id + '"}\'>' +
                '<b>' + util.esc(course.name) + '</b><span>' + util.esc(course.room) + '</span></button></div>';
            } else if (course) {
              grid += '<div class="wk-slot" style="padding:0"></div>';
            } else {
              grid += '<div class="wk-slot"></div>';
            }
          }
        });

        return '<div class="wk-switch"><div class="wk-switch-t">第 ' + week + ' 周</div>' +
          '<div class="wk-switch-btns">' +
          '<button type="button" class="wk-nav" data-week="-1" aria-label="上一周">' + ic('chev', 15) + '</button>' +
          '<button type="button" class="wk-nav" data-week="0" aria-label="本周">今</button>' +
          '<button type="button" class="wk-nav" data-week="1" style="transform:rotate(180deg)" aria-label="下一周">' + ic('chev', 15) + '</button>' +
          '</div></div>' +
          '<div class="wk-grid">' + head + grid + '</div>' +
          '<div class="blk" style="margin-top:16px"><div class="blk-title">本周课程</div><div class="blk-card">' +
          Data.courses.map(function (c) {
            return '<div class="lst-item" data-go="screen-course" data-param=\'{"id":"' + c.id + '"}\'>' +
              '<span class="lst-ico c-purple">' + ic('book', 17) + '</span>' +
              '<div class="lst-main"><div class="lst-label">' + util.esc(c.name) + '</div>' +
              '<div class="lst-sub">周' + dayNames[c.day - 1] + ' 第' + c.sec + '-' + (c.sec + c.len - 1) + '节 · ' +
              util.esc(c.room) + '</div></div><span class="lst-arrow"></span></div>';
          }).join('') + '</div></div>';
      },
      mount: function (root, params) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var w = e.target.closest('[data-week]');
          if (!w) return;
          var delta = parseInt(w.dataset.week, 10);
          var cur = (params.week || 3);
          var next = delta === 0 ? 3 : Math.max(1, Math.min(20, cur + delta));
          Router.replace('screen-schedule', { week: next });
          UI.toast(delta === 0 ? '已回到本周' : '第 ' + next + ' 周');
        });
      }
    },

    /* ------------------------- 课程详情 ------------------------- */
    'screen-course': {
      title: '课程详情',
      render: function (params) {
        var c = Data.courses.filter(function (x) { return x.id === params.id; })[0];
        if (!c) return UI.emptyHTML({ title: '课程不存在' });
        var dayNames = ['一', '二', '三', '四', '五', '六', '日'];
        var sec = Data.sections.filter(function (s) { return s.s === c.sec; })[0];
        return '<div class="dt-card">' +
          '<div class="dt-title">' + util.esc(c.name) + '</div>' +
          '<div class="dt-meta"><span class="dt-badge">' + c.credit + ' 学分</span>' +
          '<span>周' + dayNames[c.day - 1] + ' 第 ' + c.sec + '-' + (c.sec + c.len - 1) + ' 节</span></div>' +
          '<div class="dt-content"><p>' + util.esc(c.intro) + '</p></div></div>' +
          '<div class="blk" style="margin-top:16px"><div class="blk-title">课程信息</div><div class="blk-card">' +
          row({ icon: 'user', iconClass: 'c-blue', label: '授课教师', value: c.teacher }) +
          row({ icon: 'clock', iconClass: 'c-green', label: '上课时间', value: (sec ? sec.t : '') + ' 起' }) +
          row({ icon: 'pin', iconClass: 'c-orange', label: '上课地点', value: c.room, onClick: 'map', arrow: true }) +
          row({ icon: 'cal', iconClass: 'c-purple', label: '考核方式', value: '考试 + 平时作业' }) +
          '</div></div>' +
          '<div class="pv-foot"><button type="button" class="pv-btn primary" data-nav="1">导航到教室</button></div>';
      },
      mount: function (root, params) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          if (e.target.closest('[data-nav]')) {
            Router.goTab('screen-map');
            UI.toast('已切换到地图，正在为你规划路线');
            return;
          }
          if (e.target.closest('[data-act="map"]')) {
            Router.goTab('screen-map');
          }
        });
      }
    },

    /* ------------------------- 校园服务详情 ------------------------- */
    'screen-service': {
      title: '校园服务',
      render: function (params) {
        var s = Data.services[params.key];
        if (!s) return UI.emptyHTML({ title: '服务暂未开放' });
        var stats = '<div class="stat-row">' + s.stats.map(function (x) {
          return '<div class="stat-box"><div class="stat-val">' + util.esc(x.v) + '</div>' +
            '<div class="stat-lab">' + util.esc(x.l) + '</div></div>';
        }).join('') + '</div>';

        var rows = '<div class="blk" style="margin-top:16px"><div class="blk-title">' + util.esc(s.rowsTitle) +
          '</div><div class="blk-card">' + s.rows.map(function (r) {
            var val = r.add ? '<span class="lst-value" style="color:var(--accent-green)">' + util.esc(r.s) + '</span>'
              : (r.s ? '<span class="lst-value">' + util.esc(r.s) + '</span>' : '');
            return '<div class="lst-item' + (r.warn ? '' : ' static') + '"' + (r.warn ? ' data-renew="1"' : '') + '>' +
              '<div class="lst-main"><div class="lst-label">' + util.esc(r.k) + '</div>' +
              '<div class="lst-sub"' + (r.warn ? ' style="color:#DC2626"' : '') + '>' + util.esc(r.v) + '</div></div>' +
              val + (r.warn ? '<span class="lst-value" style="color:var(--primary)">续借</span>' : '') + '</div>';
          }).join('') + '</div></div>';

        return '<div class="hero ' + s.heroClass + '"><h3>' + util.esc(s.title) + '</h3>' +
          '<p>' + util.esc(s.desc) + '</p></div>' + stats + rows;
      },
      mount: function (root, params) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          if (e.target.closest('[data-renew]')) {
            UI.confirm({ title: '续借图书', msg: '《设计中的设计》将延长借期 30 天，确认续借？', okText: '确认续借' })
              .then(function (ok) { if (ok) UI.toast('续借成功，新到期日已更新', { type: 'success' }); });
          }
        });
      }
    },

    /* ------------------------- 全部社团 ------------------------- */
    'screen-clubs': {
      title: '全部社团',
      render: function () {
        var joined = Store.getFollows();
        var cats = [{ k: 'all', l: '全部' }, { k: '文艺', l: '文艺' }, { k: '体育', l: '体育' },
                    { k: '音乐', l: '音乐' }, { k: '科技', l: '科技' }, { k: '人文', l: '人文' }, { k: '公益', l: '公益' }];
        var tabs = '<div class="srch-tabs">' + cats.map(function (c, i) {
          return '<button type="button" class="srch-tab' + (i === 0 ? ' active' : '') + '" data-cat="' + c.k + '">' + c.l + '</button>';
        }).join('') + '</div>';

        function card(g) {
          var isIn = joined.indexOf(g.name) >= 0 || g.joined;
          return '<div class="lst-item" data-go="screen-club" data-param=\'{"id":"' + g.id + '"}\'>' +
            '<span class="lst-ico ' + (g.color === 'h-blue' ? 'c-blue' : g.color === 'h-green' ? 'c-green' :
              g.color === 'h-orange' ? 'c-orange' : 'c-purple') + '">' + ic('users', 17) + '</span>' +
            '<div class="lst-main"><div class="lst-label">' + util.esc(g.name) +
            (g.badge ? ' <span class="dt-badge">' + util.esc(g.badge) + '</span>' : '') + '</div>' +
            '<div class="lst-sub">' + util.esc(g.tag) + ' · ' + g.members + ' 人 · ' + util.esc(g.desc) + '</div></div>' +
            '<span class="lst-value" style="color:var(--primary)">' + (isIn ? '已加入' : '查看') + '</span></div>';
        }
        return tabs + '<div class="blk-card" id="clubList">' + Data.clubs.map(card).join('') + '</div>';
      },
      mount: function (root) {
        root.querySelector('.app-body').addEventListener('click', function (e) {
          var c = e.target.closest('[data-cat]');
          if (!c) return;
          root.querySelectorAll('[data-cat]').forEach(function (b) { b.classList.remove('active'); });
          c.classList.add('active');
          var cat = c.dataset.cat;
          var list = cat === 'all' ? Data.clubs : Data.clubs.filter(function (g) { return g.tag === cat; });
          var joined = Store.getFollows();
          var box = root.querySelector('#clubList');
          if (!list.length) {
            box.innerHTML = UI.emptyHTML({ title: '该分类下暂无社团', desc: '换个分类看看吧' });
            return;
          }
          box.innerHTML = list.map(function (g) {
            var isIn = joined.indexOf(g.name) >= 0 || g.joined;
            return '<div class="lst-item" data-go="screen-club" data-param=\'{"id":"' + g.id + '"}\'>' +
              '<div class="lst-main"><div class="lst-label">' + util.esc(g.name) +
              (g.badge ? ' <span class="dt-badge">' + util.esc(g.badge) + '</span>' : '') + '</div>' +
              '<div class="lst-sub">' + util.esc(g.tag) + ' · ' + g.members + ' 人</div></div>' +
              '<span class="lst-value" style="color:var(--primary)">' + (isIn ? '已加入' : '查看') + '</span>' +
              '<span class="lst-arrow"></span></div>';
          }).join('');
        });
      }
    },

    /* ------------------------- 社团详情 ------------------------- */
    'screen-club': {
      title: '社团详情',
      render: function (params) {
        var g = Data.clubs.filter(function (x) { return x.id === params.id; })[0];
        if (!g) return UI.emptyHTML({ title: '社团不存在' });
        var joined = Store.getFollows().indexOf(g.name) >= 0 || g.joined;
        return '<div class="hero ' + g.color + '"><h3>' + util.esc(g.name) + '</h3>' +
          '<p>' + util.esc(g.intro) + '</p>' +
          '<div class="hero-tags"><span class="hero-tag">' + util.esc(g.tag) + '</span>' +
          '<span class="hero-tag">' + g.members + ' 位成员</span>' +
          (g.badge ? '<span class="hero-tag">' + util.esc(g.badge) + '</span>' : '') + '</div></div>' +
          '<div class="blk" style="margin-top:16px"><div class="blk-title">近期活动</div><div class="blk-card">' +
          row({ icon: 'cal', iconClass: 'c-orange', label: g.act, sub: '点击查看详情', onClick: 'act', arrow: true }) +
          '</div></div>' +
          '<div class="blk"><div class="blk-title">社团信息</div><div class="blk-card">' +
          row({ icon: 'users', iconClass: 'c-blue', label: '成员规模', value: g.members + ' 人' }) +
          row({ icon: 'star', iconClass: 'c-purple', label: '社团分类', value: g.tag }) +
          row({ icon: 'clock', iconClass: 'c-green', label: '活动频率', value: '每周 1-2 次' }) +
          '</div></div>' +
          '<div class="pv-foot">' +
          '<button type="button" class="pv-btn ghost" data-share="1">分享</button>' +
          '<button type="button" class="pv-btn ' + (joined ? 'ghost' : 'primary') + '" data-join="1">' +
          (joined ? '退出社团' : '加入社团') + '</button></div>';
      },
      mount: function (root, params) {
        var g = Data.clubs.filter(function (x) { return x.id === params.id; })[0];
        root.querySelector('.app-body').addEventListener('click', function (e) {
          if (e.target.closest('[data-join]')) {
            var follows = Store.getFollows();
            var idx = follows.indexOf(g.name);
            if (idx >= 0) {
              UI.confirm({ title: '退出社团', msg: '退出后将不再接收该社团的活动通知。', okText: '退出', danger: true })
                .then(function (ok) {
                  if (!ok) return;
                  follows.splice(idx, 1);
                  Store.set('follows', follows);
                  UI.toast('已退出「' + g.name + '」');
                  Router.reload();
                  App.syncProfileStats();
                });
            } else {
              follows.push(g.name);
              Store.set('follows', follows);
              UI.toast('已加入「' + g.name + '」，记得关注近期活动', { type: 'success' });
              Router.reload();
              App.syncProfileStats();
            }
            return;
          }
          if (e.target.closest('[data-share]')) {
            App.shareSheet({ title: g.name, text: g.desc });
          }
        });
      }
    }
  });

  /* ======================================================================
   * 8. 全局能力：复制 / 分享面板 / 首页红点
   * ==================================================================== */

  /** 复制文本到剪贴板（含降级方案） */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return Promise.resolve();
  }
  App.copyText = copyText;

  /** 统一分享面板 */
  App.shareSheet = function (opt) {
    opt = opt || {};
    var text = opt.text || '';
    return UI.sheet({
      title: '分享到',
      items: [
        { value: 'link', label: '复制链接', desc: '链接已包含帖子信息', icon: ic('link', 20) },
        { value: 'wechat', label: '微信好友', icon: ic('chat', 20) },
        { value: 'moments', label: '微信朋友圈', icon: ic('img', 20) },
        { value: 'qq', label: 'QQ', icon: ic('chat', 20) },
        { value: 'poster', label: '生成海报', icon: ic('img', 20) }
      ]
    }).then(function (v) {
      if (!v) return v;
      if (v === 'link') {
        return copyText(location.href + '#' + encodeURIComponent(opt.title || '')).then(function () {
          UI.toast('链接已复制', { type: 'success' });
        });
      }
      UI.toast('已唤起「' + ({ wechat: '微信', moments: '朋友圈', qq: 'QQ', poster: '海报' }[v] || '分享') + '」（演示）');
      return v;
    });
  };

  /** 同步首页红点（铃铛未读 + 公告未读文案） */
  App.syncHomeBadges = function () {
    var msgCount = DataSvc.unreadMessageCount();
    var badge = document.querySelector('#screen-home .icon-btn .badge');
    if (badge) badge.style.display = msgCount ? '' : 'none';

    var noticeCount = DataSvc.unreadNoticeCount();
    var noticeAction = document.querySelector('#screen-home .notice-list');
    var head = noticeAction && noticeAction.parentElement && noticeAction.parentElement.querySelector('.section-action');
    if (head) {
      head.innerHTML = (noticeCount ? noticeCount + '条未读' : '全部已读') + ' ' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
    }
    // 同步「我的」页消息角标
    var menuBadge = document.querySelector('#screen-profile .menu-item[data-action="消息"] .menu-badge');
    if (menuBadge) {
      menuBadge.textContent = msgCount;
      menuBadge.style.display = msgCount ? '' : 'none';
    }
  };

  /** 同步个人中心统计数据 */
  App.syncProfileStats = function () {
    var posts = Store.getPosts().length + 5; // 内置 5 条示例帖
    var favs = Store.getFavorites().length;
    var follows = Store.getFollows().length;
    var map = { '发布': posts, '收藏': favs || 48, '关注': follows || 26, '获赞': 320 };
    document.querySelectorAll('#screen-profile .pstat').forEach(function (el) {
      var lab = el.querySelector('.pstat-label').textContent.trim();
      if (map[lab] != null) el.querySelector('.pstat-val').textContent = map[lab];
    });
  };

})(window);
