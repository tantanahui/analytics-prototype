/* ===============================
   Mock 数据：短剧 IAA（广告变现）场景
   变现 = 广告收入（无付费）
   =============================== */
const seedRand = seed => { let s = seed; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; };

function gen(seed, base, trend, amp, noise, n = 30) {
  const r = seedRand(seed), out = [];
  for (let i = 0; i < n; i++) {
    const wk = (i % 7 === 5 || i % 7 === 6) ? 1.13 : 1;
    const v = base * (1 + trend * i / 100) * (1 + Math.sin(i / 3.6) * amp) * (1 + (r() - 0.5) * noise) * wk;
    out.push(Math.round(v));
  }
  return out;
}

/* 最近 30 天日期 */
const DATES = (() => {
  const arr = [], end = new Date(2026, 9, 25);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(end); d.setDate(end.getDate() - i);
    arr.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return arr;
})();

const D = {};

/* ---------- 全局口径 ----------
   投放消耗 1,286,000 元 / 新增激活 257,200 → CPA ¥5.00
   DAU 826,400 · 广告展示 19,007,200 次 · 广告收入 ¥346,975
   eCPM ¥18.25 · ARPU ¥0.42 · 人均展示 23.0 次
---------------------------------- */
D.summary = { cost: 1286000, activation: 257200, dau: 826400, imp: 19007200, revenue: 346975 };

/* ---------- 概览 KPI ---------- */
D.kpi = [
  { label: '新增激活用户', value: '257,200', delta: '+12.4%', dir: 'up', spark: gen(11, 8400, 1.6, .05, .12), color: '#2f6bff', tip: '首次启动并完成渠道归因的去重设备数' },
  { label: '日活 DAU', value: '826,400', delta: '+5.8%', dir: 'up', spark: gen(23, 260000, .5, .03, .06), color: '#17b26a', tip: '当日触发 AppStart 的去重用户' },
  { label: '投放消耗', value: '128.60', unit: '万元', delta: '+8.7%', dir: 'up', spark: gen(31, 43000, 1.3, .05, .1), color: '#f5a623', tip: '买量渠道当日消耗合计' },
  { label: '激活成本 CPA', value: '5.00', unit: '元', delta: '-3.2%', dir: 'down', spark: gen(41, 5.2, -.3, .03, .06), color: '#7a4ddd', tip: '投放消耗 / 新增激活' },
  { label: '广告收入', value: '34.70', unit: '万元', delta: '+18.2%', dir: 'up', spark: gen(53, 11600, 1.9, .06, .12), color: '#eb2f96', tip: '激励视频 / 开屏 / 插屏 / 信息流 广告收入合计' },
  { label: 'eCPM', value: '18.25', unit: '元', delta: '+4.1%', dir: 'up', spark: gen(67, 18, .2, .04, .07), color: '#00b8d9', tip: '广告收入 / 展示量 × 1000' },
  { label: 'ARPU', value: '0.42', unit: '元', delta: '+6.3%', dir: 'up', spark: gen(71, .42, .3, .04, .08), color: '#f54a45', tip: '广告收入 / DAU' },
  { label: '人均广告展示', value: '23.0', unit: '次', delta: '+2.1%', dir: 'up', spark: gen(83, 23, .2, .03, .06), color: '#2f6bff', tip: '广告展示量 / DAU，反映 Ad Load 强度' }
];

/* ---------- 趋势 ---------- */
D.trend = {
  labels: DATES,
  activation: gen(11, 240000, 0.4, .05, .10),
  cost: gen(31, 1200000, 0.3, .05, .08),
  revenue: gen(53, 320000, 0.35, .06, .10),
  ecpm: gen(67, 18, .12, .04, .07)
};

/* ---------- 渠道：投放 × 变现归因 ---------- */
/* cost 消耗 · act 激活 · ret1 次留 · rev1 首日广告收入 · ltv7 / ltv30 */
D.channels = [
  { name: '巨量引擎', sub: '抖音/番茄', imp: 42800000, clk: 3420000, cost: 428000, act: 89100, ret1: 38.2, rev1: 32800, ltv7: 1.72, ltv30: 4.42 },
  { name: '腾讯广告', sub: '广点通/微信', imp: 31500000, clk: 2180000, cost: 286000, act: 56400, ret1: 40.1, rev1: 20600, ltv7: 1.71, ltv30: 4.42 },
  { name: '快手磁力', sub: '快手信息流', imp: 22300000, clk: 1640000, cost: 198000, act: 38600, ret1: 35.4, rev1: 12900, ltv7: 1.60, ltv30: 4.21 },
  { name: '百度信息流', sub: '百度/贴吧', imp: 12600000, clk: 786000, cost: 96000, act: 17800, ret1: 33.6, rev1: 5600, ltv7: 1.51, ltv30: 3.99 },
  { name: '小米应用商店', sub: '商店/搜索', imp: 8900000, clk: 1120000, cost: 78000, act: 17200, ret1: 46.2, rev1: 7200, ltv7: 1.96, ltv30: 5.06 },
  { name: '华为应用市场', sub: '商店/搜索', imp: 7400000, clk: 926000, cost: 68000, act: 15100, ret1: 45.1, rev1: 6300, ltv7: 1.97, ltv30: 5.09 },
  { name: 'Apple Search Ads', sub: 'App Store', imp: 5200000, clk: 486000, cost: 62000, act: 8600, ret1: 43.8, rev1: 3900, ltv7: 2.15, ltv30: 5.52 },
  { name: '知乎/微博', sub: '信息流', imp: 4300000, clk: 268000, cost: 42000, act: 7400, ret1: 31.2, rev1: 2100, ltv7: 1.40, ltv30: 3.80 },
  { name: 'Google Ads', sub: 'UAC/海外', imp: 6800000, clk: 402000, cost: 28000, act: 5600, ret1: 36.4, rev1: 2000, ltv7: 1.65, ltv30: 4.25 },
  { name: '自然量/其他', sub: 'Organic', imp: 0, clk: 0, cost: 0, act: 1400, ret1: 42.0, rev1: 520, ltv7: 1.88, ltv30: 4.90 }
];

/* ---------- 广告位变现 ---------- */
D.adSlots = [
  { name: '激励视频', key: 'rewarded', req: 21400000, fill: 20180400, show: 12860000, ecpm: 22.40, rev: 288064, cpu: 15.56, scene: '解锁剧集' },
  { name: '插屏广告', key: 'interstitial', req: 4620000, fill: 4180000, show: 2860000, ecpm: 9.80, rev: 28028, cpu: 3.46, scene: '播放中断/退出' },
  { name: '开屏广告', key: 'splash', req: 1860000, fill: 1841400, show: 1824000, ecpm: 12.60, rev: 22982, cpu: 2.21, scene: '冷启动' },
  { name: '信息流 / Banner', key: 'feed', req: 8640000, fill: 8244000, show: 1463200, ecpm: 5.40, rev: 7901, cpu: 1.77, scene: '首页/剧集列表' }
];

/* ---------- 广告源聚合（Waterfall / Bidding） ---------- */
D.adSources = [
  { name: '穿山甲 Gromore', req: 9860000, fillRate: 96.2, ecpm: 24.8, rev: 148600 },
  { name: '优量汇', req: 6240000, fillRate: 93.4, ecpm: 21.6, rev: 92400 },
  { name: '快手联盟', req: 4180000, fillRate: 91.8, ecpm: 19.2, rev: 52800 },
  { name: 'AdMob', req: 2860000, fillRate: 88.6, ecpm: 16.4, rev: 28600 },
  { name: 'Mintegral', req: 1640000, fillRate: 86.2, ecpm: 14.8, rev: 14800 },
  { name: '百度联盟', req: 1120000, fillRate: 84.6, ecpm: 8.6, rev: 6400 },
  { name: 'IronSource', req: 860000, fillRate: 82.4, ecpm: 12.2, rev: 4275 }
];

/* ---------- 剧集变现 TOP ---------- */
D.dramas = [
  { name: '逆袭人生', eps: 82, uv: 186400, finish: 42.6, epPerUser: 12.4, unlock: 68.2, imp: 3864000, rev: 86400 },
  { name: '闪婚契约', eps: 76, uv: 142800, finish: 38.4, epPerUser: 10.2, unlock: 64.1, imp: 2864000, rev: 62800 },
  { name: '都市医仙', eps: 90, uv: 128600, finish: 35.2, epPerUser: 9.6, unlock: 61.8, imp: 2486000, rev: 52600 },
  { name: '总裁的替身新娘', eps: 68, uv: 116400, finish: 44.8, epPerUser: 13.8, unlock: 71.4, imp: 2942000, rev: 48200 },
  { name: '重生之我的1998', eps: 100, uv: 98200, finish: 31.6, epPerUser: 8.4, unlock: 58.2, imp: 1864000, rev: 36400 },
  { name: '神医出山', eps: 88, uv: 86400, finish: 33.8, epPerUser: 9.2, unlock: 62.4, imp: 1642000, rev: 31200 }
];

/* ---------- 分时 eCPM / 展示 ---------- */
D.hourly = {
  labels: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00'),
  ecpm: [14.2, 12.8, 11.6, 10.8, 10.2, 10.6, 11.8, 13.4, 14.6, 15.2, 15.8, 16.4, 16.8, 17.2, 17.6, 18.2, 18.8, 19.6, 21.4, 23.8, 24.6, 23.2, 19.8, 16.4],
  imp: [382000, 286000, 198000, 152000, 124000, 142000, 246000, 428000, 562000, 648000, 724000, 786000, 812000, 836000, 862000, 884000, 926000, 1042000, 1286000, 1464000, 1528000, 1346000, 986000, 642000]
};

/* ---------- 漏斗 ---------- */
D.funnels = {
  full: {
    name: '投流 → 首集解锁 全链路漏斗',
    window: '1 天转化窗口',
    steps: [
      { name: '广告曝光 AdImpression', value: 156900000 },
      { name: '广告点击 AdClick', value: 11230000 },
      { name: '下载完成 AppDownload', value: 6180000 },
      { name: '安装激活 AppInstall', value: 257200 },
      { name: '首次启动 AppStart', value: 246800 },
      { name: '首页剧集曝光 DramaExpose', value: 238400 },
      { name: '首集开始播放 EpisodeStart', value: 186400 },
      { name: '首集完播 EpisodeFinish', value: 124600 },
      { name: '解锁弹窗曝光 UnlockPopupShow', value: 108200 },
      { name: '广告看完并解锁 AdRewarded', value: 78400 }
    ]
  },
  ad: {
    name: '广告变现漏斗（单次解锁）',
    window: '会话内',
    steps: [
      { name: '解锁弹窗曝光 UnlockPopupShow', value: 4286000 },
      { name: '点击看视频解锁', value: 2864000 },
      { name: '广告请求 AdRequest', value: 2864000 },
      { name: '广告填充成功 AdFill', value: 2702000 },
      { name: '广告展示 AdShow', value: 2648000 },
      { name: '广告完整播放 AdComplete', value: 2384000 },
      { name: '激励发放 AdRewarded', value: 2362000 },
      { name: '继续观看下一集', value: 2124000 }
    ]
  }
};

/* 分广告位变现漏斗对比：请求 → 填充 → 展示 → 完整播放 */
D.funnelBySlot = [
  { name: '激励视频', steps: [2864000, 2702000, 2648000, 2384000] },
  { name: '插屏广告', steps: [1186000, 1072000, 1046000, 862000] },
  { name: '开屏广告', steps: [1860000, 1841400, 1824000, 1746000] },
  { name: '信息流/Banner', steps: [864000, 824400, 786000, 642000] }
];
D.funnelBySlotLabels = ['广告请求', '填充成功', '广告展示', '完整播放'];

/* 分渠道漏斗对比：激活 → 首集播放 → 完播 → 看广告解锁 */
D.funnelByChannel = [
  { name: '巨量引擎', steps: [89100, 64200, 42800, 31200] },
  { name: '腾讯广告', steps: [56400, 41200, 27600, 20400] },
  { name: '快手磁力', steps: [38600, 26800, 17800, 12600] },
  { name: '百度信息流', steps: [17800, 11800, 7600, 5200] },
  { name: '小米应用商店', steps: [17200, 13400, 9600, 7600] },
  { name: '华为应用市场', steps: [15100, 11800, 8400, 6800] }
];
D.funnelByChannelLabels = ['激活', '首集播放', '首集完播', '广告解锁'];

/* ---------- 留存 ---------- */
D.retentionCols = ['新增用户', '次日', '3日', '7日', '14日', '30日'];
D.retention = [
  { name: '09-26', base: 8420, vals: [37.8, 27.6, 18.9, 13.6, 9.2] },
  { name: '09-27', base: 9120, vals: [38.6, 28.4, 19.4, 14.1, 9.6] },
  { name: '09-28', base: 8760, vals: [36.9, 26.8, 18.2, 13.2, 8.9] },
  { name: '09-29', base: 10240, vals: [39.8, 29.1, 19.9, 14.6, 10.1] },
  { name: '09-30', base: 10680, vals: [41.2, 30.4, 20.8, 15.4, 10.8] },
  { name: '10-01', base: 9960, vals: [42.4, 31.2, 21.4, 16.1, 11.4] },
  { name: '10-02', base: 9440, vals: [39.2, 28.6, 19.6, 14.8, 10.2] },
  { name: '10-03', base: 10520, vals: [40.6, 29.8, 20.4, 15.1, 10.6] }
];
D.retentionByChannel = [
  { name: '小米应用商店', data: [46.2, 38.4, 30.1, 25.6, 22.4, 19.8, 17.6] },
  { name: '华为应用市场', data: [45.1, 37.2, 29.4, 24.8, 22.1, 19.2, 17.1] },
  { name: 'Apple Search Ads', data: [43.8, 35.9, 28.2, 23.9, 21.3, 18.6, 16.4] },
  { name: '腾讯广告', data: [40.1, 32.6, 25.2, 21.1, 18.6, 16.2, 14.4] },
  { name: '巨量引擎', data: [38.2, 30.8, 23.6, 19.8, 17.2, 15.1, 13.4] },
  { name: '快手磁力', data: [35.4, 27.9, 21.1, 17.6, 15.2, 13.4, 11.8] },
  { name: '百度信息流', data: [33.6, 26.1, 19.4, 16.0, 13.8, 12.0, 10.4] }
];

