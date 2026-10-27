/* ===============================
   埋点分析平台 · 原型交互
   =============================== */
const $ = s => document.querySelector(s);
const fmt = Charts.fmt;
const money = n => '¥' + Math.round(n).toLocaleString('zh-CN');
const wan = n => (n / 10000).toFixed(2) + ' 万';
const pct = (a, b) => (b ? (a / b * 100).toFixed(2) : '0.00') + '%';

const ICON = {
  dash: '<rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>',
  event: '<path d="M9 1.5L3 9h4.2L6 14.5 13 6.6H8.4z" stroke-linejoin="round"/>',
  funnel: '<path d="M2 3l4.6 5.2V13l2.8 0V8.2L14 3z" stroke-linejoin="round"/>',
  ad: '<path d="M2 6.4v3.2a1 1 0 001 1h1.6L8 13.4V2.6L4.6 5.2H3a1 1 0 00-1 1.2z"/><path d="M11.2 5.6a3.6 3.6 0 010 4.8"/>',
  ret: '<path d="M13.2 8a5.2 5.2 0 11-1.7-3.9"/><path d="M13.4 2.2v3.2h-3.2"/>',
  path: '<circle cx="4" cy="4" r="1.7"/><circle cx="12" cy="8" r="1.7"/><circle cx="4" cy="12" r="1.7"/><path d="M5.7 4H10a1 1 0 011 1v1.3"/><path d="M12 9.7V12a1 1 0 01-1 1H5.7"/>',
  dict: '<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M5 6h6M5 9h6M5 11.5h3"/>',
  user: '<circle cx="8" cy="5.4" r="2.7"/><path d="M2.8 13.6a5.2 5.2 0 0110.4 0"/>',
  seg: '<circle cx="6" cy="6" r="3.4"/><circle cx="10" cy="10" r="3.4"/>',
  set: '<circle cx="8" cy="8" r="2.2"/><path d="M8 1.6v1.8M8 12.6v1.8M1.6 8h1.8M12.6 8h1.8M3.5 3.5l1.3 1.3M11.2 11.2l1.3 1.3M12.5 3.5l-1.3 1.3M4.8 11.2l-1.3 1.3"/>',
  bell: '<path d="M4 6.6a4 4 0 018 0V10l1.4 2H2.6L4 10z" stroke-linejoin="round"/><path d="M6.6 12.4a1.5 1.5 0 002.8 0"/>'
};

const NAV_GROUPS = [
  {
    title: '分析模型', items: [
      { id: 'overview', name: '数据概览', icon: 'dash' },
      { id: 'event', name: '事件分析', icon: 'event' },
      { id: 'funnel', name: '漏斗分析', icon: 'funnel' },
      { id: 'monetize', name: '广告变现分析', icon: 'ad' },
      { id: 'ad', name: '投放归因分析', icon: 'ad' },
      { id: 'retain', name: '留存分析', icon: 'ret' },
      { id: 'path', name: '路径分析', icon: 'path' }
    ]
  },
  {
    title: '用户洞察', items: [
      { id: 'profile', name: '用户画像', icon: 'user' },
      { id: 'segment', name: '用户分群', icon: 'seg', badge: '12' },
      { id: 'recall', name: '召回与触达', icon: 'bell' }
    ]
  },
  {
    title: '数据治理', items: [
      { id: 'dict', name: '埋点事件管理', icon: 'dict', badge: '100' }
    ]
  }
];
const NAV = NAV_GROUPS.flatMap(g => g.items);

let cur = 'overview';
let streamTimer = null;
const OV = window.OV = { grain: 'day' };

/* ---------- 全局筛选状态（顶栏生效） ---------- */
const GS = window.GS = { range: 30, app: '星河 App（iOS + Android）' };
const RANGE_TEXT = {
  7: '近 7 天（10-19 ~ 10-25）',
  14: '近 14 天（10-12 ~ 10-25）',
  30: '2026-09-26 ~ 2026-10-25'
};
window.RANGE_TEXT = RANGE_TEXT;
const VIEWS = window.VIEWS = window.VIEWS || {};

/* ===============================
   框架渲染
   =============================== */
function renderNav() {
  $('#nav').innerHTML = `
    ${NAV_GROUPS.map(g => `
      <div class="nav-group-title">${g.title}</div>
      ${g.items.map(n => navItem(n)).join('')}`).join('')}
    <div class="nav-group-title">系统</div>
    <div class="nav-item"><svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">${ICON.set}</svg>数据接入 / 渠道配置</div>
  `;
}
function navItem(n) {
  return `<div class="nav-item ${n.id === cur ? 'active' : ''}" data-nav="${n.id}">
    <svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">${ICON[n.icon]}</svg>
    ${n.name}${n.badge ? `<span class="nav-badge">${n.badge}</span>` : ''}</div>`;
}