/* ---------- 事件树：8 大分组 / 68 个事件 ---------- */
D.eventTree = [
  {
    group: '启动与生命周期', icon: '🚀', items: [
      { k: 'AppStart', n: 'App 启动', c: 1286400 },
      { k: 'AppColdStart', n: '冷启动', c: 486200 },
      { k: 'AppHotStart', n: '热启动', c: 800200 },
      { k: 'AppForeground', n: '切回前台', c: 986400 },
      { k: 'AppBackground', n: '切入后台', c: 962800 },
      { k: 'AppEnd', n: 'App 退出', c: 1261800 },
      { k: 'SplashView', n: '开屏曝光', c: 1182000 },
      { k: 'HomePageView', n: '首页浏览', c: 2864000 },
      { k: 'PageView', n: '页面浏览（全埋点）', c: 8642000 }
    ]
  },
  {
    group: '广告变现', icon: '📺', items: [
      { k: 'AdRequest', n: '广告请求', c: 42860000 },
      { k: 'AdFill', n: '广告填充成功', c: 40120000 },
      { k: 'AdShow', n: '广告展示', c: 19007200 },
      { k: 'AdClick', n: '广告点击', c: 862400 },
      { k: 'AdComplete', n: '广告完整播放', c: 16284000 },
      { k: 'AdRewarded', n: '激励发放', c: 2362000 },
      { k: 'AdClose', n: '提前关闭广告', c: 2723000 },
      { k: 'AdSkip', n: '跳过广告', c: 486200 },
      { k: 'AdError', n: '广告加载失败', c: 2740000 },
      { k: 'AdTimeout', n: '广告加载超时', c: 386400 },
      { k: 'AdFreqBlock', n: '频次控制拦截', c: 52000 },
      { k: 'AdRevenue', n: '广告收入回传', c: 19007200 }
    ]
  },
  {
    group: '剧集播放', icon: '🎬', items: [
      { k: 'DramaExpose', n: '剧集曝光', c: 38640000 },
      { k: 'DramaClick', n: '剧集点击', c: 4286000 },
      { k: 'DramaDetailView', n: '剧集详情页浏览', c: 3264000 },
      { k: 'EpisodeStart', n: '开始播放', c: 2864000 },
      { k: 'EpisodeProgress', n: '播放进度上报', c: 5240000 },
      { k: 'EpisodeFinish', n: '播放完成', c: 1864000 },
      { k: 'EpisodeExit', n: '退出播放', c: 986400 },
      { k: 'UnlockPopupShow', n: '解锁弹窗曝光', c: 4286000 },
      { k: 'UnlockClick', n: '点击解锁按钮', c: 2864000 },
      { k: 'UnlockSuccess', n: '解锁成功', c: 2362000 },
      { k: 'UnlockFail', n: '解锁失败', c: 62000 },
      { k: 'PlayError', n: '播放失败', c: 86000 },
      { k: 'PlayBuffering', n: '播放卡顿', c: 428000 },
      { k: 'PlaySpeedChange', n: '倍速切换', c: 386400 },
      { k: 'EpisodeLike', n: '剧集点赞', c: 186400 }
    ]
  },
  {
    group: '搜索与推荐', icon: '🔍', items: [
      { k: 'RecommendExpose', n: '推荐位曝光', c: 18640000 },
      { k: 'RecommendClick', n: '推荐位点击', c: 2864000 },
      { k: 'SearchDrama', n: '搜索剧集', c: 246800 },
      { k: 'SearchResultClick', n: '搜索结果点击', c: 186400 },
      { k: 'SearchNoResult', n: '搜索无结果', c: 28400 },
      { k: 'CategoryView', n: '分类频道浏览', c: 486400 },
      { k: 'RankView', n: '榜单浏览', c: 328600 },
      { k: 'BannerClick', n: 'Banner 点击', c: 126400 }
    ]
  },
  {
    group: '互动与召回', icon: '🔗', items: [
      { k: 'CollectDrama', n: '追剧收藏', c: 186400 },
      { k: 'CollectCancel', n: '取消收藏', c: 42800 },
      { k: 'LikeDrama', n: '剧集点赞', c: 264800 },
      { k: 'CommentSubmit', n: '评论提交', c: 48600 },
      { k: 'ShareClick', n: '分享点击', c: 96400 },
      { k: 'ShareSuccess', n: '分享成功', c: 71200 },
      { k: 'HistoryContinue', n: '继续观看', c: 686400 },
      { k: 'RemindMeSet', n: '设置追剧提醒', c: 86400 },
      { k: 'PushArrive', n: 'Push 到达', c: 2864000 },
      { k: 'PushClick', n: 'Push 点击', c: 186400 },
      { k: 'PushClose', n: 'Push 关闭', c: 164200 },
      { k: 'DeepLinkOpen', n: '深链唤起', c: 128600 }
    ]
  },
  {
    group: '账号与登录', icon: '🔐', items: [
      { k: 'LoginPageView', n: '登录页曝光', c: 186400 },
      { k: 'VerifyCodeSend', n: '验证码发送', c: 121300 },
      { k: 'VerifyCodeVerify', n: '验证码校验', c: 108600 },
      { k: 'LoginSuccess', n: '登录成功', c: 142800 },
      { k: 'LoginFail', n: '登录失败', c: 14300 },
      { k: 'OneClickLoginSuccess', n: '一键登录成功', c: 96400 },
      { k: 'WechatLoginSuccess', n: '微信登录成功', c: 32600 },
      { k: 'AppleLoginSuccess', n: 'Apple 登录成功', c: 8600 },
      { k: 'AutoLoginSuccess', n: '自动登录成功', c: 386400 },
      { k: 'TouristBind', n: '游客绑定账号', c: 42800 },
      { k: 'TokenExpired', n: '登录态失效', c: 18600 },
      { k: 'Logout', n: '退出登录', c: 8300 }
    ]
  },
  {
    group: '引导与权限', icon: '🛡️', items: [
      { k: 'OnboardingShow', n: '新手引导曝光', c: 246800 },
      { k: 'OnboardingFinish', n: '新手引导完成', c: 186400 },
      { k: 'PermissionRequest', n: '权限申请', c: 486200 },
      { k: 'PermissionGrant', n: '权限授予', c: 342600 },
      { k: 'PermissionDeny', n: '权限拒绝', c: 143600 },
      { k: 'NotificationEnable', n: '通知权限开启', c: 128600 },
      { k: 'UpdatePopupShow', n: '升级弹窗曝光', c: 86400 }
    ]
  },
  {
    group: '性能与稳定性', icon: '⚠️', items: [
      { k: 'AppCrash', n: 'App 崩溃', c: 8600 },
      { k: 'AppANR', n: '页面卡顿 ANR', c: 12400 },
      { k: 'NetworkError', n: '网络请求失败', c: 186400 },
      { k: 'ApiError', n: '接口报错', c: 96400 },
      { k: 'StartupDuration', n: '启动耗时', c: 826400 },
      { k: 'PageLoadSlow', n: '页面加载超时', c: 42800 },
      { k: 'QualitySwitch', n: '清晰度切换', c: 164200 }
    ]
  }
];

/* ---------- 事件关联链路（用于事件图谱 / 关联分析） ---------- */
D.eventChains = [
  { name: '广告变现主链路', icon: '📺', steps: ['AdRequest', 'AdFill', 'AdShow', 'AdComplete', 'AdRewarded'], desc: '单次解锁闭环，填充率是收入天花板' },
  { name: '解锁转化链路', icon: '🎬', steps: ['EpisodeStart', 'EpisodeFinish', 'UnlockPopupShow', 'UnlockClick', 'AdShow', 'UnlockSuccess'], desc: '内容 → 广告 → 解锁，决定人均展示次数' },
  { name: '启动访问链路', icon: '🚀', steps: ['AppStart', 'SplashView', 'HomePageView', 'RecommendExpose', 'DramaClick'], desc: '冷启动到选剧，影响首集到达率' },
  { name: '登录转化链路', icon: '🔐', steps: ['LoginPageView', 'VerifyCodeSend', 'VerifyCodeVerify', 'LoginSuccess'], desc: '登录用于跨设备追剧，游客占 82.7%' },
  { name: 'Push 召回链路', icon: '🔗', steps: ['PushArrive', 'PushClick', 'DeepLinkOpen', 'EpisodeStart'], desc: 'Push 贡献 32.4% 的次日回访' },
  { name: '播放质量链路', icon: '⚠️', steps: ['EpisodeStart', 'PlayBuffering', 'PlayError', 'EpisodeExit'], desc: '卡顿与失败直接损伤留存' }
];

/* 事件 → 上下游关联（关联分析的"关联事件"） */
D.eventRelation = {
  AdShow: {
    up: ['AdRequest', 'AdFill'], down: ['AdComplete', 'AdRewarded', 'AdClose', 'UnlockSuccess'],
    attrs: ['ad_position', 'ad_source', 'scene', 'drama_id', 'ecpm'],
    related: [
      { ev: 'AdRewarded', rate: 12.4, desc: '展示后完成激励发放占比' },
      { ev: 'UnlockSuccess', rate: 89.2, desc: '解锁场景下看完即解锁' },
      { ev: 'AdClose', rate: 14.3, desc: '未看完提前关闭' },
      { ev: 'EpisodeExit', rate: 3.6, desc: '关广告后直接退出播放' }
    ]
  },
  UnlockPopupShow: {
    up: ['EpisodeFinish'], down: ['UnlockClick', 'AdRequest', 'UnlockSuccess', 'EpisodeExit'],
    attrs: ['drama_id', 'episode_no', 'popup_type'],
    related: [
      { ev: 'UnlockClick', rate: 66.8, desc: '点击"看广告解锁"' },
      { ev: 'EpisodeExit', rate: 33.2, desc: '直接退出（最大泄漏点）' },
      { ev: 'UnlockSuccess', rate: 55.1, desc: '端到端解锁成功' }
    ]
  },
  LoginSuccess: {
    up: ['LoginPageView', 'VerifyCodeVerify'], down: ['CollectDrama', 'HistoryContinue', 'UnlockSuccess'],
    attrs: ['login_type', 'channel', 'is_new_user'],
    related: [
      { ev: 'CollectDrama', rate: 42.6, desc: '登录后 7 日内收藏剧集' },
      { ev: 'UnlockSuccess', rate: 68.4, desc: '登录用户解锁率（游客 41.2%）' }
    ]
  }
};

/* 用户属性（可与任意事件交叉分析） */
D.userProps = [
  { group: '归因属性', items: ['channel 归因渠道', 'campaign_id 广告计划', 'creative_id 素材', 'attribution_type 归因方式'] },
  { group: '设备属性', items: ['device_model 机型', 'device_tier 机型档位', 'os_version 系统版本', 'screen_resolution 分辨率', 'storage 剩余存储'] },
  { group: '网络属性', items: ['network_type 网络环境', 'carrier 运营商', 'ip_province IP省份', 'ip_city IP城市', 'city_tier 城市线级'] },
  { group: '用户属性', items: ['is_new 新老用户', 'login_status 登录状态', 'first_active_date 首次活跃', 'drama_preference 偏好题材', 'user_value_level 价值分层'] }
];

/* ---------- 事件字典：由事件树自动生成，保证与采集口径一致 ---------- */
const GROUP_META = {
  '启动与生命周期': { type: '全埋点', owner: '张涛' },
  '广告变现': { type: 'SDK 自采集', owner: '刘洋' },
  '剧集播放': { type: '代码埋点', owner: '周敏' },
  '搜索与推荐': { type: '代码埋点', owner: '周敏' },
  '互动与召回': { type: '代码埋点', owner: '李敏' },
  '账号与登录': { type: '代码埋点', owner: '王雪' },
  '引导与权限': { type: '代码埋点', owner: '陈昊' },
  '性能与稳定性': { type: 'SDK 自采集', owner: '张涛' }
};
const EV_OVERRIDE = {
  AdRewarded: { check: '参数异常' },
  UnlockSuccess: { check: '上报延迟' },
  UnlockFail: { check: '参数异常' },
  AdTimeout: { check: '上报延迟' },
  AppCrash: { check: '参数异常' },
  AdFreqBlock: { status: '灰度中' },
  AppleLoginSuccess: { status: '灰度中' },
  NotificationEnable: { status: '灰度中' },
  CommentSubmit: { status: '灰度中' },
  QualitySwitch: { status: '灰度中' },
  PushClose: { status: '灰度中' },
  DeepLinkOpen: { status: '灰度中' },
  RemindMeSet: { status: '灰度中' }
};
const _dr = seedRand(20261025);
D.eventDict = D.eventTree.flatMap(g => {
  const m = GROUP_META[g.group];
  return g.items.map(it => {
    const o = EV_OVERRIDE[it.k] || {};
    return {
      key: it.k, name: it.n, group: g.group, type: m.type,
      status: o.status || '已上线',
      params: 8 + Math.floor(_dr() * 12),
      today: it.c,
      last: `2026-10-25 ${String(20 + Math.floor(_dr() * 3)).padStart(2, '0')}:${String(Math.floor(_dr() * 60)).padStart(2, '0')}:${String(Math.floor(_dr() * 60)).padStart(2, '0')}`,
      owner: m.owner, check: o.check || '正常'
    };
  });
});
/* 两个非常规状态事件 */
D.eventDict.push(
  { key: 'NewAdPositionShow', name: '新广告位展示', group: '广告变现', type: '代码埋点', status: '未上报', params: 8, today: 0, last: '—', owner: '刘洋', check: '未接入' },
  { key: 'OldDramaPlay', name: '剧集播放（旧版）', group: '剧集播放', type: '代码埋点', status: '已废弃', params: 6, today: 0, last: '2026-08-14 11:02:31', owner: '周敏', check: '已下线' }
);

/* 公共参数（全埋点自动采集，所有事件均携带） */
D.commonParams = [
  { p: 'user_id', t: 'STRING', req: '自动', d: '用户唯一标识（游客为匿名 ID）' },
  { p: 'device_id', t: 'STRING', req: '自动', d: '设备标识，用于归因与跨事件串联' },
  { p: 'session_id', t: 'STRING', req: '自动', d: '会话 ID，会话内路径分析用' },
  { p: 'app_version', t: 'STRING', req: '自动', d: 'App 版本' },
  { p: 'os', t: 'ENUM', req: '自动', d: 'iOS / Android' },
  { p: 'os_version', t: 'STRING', req: '自动', d: '系统版本' },
  { p: 'device_model', t: 'STRING', req: '自动', d: '机型，用于机型档位分群' },
  { p: 'network_type', t: 'ENUM', req: '自动', d: 'wifi / 5G / 4G / 3G / offline' },
  { p: 'carrier', t: 'ENUM', req: '自动', d: '运营商：移动 / 联通 / 电信 / 广电' },
  { p: 'ip_province', t: 'STRING', req: '自动', d: 'IP 解析省份' },
  { p: 'ip_city', t: 'STRING', req: '自动', d: 'IP 解析城市' },
  { p: 'channel', t: 'STRING', req: '自动', d: '首次归因渠道（用户归属）' },
  { p: 'is_new_user', t: 'BOOL', req: '自动', d: '是否当日新增' },
  { p: 'time', t: 'TIMESTAMP', req: '自动', d: '事件发生时间（毫秒）' }
];

/* 事件参数定义 */
D.eventParams = {
  AdShow: [
    { p: 'ad_position', t: 'ENUM', req: '必填', d: '广告位：rewarded / interstitial / splash / feed' },
    { p: 'ad_source', t: 'ENUM', req: '必填', d: '广告源：gromore / ylh / ks_union / admob / mintegral ...' },
    { p: 'ad_type', t: 'ENUM', req: '必填', d: '素材类型：video / image / native' },
    { p: 'scene', t: 'ENUM', req: '必填', d: '触发场景：unlock_episode / cold_start / episode_exit / home_feed' },
    { p: 'drama_id', t: 'STRING', req: '选填', d: '当前剧集 ID' },
    { p: 'episode_no', t: 'NUMBER', req: '选填', d: '当前集数' },
    { p: 'ecpm', t: 'NUMBER', req: '必填', d: '广告源回传的预估 eCPM（元）' },
    { p: 'is_first_show', t: 'BOOL', req: '自动', d: '当日该用户首次广告展示' },
    { p: 'channel', t: 'STRING', req: '自动', d: '归因渠道' },
    { p: 'network_type', t: 'ENUM', req: '自动', d: 'wifi / 4G / 5G' }
  ],
  AdRewarded: [
    { p: 'ad_position', t: 'ENUM', req: '必填', d: '广告位，通常 rewarded' },
    { p: 'ad_source', t: 'ENUM', req: '必填', d: '广告源' },
    { p: 'scene', t: 'ENUM', req: '必填', d: 'unlock_episode / double_reward / signin' },
    { p: 'drama_id', t: 'STRING', req: '必填', d: '解锁的剧集 ID' },
    { p: 'episode_no', t: 'NUMBER', req: '必填', d: '解锁的集数' },
    { p: 'reward_type', t: 'ENUM', req: '必填', d: 'unlock_episode / vip_day / coin' },
    { p: 'verify_status', t: 'ENUM', req: '必填', d: 'success / server_verify_fail / timeout' },
    { p: 'duration_ms', t: 'NUMBER', req: '选填', d: '广告观看时长' },
    { p: 'ecpm', t: 'NUMBER', req: '必填', d: '本次展示 eCPM' }
  ],
  UnlockSuccess: [
    { p: 'drama_id', t: 'STRING', req: '必填', d: '剧集 ID' },
    { p: 'episode_no', t: 'NUMBER', req: '必填', d: '解锁集数' },
    { p: 'unlock_type', t: 'ENUM', req: '必填', d: 'ad_watch / share / wait_free' },
    { p: 'ad_watched_count', t: 'NUMBER', req: '选填', d: '当日累计看广告解锁次数' },
    { p: 'is_first_unlock', t: 'BOOL', req: '自动', d: '是否首次解锁' },
    { p: 'channel', t: 'STRING', req: '自动', d: '归因渠道' }
  ],
  LoginSuccess: [
    { p: 'user_id', t: 'STRING', req: '必填', d: '用户唯一标识' },
    { p: 'login_type', t: 'ENUM', req: '必填', d: 'phone / wechat / apple / one_click / tourist' },
    { p: 'is_new_user', t: 'BOOL', req: '必填', d: '是否首次登录' },
    { p: 'channel', t: 'STRING', req: '必填', d: '归因渠道' },
    { p: 'campaign_id', t: 'STRING', req: '选填', d: '广告计划 ID' },
    { p: 'duration_ms', t: 'NUMBER', req: '选填', d: '登录耗时' },
    { p: 'device_model', t: 'STRING', req: '自动', d: '设备机型' }
  ]
};

/* ---------- 维度拆分（事件分析） ---------- */
D.dimSplit = [
  { name: '巨量引擎', v: 4286000, r: 33.3 },
  { name: '腾讯广告', v: 2712000, r: 21.1 },
  { name: '快手磁力', v: 1864000, r: 14.5 },
  { name: '百度信息流', v: 862000, r: 6.7 },
  { name: '小米应用商店', v: 828000, r: 6.4 },
  { name: '华为应用市场', v: 726000, r: 5.6 },
  { name: 'Apple Search Ads', v: 414000, r: 3.2 },
  { name: '自然量', v: 672000, r: 5.2 }
];
D.slotSplit = [
  { name: '激励视频', v: 12860000, r: 67.7 },
  { name: '插屏广告', v: 2860000, r: 15.0 },
  { name: '开屏广告', v: 1824000, r: 9.6 },
  { name: '信息流/Banner', v: 1463200, r: 7.7 }
];
D.loginTypeSplit = [
  { name: '游客 / 免登录', v: 683600, r: 82.7 },
  { name: '一键登录', v: 96400, r: 11.7 },
  { name: '微信登录', v: 32600, r: 3.9 },
  { name: '手机号验证码', v: 13400, r: 1.6 }
];

/* ---------- 创意素材 ---------- */
D.creatives = [
  { name: '高能反转·前30秒', ch: '巨量引擎', imp: 8640000, ctr: 8.4, act: 18600, cpa: 4.62, rev: 26800, roas1: 7.9, bg: 'linear-gradient(135deg,#2f6bff,#6f9bff)' },
  { name: '霸总名场面·竖屏', ch: '巨量引擎', imp: 6420000, ctr: 6.1, act: 12400, cpa: 5.18, rev: 16200, roas1: 6.4, bg: 'linear-gradient(135deg,#f5a623,#ffc46b)' },
  { name: '爽剧切片·30s', ch: '腾讯广告', imp: 5860000, ctr: 7.2, act: 14200, cpa: 4.86, rev: 21400, roas1: 7.6, bg: 'linear-gradient(135deg,#7a4ddd,#b18aff)' },
  { name: '逆袭打脸·剧情', ch: '快手磁力', imp: 4280000, ctr: 5.8, act: 8600, cpa: 5.42, rev: 10800, roas1: 6.1, bg: 'linear-gradient(135deg,#17b26a,#6fdb9f)' },
  { name: '悬念开头·15s', ch: '腾讯广告', imp: 3920000, ctr: 6.9, act: 9800, cpa: 5.02, rev: 14600, roas1: 7.2, bg: 'linear-gradient(135deg,#00b8d9,#7ee0f0)' },
  { name: '甜宠向·图文', ch: '百度信息流', imp: 3160000, ctr: 4.6, act: 5200, cpa: 6.14, rev: 5600, roas1: 4.8, bg: 'linear-gradient(135deg,#eb2f96,#ff9ac4)' }
];

/* ---------- 实时事件流 ---------- */
D.streamSeed = [
  ['AdRewarded', '解锁第 12 集 · 激励视频 · 穿山甲', 'iPhone 15 Pro'],
  ['AdShow', '激励视频 · scene=unlock_episode', 'Redmi K70'],
  ['EpisodeFinish', '《逆袭人生》第 8 集', 'HUAWEI Mate60'],
  ['UnlockSuccess', 'unlock_type=ad_watch · 巨量引擎', 'OPPO Find X7'],
  ['AdRequest', '插屏 · scene=episode_exit', 'iPhone 14'],
  ['LoginSuccess', '一键登录 · 巨量引擎', 'vivo X100'],
  ['AppStart', '冷启动 · 自然量', 'iPhone 13'],
  ['AdError', '无填充 · 优量汇 · code=2001', 'Xiaomi 14'],
  ['DramaClick', '《闪婚契约》· 首页推荐位', 'HUAWEI P60'],
  ['AdComplete', '激励视频 · 32s 完整播放', 'iPhone 15']
];

/* ---------- 事件参数定义（补充 8 个高频事件） ---------- */
Object.assign(D.eventParams, {
  AdError: [
    { p: 'ad_position', t: 'ENUM', req: '必填', d: '广告位' },
    { p: 'ad_source', t: 'ENUM', req: '必填', d: '广告源' },
    { p: 'error_code', t: 'NUMBER', req: '必填', d: '2001 无填充 / 3002 超时 / 1004 未初始化 / 4001 网络 / 5003 频控' },
    { p: 'error_msg', t: 'STRING', req: '选填', d: '聚合 SDK 原始错误' },
    { p: 'retry_count', t: 'NUMBER', req: '选填', d: '本次请求重试次数' },
    { p: 'scene', t: 'ENUM', req: '必填', d: '触发场景' }
  ],
  EpisodeStart: [
    { p: 'drama_id', t: 'STRING', req: '必填', d: '剧集 ID' },
    { p: 'episode_no', t: 'NUMBER', req: '必填', d: '集数' },
    { p: 'is_first_episode', t: 'BOOL', req: '自动', d: '是否该剧首集' },
    { p: 'from_page', t: 'ENUM', req: '必填', d: '来源页：home / recommend / search / history / push / share' },
    { p: 'is_unlocked', t: 'BOOL', req: '必填', d: '该集是否已解锁' },
    { p: 'play_position', t: 'NUMBER', req: '选填', d: '起播位置（秒）' }
  ],
  UnlockPopupShow: [
    { p: 'drama_id', t: 'STRING', req: '必填', d: '剧集 ID' },
    { p: 'episode_no', t: 'NUMBER', req: '必填', d: '待解锁集数' },
    { p: 'popup_type', t: 'ENUM', req: '必填', d: 'ad_unlock / share_unlock / wait_free' },
    { p: 'show_count_today', t: 'NUMBER', req: '自动', d: '当日该用户第几次看到弹窗' },
    { p: 'left_free_seconds', t: 'NUMBER', req: '选填', d: '距离免费解锁剩余秒数' }
  ],
  AppStart: [
    { p: 'start_type', t: 'ENUM', req: '必填', d: 'cold / hot / push / deeplink' },
    { p: 'startup_duration_ms', t: 'NUMBER', req: '必填', d: '启动耗时' },
    { p: 'from_page', t: 'STRING', req: '选填', d: '唤起来源' },
    { p: 'is_first_start', t: 'BOOL', req: '自动', d: '是否首次启动' },
    { p: 'days_since_install', t: 'NUMBER', req: '自动', d: '安装后第几天' },
    { p: 'channel', t: 'STRING', req: '自动', d: '归因渠道' }
  ],
  PushClick: [
    { p: 'push_id', t: 'STRING', req: '必填', d: '推送任务 ID' },
    { p: 'push_type', t: 'ENUM', req: '必填', d: 'new_episode / continue_watch / recall / activity' },
    { p: 'drama_id', t: 'STRING', req: '选填', d: '关联剧集' },
    { p: 'arrive_to_click_ms', t: 'NUMBER', req: '自动', d: '到达到点击间隔' }
  ],
  AppCrash: [
    { p: 'crash_type', t: 'ENUM', req: '必填', d: 'java / native / anr / oom' },
    { p: 'stack_hash', t: 'STRING', req: '必填', d: '堆栈指纹' },
    { p: 'page', t: 'STRING', req: '必填', d: '崩溃所在页面' },
    { p: 'memory_mb', t: 'NUMBER', req: '选填', d: '崩溃时内存占用' },
    { p: 'device_model', t: 'STRING', req: '自动', d: '机型（低端机占比高）' }
  ],
  SearchDrama: [
    { p: 'keyword', t: 'STRING', req: '必填', d: '搜索词' },
    { p: 'search_from', t: 'ENUM', req: '必填', d: 'home / category / history / voice' },
    { p: 'result_count', t: 'NUMBER', req: '必填', d: '结果条数，0 时触发 SearchNoResult' },
    { p: 'is_hot_word', t: 'BOOL', req: '选填', d: '是否命中热搜词' }
  ],
  PermissionRequest: [
    { p: 'permission_type', t: 'ENUM', req: '必填', d: 'notification / storage / phone_state / location' },
    { p: 'request_scene', t: 'ENUM', req: '必填', d: 'startup / unlock / download' },
    { p: 'is_first_request', t: 'BOOL', req: '自动', d: '是否首次申请' }
  ]
});

/* =========================================================
   用户画像：机型 / 系统 / 网络 / 运营商 / IP 归属 / 用户类型
   ========================================================= */