const TITLES = {
  overview: ['数据概览', '短剧 IAA · 买量与广告变现核心指标'],
  event: ['事件分析', '任意事件的触发次数 / 人数 / 分布查询'],
  funnel: ['漏斗分析', '解锁转化与广告变现漏斗'],
  monetize: ['广告变现分析', '广告位 / 广告源 / 剧集维度收入与 eCPM'],
  ad: ['投放归因分析', '渠道 × 计划 × 素材的买量与回本分析'],
  retain: ['留存分析', '留存曲线 · 分群对比 · 留存与 LTV 交叉'],
  path: ['路径分析', '用户行为序列的流转与折损'],
  profile: ['用户画像', '机型 / IP 归属 / 网络 / 系统 的分布与变现差异'],
  segment: ['用户分群', '按行为与属性圈选人群，支撑精细化运营'],
  recall: ['召回与触达', '通知权限 · Push · 桌面快捷方式与组件 · 回流归因'],
  dict: ['埋点事件管理', '事件字典、参数定义、关联链路与上报质量']
};

/* 顶栏筛选：应用 / 时间范围（真实生效） */
function topFilters(extra = '') {
  const r = window.GS ? GS.range : 30;
  const opts = [7, 14, 30].map(v =>
    `<option value="${v}" ${v === +r ? 'selected' : ''}>${RANGE_TEXT[v]}</option>`).join('');
  return `
    <select class="select" id="appSel">
      <option>星河 App（iOS + Android）</option><option>星河极速版</option><option>星河海外版</option>
    </select>
    <select class="select" id="rangeSel">${opts}</select>
    ${extra}
    <button class="btn primary" id="queryBtn">查询</button>`;
}

/* 按全局时间范围切片 */
function sl(arr) {
  const n = window.GS ? GS.range : 30;
  return arr.slice(-Math.min(n, arr.length));
}

function go(id) {
  cur = id;
  if (streamTimer) { clearInterval(streamTimer); streamTimer = null; }
  renderNav();
  const [t, s] = TITLES[id];
  $('#crumb').innerHTML = `${t}<small>${s}</small>`;
  $('#view').innerHTML = VIEWS[id].render();
  bindChartHover();
  VIEWS[id].after && VIEWS[id].after();
  if (window.bindUI) bindUI();
  bindTopFilters();
  $('#view').scrollTop = 0;
  document.querySelector('.content').scrollTop = 0;
}

/* 顶栏：应用 / 时间范围 / 查询 —— 真实生效 */
function bindTopFilters() {
  const rs = document.getElementById('rangeSel');
  if (rs) rs.onchange = () => {
    GS.range = +rs.value;
    GS.rangeText = RANGE_TEXT[GS.range];
    go(cur);
    Toast(`时间范围已切换为「${RANGE_TEXT[GS.range]}」，共 ${GS.range} 天`);
  };
  const as = document.getElementById('appSel');
  if (as) as.onchange = () => { GS.app = as.options[as.selectedIndex].text; Toast(`已切换应用：${GS.app}`); };
  const q = document.getElementById('queryBtn');
  if (q) q.onclick = () => Toast(`查询已执行 · ${GS.app} · ${RANGE_TEXT[GS.range]}`);
}
window.bindTopFilters = bindTopFilters;