D.deviceModels = [
  { name: 'iPhone 15 Pro', share: 4.6, tier: '¥5000+', ecpm: 30.2, arpu: 0.86, ret1: 45.8, ltv30: 6.2 },
  { name: 'iPhone 14', share: 4.2, tier: '¥3000-5000', ecpm: 25.4, arpu: 0.72, ret1: 43.2, ltv30: 5.5 },
  { name: 'iPhone 13', share: 3.8, tier: '¥3000-5000', ecpm: 24.1, arpu: 0.68, ret1: 42.6, ltv30: 5.3 },
  { name: 'Redmi K70', share: 3.6, tier: '¥2000-3000', ecpm: 19.8, arpu: 0.52, ret1: 39.4, ltv30: 4.7 },
  { name: 'HUAWEI Mate 60', share: 3.4, tier: '¥5000+', ecpm: 28.6, arpu: 0.81, ret1: 44.6, ltv30: 6.0 },
  { name: 'OPPO Find X7', share: 3.0, tier: '¥3000-5000', ecpm: 23.2, arpu: 0.65, ret1: 41.8, ltv30: 5.2 },
  { name: 'vivo X100', share: 2.8, tier: '¥3000-5000', ecpm: 22.6, arpu: 0.63, ret1: 41.2, ltv30: 5.1 },
  { name: 'Xiaomi 14', share: 2.6, tier: '¥3000-5000', ecpm: 22.1, arpu: 0.61, ret1: 40.8, ltv30: 5.0 },
  { name: 'HUAWEI P60', share: 2.4, tier: '¥3000-5000', ecpm: 21.4, arpu: 0.58, ret1: 40.2, ltv30: 4.9 },
  { name: 'OPPO A2', share: 2.2, tier: '¥1000-2000', ecpm: 15.2, arpu: 0.34, ret1: 35.6, ltv30: 3.9 },
  { name: 'vivo Y36', share: 2.0, tier: '¥1000-2000', ecpm: 14.6, arpu: 0.32, ret1: 35.1, ltv30: 3.8 },
  { name: 'Redmi Note 13', share: 1.9, tier: '¥1000-2000', ecpm: 15.8, arpu: 0.36, ret1: 36.2, ltv30: 4.0 },
  { name: 'Redmi 12C', share: 1.8, tier: '¥0-1000', ecpm: 11.2, arpu: 0.21, ret1: 31.4, ltv30: 3.1 },
  { name: 'iPhone 12', share: 1.8, tier: '¥3000-5000', ecpm: 20.8, arpu: 0.56, ret1: 39.8, ltv30: 4.8 }
];

D.deviceTier = [
  { name: '¥0-1000 低端', share: 26.4, ecpm: 11.8, arpu: 0.21, ret1: 32.1, ret7: 15.8, ltv30: 3.2, fill: 88.6, crash: 1.86 },
  { name: '¥1000-2000 中低端', share: 28.6, ecpm: 15.2, arpu: 0.34, ret1: 35.6, ret7: 18.4, ltv30: 3.9, fill: 91.4, crash: 1.24 },
  { name: '¥2000-3000 中端', share: 21.2, ecpm: 19.6, arpu: 0.52, ret1: 39.2, ret7: 20.6, ltv30: 4.6, fill: 94.2, crash: 0.86 },
  { name: '¥3000-5000 中高端', share: 14.6, ecpm: 24.8, arpu: 0.72, ret1: 42.4, ret7: 22.8, ltv30: 5.4, fill: 96.1, crash: 0.62 },
  { name: '¥5000+ 高端', share: 9.2, ecpm: 30.2, arpu: 0.92, ret1: 45.8, ret7: 24.9, ltv30: 6.2, fill: 97.4, crash: 0.41 }
];

D.osVersion = [
  { name: 'iOS 18', share: 12.4 }, { name: 'iOS 17', share: 15.6 }, { name: 'iOS 16', share: 8.2 }, { name: 'iOS 其他', share: 3.4 },
  { name: 'Android 14', share: 18.6 }, { name: 'Android 13', share: 16.4 }, { name: 'Android 12', share: 12.8 },
  { name: 'Android 11', share: 8.4 }, { name: 'Android 10 及以下', share: 4.2 }
];

D.networkType = [
  { name: 'WiFi', share: 62.4, ecpm: 19.8, arpu: 0.46 },
  { name: '5G', share: 24.6, ecpm: 17.2, arpu: 0.38 },
  { name: '4G', share: 12.2, ecpm: 14.6, arpu: 0.31 },
  { name: '弱网 / 离线', share: 0.8, ecpm: 8.4, arpu: 0.12 }
];

D.carrier = [
  { name: '中国移动', share: 42.6, ecpm: 18.6 },
  { name: '中国电信', share: 26.4, ecpm: 18.2 },
  { name: '中国联通', share: 24.8, ecpm: 17.9 },
  { name: '中国广电', share: 3.2, ecpm: 16.4 },
  { name: '其他 / 海外', share: 3.0, ecpm: 12.8 }
];

/* IP 归属：省份（中国大陆） */
D.provinces = [
  { name: '广东', share: 12.6, ecpm: 21.4, arpu: 0.52, ret1: 39.8 },
  { name: '河南', share: 8.4, ecpm: 15.8, arpu: 0.34, ret1: 36.2 },
  { name: '山东', share: 7.8, ecpm: 16.4, arpu: 0.36, ret1: 36.8 },
  { name: '江苏', share: 7.2, ecpm: 20.2, arpu: 0.48, ret1: 38.9 },
  { name: '四川', share: 6.4, ecpm: 17.2, arpu: 0.38, ret1: 37.1 },
  { name: '河北', share: 5.6, ecpm: 15.2, arpu: 0.32, ret1: 35.6 },
  { name: '湖南', share: 5.2, ecpm: 16.8, arpu: 0.36, ret1: 36.4 },
  { name: '浙江', share: 5.0, ecpm: 21.8, arpu: 0.54, ret1: 40.2 },
  { name: '安徽', share: 4.6, ecpm: 15.6, arpu: 0.33, ret1: 35.9 },
  { name: '湖北', share: 4.4, ecpm: 17.6, arpu: 0.39, ret1: 37.4 },
  { name: '广西', share: 3.8, ecpm: 14.2, arpu: 0.28, ret1: 34.8 },
  { name: '江西', share: 3.6, ecpm: 14.8, arpu: 0.30, ret1: 35.2 },
  { name: '陕西', share: 3.4, ecpm: 16.2, arpu: 0.35, ret1: 36.6 },
  { name: '福建', share: 3.2, ecpm: 19.4, arpu: 0.45, ret1: 38.4 },
  { name: '云南', share: 3.0, ecpm: 13.8, arpu: 0.27, ret1: 34.2 },
  { name: '其他省份', share: 15.8, ecpm: 16.0, arpu: 0.34, ret1: 36.4 }
];

/* 城市线级 */
D.cityTier = [
  { name: '一线城市', share: 14.2, ecpm: 26.4, arpu: 0.62, ret1: 40.2, ret7: 21.2 },
  { name: '新一线城市', share: 22.6, ecpm: 21.2, arpu: 0.51, ret1: 38.6, ret7: 20.1 },
  { name: '二线城市', share: 24.8, ecpm: 17.6, arpu: 0.42, ret1: 37.4, ret7: 19.2 },
  { name: '三线城市', share: 20.4, ecpm: 13.8, arpu: 0.34, ret1: 36.2, ret7: 18.2 },
  { name: '四线及以下', share: 18.0, ecpm: 10.6, arpu: 0.28, ret1: 35.1, ret7: 17.4 }
];

/* 用户归属（首次归因来源） */
D.channelOwn = [
  { name: '巨量引擎（买量）', share: 34.6, arpu: 0.39, ret1: 38.2, ltv30: 4.42 },
  { name: '腾讯广告（买量）', share: 21.9, arpu: 0.40, ret1: 40.1, ltv30: 4.42 },
  { name: '快手磁力（买量）', share: 15.0, arpu: 0.36, ret1: 35.4, ltv30: 4.21 },
  { name: '百度信息流（买量）', share: 6.9, arpu: 0.33, ret1: 33.6, ltv30: 3.99 },
  { name: '应用商店（自然+ASA）', share: 15.8, arpu: 0.48, ret1: 45.1, ltv30: 5.22 },
  { name: '自然量 / 分享回流', share: 5.8, arpu: 0.44, ret1: 42.0, ltv30: 4.90 }
];

/* 用户类型 */
D.userType = [
  { name: '新用户（7 日内新增）', share: 28.4, arpu: 0.48, imp: 26.4 },
  { name: '活跃老用户', share: 46.2, arpu: 0.46, imp: 24.8 },
  { name: '回流用户（沉默后唤醒）', share: 12.6, arpu: 0.31, imp: 16.2 },
  { name: '低频浅度用户', share: 8.4, arpu: 0.14, imp: 6.8 },
  { name: '即将流失用户', share: 4.4, arpu: 0.08, imp: 3.2 }
];

/* 用户价值分层（由留存 × 广告行为计算） */
D.valueLevel = [
  { name: '高价值用户', share: 12.6, days: 22.4, imp: 42.6, arpu: 0.96, ltv30: 8.42, revShare: 41.8, ret1: 62.4 },
  { name: '中价值用户', share: 26.4, days: 12.8, imp: 24.2, arpu: 0.52, ltv30: 4.86, revShare: 33.6, ret1: 44.6 },
  { name: '低价值用户', share: 38.6, days: 5.2, imp: 9.6, arpu: 0.18, ltv30: 1.62, revShare: 18.4, ret1: 26.8 },
  { name: '沉默 / 流失用户', share: 22.4, days: 1.4, imp: 2.1, arpu: 0.04, ltv30: 0.28, revShare: 6.2, ret1: 8.2 }
];

/* =========================================================
   用户分群
   ========================================================= */
D.segments = [
  {
    id: 'sg_001', name: '高价值追剧用户', count: 186400, share: 22.6, type: '规则分群', updated: '2026-10-25 08:00',
    desc: '近 7 日活跃 ≥5 天且日均播放 ≥8 集，变现与留存双高，广告策略应保体验',
    arpu: 0.86, ret7: 42.6, imp: 42.4, ltv30: 8.42, owner: '李敏', status: '已就绪',
    rules: ['近 7 日 活跃天数 ≥ 5 天', '近 7 日 EpisodeFinish 次数 ≥ 56', '近 7 日 AdRewarded 次数 ≥ 10', 'user_value_level = 高价值'],
    device: [['¥3000-5000', 28.6], ['¥5000+', 24.2], ['¥2000-3000', 22.4], ['¥1000-2000', 18.6], ['¥0-1000', 6.2]],
    province: [['广东', 14.2], ['江苏', 8.6], ['浙江', 8.2], ['山东', 7.4], ['四川', 6.8]],
    channel: [['巨量引擎', 31.2], ['腾讯广告', 20.4], ['应用商店', 18.6], ['快手磁力', 14.2], ['自然量', 8.4]]
  },
  {
    id: 'sg_002', name: '广告解锁活跃用户', count: 124600, share: 15.1, type: '规则分群', updated: '2026-10-25 08:00',
    desc: '近 7 日 AdRewarded ≥5 次，变现主力人群，可适度提高 Ad Load',
    arpu: 0.78, ret7: 38.4, imp: 38.6, ltv30: 7.62, owner: '刘洋', status: '已就绪',
    rules: ['近 7 日 AdRewarded 次数 ≥ 5', '近 7 日 UnlockSuccess 次数 ≥ 5', 'login_status ∈ 游客/已登录'],
    device: [['¥2000-3000', 26.4], ['¥1000-2000', 25.2], ['¥3000-5000', 22.8], ['¥5000+', 14.6], ['¥0-1000', 11.0]],
    province: [['广东', 12.8], ['河南', 8.4], ['山东', 8.1], ['四川', 7.2], ['河北', 6.4]],
    channel: [['巨量引擎', 36.4], ['快手磁力', 18.2], ['腾讯广告', 17.6], ['百度信息流', 8.4], ['自然量', 6.2]]
  },
  {
    id: 'sg_003', name: '解锁弹窗流失用户', count: 96400, share: 11.7, type: '规则分群', updated: '2026-10-25 08:00',
    desc: '曝光解锁弹窗 ≥3 次但未解锁，变现最大可运营池，建议 Push + 免费解锁券召回',
    arpu: 0.16, ret7: 14.2, imp: 6.4, ltv30: 1.24, owner: '李敏', status: '已就绪',
    rules: ['近 7 日 UnlockPopupShow 次数 ≥ 3', '近 7 日 UnlockSuccess 次数 = 0', '近 7 日 EpisodeExit 次数 ≥ 3'],
    device: [['¥0-1000', 34.2], ['¥1000-2000', 31.6], ['¥2000-3000', 18.4], ['¥3000-5000', 10.6], ['¥5000+', 5.2]],
    province: [['河南', 11.2], ['河北', 9.4], ['安徽', 8.6], ['广西', 8.2], ['云南', 7.4]],
    channel: [['快手磁力', 28.6], ['百度信息流', 22.4], ['巨量引擎', 24.2], ['腾讯广告', 12.6], ['自然量', 6.8]]
  },
  {
    id: 'sg_004', name: '低频浅度用户', count: 218600, share: 26.4, type: '规则分群', updated: '2026-10-25 08:00',
    desc: '近 7 日活跃 ≤2 天、日均播放 ≤3 集，需内容推荐与 Push 双管齐下',
    arpu: 0.14, ret7: 9.6, imp: 6.8, ltv30: 1.18, owner: '周敏', status: '已就绪',
    rules: ['近 7 日 活跃天数 ≤ 2', '近 7 日 EpisodeStart 次数 ≤ 21', 'Push 可触达 = 是'],
    device: [['¥0-1000', 32.4], ['¥1000-2000', 30.8], ['¥2000-3000', 19.6], ['¥3000-5000', 11.4], ['¥5000+', 5.8]],
    province: [['河南', 10.4], ['山东', 9.2], ['河北', 8.6], ['安徽', 8.1], ['湖南', 7.6]],
    channel: [['巨量引擎', 33.2], ['快手磁力', 21.4], ['百度信息流', 14.8], ['腾讯广告', 16.2], ['自然量', 8.4]]
  },
  {
    id: 'sg_005', name: '流失预警用户', count: 86200, share: 10.4, type: 'AI 预测分群', updated: '2026-10-25 06:30',
    desc: '模型预测 7 日内流失概率 > 70%，且有未完成追剧，优先下发"更新提醒"Push',
    arpu: 0.22, ret7: 11.4, imp: 8.2, ltv30: 1.46, owner: '算法', status: '计算中',
    rules: ['流失概率 ≥ 70%（模型 lr_v3）', '收藏剧集 ≥ 1 且未看完', '近 3 日 未活跃'],
    device: [['¥1000-2000', 29.6], ['¥0-1000', 26.4], ['¥2000-3000', 21.2], ['¥3000-5000', 14.6], ['¥5000+', 8.2]],
    province: [['四川', 9.8], ['河南', 9.2], ['湖南', 8.6], ['湖北', 8.1], ['江西', 7.4]],
    channel: [['巨量引擎', 30.4], ['腾讯广告', 22.6], ['快手磁力', 18.4], ['百度信息流', 12.2], ['自然量', 8.6]]
  },
  {
    id: 'sg_006', name: '低端机低变现用户', count: 164800, share: 19.9, type: '规则分群', updated: '2026-10-25 08:00',
    desc: '机型档位 ¥0-1000，填充率仅 88.6% 且崩溃率 1.86%，影响收入与留存',
    arpu: 0.21, ret7: 15.8, imp: 11.2, ltv30: 3.20, owner: '刘洋', status: '已就绪',
    rules: ['device_tier = ¥0-1000', 'os_version ≤ Android 11', '近 7 日 AdError 次数 ≥ 3'],
    device: [['¥0-1000', 100]],
    province: [['河南', 12.4], ['河北', 10.2], ['安徽', 9.6], ['广西', 8.8], ['云南', 8.2]],
    channel: [['快手磁力', 26.8], ['百度信息流', 20.4], ['巨量引擎', 28.6], ['腾讯广告', 13.4], ['自然量', 6.4]]
  },
  {
    id: 'sg_007', name: '一线+新一线高 eCPM 用户', count: 92400, share: 11.2, type: '规则分群', updated: '2026-10-25 08:00',
    desc: 'eCPM ¥21-26，适合加大激励视频密度与品牌广告测试',
    arpu: 0.72, ret7: 22.8, imp: 31.6, ltv30: 6.84, owner: '刘洋', status: '已就绪',
    rules: ['city_tier ∈ 一线 / 新一线', 'device_tier ≥ ¥3000', '近 7 日 AdComplete 次数 ≥ 8'],
    device: [['¥5000+', 38.6], ['¥3000-5000', 34.2], ['¥2000-3000', 18.4], ['¥1000-2000', 7.2], ['¥0-1000', 1.6]],
    province: [['广东', 18.6], ['江苏', 11.4], ['浙江', 11.2], ['北京', 9.8], ['上海', 9.4]],
    channel: [['应用商店', 26.4], ['腾讯广告', 22.8], ['巨量引擎', 21.6], ['自然量', 12.4], ['快手磁力', 9.2]]
  },
  {
    id: 'sg_008', name: '游客未登录用户', count: 683600, share: 82.7, type: '规则分群', updated: '2026-10-25 08:00',
    desc: '未绑定账号，跨设备追剧体验差，D7 留存低于登录用户 18.6pt',
    arpu: 0.38, ret7: 18.2, imp: 21.4, ltv30: 4.12, owner: '王雪', status: '已就绪',
    rules: ['login_status = 游客', '近 30 日 LoginSuccess 次数 = 0'],
    device: [['¥1000-2000', 30.2], ['¥0-1000', 27.6], ['¥2000-3000', 20.4], ['¥3000-5000', 14.2], ['¥5000+', 7.6]],
    province: [['广东', 12.2], ['河南', 8.8], ['山东', 8.2], ['四川', 7.4], ['河北', 6.8]],
    channel: [['巨量引擎', 35.2], ['快手磁力', 18.6], ['腾讯广告', 17.4], ['百度信息流', 10.2], ['自然量', 8.6]]
  },
  {
    id: 'sg_009', name: '无填充受损用户', count: 64200, share: 7.8, type: '规则分群', updated: '2026-10-25 08:00',
    desc: '当日 AdError(no_fill) ≥3 次，直接损失曝光，应补充备用广告源',
    arpu: 0.26, ret7: 16.8, imp: 9.6, ltv30: 2.86, owner: '刘洋', status: '已就绪',
    rules: ['当日 AdError error_code = 2001 次数 ≥ 3', 'network_type ∈ 4G / 弱网'],
    device: [['¥0-1000', 38.4], ['¥1000-2000', 29.6], ['¥2000-3000', 17.2], ['¥3000-5000', 10.4], ['¥5000+', 4.4]],
    province: [['河南', 11.8], ['河北', 10.4], ['云南', 9.2], ['广西', 8.8], ['甘肃', 7.6]],
    channel: [['快手磁力', 27.4], ['百度信息流', 21.8], ['巨量引擎', 26.2], ['腾讯广告', 14.6], ['自然量', 6.8]]
  },
  {
    id: 'sg_010', name: 'Push 可触达用户', count: 486200, share: 58.8, type: '规则分群', updated: '2026-10-25 08:00',
    desc: '已授予通知权限且近 7 日 Push 点击 ≥1，是召回主阵地',
    arpu: 0.48, ret7: 26.4, imp: 26.8, ltv30: 5.24, owner: '李敏', status: '已就绪',
    rules: ['NotificationEnable = 已开启', '近 7 日 PushClick 次数 ≥ 1', 'device_tier ≥ ¥1000'],
    device: [['¥2000-3000', 24.6], ['¥1000-2000', 24.2], ['¥3000-5000', 22.8], ['¥5000+', 16.4], ['¥0-1000', 12.0]],
    province: [['广东', 13.4], ['江苏', 8.2], ['山东', 8.0], ['浙江', 7.6], ['四川', 7.2]],
    channel: [['巨量引擎', 32.4], ['腾讯广告', 21.2], ['应用商店', 16.8], ['快手磁力', 14.6], ['自然量', 8.4]]
  },
  {
    id: 'sg_011', name: '新增未留存用户', count: 161000, share: 19.5, type: '规则分群', updated: '2026-10-25 08:00',
    desc: '首日新增但 D1 未回访，占新增 62.6%，需复盘素材与首集体验',
    arpu: 0.06, ret7: 0, imp: 3.4, ltv30: 0.42, owner: '王雪', status: '已就绪',
    rules: ['is_new_user = 是', '次日 AppStart 次数 = 0', '首日 EpisodeFinish 次数 ≤ 1'],
    device: [['¥0-1000', 33.6], ['¥1000-2000', 30.4], ['¥2000-3000', 19.8], ['¥3000-5000', 11.2], ['¥5000+', 5.0]],
    province: [['河南', 10.8], ['河北', 9.6], ['安徽', 9.2], ['广西', 8.4], ['江西', 7.8]],
    channel: [['快手磁力', 24.6], ['百度信息流', 22.8], ['巨量引擎', 28.4], ['腾讯广告', 14.2], ['自然量', 6.4]]
  },
  {
    id: 'sg_012', name: '海外版用户（东南亚 / 北美）', count: 38600, share: 4.7, type: '规则分群', updated: '2026-10-25 08:00',
    desc: '海外版独立归因，eCPM ¥12.8，以 AdMob / Mintegral 为主',
    arpu: 0.34, ret7: 19.6, imp: 18.4, ltv30: 3.62, owner: '陈昊', status: '已就绪',
    rules: ['app_id = 星河海外版', 'ip_country ∉ 中国大陆', 'ad_source ∈ admob / mintegral'],
    device: [['¥1000-2000', 34.2], ['¥2000-3000', 26.4], ['¥3000-5000', 21.8], ['¥5000+', 11.6], ['¥0-1000', 6.0]],
    province: [['东南亚', 46.2], ['北美', 28.4], ['其他', 25.4]],
    channel: [['Google Ads', 42.6], ['自然量', 24.8], ['Meta', 18.6], ['其他', 14.0]]
  }
];

/* =========================================================
   留存深化
   ========================================================= */
D.retentionCurve = [37.4, 31.2, 28.4, 25.6, 23.4, 21.2, 19.2, 18.4, 17.7, 17.0, 16.4, 15.8, 15.3, 14.8, 14.1, 13.6, 13.1, 12.7, 12.3, 11.9, 11.6, 11.3, 11.0, 10.7, 10.5, 10.3, 10.1, 10.0, 9.9, 9.8];
/* 累计人均广告收入 LTV（元）＝ 留存人日 × 活跃日 ARPU ¥0.94 */
D.ltvCurve = [0.37, 0.66, 0.93, 1.17, 1.39, 1.59, 1.77, 1.94, 2.11, 2.27, 2.43, 2.58, 2.73, 2.86, 2.99, 3.12, 3.24, 3.36, 3.47, 3.57, 3.70, 3.80, 3.90, 4.00, 4.10, 4.19, 4.28, 4.38, 4.47, 4.58];
const _rc = seedRand(20261026);
D.retentionCompare = {
  lastWeek: D.retentionCurve.map(v => +(v * (0.94 + _rc() * 0.04)).toFixed(1)),
  lastMonth: D.retentionCurve.map(v => +(v * (0.87 + _rc() * 0.06)).toFixed(1))
};

/* 分群留存对比：[D1, D3, D7, D14, D30] */
D.retentionByTier = [
  { name: '¥0-1000 低端机', data: [32.1, 24.6, 15.8, 10.2, 6.4] },
  { name: '¥1000-2000', data: [35.6, 27.8, 18.4, 12.1, 7.8] },
  { name: '¥2000-3000', data: [39.2, 30.4, 20.6, 13.8, 9.0] },
  { name: '¥3000-5000', data: [42.4, 33.2, 22.8, 15.4, 10.2] },
  { name: '¥5000+ 高端机', data: [45.8, 36.1, 24.9, 16.8, 11.4] }
];
D.retentionByCity = [
  { name: '一线城市', data: [40.2, 31.0, 21.2, 14.2, 9.6] },
  { name: '新一线城市', data: [38.6, 29.6, 20.1, 13.4, 9.0] },
  { name: '二线城市', data: [37.4, 28.4, 19.2, 12.8, 8.6] },
  { name: '三线城市', data: [36.2, 27.2, 18.2, 12.0, 8.0] },
  { name: '四线及以下', data: [35.1, 26.1, 17.4, 11.4, 7.6] }
];
/* 首日行为对留存的影响 —— 关键洞察 */
D.retentionByBehavior = [
  { name: '首日未看广告解锁', data: [18.2, 10.4, 5.8, 3.2, 1.8], note: '未解锁 = 未进入追剧循环' },
  { name: '首日解锁 1-2 次', data: [42.6, 33.8, 24.2, 16.8, 11.2], note: '基线' },
  { name: '首日解锁 3-5 次', data: [58.4, 48.6, 37.2, 27.4, 19.6], note: '留存提升 18.0pt' },
  { name: '首日解锁 6-10 次', data: [64.2, 55.4, 44.8, 34.2, 25.4], note: '核心粘性人群' },
  { name: '首日解锁 10 次以上', data: [68.6, 60.2, 50.4, 39.6, 30.2], note: 'D30 留存 30.2%' }
];
/* 首日观看集数对留存的影响 */
D.retentionByEpisode = [
  { name: '首日 1-2 集', data: [22.4, 13.6, 7.8, 4.6, 2.6] },
  { name: '首日 3-5 集', data: [38.2, 28.4, 18.6, 12.4, 8.2] },
  { name: '首日 6-10 集', data: [52.6, 43.2, 32.4, 23.6, 16.8] },
  { name: '首日 11-20 集', data: [61.4, 52.8, 42.6, 32.4, 24.2] },
  { name: '首日 20 集以上', data: [66.8, 58.4, 48.2, 37.8, 28.6] }
];
/* 渠道留存 × LTV（散点用） */
D.channelRetLtv = [
  { name: '小米应用商店', ret7: 30.1, ltv30: 5.06, act: 17200 },
  { name: '华为应用市场', ret7: 29.4, ltv30: 5.09, act: 15100 },
  { name: 'Apple Search Ads', ret7: 28.2, ltv30: 5.52, act: 8600 },
  { name: '腾讯广告', ret7: 25.2, ltv30: 4.42, act: 56400 },
  { name: '巨量引擎', ret7: 23.6, ltv30: 4.42, act: 89100 },
  { name: 'Google Ads', ret7: 24.1, ltv30: 4.25, act: 5600 },
  { name: '快手磁力', ret7: 21.1, ltv30: 4.21, act: 38600 },
  { name: '知乎/微博', ret7: 18.6, ltv30: 3.80, act: 7400 },
  { name: '百度信息流', ret7: 19.4, ltv30: 3.99, act: 17800 }
];
/* 渠道留存（统一为 D1 / D3 / D7 / D14 / D30 五档） */
D.retentionByChannel = [
  { name: '小米应用商店', data: [46.2, 30.1, 17.6, 12.4, 8.6] },
  { name: '华为应用市场', data: [45.1, 29.4, 17.1, 12.1, 8.4] },
  { name: 'Apple Search Ads', data: [43.8, 28.2, 16.4, 11.8, 8.2] },
  { name: '腾讯广告', data: [40.1, 25.2, 14.4, 10.2, 7.0] },
  { name: '巨量引擎', data: [38.2, 23.6, 13.4, 9.4, 6.4] },
  { name: 'Google Ads', data: [36.4, 21.6, 12.1, 8.6, 5.9] },
  { name: '快手磁力', data: [35.4, 21.1, 11.8, 8.2, 5.6] },
  { name: '百度信息流', data: [33.6, 19.4, 10.4, 7.2, 4.8] },
  { name: '知乎 / 微博', data: [31.2, 17.8, 9.4, 6.4, 4.2] }
];