/* 折线图 hover */
function bindChartHover() {
  document.querySelectorAll('svg[data-chart="line"]').forEach(svg => {
    const wrap = svg.parentElement;
    let tip = wrap.querySelector('.tip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; wrap.appendChild(tip); }
    const d = Charts.store[+svg.dataset.cid];
    if (!d) return;
    const rect = svg.querySelector('.hover-rect'), hl = svg.querySelector('.hover-line');
    const iw = d.width - d.padL - d.padR;
    rect.addEventListener('mousemove', e => {
      const scale = svg.clientWidth / d.width;
      const x = (e.offsetX !== undefined ? e.offsetX : 0);
      const vx = x / scale;
      let i = Math.round(((vx - d.padL) / iw) * (d.labels.length - 1));
      i = Math.max(0, Math.min(d.labels.length - 1, i));
      hl.setAttribute('x1', d.padL + (i * iw) / (d.labels.length - 1));
      hl.setAttribute('x2', d.padL + (i * iw) / (d.labels.length - 1));
      hl.style.display = '';
      tip.innerHTML = `<b>${d.labels[i]}</b><br>` + d.series.map(s =>
        `<span style="color:${s.color}">●</span> ${s.name}：${d.yFormat(s.data[i])}`).join('<br>');
      tip.style.left = (d.padL + (i * iw) / (d.labels.length - 1)) * scale + 'px';
      tip.style.top = '58px';
      tip.classList.add('show');
    });
    rect.addEventListener('mouseleave', () => { tip.classList.remove('show'); hl.style.display = 'none'; });
  });
}

/* ===============================
   1. 数据概览
   =============================== */
VIEWS.overview = {
  render() {
    $('#topfilters').innerHTML = topFilters(`
      <select class="select"><option>全部渠道</option><option>巨量引擎</option><option>腾讯广告</option></select>
      <button class="btn ghost">对比上一周期</button>`);

    const GOTO = {
      '新增激活用户': 'ad', '日活 DAU': 'profile', '投放消耗': 'ad', '激活成本 CPA': 'ad',
      '广告收入': 'monetize', 'eCPM': 'monetize', 'ARPU': 'monetize', '人均广告展示': 'monetize'
    };
    const kpis = D.kpi.map(k => `
      <div class="kpi" data-goto="${GOTO[k.label] || ''}">
        <div class="label">${k.label}<span class="help" title="${k.tip}">?</span></div>
        <div class="value">${k.value}${k.unit ? `<span class="unit">${k.unit}</span>` : ''}</div>
        <div class="delta">
          <span class="${k.dir === 'up' ? 'up' : 'down'}">${k.delta.includes('-') ? '▼' : '▲'} ${k.delta.replace('-', '')}</span>
          <span class="cmp">较上一周期</span>
        </div>
        <div class="spark">${Charts.spark(k.spark, k.color)}</div>
      </div>`).join('');

    /* 时间粒度聚合 */
    const agg = (arr, k) => {
      const out = [];
      for (let i = 0; i < arr.length; i += k) out.push(arr.slice(i, i + k).reduce((a, b) => a + b, 0));
      return out;
    };
    const gl = (() => {
      const L = sl(D.trend.labels);
      if (OV.grain === 'week') return L.filter((_, i) => i % 7 === 0).map((_, i) => 'W' + (i + 1));
      if (OV.grain === 'month') return ['09-26~10-10', '10-11~10-25'];
      return L;
    })();
    const K = OV.grain === 'week' ? 7 : OV.grain === 'month' ? 15 : 1;
    const trend = Charts.line({
      labels: gl, height: 268, area: true,
      series: [
        { name: '广告收入', data: agg(sl(D.trend.revenue), K), color: '#eb2f96' },
        { name: '新增激活', data: agg(sl(D.trend.activation), K), color: '#2f6bff' }
      ]
    });

    const slotRev = D.adSlots.map((s, i) => ({
      name: s.name, value: s.rev, color: Charts.C[i], extra: `eCPM ¥${s.ecpm}`
    }));

    const coreFunnel = [
      { name: '安装激活', value: 257200 },
      { name: '首集开始播放', value: 186400 },
      { name: '首集完播', value: 124600 },
      { name: '解锁弹窗曝光', value: 108200 },
      { name: '看完广告并解锁', value: 78400 }
    ];

    const rows = D.channels.map(c => {
      const cpa = c.cost ? c.cost / c.act : 0;
      const r1 = c.cost ? c.rev1 / c.cost * 100 : 0;
      const r7 = c.cost ? c.act * c.ltv7 / c.cost * 100 : 0;
      const r30 = c.cost ? c.act * c.ltv30 / c.cost * 100 : 0;
      const payback = c.cost ? Math.round(30 * cpa / c.ltv30) : 0;
      return `<tr data-row="channel:${c.name}">
        <td><span class="name">${c.name}</span><div class="sub">${c.sub}</div></td>
        <td class="num">${c.cost ? money(c.cost) : '—'}</td>
        <td class="num"><b>${fmt(c.act)}</b></td>
        <td class="num">${cpa ? '¥' + cpa.toFixed(2) : '—'}</td>
        <td class="num">${c.ret1}%</td>
        <td class="num">¥${(c.rev1 / c.act).toFixed(3)}</td>
        <td class="num">${money(c.rev1)}</td>
        <td class="num">${r1 ? r1.toFixed(1) + '%' : '—'}</td>
        <td class="num ${r7 >= 40 ? 'up' : r7 < 30 ? 'down' : ''}">${r7 ? r7.toFixed(1) + '%' : '—'}</td>
        <td class="num">¥${c.ltv30.toFixed(2)}</td>
        <td class="num ${r30 >= 100 ? 'up' : ''}">${r30 ? r30.toFixed(0) + '%' : '—'}</td>
        <td><span class="tag ${payback && payback <= 30 ? 'green' : payback <= 40 ? 'orange' : 'red'}">${payback ? payback + ' 天' : '—'}</span></td>
      </tr>`;
    }).join('');

    return `
      <div class="grid g4">${kpis}</div>

      <div class="card">
        <div class="card-head">
          <div class="card-title">核心趋势<small>广告收入 vs 新增激活 · ${RANGE_TEXT[GS.range]}</small></div>
          <div class="right">
            <div class="seg" id="grainSeg">
              <button class="${OV.grain === 'day' ? 'active' : ''}" data-grain="day">按日</button>
              <button class="${OV.grain === 'week' ? 'active' : ''}" data-grain="week">按周</button>
              <button class="${OV.grain === 'month' ? 'active' : ''}" data-grain="month">按月</button>
            </div>
            <button class="btn sm">添加指标</button>
            <button class="btn sm">下载 CSV</button>
          </div>
        </div>
        <div class="card-body">
          <div class="chart-wrap">${trend}</div>
          <div class="legend">
            <span><i style="background:#eb2f96"></i>广告收入（元）</span>
            <span><i style="background:#2f6bff"></i>新增激活</span>
          </div>
        </div>
      </div>

      <div class="grid g2">
        <div class="card">
          <div class="card-head"><div class="card-title">广告位收入构成<small>激励视频为主力</small></div><div class="right"><button class="btn sm">按 eCPM 排序</button></div></div>
          <div class="card-body">${Charts.hbar(slotRev)}</div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">激活 → 广告解锁 概览</div><div class="right"><button class="btn sm">查看完整漏斗</button></div></div>
          <div class="card-body">
            ${funnelRows(coreFunnel)}
            <div class="note mt12"><span>💡</span><div>激活→首集播放 72.5% 是最大折损；解锁环节看完广告并完成解锁 91.0%，变现链路健康。建议优化首集前 30 秒留存与首页选剧效率。</div></div>
          </div>
        </div>
      </div>

      <div class="grid g-2-1">
        <div class="card">
          <div class="card-head"><div class="card-title">渠道投放 × 广告变现归因<small>ROAS 与回本周期</small></div><div class="right"><button class="btn sm">自定义列</button><button class="btn sm">导出</button></div></div>
          <div class="tbl-wrap">
            <table class="tbl">
              <thead><tr>
                <th>渠道</th><th class="num">消耗</th><th class="num">激活</th><th class="num">CPA</th>
                <th class="num">次留</th><th class="num">首日 ARPU</th><th class="num">首日收入</th>
                <th class="num">首日 ROAS</th><th class="num">7 日 ROAS</th>
                <th class="num">LTV30/人</th><th class="num">30 日 ROAS</th><th>回本预估</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">实时事件流</div><div class="right"><span class="dot pulse"></span><span class="muted">Receiving</span></div></div>
          <div class="card-body"><div class="stream" id="stream"></div></div>
        </div>
      </div>`;
  },
  after() {
    document.querySelectorAll('[data-grain]').forEach(b => {
      b.addEventListener('click', () => { OV.grain = b.dataset.grain; go('overview'); });
    });
    const box = $('#stream');
    let i = 0;
    const push = () => {
      const s = D.streamSeed[i % D.streamSeed.length];
      const now = new Date(Date.now() + i * 1000);
      const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const el = document.createElement('div');
      el.className = 'stream-item';
      el.innerHTML = `<span class="t">${t}</span><span class="e">${s[0]}</span><span class="muted">${s[1]}</span><span class="u">${s[2]}</span>`;
      box.insertBefore(el, box.firstChild);
      while (box.children.length > 14) box.removeChild(box.lastChild);
      i++;
    };
    for (let k = 0; k < 10; k++) push();
    streamTimer = setInterval(push, 2600);
  }
};

/* 漏斗行式渲染（概览/对比用） */
function funnelRows(steps) {
  const max = steps[0].value;
  let h = '<div class="funnel-rows">';
  steps.forEach((s, i) => {
    const w = Math.max(8, s.value / max * 100);
    h += `<div class="frow">
      <div class="fname">${i + 1}. ${s.name}</div>
      <div><div class="fbar" style="width:${w}%;background:rgba(47,107,255,${(1 - i * 0.12).toFixed(2)})">
        ${fmt(s.value)} 人
      </div></div>
      <div class="fmeta">${i === 0 ? '100%' :
        `<span class="up">${pct(s.value, steps[i - 1].value)}</span> · 流失 ${fmt(steps[i - 1].value - s.value)}`}</div>
    </div>`;
    if (i < steps.length - 1) h += `<div class="frow"><div></div><div class="fgap">▼</div><div></div></div>`;
  });
  return h + '</div>';
}