/* 回访入口 */
D.returnPath = [
  { name: 'Push 消息唤醒', v: 32.4, color: '#2f6bff' },
  { name: '桌面图标直达', v: 28.6, color: '#17b26a' },
  { name: '分享链接回流', v: 12.4, color: '#f5a623' },
  { name: '广告再营销', v: 9.6, color: '#7a4ddd' },
  { name: '应用商店 / 搜索', v: 8.2, color: '#00b8d9' },
  { name: '其他', v: 8.8, color: '#8f959e' }
];
/* 留存预警 */
D.retentionWarn = [
  { obj: '快手磁力 · 极速版计划', metric: 'D7 留存', val: '13.2%', delta: '-2.4pt', thr: '≥ 15%', level: 'red', act: '缩量并更换素材' },
  { obj: 'Android 10 及以下机型', metric: 'D1 留存', val: '28.6%', delta: '-3.1pt', thr: '≥ 32%', level: 'red', act: '低端机性能优化' },
  { obj: '百度信息流', metric: 'D3 留存', val: '19.4%', delta: '-1.2pt', thr: '≥ 20%', level: 'orange', act: '收紧人群包' },
  { obj: '首日未解锁用户', metric: 'D1 留存', val: '18.2%', delta: '-19.2pt', thr: '≥ 30%', level: 'red', act: '首集免费集数 +2' },
  { obj: '¥0-1000 机型档', metric: '广告填充率', val: '88.6%', delta: '-1.8pt', thr: '≥ 92%', level: 'orange', act: '补充备用广告源' },
  { obj: '四线及以下城市', metric: 'D7 留存', val: '17.4%', delta: '-0.6pt', thr: '≥ 18%', level: 'orange', act: '下沉题材内容补充' }
];
/* 留存明细补充行（近期日期 D30 未到期） */
D.retention = D.retention.concat([
  { name: '10-04', base: 11260, vals: [41.8, 30.8, 21.2, 15.6] },
  { name: '10-05', base: 10840, vals: [40.2, 29.6, 20.4, 14.8] },
  { name: '10-06', base: 12480, vals: [42.6, 31.8, 22.1, 16.2] },
  { name: '10-07', base: 11860, vals: [41.2, 30.2, 20.8] },
  { name: '10-08', base: 12640, vals: [43.4, 32.4] },
  { name: '10-09', base: 13280, vals: [42.8] }
]);

/* ============================================================
   通知与触达 / 用户回流体系
   Push 通知 · 桌面快捷方式 · 桌面组件 · 短信 / 站外召回
   ============================================================ */

/* --- 1) 事件分组：把 Push / 深链事件独立成「通知与触达」分组 --- */
const MOVE_KEYS = ['PushArrive', 'PushClick', 'PushClose', 'DeepLinkOpen'];
const _recallGrp = D.eventTree.find(g => g.group === '互动与召回');
_recallGrp.items = _recallGrp.items.filter(i => MOVE_KEYS.indexOf(i.k) < 0);

D.notifyGroup = {
  group: '通知与触达', icon: '🔔', items: [
    { k: 'NotifyAuthPopupShow', n: '通知授权弹窗曝光', c: 242600 },
    { k: 'NotifyAuthAllow', n: '点击允许通知', c: 158300 },
    { k: 'NotifyAuthDeny', n: '点击拒绝通知', c: 62400 },
    { k: 'NotifyAuthIgnore', n: '授权弹窗忽略', c: 21900 },
    { k: 'NotifyEnable', n: '通知权限已开启', c: 151200 },
    { k: 'NotifyDisable', n: '通知权限关闭', c: 8600 },
    { k: 'PushArrive', n: 'Push 到达', c: 1148200 },
    { k: 'PushShow', n: 'Push 展示（通知栏）', c: 986400 },
    { k: 'PushClick', n: 'Push 点击', c: 74600 },
    { k: 'PushClose', n: 'Push 划掉 / 关闭', c: 164200 },
    { k: 'DeepLinkOpen', n: '深链唤起 App', c: 61800 },
    { k: 'ShortcutGuideShow', n: '桌面快捷方式引导曝光', c: 186400 },
    { k: 'ShortcutAddClick', n: '点击添加快捷方式', c: 68200 },
    { k: 'ShortcutAddSuccess', n: '快捷方式添加成功', c: 52400 },
    { k: 'ShortcutLaunch', n: '快捷方式启动 App', c: 102600 },
    { k: 'WidgetAdd', n: '桌面组件添加', c: 42800 },
    { k: 'WidgetExpose', n: '桌面组件曝光', c: 386400 },
    { k: 'WidgetClick', n: '桌面组件点击', c: 68400 },
    { k: 'SmsSend', n: '召回短信发送', c: 128600 },
    { k: 'SmsClick', n: '召回短信点击', c: 2700 }
  ]
};
D.eventTree.splice(5, 0, D.notifyGroup);

/* --- 2) 同步事件字典（分组归属 / 负责人 / 状态） --- */
GROUP_META['通知与触达'] = { type: '代码埋点', owner: '李敏' };
Object.assign(EV_OVERRIDE, {
  NotifyAuthPopupShow: { status: '已上线' },
  NotifyAuthDeny: { status: '灰度中' },
  NotifyDisable: { status: '灰度中' },
  PushShow: { status: '灰度中' },
  ShortcutGuideShow: { check: '参数异常' },
  ShortcutAddSuccess: { status: '灰度中' },
  WidgetAdd: { status: '灰度中' },
  WidgetExpose: { check: '上报延迟' },
  SmsSend: { status: '灰度中' }
});
const _dr2 = seedRand(20261026);
const NOTIFY_KEYS = D.notifyGroup.items.map(i => i.k);
D.eventDict = D.eventDict.filter(e => NOTIFY_KEYS.indexOf(e.key) < 0).concat(
  D.notifyGroup.items.map(it => {
    const o = EV_OVERRIDE[it.k] || {};
    return {
      key: it.k, name: it.n, group: '通知与触达', type: '代码埋点',
      status: o.status || '已上线',
      params: 8 + Math.floor(_dr2() * 12),
      today: it.c,
      last: `2026-10-25 ${String(20 + Math.floor(_dr2() * 3)).padStart(2, '0')}:${String(Math.floor(_dr2() * 60)).padStart(2, '0')}:${String(Math.floor(_dr2() * 60)).padStart(2, '0')}`,
      owner: '李敏', check: o.check || '正常'
    };
  })
);

/* --- 3) 关联链路 --- */
D.eventChains.push(
  { name: '通知授权链路', icon: '🔔', steps: ['NotifyAuthPopupShow', 'NotifyAuthAllow', 'NotifyEnable', 'PushArrive', 'PushClick', 'DeepLinkOpen', 'EpisodeStart'], desc: '授权率决定可触达人群上限，是回流的地基' },
  { name: '桌面快捷方式链路', icon: '🧩', steps: ['ShortcutGuideShow', 'ShortcutAddClick', 'ShortcutAddSuccess', 'ShortcutLaunch', 'EpisodeStart'], desc: '绕开 Push 授权的被动回流方式' },
  { name: '桌面组件唤醒链路', icon: '🔔', steps: ['WidgetAdd', 'WidgetExpose', 'WidgetClick', 'AppStart', 'EpisodeStart'], desc: '组件是"零推送"的高频回流入口，点击率 17.7%' }
);

/* --- 4) 事件关联 --- */
Object.assign(D.eventRelation, {
  NotifyAuthPopupShow: {
    up: ['AppStart'], down: ['NotifyAuthAllow', 'NotifyAuthDeny', 'NotifyAuthIgnore', 'NotifyEnable'],
    attrs: ['trigger_scene', 'popup_style', 'session_seq', 'is_first_install'],
    related: [
      { ev: 'NotifyAuthAllow', rate: 65.2, desc: '点击"允许"占比' },
      { ev: 'NotifyAuthDeny', rate: 25.7, desc: '主动拒绝，二次引导几乎无效' },
      { ev: 'NotifyAuthIgnore', rate: 9.0, desc: '弹窗未操作，可再次触发' },
      { ev: 'NotifyEnable', rate: 62.3, desc: '端到端授权成功（含系统层确认）' }
    ]
  },
  PushClick: {
    up: ['PushArrive', 'PushShow'], down: ['DeepLinkOpen', 'EpisodeStart', 'AdShow'],
    attrs: ['push_id', 'push_scene', 'vendor', 'send_hour'],
    related: [
      { ev: 'DeepLinkOpen', rate: 82.8, desc: '点击后成功唤起 App' },
      { ev: 'EpisodeStart', rate: 71.4, desc: '点击后开始播放剧集' },
      { ev: 'AdShow', rate: 64.2, desc: '点击后当日看到广告' }
    ]
  },
  WidgetClick: {
    up: ['WidgetExpose'], down: ['AppStart', 'EpisodeStart'],
    attrs: ['widget_type', 'click_target', 'drama_id'],
    related: [
      { ev: 'AppStart', rate: 91.8, desc: '点击组件后唤起 App' },
      { ev: 'EpisodeStart', rate: 78.4, desc: '直接进入追剧播放' }
    ]
  },
  ShortcutAddSuccess: {
    up: ['ShortcutGuideShow', 'ShortcutAddClick'], down: ['ShortcutLaunch', 'EpisodeStart'],
    attrs: ['guide_scene', 'os_type', 'add_way'],
    related: [
      { ev: 'ShortcutLaunch', rate: 62.4, desc: '7 日内通过快捷方式启动' },
      { ev: 'EpisodeStart', rate: 88.6, desc: '快捷启动后直接追剧' }
    ]
  }
});

/* --- 5) 事件参数定义 --- */
Object.assign(D.eventParams, {
  NotifyAuthPopupShow: [
    { p: 'trigger_scene', t: 'ENUM', req: '必填', d: 'first_launch / episode_finish / unlock_success / breakpoint / app_exit' },
    { p: 'popup_style', t: 'ENUM', req: '必填', d: 'system（系统弹窗）/ in_app（自定义预授权弹窗）' },
    { p: 'is_first_install', t: 'BOOL', req: '必填', d: '是否首次安装后首次弹窗' },
    { p: 'session_seq', t: 'NUMBER', req: '自动', d: '第几次会话触发' },
    { p: 'os', t: 'ENUM', req: '自动', d: 'iOS / Android' }
  ],
  NotifyAuthAllow: [
    { p: 'trigger_scene', t: 'ENUM', req: '必填', d: '触发场景，同弹窗曝光事件' },
    { p: 'duration_ms', t: 'NUMBER', req: '选填', d: '从弹窗曝光到点击允许的耗时' },
    { p: 'os', t: 'ENUM', req: '自动', d: 'iOS / Android' },
    { p: 'is_system_granted', t: 'BOOL', req: '必填', d: '系统层是否真正授权（区分"点允许但未开系统权限"）' }
  ],
  PushArrive: [
    { p: 'push_id', t: 'STRING', req: '必填', d: '推送任务 ID，串联到达→展示→点击' },
    { p: 'push_scene', t: 'ENUM', req: '必填', d: 'breakpoint / new_drama / update / silent_recall / signin / interaction' },
    { p: 'vendor', t: 'ENUM', req: '必填', d: '通道：自建长连接 / 小米 / 华为 / OPPO / vivo / 荣耀 / APNs' },
    { p: 'push_type', t: 'ENUM', req: '必填', d: 'notify / silent（静默）/ local（本地定时）' },
    { p: 'segment_id', t: 'STRING', req: '选填', d: '定向分群 ID' }
  ],
  PushClick: [
    { p: 'push_id', t: 'STRING', req: '必填', d: '推送任务 ID' },
    { p: 'push_scene', t: 'ENUM', req: '必填', d: '推送场景' },
    { p: 'click_type', t: 'ENUM', req: '必填', d: 'body（正文）/ action（按钮）/ clear（清除时误触）' },
    { p: 'send_hour', t: 'NUMBER', req: '自动', d: '发送小时，用于分时效果归因' },
    { p: 'deeplink_url', t: 'STRING', req: '选填', d: '跳转链接，如 xh://drama/d_10231/ep/9' }
  ],
  DeepLinkOpen: [
    { p: 'push_id', t: 'STRING', req: '选填', d: '来源推送任务（桌面图标来源为空）' },
    { p: 'source', t: 'ENUM', req: '必填', d: 'push / shortcut / widget / sms / share / remarketing' },
    { p: 'target_page', t: 'STRING', req: '必填', d: '落地页：drama_detail / player / home / signin' },
    { p: 'is_cold_start', t: 'BOOL', req: '自动', d: '是否冷启动唤起' },
    { p: 'drama_id', t: 'STRING', req: '选填', d: '落地剧集' }
  ],
  ShortcutAddSuccess: [
    { p: 'guide_scene', t: 'ENUM', req: '必填', d: 'episode_finish / unlock_success / home_banner / settings' },
    { p: 'os_type', t: 'ENUM', req: '必填', d: 'Android（直接加桌面图标）/ iOS（快捷指令）' },
    { p: 'add_way', t: 'ENUM', req: '必填', d: 'auto（一键添加）/ manual（手动引导）' },
    { p: 'duration_ms', t: 'NUMBER', req: '选填', d: '添加流程耗时' }
  ],
  WidgetAdd: [
    { p: 'widget_type', t: 'ENUM', req: '必填', d: 'progress_2x2（追剧进度）/ recommend_4x2（今日推荐）/ signin_1x1' },
    { p: 'add_scene', t: 'ENUM', req: '必填', d: 'episode_finish / long_press_icon / settings_guide' },
    { p: 'os_type', t: 'ENUM', req: '自动', d: 'iOS 14+ / Android 12+' }
  ],
  WidgetClick: [
    { p: 'widget_type', t: 'ENUM', req: '必填', d: '组件类型' },
    { p: 'click_target', t: 'ENUM', req: '必填', d: 'continue_play / drama_cover / signin_btn / refresh' },
    { p: 'drama_id', t: 'STRING', req: '选填', d: '目标剧集' },
    { p: 'episode_no', t: 'NUMBER', req: '选填', d: '断点集数' }
  ],
  SmsSend: [
    { p: 'sms_id', t: 'STRING', req: '必填', d: '短信任务 ID' },
    { p: 'silent_days', t: 'NUMBER', req: '必填', d: '沉默天数分层：7 / 14 / 30 / 60' },
    { p: 'vendor', t: 'ENUM', req: '必填', d: '短信通道商' },
    { p: 'cost', t: 'NUMBER', req: '选填', d: '单条成本（元）' }
  ]
});

/* ============================================================
   通知权限与触达分析数据
   ============================================================ */

/* 通知授权漏斗（近 30 日新装用户口径） */
D.notifyFunnel = [
  { name: '新装启动用户', value: 257200 },
  { name: '授权弹窗曝光', value: 242600 },
  { name: '点击「允许」', value: 158300 },
  { name: '系统层授权成功', value: 151200 },
  { name: '7 日内收到 Push', value: 148600 },
  { name: '点击过 Push', value: 42800 },
  { name: 'Push 回流并播放', value: 36400 }
];

/* 未授权原因构成（合计 = 257,200 - 151,200 = 106,000） */
D.notifyLoss = [
  { name: '主动点击「拒绝」', value: 62400, color: '#f54a45' },
  { name: '弹窗曝光但未操作', value: 21900, color: '#f5a623' },
  { name: '系统设置中已关闭', value: 12800, color: '#7a4ddd' },
  { name: '未触达弹窗（时机未满足）', value: 6600, color: '#00b8d9' },
  { name: '系统 / 机型不支持', value: 2300, color: '#c9cfd8' }
];

/* 授权时机效果对比 */
D.notifyScene = [
  { scene: '首次解锁成功后', exp: 24800, allow: 78.4, sys: 74.2, note: '已全量：用户已获得价值，授权意愿最高' },
  { scene: '首集完播后', exp: 86400, allow: 71.6, sys: 67.8, note: '主力触发时机，覆盖量最大' },
  { scene: '追剧断点提醒时', exp: 18600, allow: 65.2, sys: 61.4, note: '结合"提醒我更新"场景' },
  { scene: '首次启动立即弹', exp: 128600, allow: 42.1, sys: 39.6, note: '对照组：用户尚无认知，拒绝率高' },
  { scene: '退出 App 前', exp: 12400, allow: 35.2, sys: 32.8, note: '体验干扰明显，已下线' }
];

/* 授权率 / 到达率 / 点击率 趋势（近 14 天） */
D.notifyTrend = {
  labels: DATES.slice(-14),
  authRate: [52.1, 52.6, 53.2, 52.8, 54.1, 54.6, 54.2, 55.1, 55.8, 56.4, 56.1, 57.2, 58.1, 58.8],
  arriveRate: [86.2, 86.8, 87.1, 86.4, 87.9, 88.2, 87.6, 88.4, 89.1, 89.6, 89.2, 90.4, 90.8, 91.4],
  ctr: [5.8, 5.9, 6.1, 6.0, 6.2, 6.4, 6.2, 6.3, 6.6, 6.8, 6.5, 6.7, 6.6, 6.5]
};

/* 授权率分布（可切换维度） */
D.notifyByOs = [
  { name: 'iOS', share: 39.6, auth: 64.2, arrive: 94.2, ctr: 7.1 },
  { name: 'Android', share: 60.4, auth: 55.6, arrive: 88.6, ctr: 6.1 }
];
D.notifyByTier = [
  { name: '¥0-1000', share: 26.4, auth: 51.2, arrive: 84.2, ctr: 5.2 },
  { name: '¥1000-2000', share: 28.6, auth: 56.4, arrive: 88.4, ctr: 6.2 },
  { name: '¥2000-3000', share: 21.8, auth: 59.8, arrive: 90.6, ctr: 6.6 },
  { name: '¥3000-5000', share: 14.2, auth: 62.1, arrive: 92.4, ctr: 7.0 },
  { name: '¥5000+', share: 9.0, auth: 65.4, arrive: 94.8, ctr: 7.4 }
];
D.notifyByChannel = [
  { name: '小米应用商店', share: 11.2, auth: 68.4, arrive: 96.2, ctr: 7.8 },
  { name: '华为应用市场', share: 9.8, auth: 66.2, arrive: 95.4, ctr: 7.4 },
  { name: 'Apple Search Ads', share: 4.6, auth: 71.2, arrive: 97.1, ctr: 8.2 },
  { name: '腾讯广告', share: 18.6, auth: 60.4, arrive: 91.2, ctr: 6.8 },
  { name: '巨量引擎', share: 34.6, auth: 57.2, arrive: 89.4, ctr: 6.4 },
  { name: '快手磁力', share: 12.4, auth: 52.6, arrive: 86.2, ctr: 5.6 },
  { name: '百度信息流', share: 5.6, auth: 48.4, arrive: 84.6, ctr: 5.1 },
  { name: '知乎 / 微博', share: 3.2, auth: 44.2, arrive: 82.4, ctr: 4.6 }
];

/* Push 场景效果 */
D.pushScene = [
  { scene: '追剧断点提醒', icon: '🎬', send: 386400, arrive: 91.2, ctr: 11.2, back: 82.4, imp: 4.2, rev: 18640, tip: '效果最优，应作为主力自动任务' },
  { scene: '新剧上线通知', icon: '🆕', send: 286400, arrive: 89.6, ctr: 7.4, back: 68.2, imp: 3.1, rev: 9820, tip: '按题材偏好定向可再提升 1.5pt' },
  { scene: '版本更新提醒', icon: '⬆️', send: 186400, arrive: 88.4, ctr: 6.8, back: 61.4, imp: 2.6, rev: 6240, tip: '仅发沉默用户，活跃用户不发' },
  { scene: '互动提醒（评论/点赞）', icon: '💬', send: 86400, arrive: 85.4, ctr: 5.1, back: 56.2, imp: 2.4, rev: 2060, tip: '低频次，需做合并去重' },
  { scene: '签到 / 做任务', icon: '📅', send: 128600, arrive: 86.2, ctr: 4.6, back: 52.8, imp: 2.2, rev: 3180, tip: '收益边际递减，建议降频' },
  { scene: '沉默召回（7 日未活跃）', icon: '😴', send: 212400, arrive: 84.6, ctr: 3.2, back: 41.6, imp: 1.8, rev: 4820, tip: 'CTR 低但绝对增量大，配合权益' }
];

/* 分时点击率 */
D.pushHour = {
  labels: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'],
  ctr: [0.8, 0.5, 0.4, 1.2, 3.1, 4.2, 5.2, 4.8, 5.6, 7.4, 9.1, 6.8],
  back: [0.6, 0.4, 0.3, 0.9, 2.4, 3.3, 4.1, 3.8, 4.4, 5.9, 7.2, 5.4]
};

/* Push 任务列表 */
D.pushTasks = [
  { id: 'ps_10241', name: '每日追剧断点提醒', scene: '追剧断点提醒', seg: '断点未看完用户', send: 386400, arrive: 91.2, ctr: 11.2, back: 42400, imp: 4.2, rev: 18640, status: '运行中', time: '每日 20:00', freq: '每日 1 条', owner: '李敏' },
  { id: 'ps_10238', name: '新剧上线 · 都市甜宠', scene: '新剧上线通知', seg: '甜宠偏好用户', send: 146200, arrive: 90.4, ctr: 8.1, back: 12800, imp: 3.4, rev: 5240, status: '运行中', time: '2026-10-25 12:00', freq: '单次', owner: '李敏' },
  { id: 'ps_10236', name: '新剧上线 · 悬疑反转', scene: '新剧上线通知', seg: '悬疑偏好用户', send: 140200, arrive: 88.8, ctr: 6.7, back: 9200, imp: 2.8, rev: 4580, status: '已结束', time: '2026-10-25 12:00', freq: '单次', owner: '李敏' },
  { id: 'ps_10230', name: '7 日沉默召回 · 权益版', scene: '沉默召回', seg: '沉默 7 日用户', send: 212400, arrive: 84.6, ctr: 3.2, back: 8600, imp: 1.8, rev: 4820, status: '运行中', time: '每日 19:30', freq: '每 3 日 1 条', owner: '陈昊' },
  { id: 'ps_10228', name: '签到提醒', scene: '签到 / 做任务', seg: '全量已授权', send: 128600, arrive: 86.2, ctr: 4.6, back: 5400, imp: 2.2, rev: 3180, status: '观察中', time: '每日 08:30', freq: '每日 1 条', owner: '陈昊' },
  { id: 'ps_10225', name: '版本更新 v6.3.0', scene: '版本更新提醒', seg: 'v6.2 及以下', send: 186400, arrive: 88.4, ctr: 6.8, back: 11200, imp: 2.6, rev: 6240, status: '已结束', time: '2026-10-22 10:00', freq: '单次', owner: '张涛' },
  { id: 'ps_10220', name: '评论被回复提醒', scene: '互动提醒', seg: '近 7 日评论用户', send: 86400, arrive: 85.4, ctr: 5.1, back: 3800, imp: 2.4, rev: 2060, status: '运行中', time: '实时触发', freq: '实时 · 限 2 条/日', owner: '周敏' },
  { id: 'ps_10215', name: '追剧更新提醒（用户订阅）', scene: '追剧断点提醒', seg: '已订阅更新用户', send: 68400, arrive: 93.6, ctr: 13.4, back: 9200, imp: 4.8, rev: 4180, status: '运行中', time: '实时触发', freq: '实时', owner: '李敏' },
  { id: 'ps_10210', name: '30 日流失召回 · 短信兜底', scene: '沉默召回', seg: '沉默 30 日 · 无 Push 授权', send: 128600, arrive: 96.4, ctr: 2.1, back: 2700, imp: 1.4, rev: 920, status: '观察中', time: '每周三 15:00', freq: '每周 1 条', owner: '陈昊' },
  { id: 'ps_10198', name: '桌面组件引导（AB 实验 B 组）', scene: '组件引导', seg: '完播用户 · 实验 B', send: 42800, arrive: 92.1, ctr: 18.6, back: 6400, imp: 3.6, rev: 2860, status: '实验中', time: '触发式', freq: '单次', owner: '李敏' }
];

/* 桌面快捷方式 */
D.shortcut = {
  funnel: [
    { name: '引导曝光', value: 186400 },
    { name: '点击去添加', value: 68200 },
    { name: '添加成功', value: 52400 },
    { name: '7 日内使用启动', value: 32700 },
    { name: '形成周活习惯', value: 18600 }
  ],
  byScene: [
    { name: '首集完播后浮层', exp: 86400, click: 42.6, ok: 31.8 },
    { name: '解锁成功后引导', exp: 48600, click: 38.2, ok: 28.4 },
    { name: '首页横幅', exp: 32800, click: 21.4, ok: 14.2 },
    { name: '设置页入口', exp: 18600, click: 12.8, ok: 9.6 }
  ],
  byOs: [
    { name: 'Android（桌面图标）', cov: 8.6, launch: 92600, ok: 76.8 },
    { name: 'iOS（快捷指令）', cov: 3.2, launch: 10000, ok: 41.2 }
  ],
  lift: { ret7: 34.2, ret7Base: 18.6, arpu: 0.61, arpuBase: 0.38, imp: 28.4, impBase: 22.1, ltv30: 7.06, ltv30Base: 4.58 }
};

/* 桌面组件 */
D.widget = {
  funnel: [
    { name: '组件引导曝光', value: 128600 },
    { name: '点击添加组件', value: 18600 },
    { name: '添加成功', value: 42800 },
    { name: '日均曝光', value: 386400 },
    { name: '日均点击', value: 68400 },
    { name: '唤起 App', value: 62800 }
  ],
  types: [
    { name: '追剧进度 2×2', add: 62.4, exp: 62.8, ctr: 21.4, back: 62.4 },
    { name: '今日推荐 4×2', add: 26.8, exp: 28.4, ctr: 12.6, back: 28.6 },
    { name: '签到卡 1×1', add: 10.8, exp: 8.8, ctr: 9.2, back: 9.0 }
  ],
  byOs: [
    { name: 'Android 12+', cov: 6.4, add: 28600, expPerDay: 9.4, ctr: 18.2 },
    { name: 'iOS 14+', cov: 3.8, add: 14200, expPerDay: 8.2, ctr: 16.8 }
  ],
  lift: { ret7: 41.6, ret7Base: 19.2, arpu: 0.72, arpuBase: 0.42, imp: 31.2, impBase: 23.0, ltv30: 8.14, ltv30Base: 4.58 }
};

/* 召回渠道效果对比 */
D.recallChannels = [
  { name: 'Push 推送', icon: '🔔', reach: 1148200, rate1: 89.3, rate2: 6.5, back: 61800, share: 32.4, cost: 0, arpu: 0.58, imp: 27.4, tag: '主力', color: '#2f6bff' },
  { name: '桌面图标 / 快捷方式', icon: '🧩', reach: 102600, rate1: 100, rate2: 41.6, back: 42600, share: 28.6, cost: 0, arpu: 0.61, imp: 28.4, tag: '免费·高质', color: '#17b26a' },
  { name: '分享链接回流', icon: '🔗', reach: 168400, rate1: 100, rate2: 14.2, back: 23800, share: 12.4, cost: 0, arpu: 0.46, imp: 21.2, tag: '带新', color: '#f5a623' },
  { name: '广告再营销', icon: '📢', reach: 186400, rate1: 100, rate2: 4.2, back: 18600, share: 9.6, cost: 1.86, arpu: 0.42, imp: 19.6, tag: '付费', color: '#7a4ddd' },
  { name: '应用商店 / 搜索', icon: '🔍', reach: 62400, rate1: 100, rate2: 26.4, back: 16400, share: 8.2, cost: 0, arpu: 0.52, imp: 24.6, tag: '自然', color: '#00b8d9' },
  { name: '召回短信', icon: '✉️', reach: 128600, rate1: 96.4, rate2: 2.1, back: 2700, share: 1.4, cost: 0.035, arpu: 0.34, imp: 14.2, tag: '兜底', color: '#f54a45' },
  { name: '其他', icon: '➖', reach: 82400, rate1: 100, rate2: 18.4, back: 14200, share: 7.4, cost: 0, arpu: 0.38, imp: 18.4, tag: '—', color: '#8f959e' }
];

/* 沉默用户召回漏斗（7 日未活跃） */
D.recallFunnel = [
  { name: '沉默用户（7 日未活跃）', value: 428600 },
  { name: '可触达（授权 / 有组件）', value: 286400 },
  { name: 'Push 到达', value: 264200 },
  { name: 'Push 展示', value: 218600 },
  { name: '点击', value: 42800 },
  { name: '唤起 App', value: 36400 },
  { name: '播放 ≥ 1 集', value: 28600 },
  { name: '当日看广告 ≥ 1 次', value: 18600 }
];

/* 授权 / 未授权 用户价值对比 */
D.recallLift = [
  { name: '通知已授权', dau: 486200, ret1: 46.8, ret7: 26.4, ret30: 13.8, imp: 27.4, arpu: 0.58, ltv30: 6.42, days: 11.4, color: '#2f6bff' },
  { name: '未授权 / 已关闭', dau: 340200, ret1: 22.4, ret7: 8.2, ret30: 3.6, imp: 16.8, arpu: 0.21, ltv30: 2.18, days: 4.2, color: '#f54a45' },
  { name: '已添加桌面快捷方式', dau: 52400, ret1: 52.4, ret7: 34.2, ret30: 18.6, imp: 28.4, arpu: 0.61, ltv30: 7.06, days: 13.2, color: '#17b26a' },
  { name: '已添加桌面组件', dau: 42800, ret1: 58.6, ret7: 41.6, ret30: 23.4, imp: 31.2, arpu: 0.72, ltv30: 8.14, days: 15.8, color: '#7a4ddd' }
];

/* 触达策略 A/B 实验 */
D.recallAB = [
  { name: '授权弹窗时机', a: '首次启动立即弹窗', b: '首次解锁成功后弹窗', metric: '授权率', av: '42.1%', bv: '78.4%', lift: '+36.3pt', win: 'B', res: '已全量', note: '用户先获得"免费看剧"价值，再索取权限，授权率接近翻倍' },
  { name: 'Push 文案', a: '通用文案「新剧上线啦」', b: '断点文案「《总裁的小娇妻》看到第 8 集，解锁继续」', metric: '点击率', av: '5.2%', bv: '11.2%', lift: '+6.0pt', win: 'B', res: '已全量', note: '带剧名 + 具体集数的断点文案 CTR 翻倍，是所有优化里 ROI 最高的' },
  { name: '桌面组件引导位', a: '首页横幅', b: '剧集完播后浮层', metric: '组件添加率', av: '2.1%', bv: '6.8%', lift: '+4.7pt', win: 'B', res: '灰度 30%', note: '完播瞬间是"还想看"意愿最强时刻，引导转化率是首页的 3.2 倍' },
  { name: '沉默召回权益', a: '纯文案召回', b: '文案 + 免广告解锁 2 集', metric: '回流率', av: '2.8%', bv: '4.6%', lift: '+1.8pt', win: 'B', res: '实验中', note: '权益让渡 2 集广告（约 ¥0.09）换回 LTV ¥2.18，ROI 24 倍' }
];

/* 触达行动建议 */
D.recallActions = [
  { lv: 'red', t: '首启弹窗授权率仅 42.1%', d: '把授权弹窗统一改为「首次解锁成功后」触发，预计整体授权率可从 58.8% 提升至 72%+，可触达池增加约 34 万人', g: '+34.2 万可触达', owner: '李敏' },
  { lv: 'red', t: 'Push 点击率 6.5% 低于行业 8%', d: '全量切换为「剧名 + 断点集数」文案模板，并按 20:00-21:00 高峰时段集中发送', g: 'CTR → 9%+, 日均 +1.8 万回流', owner: '李敏' },
  { lv: 'orange', t: '桌面组件渗透率仅 5.2%', d: '组件是唯一不需要 Push 授权的被动回流入口（点击率 17.7%），应在剧集完播后强制引导一次', g: '渗透 → 12%, D7 +2.4pt', owner: '周敏' },
  { lv: 'orange', t: '41.2% 用户完全不可触达', d: '对无 Push 授权用户优先引导添加桌面快捷方式（Android 添加率 8.6%），作为 Push 的替代通路', g: '+8.6% 被动回流覆盖', owner: '陈昊' },
  { lv: 'orange', t: '短信召回 CTR 仅 2.1%', d: '短信仅用于 30 日以上深度沉默且无 Push 授权的用户，配合「免广告解锁 2 集」权益', g: '单次成本 ¥0.035，ROI 24x', owner: '陈昊' }
];

/* ===========================================================
   事件分析 / 漏斗分析 / 广告变现 · 高保真交互数据层
   =========================================================== */
const _n = v => Math.round(v).toLocaleString('zh-CN');
const _pc = (a, b) => (b ? (a / b * 100).toFixed(1) : '0.0') + '%';

/* ---------- 事件分析：维度拆分数据集（可切换，真实生效） ---------- */
D.evDimSplit = {};
(function () {
  const tot = D.dimSplit.reduce((s, x) => s + x.v, 0);
  D.evDimSplit.channel = {
    title: '归因渠道', hint: '按首次归因渠道拆分（用户归属）', rowType: 'channel', barIdx: 1,
    head: ['归因渠道', '触发次数', '占比', '触发用户数', '人均次数', '人均广告收入', '分布'],
    rows: D.dimSplit.map(d => {
      const ch = D.channels.find(c => c.name === d.name);
      const users = Math.round(d.v * 0.62);
      return {
        name: d.name, sub: ch ? ch.sub : 'Organic',
        vals: [_n(d.v), _pc(d.v, tot), _n(users), (d.v / users).toFixed(2),
          '¥' + (ch ? (ch.rev1 / ch.act).toFixed(3) : '0.371')],
        bar: d.v / tot * 100
      };
    })
  };
  const slotTot = D.adSlots.reduce((s, x) => s + x.show, 0);
  D.evDimSplit.slot = {
    title: '广告位', hint: '仅广告类事件有效', rowType: 'slot', barIdx: 1,
    head: ['广告位', '触发次数', '占比', 'eCPM', '广告收入', '人均展示', '填充率'],
    rows: D.adSlots.map(s => ({
      name: s.name, sub: s.scene,
      vals: [_n(s.show), _pc(s.show, slotTot), '¥' + s.ecpm.toFixed(2),
        '¥' + _n(s.rev), s.cpu + ' 次', _pc(s.fill, s.req)],
      bar: s.show / slotTot * 100
    }))
  };
  const srcTot = D.adSources.reduce((s, x) => s + x.req, 0);
  D.evDimSplit.source = {
    title: '广告源', hint: '按广告聚合平台拆分', rowType: 'source', barIdx: 1,
    head: ['广告源', '请求量', '占比', '填充率', 'eCPM', '广告收入', '收入占比'],
    rows: D.adSources.map(s => ({
      name: s.name, sub: s.fillRate >= 92 ? '优质' : s.fillRate >= 88 ? '中等' : '待优化',
      vals: [_n(s.req), _pc(s.req, srcTot), s.fillRate + '%', '¥' + s.ecpm.toFixed(1),
        '¥' + _n(s.rev), _pc(s.rev, D.adSources.reduce((a, b) => a + b.rev, 0))],
      bar: s.req / srcTot * 100
    }))
  };
  const SCENES = [
    ['解锁剧集 unlock_episode', 0.624, 22.4], ['冷启动 cold_start', 0.156, 12.6],
    ['剧集退出 episode_exit', 0.098, 9.8], ['首页信息流 home_feed', 0.072, 5.4],
    ['签到双倍 signin', 0.031, 18.2], ['追剧提醒 remind', 0.019, 16.4]
  ];
  const scTot = D.summary.imp;
  D.evDimSplit.scene = {
    title: '触发场景', hint: 'scene 参数取值分布', barIdx: 1,
    head: ['触发场景', '触发次数', '占比', 'eCPM', '广告收入', '人均次数'],
    rows: SCENES.map(s => {
      const v = Math.round(scTot * s[1]);
      return {
        name: s[0].split(' ')[0], sub: s[0].split(' ')[1],
        vals: [_n(v), _pc(v, scTot), '¥' + s[2].toFixed(1), '¥' + _n(v * s[2] / 1000),
          (v / (D.summary.dau * s[1] * 0.62)).toFixed(2)],
        bar: s[1] * 100
      };
    })
  };
  const drTot = D.dramas.reduce((s, x) => s + x.imp, 0);
  D.evDimSplit.drama = {
    title: '剧集', hint: '按当前播放剧集拆分', rowType: 'drama', barIdx: 1,
    head: ['剧集', '触发次数', '占比', '完播率', '解锁率', '广告收入', 'ARPU'],
    rows: D.dramas.map(d => ({
      name: d.name, sub: d.eps + ' 集',
      vals: [_n(d.imp), _pc(d.imp, drTot), d.finish + '%', d.unlock + '%',
        '¥' + _n(d.rev), '¥' + (d.rev / d.uv).toFixed(3)],
      bar: d.imp / drTot * 100
    }))
  };
  D.evDimSplit.model = {
    title: '机型', hint: '按设备机型拆分（TOP 10）', rowType: 'model', barIdx: 1,
    head: ['机型', '触发次数', '占比', '档位', 'eCPM', '次留', '崩溃率'],
    rows: D.deviceModels.slice(0, 10).map(m => {
      const v = Math.round(D.summary.dau * m.share / 100 * 23);
      return {
        name: m.name, sub: m.tier,
        vals: [_n(v), _pc(v, D.summary.imp), '¥' + m.ecpm.toFixed(1), m.ret1 + '%',
          (m.tier === '¥0-1000' ? 1.86 : m.tier === '¥1000-2000' ? 0.94 : 0.42).toFixed(2) + '%'],
        bar: m.share
      };
    })
  };
  D.evDimSplit.city = {
    title: '城市线级', hint: '按 IP 归属城市线级拆分', barIdx: 1,
    head: ['城市线级', '触发次数', '占比', 'eCPM', 'ARPU', '次留'],
    rows: D.cityTier.map(t => {
      const v = Math.round(D.summary.imp * t.share / 100);
      return {
        name: t.name, sub: 'IP 归属',
        vals: [_n(v), t.share + '%', '¥' + t.ecpm.toFixed(1), '¥' + t.arpu.toFixed(2), t.ret1 + '%'],
        bar: t.share
      };
    })
  };
})();

/* ---------- 事件分析：数值分布（人均次数分布） ---------- */
D.evDist = [
  { name: '1 次', v: 42.6 }, { name: '2-3 次', v: 24.8 }, { name: '4-6 次', v: 14.2 },
  { name: '7-10 次', v: 8.4 }, { name: '11-20 次', v: 6.2 }, { name: '20 次以上', v: 3.8 }
];

/* ---------- 漏斗分析：分维度对比 / 流失去向 ---------- */
D.funnelSplit = {
  channel: {
    title: '归因渠道', rowType: 'channel', head: D.funnelByChannelLabels,
    rows: D.funnelByChannel.map(c => ({ name: c.name, vals: c.steps }))
  },
  slot: {
    title: '广告位', rowType: 'slot', head: D.funnelBySlotLabels,
    rows: D.funnelBySlot.map(c => ({ name: c.name, vals: c.steps }))
  },
  source: {
    title: '广告源', rowType: 'source', head: ['请求量', '填充成功', '广告展示', '完整播放'],
    rows: D.adSources.map(s => ({
      name: s.name,
      vals: [s.req, Math.round(s.req * s.fillRate / 100), Math.round(s.req * s.fillRate / 100 * 0.94),
        Math.round(s.req * s.fillRate / 100 * 0.94 * (s.ecpm >= 20 ? 0.92 : s.ecpm >= 12 ? 0.86 : 0.78))]
    }))
  },
  drama: {
    title: '剧集', rowType: 'drama', head: ['播放人数', '首集完播', '解锁弹窗', '解锁成功'],
    rows: D.dramas.map(d => ({
      name: d.name,
      vals: [d.uv, Math.round(d.uv * 0.82), Math.round(d.uv * d.finish / 100 * 0.86),
        Math.round(d.uv * d.unlock / 100)]
    }))
  }
};

/* 漏斗步骤流失画像（点击步骤后展示） */
D.funnelLossFlow = [
  { name: '退出 App（流失）', v: 34.2 }, { name: '返回首页换剧', v: 26.4 },
  { name: '停留在当前页', v: 18.6 }, { name: '去看免费剧集', v: 13.2 },
  { name: '其他路径', v: 7.6 }
];
D.funnelLossTier = D.deviceTier.map(t => ({ name: t.name, value: +(t.share * (1.16 - D.deviceTier.indexOf(t) * 0.06)).toFixed(1) }));
D.funnelLossChannel = D.channels.slice(0, 6).map(c => ({ name: c.name, value: +(c.act / 257200 * 100 * 1.08).toFixed(1) }));

/* 漏斗各步骤转化率趋势（可切换步骤） */
D.funnelTrendSeed = [0.92, 0.86, 0.78, 0.72, 0.68, 0.64, 0.7, 0.82, 0.88, 0.9];

/* ---------- 广告变现：分时 by 广告位 / 热力 / 散点 ---------- */
D.hourlyBySlot = (() => {
  const base = D.hourly.imp;
  const shape = {
    '激励视频': Array.from({ length: 24 }, (_, i) => 0.6 + Math.sin((i - 4) / 24 * Math.PI) * 0.8 + (i >= 18 && i <= 22 ? 0.45 : 0)),
    '插屏广告': Array.from({ length: 24 }, (_, i) => 0.5 + (i >= 12 && i <= 23 ? 0.6 : 0.1) + (i >= 19 && i <= 22 ? 0.3 : 0)),
    '开屏广告': Array.from({ length: 24 }, (_, i) => (i >= 6 && i <= 9 ? 1.6 : i >= 11 && i <= 13 ? 1.1 : i >= 18 && i <= 22 ? 1.2 : 0.4)),
    '信息流 / Banner': Array.from({ length: 24 }, (_, i) => 0.7 + (i >= 8 && i <= 23 ? 0.5 : 0) + (i >= 20 && i <= 22 ? 0.4 : 0))
  };
  const out = {};
  D.adSlots.forEach(s => {
    const sh = shape[s.name];
    const tot = sh.reduce((a, b) => a + b, 0);
    out[s.name] = sh.map(v => Math.round(s.show * v / tot));
  });
  return out;
})();
D.hourlyFill = [93.2, 92.4, 91.6, 90.8, 89.6, 90.4, 91.8, 92.6, 93.4, 94.1, 94.6, 94.8, 95.1, 95.4, 95.2, 95.0, 94.8, 94.6, 94.4, 94.8, 95.2, 94.6, 93.8, 93.4];
D.hourlyRev = D.hourly.imp.map((v, i) => Math.round(v * D.hourly.ecpm[i] / 1000));

/* 广告源四象限：eCPM × 填充率，气泡=收入 */
D.adSourceScatter = D.adSources.map((s, i) => ({
  name: s.name, x: s.fillRate, y: s.ecpm, r: s.rev, color: Charts.C[i % Charts.C.length]
}));

window.D = D;
window.DATES = DATES;
