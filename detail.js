/* ===========================================================
   detail.js —— 事件分析 / 漏斗分析 / 广告变现（1:1 高保真重做）
   覆盖 views.js 中的同名视图，加载顺序需在 views.js 之后
   =========================================================== */

const qnum = n => Math.round(n).toLocaleString('zh-CN');
const qpct = (a, b) => (b ? a / b * 100 : 0);

function qhash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}
function qrand(seed) {
  let s = seed;
  return () => { s = Math.sin(s * 127.1) * 43758.5453; return s - Math.floor(s); };
}
/* 按总量切分到 n 个点，和恒等于 total */
function qdist(total, n, seed) {
  const r = qrand(seed);
  const raw = Array.from({ length: n }, (_, i) => 1 + Math.sin(i * 0.7 + seed * 6) * 0.12 + (r() - 0.5) * 0.22);
  const sum = raw.reduce((a, b) => a + b, 0);
  const out = raw.map(v => Math.max(1, Math.round(total * v / sum)));
  const diff = total - out.reduce((a, b) => a + b, 0);
  out[out.length - 1] += diff;
  return out;
}
function evItem(k) {
  return D.eventTree.flatMap(g => g.items).find(i => i.k === k) || { k, n: k, c: 0 };
}
function evGroupOf(k) {
  const g = D.eventTree.find(x => x.items.some(i => i.k === k));
  return g ? g.group : '未分组';
}

/* ===========================================================
   1. 事件分析
   =========================================================== */
const EV = window.EV = {
  k: 'AdShow', n: '广告展示',
  metric: 'count', dim: 'channel', grain: 'day', chart: 'line',
  compare: false, cmpK: null, cmpN: null,
  hide: {}, filters: [{ p: 'ad_position', op: '=', v: 'rewarded' }],
  fav: ['AdShow', 'UnlockSuccess', 'LoginSuccess', 'AdError'],
  tab: 'all', recent: ['AdShow', 'UnlockSuccess', 'EpisodeStart', 'AdRewarded']
};

const EV_METRICS = [
  ['count', '触发次数'], ['users', '触发用户数'], ['per', '人均次数'],
  ['device', '去重设备数'], ['sum', '数值求和（播放时长）']
];
const EV_DIMS = [
  ['channel', '归因渠道'], ['slot', '广告位'], ['source', '广告源'], ['scene', '触发场景'],
  ['drama', '剧集'], ['model', '机型'], ['city', '城市线级'], ['none', '不拆分']
];
const EV_GRAINS = [['hour', '按小时'], ['day', '按天'], ['week', '按周']];

function evCountTotal() {
  return Math.round((evItem(EV.k).c || 100000) * Math.pow(0.82, EV.filters.length));
}
function evLabels() {
  if (EV.grain === 'hour') return D.hourly.labels;
  if (EV.grain === 'week') return Array.from({ length: 12 }, (_, i) => 'W' + (i + 1));
  return sl(DATES).map(d => d.slice(5));
}
function evSeriesOf(k, total, salt) {
  const n = evLabels().length;
  if (EV.grain === 'hour') {
    const shape = D.hourly.imp;
    const sum = shape.reduce((a, b) => a + b, 0);
    return shape.map(v => Math.round(total * v / sum));
  }
  return qdist(total, n, qhash(k + EV.grain + salt));
}
function evBuild() {
  const cntTotal = evCountTotal();
  const uTot = Math.round(cntTotal * 0.62);
  const cnt = evSeriesOf(EV.k, cntTotal, EV.dim);
  const usr = evSeriesOf(EV.k, uTot, 'u' + EV.dim);
  let data, unit, head;
  switch (EV.metric) {
    case 'users': data = usr; unit = '人'; head = uTot; break;
    case 'device': data = usr.map(v => Math.round(v * 0.93)); unit = '台'; head = Math.round(uTot * 0.93); break;
    case 'per': data = cnt.map((v, i) => +(v / Math.max(1, usr[i])).toFixed(2)); unit = '次'; head = +(cntTotal / Math.max(1, uTot)).toFixed(2); break;
    case 'sum': data = cnt.map(v => Math.round(v * 24.6)); unit = '秒'; head = Math.round(cntTotal * 24.6); break;
    default: data = cnt; unit = '次'; head = cntTotal;
  }
  const prev = data.map((v, i) => +(v * (0.84 + (i % 5) * 0.012)).toFixed(EV.metric === 'per' ? 2 : 0));
  let cmp = null;
  if (EV.compare && EV.cmpK) {
    const cTotal = Math.round((evItem(EV.cmpK).c || 100000) * Math.pow(0.82, EV.filters.length));
    const cArr = evSeriesOf(EV.cmpK, EV.metric === 'users' ? Math.round(cTotal * 0.62) : cTotal, EV.dim);
    cmp = EV.metric === 'sum' ? cArr.map(v => Math.round(v * 24.6)) : cArr;
  }
  return { data, prev, cmp, unit, head, cntTotal, uTot };
}

/* 迷你多环 donut（收入/构成占比） */
function qDonut(parts, opts = {}) {
  const { size = 168, thick = 22, inner = '' } = opts;
  const r = size / 2 - thick / 2 - 2, c = 2 * Math.PI * r;
  const total = parts.reduce((s, p) => s + p.v, 0) || 1;
  let off = 0, g = '';
  parts.forEach(p => {
    const len = c * p.v / total;
    g += `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${p.color}" stroke-width="${thick}"
      stroke-dasharray="${Math.max(len - 2.5, 0.5)} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size / 2} ${size / 2})"
      style="cursor:pointer" data-donut="${p.name}"><title>${p.name}：${qnum(p.v)}（${(p.v / total * 100).toFixed(1)}%）</title></circle>`;
    off += len;
  });
  g += `<text x="50%" y="47%" text-anchor="middle" font-size="11" fill="#8f959e">${parts.length} 项合计</text>`;
  g += `<text x="50%" y="60%" text-anchor="middle" font-size="16" font-weight="600" fill="#1f2329">${inner || Charts.fmt(total)}</text>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${g}</svg>`;
}

/* 瀑布图（ARPU / 收入拆解） */
function qWaterfall(items, opts = {}) {
  const { width = 620, height = 220, suffix = '' } = opts;
  const padL = 40, padT = 22, padB = 34, padR = 12;
  const iw = width - padL - padR, ih = height - padT - padB;
  const cum = [];
  let acc = 0;
  items.forEach((it, i) => {
    if (i === 0 || it.type === 'total') { acc = it.v; cum.push([0, it.v]); }
    else { cum.push([acc, acc + it.v]); acc += it.v; }
  });
  const maxV = Math.max(...cum.map(c => Math.max(c[0], c[1]))) * 1.08;
  const Y = v => padT + ih - (v / maxV) * ih;
  const bw = Math.min(46, iw / items.length * 0.58);
  let g = '';
  for (let i = 0; i <= 3; i++) {
    const v = maxV / 3 * i, y = Y(v);
    g += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="#eef0f4"/>`;
    g += `<text x="${padL - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="10.5" fill="#a5abb5">${Charts.fmt(Math.round(v))}</text>`;
  }
  items.forEach((it, i) => {
    const [a, b] = cum[i];
    const x = padL + iw / items.length * (i + 0.5) - bw / 2;
    const y1 = Y(Math.max(a, b)), hgt = Math.max(2, Math.abs(Y(a) - Y(b)));
    const isTotal = i === 0 || it.type === 'total';
    const color = isTotal ? '#2f6bff' : it.v >= 0 ? '#17b26a' : '#f54a45';
    g += `<rect x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${bw}" height="${hgt.toFixed(1)}" rx="3" fill="${color}" opacity="${isTotal ? .95 : .78}"><title>${it.name}：${it.v > 0 && i ? '+' : ''}${Charts.fmt(it.v)}${suffix}</title></rect>`;
    g += `<text x="${(x + bw / 2).toFixed(1)}" y="${(y1 - 5).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${color}">${isTotal ? Charts.fmt(it.v) : (it.v >= 0 ? '+' : '') + Charts.fmt(it.v)}</text>`;
    g += `<text x="${(x + bw / 2).toFixed(1)}" y="${height - 14}" text-anchor="middle" font-size="10.5" fill="#646a73">${it.name}</text>`;
    if (!isTotal && i < items.length - 1) {
      const yc = Y(b);
      g += `<line x1="${(x + bw).toFixed(1)}" y1="${yc.toFixed(1)}" x2="${(padL + iw / items.length * (i + 1.5) - bw / 2).toFixed(1)}" y2="${yc.toFixed(1)}" stroke="#c9cfd8" stroke-dasharray="3 3"/>`;
    }
  });
  return `<svg class="chart" viewBox="0 0 ${width} ${height}">${g}</svg>`;
}

/* 行数组直接导出 CSV */
function dtlCsv(name, rows) {
  const txt = rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\n');
  try {
    const blob = new Blob(['\ufeff' + txt], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { /* 忽略 */ }
  Toast(`已导出「${name}」· ${rows.length - 1} 行`);
}

VIEWS.event = {
  render() {
    $('#topfilters').innerHTML = topFilters(`
      <select class="select" id="evUserType"><option>全部用户</option><option>新用户（首日）</option><option>老用户</option><option>游客</option></select>`);

    const K = EV.k, it = evItem(K);
    const B = evBuild();
    const rel = D.eventRelation[K];
    const chain = D.eventChains.find(c => c.steps.indexOf(K) >= 0);

    /* ---------- 事件库 ---------- */
    const evTotalCnt = D.eventTree.reduce((s, g) => s + g.items.length, 0);
    const tabs = [['all', '全部'], ['fav', '收藏'], ['recent', '最近']].map(([k, n]) =>
      `<button class="${EV.tab === k ? 'active' : ''}" data-evtab="${k}">${n}${k === 'fav' ? ` ${EV.fav.length}` : ''}</button>`).join('');

    const treeGroups = D.eventTree.map(g => {
      let items = g.items;
      if (EV.tab === 'fav') items = items.filter(i => EV.fav.indexOf(i.k) >= 0);
      if (EV.tab === 'recent') items = items.filter(i => EV.recent.indexOf(i.k) >= 0);
      if (!items.length) return '';
      return `<div class="tree-group" data-grp="${g.group}"><span class="tg-ic">${g.icon}</span>${g.group}<span class="cnt">${items.length}</span></div>
        ${items.map(i => `<div class="tree-item ${i.k === K ? 'sel' : ''}" data-ev="${i.k}" data-evn="${i.n}" data-grp="${g.group}">
          <span class="ti-star ${EV.fav.indexOf(i.k) >= 0 ? 'on' : ''}" data-fav="${i.k}">${EV.fav.indexOf(i.k) >= 0 ? '★' : '☆'}</span>
          <span class="ti-nm">${i.n}</span><span class="cnt">${Charts.fmt(i.c)}</span>
        </div>`).join('')}`;
    }).join('') || `<div class="empty">该分类下暂无事件</div>`;

    /* ---------- 查询构建器 ---------- */
    const metricSel = `<select class="select qb-sel" data-metric>${EV_METRICS.map(([k, n]) => `<option value="${k}" ${EV.metric === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
    const dimSel = `<select class="select qb-sel" data-dim>${EV_DIMS.map(([k, n]) => `<option value="${k}" ${EV.dim === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
    const grainSel = `<select class="select qb-sel" data-grain>${EV_GRAINS.map(([k, n]) => `<option value="${k}" ${EV.grain === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`;

    const filterChips = EV.filters.length
      ? EV.filters.map((f, i) => `<span class="chip f">${f.p} <b>${f.op}</b> ${f.v}<span class="x" data-fdel="${i}">×</span></span>`).join('')
      : `<span class="muted" style="font-size:12px">未设置过滤条件，将统计全部用户</span>`;

    const qb = `
      <div class="qb">
        <div class="qb-row">
          <div class="qb-lb">分析事件</div>
          <div class="qb-bd">
            <span class="chip ev">${it.n}<em class="code">${K}</em><span class="x" data-cmpdel="main" title="清除">×</span></span>
            ${EV.compare && EV.cmpK ? `<span class="qb-and">VS</span>
              <span class="chip ev c2">${EV.cmpN}<em class="code">${EV.cmpK}</em><span class="x" data-cmpdel="cmp">×</span></span>`
        : `<span class="chip add" data-cmpadd>＋ 添加对比事件</span>`}
          </div>
        </div>
        <div class="qb-row">
          <div class="qb-lb">统计口径</div>
          <div class="qb-bd">
            <span class="qb-k">指标</span>${metricSel}
            <span class="qb-k">维度拆分</span>${dimSel}
            <span class="qb-k">时间粒度</span>${grainSel}
            <span class="qb-k">过滤</span>
            <span class="badge-soft">${EV.filters.length} 条</span>
          </div>
        </div>
        <div class="qb-row">
          <div class="qb-lb">过滤条件</div>
          <div class="qb-bd">
            ${filterChips}
            <span class="chip add" data-fadd>＋ 添加过滤条件</span>
          </div>
        </div>
        <div class="qb-foot">
          <div class="qb-hint">
            <span class="dot-live"></span>数据就绪 · 命中 <b>${Charts.fmt(B.cntTotal)}</b> 次事件 / <b>${Charts.fmt(B.uTot)}</b> 位用户
            <span class="muted">· 更新时间 09:20</span>
          </div>
          <div class="qb-acts">
            <button class="btn sm" id="evSaveBtn">保存为看板</button>
            <button class="btn sm" id="evExportBtn">导出 CSV</button>
            <button class="btn primary" id="evQueryBtn">查询</button>
          </div>
        </div>
      </div>`;

    /* ---------- 指标概览 ---------- */
    const prevHead = EV.metric === 'per'
      ? +(B.prev.reduce((a, b) => a + b, 0) / B.prev.length).toFixed(2)
      : B.prev.reduce((a, b) => a + b, 0);
    const delta = prevHead ? (B.head - prevHead) / prevHead * 100 : 0;
    const mName = EV_METRICS.find(m => m[0] === EV.metric)[1];
    const miniKpi = `
      <div class="mini-kpis">
        <div class="mini-kpi"><div class="l">${mName}</div><div class="v">${Charts.fmt(B.head)}<span class="u">${B.unit}</span></div>
          <div class="d"><span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}%</span><span class="cmp">环比</span></div></div>
        <div class="mini-kpi"><div class="l">触发用户数</div><div class="v">${Charts.fmt(B.uTot)}<span class="u">人</span></div>
          <div class="d"><span class="muted">占 DAU ${(B.uTot / D.summary.dau * 100).toFixed(1)}%</span></div></div>
        <div class="mini-kpi"><div class="l">人均次数</div><div class="v">${(B.cntTotal / Math.max(1, B.uTot)).toFixed(2)}<span class="u">次</span></div>
          <div class="d"><span class="muted">P90 ${(B.cntTotal / Math.max(1, B.uTot) * 2.8).toFixed(1)} 次</span></div></div>
        <div class="mini-kpi"><div class="l">事件属性</div><div class="v" style="font-size:15px">${evGroupOf(K)}</div>
          <div class="d"><span class="muted">${(D.eventParams[K] || D.eventParams.AdShow || []).length} 个参数</span></div></div>
      </div>`;

    /* ---------- 趋势图 ---------- */
    const labels = evLabels();
    const series = [];
    if (!EV.hide.cur) series.push({ name: it.n, data: B.data, color: '#2f6bff' });
    if (!EV.hide.prev) series.push({ name: '上一周期', data: B.prev, color: '#c9cfd8', dash: true });
    if (B.cmp && !EV.hide.cmp) series.push({ name: EV.cmpN, data: B.cmp, color: '#7a4ddd' });

    let chart = '';
    if (!series.length) chart = `<div class="empty">所有系列已隐藏，点击下方图例恢复</div>`;
    else if (EV.chart === 'bar') chart = Charts.bar({ labels, series, height: 268, yFormat: v => Charts.fmt(v) });
    else {
      const cum = arr => arr.reduce((acc, v) => (acc.push((acc.length ? acc[acc.length - 1] : 0) + v), acc), []);
      const s = EV.chart === 'cum' ? series.map(x => Object.assign({}, x, { data: cum(x.data), dash: false })) : series;
      chart = Charts.line({
        labels, height: 268, area: EV.chart === 'line' && s.length === 1, series: s,
        yFormat: EV.metric === 'per' ? v => v.toFixed(1) : v => Charts.fmt(v)
      });
    }
    const legend = [
      `<span class="lg ${EV.hide.cur ? 'off' : ''}" data-lg="cur"><i style="background:#2f6bff"></i>${it.n}</span>`,
      EV.compare && EV.cmpK ? `<span class="lg ${EV.hide.cmp ? 'off' : ''}" data-lg="cmp"><i style="background:#7a4ddd"></i>${EV.cmpN}</span>` : '',
      `<span class="lg ${EV.hide.prev ? 'off' : ''}" data-lg="prev"><i style="background:#c9cfd8"></i>上一周期</span>`
    ].join('');

    const chartSeg = [['line', '折线'], ['bar', '柱状'], ['cum', '累计']].map(([k, n]) =>
      `<button class="${EV.chart === k ? 'active' : ''}" data-ec="${k}">${n}</button>`).join('');

    /* ---------- 维度拆分 ---------- */
    const dd = EV.dim !== 'none' ? D.evDimSplit[EV.dim] : null;
    let dimBlock = '';
    if (dd) {
      const hasBar = dd.head[dd.head.length - 1] === '分布';
      const head = dd.head.map((h, i) => `<th class="${i === 0 ? '' : 'num'}">${h}</th>`).join('') + (hasBar ? '' : '<th>分布</th>');
      const rows = dd.rows.map(r => {
        const share = r.bar;
        const val = Math.round(B.cntTotal * share / 100);
        const cells = r.vals.map((v, i) => i === 0
          ? `<td class="num"><b>${qnum(val)}</b></td>`
          : `<td class="num">${v}</td>`).join('');
        return `<tr class="row-btn" data-evrow="${encodeURIComponent(r.name)}" data-evshare="${share}">
          <td><span class="name">${r.name}</span><div class="sub">${r.sub || ''}</div></td>
          ${cells}
          ${hasBar ? '' : `<td><div class="bar-cell"><div class="mini-bar" style="width:${Math.min(100, share * 1.5).toFixed(0)}%"></div></div></td>`}
        </tr>`;
      }).join('');
      dimBlock = `
        <div class="card">
          <div class="card-head">
            <div class="card-title">按「${dd.title}」拆分<small>${dd.hint} · 点击行下钻</small></div>
            <div class="right"><button class="btn sm" id="evDimExport">导出</button></div>
          </div>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr>${head}</tr></thead><tbody>${rows}</tbody>
          </table></div>
          <div class="card-body tight"><div class="note"><span>💡</span><div>${EV.dim === 'channel'
          ? '商店渠道（小米 / 华为 / ASA）解锁率与 ARPU 均高于信息流，是 IAA 的高价值来源；信息流量大但人均广告收入低 30% 以上。'
          : EV.dim === 'model' ? '¥0-1000 机型占设备 26.4%，eCPM 仅 ¥11.8、填充率 88.6%，建议对低端机降频插屏、优先激励视频。'
            : EV.dim === 'city' ? '一线城市 eCPM 是四线的 2.5 倍，但四线贡献了 34.6% 的展示量，价格与量的平衡点在二线。'
              : '该维度下各项的触发占比与变现效率差异，可直接用于人群圈选与投放出价调整。'}</div></div></div>
        </div>`;
    } else {
      dimBlock = `<div class="card"><div class="card-body"><div class="empty">已关闭维度拆分，仅展示整体趋势。选择「维度拆分」可查看分渠道 / 机型 / 省份等分布。</div></div></div>`;
    }

    /* ---------- 数值分布 ---------- */
    const distBars = D.evDist.map((d, i) => `
      <div class="dist-row" data-dist="${d.name}">
        <span class="dn">${d.name}</span>
        <span class="dt"><i style="width:${(d.v / 42.6 * 100).toFixed(1)}%;background:${Charts.C[i % Charts.C.length]}"></i></span>
        <span class="dv">${d.v}%</span>
      </div>`).join('');
    const pctl = [['P50', 2], ['P75', 6], ['P90', 11], ['P99', 26]];
    const pctlHTML = pctl.map(([n, v]) => `<div class="pc"><span>${n}</span><b>${v} 次</b></div>`).join('');

    /* ---------- 用户属性 ---------- */
    const attrGroup = (title, list, dimKey, fmtv) => `
      <div class="attr-blk ${dimKey && EV.dim === dimKey ? 'on' : ''}" data-attrdim="${dimKey || ''}">
        <div class="attr-hd">${title}<span class="gi">${!dimKey ? '过滤条件可用' : EV.dim === dimKey ? '已拆分' : '点击拆分'}</span></div>
        <div class="dist-mini">${list.slice(0, 5).map((x, i) => `
          <div class="row"><span class="nm">${x.name}</span>
            <span class="tk"><i class="fl" style="width:${(x.share / list[0].share * 100).toFixed(0)}%;background:${Charts.C[i % Charts.C.length]}"></i></span>
            <span class="vl">${fmtv(x)}</span></div>`).join('')}</div>
      </div>`;

    /* ---------- 事件关联 ---------- */
    const relChain = rel ? `
      <div class="rel-chain">
        ${rel.up.map(e => `<span class="rel-node" data-jump="${e}">${e}</span>`).join('<span class="rel-arrow">→</span>')}
        <span class="rel-arrow">→</span><span class="rel-node cur">${K}</span><span class="rel-arrow">→</span>
        ${rel.down.map(e => `<span class="rel-node" data-jump="${e}">${e}</span>`).join('<span class="rel-arrow">·</span>')}
      </div>
      <div class="rel-attrs mt8"><span class="lb">可下钻属性</span>
        ${rel.attrs.map(a => `<span class="tag blue">${a}</span>`).join('')}</div>` : `<div class="muted">该事件未配置上下游关联</div>`;
    const relRows = rel ? rel.related.map(r => `<tr class="row-btn" data-jump="${r.ev}">
      <td><span class="name">${r.ev}</span><div class="sub">${(D.eventTree.flatMap(g => g.items).find(i => i.k === r.ev) || {}).n || ''}</div></td>
      <td class="num"><b>${r.rate}%</b></td>
      <td class="muted">${r.desc}</td>
      <td class="num"><div class="bar-cell"><div class="mini-bar" style="width:${Math.min(100, r.rate)}%"></div></div></td>
    </tr>`).join('') : '';

    return `
      <div class="ev-layout">
        <div class="panel ev-side">
          <div class="panel-head">事件库<small class="muted" style="font-weight:400">${evTotalCnt}</small>
            <div style="margin-left:auto"><button class="btn sm ghost" id="evManageBtn">管理</button></div></div>
          <div class="panel-body">
            <input class="input" id="evSearch" style="width:100%;margin-bottom:8px" placeholder="搜索事件名 / 标识（AdShow）">
            <div class="tree-tabs">${tabs}</div>
            <div class="tree" id="evTree">${treeGroups}</div>
          </div>
        </div>

        <div class="ev-main">
          <div class="card">${qb}${miniKpi}</div>

          <div class="card">
            <div class="card-head">
              <div class="card-title">${it.n} 趋势<small>${RANGE_TEXT[GS.range]} · ${EV_GRAINS.find(g => g[0] === EV.grain)[1]}</small></div>
              <div class="right">
                <div class="seg" id="evChartSeg">${chartSeg}</div>
                <label class="sw"><input type="checkbox" id="evCompareCb" ${EV.compare ? 'checked' : ''}><span>对比上一周期</span></label>
                <button class="btn sm" id="evTrendExport">导出</button>
              </div>
            </div>
            <div class="card-body rel" id="evTrendWrap">
              <div class="chart-wrap">${chart}</div>
              <div class="legend">${legend}</div>
            </div>
          </div>

          ${dimBlock}

          <div class="grid g2">
            <div class="card">
              <div class="card-head"><div class="card-title">人均触发次数分布<small>${it.n} · 用户维度</small></div>
                <div class="right"><button class="btn sm" id="evDistExport">导出</button></div></div>
              <div class="card-body">
                <div class="dist-bars">${distBars}</div>
                <div class="pctls">${pctlHTML}</div>
              </div>
            </div>
            <div class="card">
              <div class="card-head"><div class="card-title">用户属性交叉<small>点击任一分组切换拆分维度</small></div>
                <div class="right"><button class="btn sm primary" id="evSegBtn">沉淀为分群</button></div></div>
              <div class="card-body">
                ${attrGroup('机型档位', D.deviceTier, 'model', x => x.ecpm + '')}
                ${attrGroup('城市线级', D.cityTier, 'city', x => x.ecpm + '')}
                ${attrGroup('网络环境', D.networkType, '', x => x.ecpm + '')}
                <div class="muted" style="font-size:11.5px;margin-top:8px">数值为该分组的 eCPM（元 / 千次展示）</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">事件关联分析<small>${K} 的上下游与后续行为</small></div>
              <div class="right"><button class="btn sm" id="evChainBtn">维护关联链路</button></div></div>
            <div class="card-body">
              <div class="card-title" style="font-size:12.5px;margin-bottom:8px">关联链路${chain ? ` · ${chain.name}` : ''}</div>
              ${relChain}
              ${chain ? `<div class="muted mt8" style="font-size:12px">${chain.desc}</div>` : ''}
              ${relRows ? `<div class="tbl-wrap mt12"><table class="tbl">
                <thead><tr><th>关联事件</th><th class="num">触发占比</th><th>说明</th><th>分布</th></tr></thead>
                <tbody>${relRows}</tbody></table></div>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  },

  after() {
    /* 事件选择 */
    document.querySelectorAll('[data-ev]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.dataset.fav) return;
        const k = el.dataset.ev;
        EV.k = k; EV.n = el.dataset.evn;
        if (EV.recent.indexOf(k) < 0) { EV.recent.unshift(k); EV.recent = EV.recent.slice(0, 6); }
        if (!/^Ad|Unlock|Episode/.test(k)) EV.filters = [];
        go('event');
      });
    });
    /* 收藏 */
    document.querySelectorAll('[data-fav]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const k = el.dataset.fav;
        const i = EV.fav.indexOf(k);
        if (i >= 0) EV.fav.splice(i, 1); else EV.fav.push(k);
        go('event');
      });
    });
    /* 事件库 tab */
    document.querySelectorAll('[data-evtab]').forEach(b => {
      b.addEventListener('click', () => { EV.tab = b.dataset.evtab; go('event'); });
    });
    /* 搜索 */
    const si = $('#evSearch');
    if (si) si.addEventListener('input', () => {
      const q = (si.value || '').trim().toLowerCase();
      document.querySelectorAll('.tree-item').forEach(el => {
        const txt = (el.dataset.ev + ' ' + el.dataset.evn).toLowerCase();
        el.style.display = !q || txt.indexOf(q) >= 0 ? '' : 'none';
      });
      document.querySelectorAll('.tree-group[data-grp]').forEach(g => {
        const nm = g.dataset.grp;
        const anyShow = Array.from(document.querySelectorAll('.tree-item[data-grp="' + nm + '"]')).some(x => x.style.display !== 'none');
        g.style.display = anyShow ? '' : 'none';
      });
    });
    /* 分组折叠 */
    document.querySelectorAll('.tree-group[data-grp]').forEach(g => {
      g.addEventListener('click', () => {
        const nm = g.dataset.grp;
        const items = document.querySelectorAll('.tree-item[data-grp="' + nm + '"]');
        const hide = items.length && items[0].style.display !== 'none';
        items.forEach(el => el.style.display = hide ? 'none' : '');
      });
    });
    /* 指标 / 维度 / 粒度 */
    const mSel = document.querySelector('[data-metric]');
    if (mSel) mSel.addEventListener('change', e => { EV.metric = e.target.value; go('event'); Toast(`指标切换为「${EV_METRICS.find(m => m[0] === EV.metric)[1]}」`); });
    const dSel = document.querySelector('[data-dim]');
    if (dSel) dSel.addEventListener('change', e => { EV.dim = e.target.value; go('event'); });
    const gSel = document.querySelector('[data-grain]');
    if (gSel) gSel.addEventListener('change', e => { EV.grain = e.target.value; go('event'); });
    /* 图表形态 / 图例 */
    document.querySelectorAll('[data-ec]').forEach(b => {
      b.addEventListener('click', () => { EV.chart = b.dataset.ec; go('event'); });
    });
    document.querySelectorAll('[data-lg]').forEach(el => {
      el.addEventListener('click', () => {
        const k = el.dataset.lg;
        EV.hide[k] = !EV.hide[k];
        go('event');
      });
    });
    /* 对比开关 */
    const cb = $('#evCompareCb');
    if (cb) cb.addEventListener('change', () => {
      EV.compare = cb.checked;
      if (EV.compare && !EV.cmpK) { EV.cmpK = 'AdRequest'; EV.cmpN = '广告请求'; }
      go('event');
      Toast(EV.compare ? '已开启上一周期对比' : '已关闭对比');
    });
    /* 过滤器 */
    document.querySelectorAll('[data-fdel]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        EV.filters.splice(+el.dataset.fdel, 1);
        go('event');
        Toast('已移除过滤条件，数据已重算');
      });
    });
    const fadd = document.querySelector('[data-fadd]');
    if (fadd) fadd.addEventListener('click', () => {
      Modal.open({
        title: '添加过滤条件',
        body: `<div class="muted" style="font-size:12px;margin-bottom:10px">对「${EV.n}」的事件参数或用户属性做过滤，多个条件为「且」关系。</div>`,
        fields: [
          { label: '字段', key: 'p', type: 'select', options: ['ad_position', 'ad_source', 'scene', 'drama_id', 'channel', 'device_tier', 'city_tier', 'login_status', 'network'], req: true },
          { label: '操作符', key: 'op', type: 'select', options: ['=', '!=', 'in', 'not in', '>', '<'] },
          { label: '取值', key: 'v', value: 'rewarded', req: true, tip: '多个值用英文逗号分隔' }
        ],
        okText: '添加',
        onOk: v => { EV.filters.push({ p: v.p, op: v.op, v: v.v }); go('event'); Toast('过滤条件已应用，数据已重算'); }
      });
    });
    /* 对比事件 */
    const cadd = document.querySelector('[data-cmpadd]');
    if (cadd) cadd.addEventListener('click', () => {
      const list = D.eventTree.flatMap(g => g.items).slice(0, 40)
        .map(i => `<option value="${i.k}">${i.n} · ${i.k}</option>`).join('');
      Modal.open({
        title: '添加对比事件',
        body: `<div class="muted" style="font-size:12px;margin-bottom:10px">同时展示两条事件曲线，用于验证因果或先后关系。</div>`,
        fields: [{ label: '对比事件', key: 'k', type: 'select', options: D.eventTree.flatMap(g => g.items).slice(0, 40).map(i => i.k) }],
        okText: '添加对比',
        onOk: v => { EV.cmpK = v.k; EV.cmpN = evItem(v.k).n; EV.compare = true; go('event'); }
      });
    });
    document.querySelectorAll('[data-cmpdel]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        if (el.dataset.cmpdel === 'cmp') { EV.cmpK = null; EV.cmpN = null; EV.compare = false; }
        go('event');
      });
    });
    /* 查询按钮：计算过渡 */
    const qbBtn = $('#evQueryBtn');
    if (qbBtn) qbBtn.addEventListener('click', () => {
      const wrap = $('#evTrendWrap');
      if (!wrap) return;
      const mask = document.createElement('div');
      mask.className = 'calc-mask';
      mask.innerHTML = `<span class="spin"></span>查询中 · 扫描 ${Charts.fmt(B_scan())} 条事件…`;
      wrap.appendChild(mask);
      setTimeout(() => { go('event'); Toast('查询完成，已按当前条件重算'); }, 700);
    });
    /* 保存 / 导出 */
    const sv = $('#evSaveBtn');
    if (sv) sv.addEventListener('click', () => Modal.open({
      title: '保存为看板',
      fields: [{ label: '看板名称', key: 'n', value: `${EV.n} · ${EV_METRICS.find(m => m[0] === EV.metric)[1]}`, req: true },
      { label: '归属目录', key: 'd', type: 'select', options: ['我的看板', '投放分析', '变现分析', '团队共享'] }],
      okText: '保存',
      onOk: v => Toast(`已保存到「${v.d} / ${v.n}」`)
    }));
    const ex = $('#evExportBtn');
    if (ex) ex.addEventListener('click', () => {
      const rows = [['事件', '指标', '维度', '粒度', '数值']].concat(
        evLabels().map((lb, i) => [EV.k, EV_METRICS.find(m => m[0] === EV.metric)[1], EV.dim, lb, evBuild().data[i]])
      );
      dtlCsv('事件分析_' + EV.k, rows);
    });
    /* 维度行下钻 */
    document.querySelectorAll('[data-evrow]').forEach(tr => {
      tr.addEventListener('click', () => {
        const name = decodeURIComponent(tr.dataset.evrow);
        const share = +tr.dataset.evshare || 0;
        const dd = D.evDimSplit[EV.dim];
        const r = dd.rows.find(x => x.name === name);
        const val = Math.round(evCountTotal() * share / 100);
        const trend = qdist(val, 14, qhash(name + EV.dim));
        openDrawerHTML(`${dd.title} · ${name}`, `
          <div class="dw-grid">
            <div class="dw-item"><span class="k">触发次数</span><span class="v">${qnum(val)}</span></div>
            <div class="dw-item"><span class="k">占比</span><span class="v">${share.toFixed(1)}%</span></div>
            <div class="dw-item"><span class="k">人均次数</span><span class="v">${(val / Math.max(1, Math.round(D.summary.dau * share / 100))).toFixed(2)}</span></div>
            <div class="dw-item"><span class="k">事件</span><span class="v" style="font-size:13px">${EV.n}</span></div>
          </div>
          <div class="card-title mt16" style="font-size:13px">近 14 天趋势</div>
          <div class="dw-chart">${Charts.line({ labels: DATES.slice(-14).map(d => d.slice(5)), height: 160, area: true, series: [{ name: name, data: trend, color: '#2f6bff' }] })}</div>
          <div class="card-title mt16" style="font-size:13px">该分组下的指标明细</div>
          <div class="tbl-wrap mt8"><table class="tbl"><thead><tr>${dd.head.map((h, i) => `<th class="${i ? 'num' : ''}">${h}</th>`).join('')}</tr></thead>
            <tbody><tr>${[name].concat(r.vals.slice(1)).map((v, i) => `<td class="${i ? 'num' : ''}">${v}</td>`).join('')}</tr></tbody></table></div>
          <div class="note mt16"><span>💡</span><div>该分组贡献 ${share.toFixed(1)}% 的 ${EV.n}，点击下方按钮可直接圈选这部分用户。</div></div>
          <div class="dw-acts">
            <button class="btn" id="dwToSeg">圈选为分群</button>
            <button class="btn" id="dwToFunnel">查看该分组的漏斗</button>
          </div>`);
        const b1 = document.getElementById('dwToSeg');
        if (b1) b1.addEventListener('click', () => { closeDrawer(); go('segment'); Toast('已带入筛选条件，可直接保存分群'); });
        const b2 = document.getElementById('dwToFunnel');
        if (b2) b2.addEventListener('click', () => { closeDrawer(); go('funnel'); });
      });
    });
    /* 分布条 / 属性卡 */
    document.querySelectorAll('[data-dist]').forEach(el => {
      el.addEventListener('click', () => Toast(`「${el.dataset.dist}」用户占 ${el.querySelector('.dv').textContent}`));
    });
    document.querySelectorAll('[data-attrdim]').forEach(el => {
      el.addEventListener('click', () => {
        const dk = el.dataset.attrdim;
        if (!dk) { Toast('网络维度暂不支持拆分，可作为过滤条件使用', 'warn'); return; }
        EV.dim = dk; go('event');
        Toast(`已切换到「${EV_DIMS.find(d => d[0] === EV.dim)[1]}」拆分`);
      });
    });
    /* 关联事件跳转 */
    document.querySelectorAll('[data-jump]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const k = el.dataset.jump;
        EV.k = k; EV.n = evItem(k).n;
        if (EV.recent.indexOf(k) < 0) EV.recent.unshift(k);
        go('event');
      });
    });
    /* 其它按钮 */
    const bseg = $('#evSegBtn');
    if (bseg) bseg.addEventListener('click', () => {
      Modal.open({
        title: '沉淀为分群',
        body: `<div class="muted" style="font-size:12px;margin-bottom:10px">将当前「${EV.n} × ${EV_DIMS.find(d => d[0] === EV.dim)[1]}」的拆分结果保存为人群包，可用于 Push 定向与漏斗对比。</div>`,
        fields: [{ label: '分群名称', key: 'n', value: `${EV.n} · ${EV_DIMS.find(d => d[0] === EV.dim)[1]}高价值`, req: true },
        { label: '更新方式', key: 't', type: 'select', options: ['每日自动更新', '手动更新', '一次性快照'] }],
        okText: '创建',
        onOk: v => { Toast(`分群「${v.n}」已创建，预估覆盖 ${Charts.fmt(Math.round(B.uTot * 0.18))} 人`); }
      });
    });
    const chi = $('#evChainBtn');
    if (chi) chi.addEventListener('click', () => go('dict'));
    const man = $('#evManageBtn');
    if (man) man.addEventListener('click', () => go('dict'));
    const de = $('#evDimExport');
    if (de) de.addEventListener('click', () => {
      const dd2 = D.evDimSplit[EV.dim];
      dtlCsv('维度拆分_' + dd2.title, [dd2.head].concat(dd2.rows.map(r => [r.name].concat(r.vals.slice(1)))));
    });
    const dte = $('#evTrendExport');
    if (dte) dte.addEventListener('click', () => {
      const B2 = evBuild();
      dtlCsv('趋势_' + EV.k, [['日期', EV.n, '上一周期']].concat(evLabels().map((l, i) => [l, B2.data[i], B2.prev[i]])));
    });
  }
};
function B_scan() { return (evItem(EV.k).c || 0) + 42860000; }

/* ===========================================================
   2. 漏斗分析
   =========================================================== */
const FN = window.FN = {
  key: 'full', win: 'd7', split: 'channel', order: 'ordered',
  chart: 'trapezoid', sel: 2, steps: null, loaded: null, trendStep: 2
};
const FN_WIN = { session: 0.82, same: 0.90, d1: 0.955, d7: 1 };
const FN_WIN_LABEL = { session: '会话内', same: '同日', d1: '1 天', d7: '7 天' };

function fnSteps() {
  if (FN.loaded !== FN.key || !FN.steps) {
    FN.steps = D.funnels[FN.key].steps.map(s => {
      const parts = s.name.split(' ');
      return { name: parts[0], key: parts[1] || '', full: s.name, value: s.value };
    });
    FN.loaded = FN.key;
    FN.sel = Math.min(2, FN.steps.length - 1);
    FN.trendStep = FN.sel;
  }
  return FN.steps;
}
function fnView() {
  const st = fnSteps();
  const w = FN_WIN[FN.win] || 1;
  const n = st.length;
  return st.map((s, i) => ({
    name: s.name,
    value: Math.max(1, Math.round(s.value * (1 - (1 - w) * i / Math.max(1, n - 1)) * (FN.order === 'unordered' ? 1 + 0.05 * i / n : 1)))
  }));
}
function fnScaleVals(vals) {
  const w = FN_WIN[FN.win] || 1, n = vals.length;
  return vals.map((v, i) => Math.round(v * (1 - (1 - w) * i / Math.max(1, n - 1))));
}
function fnBars(steps) {
  const max = steps[0].value;
  return `<div class="fbars">` + steps.map((s, i) => {
    const w = Math.max(5, s.value / max * 100);
    const conv = i ? s.value / steps[i - 1].value * 100 : 100;
    return `<div class="fbar-row ${FN.sel === i ? 'sel' : ''}" data-step="${i}">
      <span class="fi">${i + 1}</span>
      <span class="fn">${s.name}<em>${fnSteps()[i].key}</em></span>
      <span class="ft"><i style="width:${w.toFixed(1)}%"></i></span>
      <span class="fv">${Charts.fmt(s.value)}</span>
      <span class="fc ${i && conv < 60 ? 'bad' : ''}">${i ? conv.toFixed(1) + '%' : '—'}</span>
    </div>`;
  }).join('') + `</div>`;
}

VIEWS.funnel = {
  render() {
    $('#topfilters').innerHTML = topFilters(`
      <select class="select" id="fnChannel"><option>全部渠道</option><option>巨量引擎</option><option>腾讯广告</option><option>快手磁力</option><option>小米应用商店</option></select>`);

    const f = D.funnels[FN.key];
    const steps = fnView();
    const first = steps[0].value, last = steps[steps.length - 1].value;
    const totalRate = last / first * 100;

    let maxLoss = { i: 1, rate: 100 };
    steps.forEach((s, i) => {
      if (!i) return;
      const r = s.value / steps[i - 1].value * 100;
      if (r < maxLoss.rate) maxLoss = { i, rate: r };
    });
    const avgDur = FN.key === 'full' ? 86.8 : 1.6;
    const fnUnit = /曝光|请求|展示/.test(fnSteps()[0].name) ? '次' : '人';

    const kpi = `
      <div class="mini-kpis">
        <div class="mini-kpi"><div class="l">整体转化率</div><div class="v">${totalRate.toFixed(2)}<span class="u">%</span></div>
          <div class="d"><span class="up">▲ 0.34pt</span><span class="cmp">较上周</span></div></div>
        <div class="mini-kpi"><div class="l">端到端流失</div><div class="v">${Charts.fmt(first - last)}<span class="u">${fnUnit}</span></div>
          <div class="d"><span class="down">▼ ${(100 - totalRate).toFixed(2)}%</span><span class="cmp">流失率</span></div></div>
        <div class="mini-kpi"><div class="l">最大流失环节</div><div class="v" style="font-size:15px">${steps[maxLoss.i].name}</div>
          <div class="d"><span class="up">单步仅 ${maxLoss.rate.toFixed(1)}%</span></div></div>
        <div class="mini-kpi"><div class="l">平均转化时长</div><div class="v">${avgDur}<span class="u">min</span></div>
          <div class="d"><span class="down">▼ 4.2 min</span><span class="cmp">较上周</span></div></div>
      </div>`;

    const stepEditor = steps.map((s, i) => `
      <div class="step-item ${FN.sel === i ? 'sel' : ''}" data-fstep="${i}">
        <span class="idx">${i + 1}</span>
        <span class="nm">${s.name}</span>
        <span class="sv">${Charts.fmt(s.value)}</span>
        <span class="ops">
          <i data-fmove="up" data-i="${i}" title="上移">↑</i>
          <i data-fmove="down" data-i="${i}" title="下移">↓</i>
          <i class="del" data-fdel2="${i}" title="删除">×</i>
        </span>
      </div>`).join('') + `<div class="step-item add" data-fadd2>＋ 添加步骤</div>`;

    let funnelChart = FN.chart === 'trapezoid'
      ? Charts.funnel(steps, { sel: FN.sel })
      : fnBars(steps);

    const si = FN.sel;
    const sv = steps[si] || steps[0];
    const prevV = si > 0 ? steps[si - 1].value : sv.value;
    const stepConv = sv.value / prevV * 100;
    const lossTotal = prevV - sv.value;
    const lossFlow = D.funnelLossFlow.map((x, i) => ({ name: x.name, value: +(x.v * (1 + (qhash(sv.name + i) - 0.5) * 0.24)).toFixed(1) }));
    const lossTier = D.funnelLossTier;
    const stepTrend = qdist(Math.round(stepConv * 100), 14, qhash(sv.name)).map(v => +(v / 100).toFixed(2));

    const detail = `
      <div class="sd-panel">
        <div class="sd-hd">
          <span class="sd-idx">${si + 1}</span>
          <span class="t">${sv.name}</span>
          <span class="tag ${stepConv < 60 ? 'red' : stepConv < 85 ? 'orange' : 'green'}">单步转化 ${stepConv.toFixed(1)}%</span>
          <span class="muted" style="font-size:12px">${Charts.fmt(sv.value)} ${fnUnit} · 流失 ${Charts.fmt(lossTotal)} ${fnUnit}</span>
          <div style="margin-left:auto;display:flex;gap:6px">
            <button class="btn sm" id="sdSegBtn">圈选流失用户</button>
            <button class="btn sm" id="sdPathBtn">查看流失路径</button>
          </div>
        </div>
        <div class="sd-bd">
          <div class="sd-col">
            <div class="h">流失用户去向 TOP5</div>
            <div class="dist-mini">${lossFlow.map((x, i) => `
              <div class="row"><span class="nm">${x.name}</span>
                <span class="tk"><i class="fl" style="width:${(x.value / lossFlow[0].value * 100).toFixed(0)}%;background:${Charts.C[i % Charts.C.length]}"></i></span>
                <span class="vl">${x.value}%</span></div>`).join('')}</div>
          </div>
          <div class="sd-col">
            <div class="h">流失用户机型分布</div>
            <div class="dist-mini">${lossTier.map((x, i) => `
              <div class="row"><span class="nm">${x.name}</span>
                <span class="tk"><i class="fl" style="width:${(x.value / lossTier[0].value * 100).toFixed(0)}%;background:${Charts.C[i % Charts.C.length]}"></i></span>
                <span class="vl">${x.value}%</span></div>`).join('')}</div>
          </div>
        </div>
        <div class="sd-foot">
          <div class="sdf-l"><span class="h">该步骤近 14 天转化率</span>
            <div class="sdf-chart">${Charts.line({ labels: DATES.slice(-14).map(d => d.slice(5)), height: 120, area: true, series: [{ name: '转化率', data: stepTrend, color: '#2f6bff' }], yFormat: v => v.toFixed(2) + '%' })}</div>
          </div>
          <div class="sdf-r"><span class="h">优化建议</span>
            <div class="note" style="margin:0"><span>💡</span><div>${si === 0
        ? '首步为入口，规模由投放决定。关注曝光→点击的素材质量，点击率低于 5% 时优先换素材而非调价。'
        : stepConv < 60
          ? `该步骤流失 ${(100 - stepConv).toFixed(1)}%，是当前漏斗的最大瓶颈。建议对流失用户做二次触达（Push / 组件），并检查该环节的加载耗时与错误率。`
          : `该步骤转化 ${stepConv.toFixed(1)}%，处于健康区间。可保持现状，重点关注下游步骤。`}</div></div>
          </div>
        </div>
      </div>`;

    const detailRows = steps.map((s, i) => {
      const prev = i === 0 ? s.value : steps[i - 1].value;
      const conv = s.value / prev * 100;
      const cum = s.value / first * 100;
      return `<tr class="row-btn ${FN.sel === i ? 'tr-sel' : ''}" data-fstep="${i}">
        <td><span class="sd-idx sm">${i + 1}</span></td>
        <td><span class="name">${s.name}</span><div class="sub code">${fnSteps()[i].key}</div></td>
        <td class="num"><b>${Charts.fmt(s.value)}</b></td>
        <td class="num">${i === 0 ? '—' : conv.toFixed(1) + '%'}</td>
        <td class="num">${cum.toFixed(2) + '%'}</td>
        <td class="num">${i === 0 ? '—' : Charts.fmt(prev - s.value)}</td>
        <td class="num ${i && conv < 60 ? 'up' : ''}">${i === 0 ? '—' : (100 - conv).toFixed(1) + '%'}</td>
        <td class="num">${i === 0 ? '—' : (i * (avgDur / steps.length) * 1.1).toFixed(1) + ' min'}</td>
      </tr>`;
    }).join('');

    const sp = D.funnelSplit[FN.split];
    const spRows = sp ? sp.rows.map(r => {
      const vals = fnScaleVals(r.vals);
      const e2e = vals[vals.length - 1] / vals[0] * 100;
      const cells = vals.map((v, i) => {
        const conv = i ? v / vals[i - 1] * 100 : 100;
        return `<td class="num ${i && conv < 70 ? 'up' : ''}">${i ? conv.toFixed(1) + '%' : Charts.fmt(v)}</td>`;
      }).join('');
      return `<tr class="row-btn" data-fsplitrow="${encodeURIComponent(r.name)}">
        <td><span class="name">${r.name}</span></td>
        ${cells}
        <td class="num"><b>${e2e.toFixed(2)}%</b></td>
        <td><div class="bar-cell"><div class="mini-bar" style="width:${Math.min(100, e2e * 2).toFixed(0)}%"></div></div></td>
      </tr>`;
    }).join('') : '';

    const winKeys = ['session', 'same', 'd1', 'd7'];
    const winBars = winKeys.map(k => {
      const w = FN_WIN[k];
      const val = Math.round(sv.value * (w === 1 ? 1 : 1 - (1 - w) * si / Math.max(1, steps.length - 1)));
      return { k, val };
    });
    const maxWin = Math.max.apply(null, winBars.map(x => x.val));
    const winHTML = winBars.map(x => `
      <div class="wbar ${FN.win === x.k ? 'on' : ''}" data-fwin="${x.k}">
        <span class="wn">${FN_WIN_LABEL[x.k]}</span>
        <span class="wt"><i style="width:${(x.val / maxWin * 100).toFixed(0)}%;background:${FN.win === x.k ? '#2f6bff' : '#c6d8ff'}"></i></span>
        <span class="wv">${Charts.fmt(x.val)}</span>
        <span class="wp">${(x.val / first * 100).toFixed(2)}%</span>
      </div>`).join('');

    return `
      <div class="fn-layout">
        <div class="panel fn-side">
          <div class="panel-head">漏斗配置</div>
          <div class="panel-body">
            <div class="fl-lb">选择漏斗</div>
            <select class="select" style="width:100%" id="fsel">
              ${Object.keys(D.funnels).map(k => `<option value="${k}" ${k === FN.key ? 'selected' : ''}>${D.funnels[k].name}</option>`).join('')}
            </select>
            <div class="fl-lb mt12">转化窗口</div>
            <div class="seg full" id="fnWinSeg">
              ${winKeys.map(k => `<button class="${FN.win === k ? 'active' : ''}" data-fwin="${k}">${FN_WIN_LABEL[k]}</button>`).join('')}
            </div>
            <div class="fl-lb mt12">步骤顺序</div>
            <div class="seg full" id="fnOrderSeg">
              <button class="${FN.order === 'ordered' ? 'active' : ''}" data-forder="ordered">有序</button>
              <button class="${FN.order === 'unordered' ? 'active' : ''}" data-forder="unordered">无序</button>
            </div>
            <div class="fl-lb mt12">维度拆分</div>
            <select class="select" style="width:100%" id="fsplit">
              <option value="channel" ${FN.split === 'channel' ? 'selected' : ''}>归因渠道</option>
              <option value="slot" ${FN.split === 'slot' ? 'selected' : ''}>广告位</option>
              <option value="source" ${FN.split === 'source' ? 'selected' : ''}>广告源</option>
              <option value="drama" ${FN.split === 'drama' ? 'selected' : ''}>剧集</option>
            </select>
            <div class="fl-lb mt16">漏斗步骤 <span class="muted" style="font-weight:400">${steps.length} 步 · 可排序</span></div>
            <div class="step-list">${stepEditor}</div>
            <button class="btn primary mt16" style="width:100%;justify-content:center" id="fnRecalc">重新计算</button>
          </div>
        </div>

        <div class="fn-main">
          <div class="card">${kpi}</div>

          <div class="card">
            <div class="card-head">
              <div class="card-title">${f.name}<small>${FN_WIN_LABEL[FN.win]}内完成 · ${FN.order === 'ordered' ? '严格有序' : '无序'} · ${steps.length} 步</small></div>
              <div class="right">
                <div class="seg" id="fnChartSeg">
                  <button class="${FN.chart === 'trapezoid' ? 'active' : ''}" data-fchart="trapezoid">梯形</button>
                  <button class="${FN.chart === 'bar' ? 'active' : ''}" data-fchart="bar">条形</button>
                </div>
                <button class="btn sm" id="fnSaveBtn">保存为看板</button>
              </div>
            </div>
            <div class="card-body">
              <div class="chart-wrap">${funnelChart}</div>
              <div class="fn-tip">点击任一层查看该步骤的流失去向与机型分布</div>
            </div>
          </div>

          ${detail}

          <div class="card">
            <div class="card-head"><div class="card-title">转化明细<small>点击行定位到该步骤</small></div>
              <div class="right"><button class="btn sm" id="fnExportBtn">导出</button></div></div>
            <div class="tbl-wrap"><table class="tbl">
              <thead><tr><th class="nosort">#</th><th>步骤</th><th class="num">用户数</th><th class="num">单步转化率</th>
                <th class="num">累计转化率</th><th class="num">流失人数</th><th class="num">流失率</th><th class="num">平均耗时</th></tr></thead>
              <tbody>${detailRows}</tbody></table></div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">按「${sp ? sp.title : '维度'}」对比<small>首列为入口规模，其余为相对上一步的转化率</small></div>
              <div class="right"><button class="btn sm" id="fnSplitExport">导出</button></div></div>
            <div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>${sp ? sp.title : ''}</th>${(sp ? sp.head : []).map((h, i) => `<th class="num">${h}</th>`).join('')}
                <th class="num">端到端</th><th>分布</th></tr></thead>
              <tbody>${spRows}</tbody></table></div>
            <div class="card-body tight"><div class="note"><span>💡</span><div>商店渠道（小米 44.2% / 华为 45.0%）的广告解锁率显著高于信息流，用户更愿意为追剧看广告；扩量时建议给商店渠道更高出价系数。</div></div></div>
          </div>

          <div class="grid g2">
            <div class="card">
              <div class="card-head"><div class="card-title">转化窗口对比<small>步骤「${sv.name}」在不同窗口下的用户数</small></div></div>
              <div class="card-body"><div class="wbars">${winHTML}</div>
                <div class="note mt12"><span>💡</span><div>窗口从「会话内」放宽到「7 天」，该步骤用户数提升 ${((winBars[3].val / winBars[0].val - 1) * 100).toFixed(0)}%。IAA 用户追剧节奏慢，建议以 7 天为默认口径。</div></div>
              </div>
            </div>
            <div class="card">
              <div class="card-head"><div class="card-title">步骤转化率趋势<small>近 14 天 · 可切换步骤</small></div>
                <div class="right"><select class="select" id="fnTrendStep">${steps.map((s, i) => `<option value="${i}" ${FN.trendStep === i ? 'selected' : ''}>${i + 1}. ${s.name}</option>`).join('')}</select></div></div>
              <div class="card-body">
                <div class="chart-wrap">${Charts.line({
      labels: DATES.slice(-14).map(d => d.slice(5)), height: 200, area: true,
      series: [{
        name: '转化率',
        data: qdist(Math.round((steps[FN.trendStep] ? steps[FN.trendStep].value / (steps[FN.trendStep - 1] || steps[0]).value * 100 : 80) * 100), 14, qhash('fnt' + FN.trendStep)).map(v => +(v / 100).toFixed(2)),
        color: '#17b26a'
      }],
      yFormat: v => v.toFixed(2) + '%'
    })}</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  after() {
    const fs = $('#fsel');
    if (fs) fs.addEventListener('change', e => { FN.key = e.target.value; FN.steps = null; go('funnel'); });
    const sp = $('#fsplit');
    if (sp) sp.addEventListener('change', e => { FN.split = e.target.value; go('funnel'); });
    document.querySelectorAll('[data-fwin]').forEach(b => b.addEventListener('click', () => { FN.win = b.dataset.fwin; go('funnel'); }));
    document.querySelectorAll('[data-forder]').forEach(b => b.addEventListener('click', () => {
      FN.order = b.dataset.forder; go('funnel');
      Toast(FN.order === 'ordered' ? '已切换为严格有序' : '已切换为无序（不要求步骤顺序）');
    }));
    document.querySelectorAll('[data-fchart]').forEach(b => b.addEventListener('click', () => { FN.chart = b.dataset.fchart; go('funnel'); }));
    document.querySelectorAll('[data-step]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        FN.sel = +el.dataset.step; FN.trendStep = FN.sel; go('funnel');
      });
    });
    document.querySelectorAll('[data-fstep]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.dataset.fmove || e.target.dataset.fdel2) return;
        FN.sel = +el.dataset.fstep; FN.trendStep = FN.sel; go('funnel');
      });
    });
    document.querySelectorAll('[data-fmove]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const i = +el.dataset.i, dir = el.dataset.fmove;
        const st = fnSteps();
        const j = dir === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= st.length) { Toast('已到边界，无法移动', 'warn'); return; }
        const t = st[i]; st[i] = st[j]; st[j] = t;
        FN.sel = j; go('funnel');
        Toast(`「${t.name}」已${dir === 'up' ? '上移' : '下移'}`);
      });
    });
    document.querySelectorAll('[data-fdel2]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const i = +el.dataset.fdel2;
        const st = fnSteps();
        if (st.length <= 2) { Toast('至少保留 2 个步骤', 'warn'); return; }
        const nm = st[i].name;
        st.splice(i, 1);
        FN.sel = Math.max(0, Math.min(FN.sel, st.length - 1));
        go('funnel'); Toast(`已移除步骤「${nm}」`);
      });
    });
    const fa = document.querySelector('[data-fadd2]');
    if (fa) fa.addEventListener('click', () => {
      Modal.open({
        title: '添加漏斗步骤',
        body: `<div class="muted" style="font-size:12px;margin-bottom:10px">新步骤将插入到当前选中步骤之后，用户量按当前步骤的 72% 预估。</div>`,
        fields: [{ label: '事件', key: 'e', type: 'select', options: D.eventTree.flatMap(g => g.items).map(i => `${i.n} · ${i.k}`) }],
        okText: '添加',
        onOk: v => {
          const st = fnSteps();
          const nm = v.e.split(' · ')[0];
          const key = v.e.split(' · ')[1] || '';
          const base = st[FN.sel] ? st[FN.sel].value : st[0].value;
          st.splice(FN.sel + 1, 0, { name: nm, key, full: v.e, value: Math.round(base * 0.72) });
          FN.sel = FN.sel + 1;
          go('funnel'); Toast(`已添加步骤「${nm}」`);
        }
      });
    });
    const rc = $('#fnRecalc');
    if (rc) rc.addEventListener('click', () => {
      setTimeout(() => { go('funnel'); Toast('漏斗已按当前配置重算'); }, 450);
    });
    const ts = $('#fnTrendStep');
    if (ts) ts.addEventListener('change', e => { FN.trendStep = +e.target.value; go('funnel'); });
    document.querySelectorAll('[data-fsplitrow]').forEach(tr => {
      tr.addEventListener('click', () => {
        const name = decodeURIComponent(tr.dataset.fsplitrow);
        const spd = D.funnelSplit[FN.split];
        const r = spd.rows.find(x => x.name === name);
        const vals = fnScaleVals(r.vals);
        const bars = vals.map((v, i) => {
          const conv = i ? v / vals[i - 1] * 100 : 100;
          return `<div class="fbar-row"><span class="fi">${i + 1}</span>
            <span class="fn">${spd.head[i]}</span>
            <span class="ft"><i style="width:${Math.max(5, v / vals[0] * 100).toFixed(1)}%"></i></span>
            <span class="fv">${Charts.fmt(v)}</span>
            <span class="fc">${i ? conv.toFixed(1) + '%' : '—'}</span></div>`;
        }).join('');
        openDrawerHTML(`${spd.title} · ${name}`, `
          <div class="dw-grid">
            <div class="dw-item"><span class="k">入口用户</span><span class="v">${Charts.fmt(vals[0])}</span></div>
            <div class="dw-item"><span class="k">出口用户</span><span class="v">${Charts.fmt(vals[vals.length - 1])}</span></div>
            <div class="dw-item"><span class="k">端到端转化</span><span class="v">${(vals[vals.length - 1] / vals[0] * 100).toFixed(2)}%</span></div>
            <div class="dw-item"><span class="k">缺口</span><span class="v">${Charts.fmt(vals[0] - vals[vals.length - 1])}</span></div>
          </div>
          <div class="card-title mt16" style="font-size:13px">该${spd.title}的分步漏斗</div>
          <div class="fbars mt8">${bars}</div>
          <div class="note mt16"><span>💡</span><div>与整体漏斗相比，该分组的端到端差异主要出现在下游步骤，建议单独复核该环节的落地页与广告填充。</div></div>
          <div class="dw-acts"><button class="btn" id="dwFunnelSeg">圈选为分群</button><button class="btn" id="dwFunnelAd">查看投放明细</button></div>`);
        const b1 = document.getElementById('dwFunnelSeg');
        if (b1) b1.addEventListener('click', () => { closeDrawer(); go('segment'); });
        const b2 = document.getElementById('dwFunnelAd');
        if (b2) b2.addEventListener('click', () => { closeDrawer(); go('ad'); });
      });
    });
    const sb = $('#sdSegBtn');
    if (sb) sb.addEventListener('click', () => {
      const st = fnView();
      const cur = st[FN.sel], prev = st[FN.sel - 1] || st[0];
      Modal.open({
        title: '圈选流失用户',
        body: `<div class="muted" style="font-size:12px;margin-bottom:10px">把「${cur.name}」环节流失的 ${Charts.fmt(prev.value - cur.value)} 位用户存为分群，用于 Push 召回。</div>`,
        fields: [{ label: '分群名称', key: 'n', value: `漏斗流失 · ${cur.name}`, req: true },
        { label: '有效期', key: 'd', type: 'select', options: ['7 天', '30 天', '长期'] }],
        okText: '创建分群',
        onOk: v => Toast(`分群「${v.n}」已创建`)
      });
    });
    const pb = $('#sdPathBtn');
    if (pb) pb.addEventListener('click', () => go('path'));
    const sve = $('#fnSaveBtn');
    if (sve) sve.addEventListener('click', () => Toast(`漏斗已保存为看板「投流 · ${D.funnels[FN.key].name}」`));
    const ex = $('#fnExportBtn');
    if (ex) ex.addEventListener('click', () => {
      const st = fnView();
      dtlCsv('漏斗明细_' + FN.key, [['#', '步骤', '用户数', '单步转化率', '累计转化率']].concat(
        st.map((s, i) => [i + 1, s.name, s.value, i ? (s.value / st[i - 1].value * 100).toFixed(2) + '%' : '—', (s.value / st[0].value * 100).toFixed(2) + '%'])
      ));
    });
    const ex2 = $('#fnSplitExport');
    if (ex2) ex2.addEventListener('click', () => {
      const spd = D.funnelSplit[FN.split];
      dtlCsv('漏斗分维度_' + spd.title, [['分组'].concat(spd.head)].concat(spd.rows.map(r => [r.name].concat(r.vals))));
    });
  }
};

/* ===========================================================
   3. 广告变现分析
   =========================================================== */
const MC = window.MC = { metric: 'ecpm', slot: '全部广告位', srcView: 'waterfall' };
const MC_METRICS = [
  ['ecpm', 'eCPM'], ['imp', '展示量'], ['rev', '广告收入'], ['fill', '填充率']
];

function mcTotals() {
  const rev = D.adSlots.reduce((s, x) => s + x.rev, 0);
  const imp = D.adSlots.reduce((s, x) => s + x.show, 0);
  const req = D.adSlots.reduce((s, x) => s + x.req, 0);
  const fill = D.adSlots.reduce((s, x) => s + x.fill, 0);
  return { rev, imp, req, fill };
}
function mcHourly() {
  const T = mcTotals();
  let imp, ecpm, fill;
  if (MC.slot === '全部广告位') {
    imp = D.hourly.labels.map((_, i) => D.adSlots.reduce((s, x) => s + (((D.hourlyBySlot || {})[x.name] || [])[i] || 0), 0));
    ecpm = D.hourly.ecpm.slice();
    fill = D.hourlyFill.slice();
  } else {
    const slot = D.adSlots.find(s => s.name === MC.slot) || D.adSlots[0];
    imp = (D.hourlyBySlot[slot.name] || D.hourly.imp).slice();
    const avgE = D.hourly.ecpm.reduce((a, b) => a + b, 0) / 24;
    ecpm = D.hourly.ecpm.map(v => +(slot.ecpm * v / avgE).toFixed(2));
    const baseFill = T.fill / T.req * 100;
    fill = D.hourlyFill.map(v => +((slot.fill / slot.req * 100) * v / baseFill).toFixed(1));
  }
  /* 归一：让分时收入合计等于总览收入，避免两处口径不一致 */
  const raw = imp.reduce((s, v, i) => s + v * ecpm[i] / 1000, 0);
  const k = raw ? T.rev / raw : 1;
  ecpm = ecpm.map(v => +(v * k).toFixed(2));
  const rev = imp.map((v, i) => Math.round(v * ecpm[i] / 1000));
  return { imp, ecpm, rev, fill };
}
function mcAll() {
  const save = MC.slot;
  MC.slot = '全部广告位';
  const r = mcHourly();
  MC.slot = save;
  return r;
}
function mcSeries() {
  const cur = mcHourly();
  const all = mcAll();
  return { cur: cur[MC.metric], base: all[MC.metric] };
}

VIEWS.monetize = {
  render() {
    $('#topfilters').innerHTML = topFilters(`
      <select class="select" id="mcSlotTop">
        <option ${MC.slot === '全部广告位' ? 'selected' : ''}>全部广告位</option>
        ${D.adSlots.map(s => `<option ${MC.slot === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}
      </select>
      <button class="btn ghost" id="mcAttrBtn">归因口径：渠道归因</button>`);

    const T = mcTotals();
    const ecpm = T.rev / T.imp * 1000;
    const arpu = T.rev / D.summary.dau;
    const cpu = T.imp / D.summary.dau;
    const fillRate = T.fill / T.req * 100;

    const kpi = `
      <div class="mini-kpis">
        <div class="mini-kpi"><div class="l">广告收入</div><div class="v">${(T.rev / 10000).toFixed(2)}<span class="u">万元</span></div>
          <div class="d"><span class="up">▲ 18.2%</span><span class="cmp">较上周</span></div></div>
        <div class="mini-kpi"><div class="l">整体 eCPM</div><div class="v">${ecpm.toFixed(2)}<span class="u">元</span></div>
          <div class="d"><span class="up">▲ 4.1%</span><span class="cmp">较上周</span></div></div>
        <div class="mini-kpi"><div class="l">人均广告展示</div><div class="v">${cpu.toFixed(1)}<span class="u">次</span></div>
          <div class="d"><span class="up">▲ 2.1%</span></div></div>
        <div class="mini-kpi"><div class="l">ARPU</div><div class="v">${arpu.toFixed(3)}<span class="u">元</span></div>
          <div class="d"><span class="up">▲ 6.3%</span></div></div>
        <div class="mini-kpi"><div class="l">广告填充率</div><div class="v">${fillRate.toFixed(2)}<span class="u">%</span></div>
          <div class="d"><span class="up">▲ 0.6pt</span></div></div>
        <div class="mini-kpi"><div class="l">展示 / 填充</div><div class="v">${(T.imp / T.fill * 100).toFixed(1)}<span class="u">%</span></div>
          <div class="d"><span class="muted">展示损耗集中在开屏</span></div></div>
      </div>`;

    /* 收入结构 */
    const donutParts = D.adSlots.map((s, i) => ({ name: s.name, v: s.rev, color: Charts.C[i % Charts.C.length] }));
    const donutHTML = qDonut(donutParts, { size: 176, inner: (T.rev / 10000).toFixed(1) + '万' });
    const donutLegend = donutParts.map(p => `
      <div class="dl-row ${MC.slot === p.name ? 'on' : ''}" data-mcslot="${p.name}">
        <i style="background:${p.color}"></i>
        <span class="n">${p.name}</span>
        <span class="b"><span style="width:${(p.v / T.rev * 100).toFixed(1)}%;background:${p.color}"></span></span>
        <span class="v">${(p.v / T.rev * 100).toFixed(1)}%</span>
        <span class="r">${(p.v / 10000).toFixed(1)}万</span>
      </div>`).join('');

    /* 分时图 */
    const S = mcSeries();
    const isRate = MC.metric === 'ecpm' || MC.metric === 'fill';
    const showBase = isRate && MC.slot !== '全部广告位';
    const hourlyChart = isRate
      ? Charts.line({
        labels: D.hourly.labels, height: 240,
        series: [
          { name: MC.slot, data: S.cur, color: '#eb2f96' }
        ].concat(showBase ? [{ name: '全站均值', data: S.base, color: '#c9cfd8', dash: true }] : []),
        yFormat: v => MC.metric === 'ecpm' ? '¥' + v : v + '%'
      })
      : Charts.bar({
        labels: D.hourly.labels, height: 240,
        series: [{ name: MC.slot, data: S.cur, color: '#2f6bff' }]
      });
    const metricSeg = MC_METRICS.map(([k, n]) => `<button class="${MC.metric === k ? 'active' : ''}" data-mcmetric="${k}">${n}</button>`).join('');

    /* 分时高峰洞察 */
    const peakIdx = S.cur.indexOf(Math.max.apply(null, S.cur));

    /* 广告位明细 */
    const slotRows = D.adSlots.map(s => `<tr class="row-btn" data-row="slot:${s.name}">
      <td><span class="name">${s.name}</span><div class="sub">${s.scene}</div></td>
      <td class="num">${Charts.fmt(s.req)}</td>
      <td class="num ${s.fill / s.req * 100 >= 95 ? 'down' : s.fill / s.req * 100 < 90 ? 'up' : ''}">${pct(s.fill, s.req)}</td>
      <td class="num">${pct(s.show, s.fill)}</td>
      <td class="num">${Charts.fmt(s.show)}</td>
      <td class="num"><b>¥${s.ecpm.toFixed(2)}</b></td>
      <td class="num">${money(s.rev)}</td>
      <td class="num">${pct(s.rev, T.rev)}</td>
      <td class="num">${s.cpu}</td>
    </tr>`).join('');

    /* 广告源 */
    const sortedSrc = D.adSources.slice().sort((a, b) => b.ecpm - a.ecpm);
    const ladder = sortedSrc.map((s, i) => {
      const share = s.rev / T.rev * 100;
      const uplift = s.ecpm >= 20 ? 0.12 : s.ecpm >= 12 ? 0.08 : 0.04;
      return `<div class="ld-row" data-src="${encodeURIComponent(s.name)}">
        <span class="ld-rank">${i + 1}</span>
        <span class="ld-nm">${s.name}<em>${s.ecpm >= 20 ? '主力层' : s.ecpm >= 12 ? '补充层' : '兜底层'}</em></span>
        <span class="ld-e">¥${s.ecpm.toFixed(1)}</span>
        <span class="ld-f">${s.fillRate}%</span>
        <span class="ld-b"><i style="width:${share.toFixed(1)}%;background:${Charts.C[i % Charts.C.length]}"></i></span>
        <span class="ld-r">${(s.rev / 10000).toFixed(1)}万</span>
        <span class="tag ${s.ecpm >= 20 ? 'green' : s.ecpm >= 12 ? 'orange' : 'red'}">${s.ecpm >= 20 ? '置顶' : s.ecpm >= 12 ? '保留' : '下沉兜底'}</span>
      </div>`;
    }).join('');

    const biddingRows = sortedSrc.map((s, i) => {
      const uplift = s.ecpm >= 20 ? 0.12 : s.ecpm >= 12 ? 0.08 : 0.04;
      const gain = Math.round(s.rev * uplift);
      return `<tr>
        <td><span class="name">${s.name}</span></td>
        <td class="num">¥${s.ecpm.toFixed(1)}</td>
        <td class="num"><b>¥${(s.ecpm * (1 + uplift)).toFixed(1)}</b></td>
        <td class="num">${s.fillRate}%</td>
        <td class="num">${(s.rev / 10000).toFixed(1)}万</td>
        <td class="num up">+${(gain / 10000).toFixed(1)}万</td>
        <td class="num">${(uplift * 100).toFixed(0)}%</td>
        <td><span class="tag ${i < 2 ? 'green' : i < 4 ? 'orange' : 'red'}">${i < 2 ? '优先接入' : i < 4 ? '灰度验证' : '暂缓'}</span></td>
      </tr>`;
    }).join('');
    const biddingGain = sortedSrc.reduce((s, x) => s + Math.round(x.rev * (x.ecpm >= 20 ? 0.12 : x.ecpm >= 12 ? 0.08 : 0.04)), 0);

    /* 四象限 */
    const avgFill = D.adSources.reduce((a, b) => a + b.fillRate, 0) / D.adSources.length;
    const scatter = Charts.scatter(D.adSourceScatter, {
      width: 560, height: 300, xLabel: '填充率', yLabel: 'eCPM',
      quadX: avgFill, quadY: 18, yPrefix: '¥', xMax: 100
    });

    /* 分时将 × 广告位热力 */
    const buckets = ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'];
    const heat = D.adSlots.map((s, si) => {
      const arr = D.hourlyBySlot[s.name] || [];
      const vals = buckets.map((_, bi) => {
        const seg = arr.slice(bi * 4, bi * 4 + 4);
        return seg.reduce((a, b) => a + b, 0);
      });
      const max = Math.max.apply(null, vals);
      return `<tr><td><span class="name">${s.name}</span></td>
        ${vals.map((v, bi) => {
        const a = v / max;
        return `<td class="hm" style="background:rgba(47,107,255,${(0.08 + a * 0.8).toFixed(2)});color:${a > 0.6 ? '#fff' : '#1f2329'}"
          title="${s.name} ${buckets[bi]}：${Charts.fmt(v)} 次">${Charts.fmt(v)}</td>`;
      }).join('')}
      <td class="num"><b>${(s.show / 10000).toFixed(0)}万</b></td></tr>`;
    }).join('');

    /* 收入缺口瀑布 */
    const avgEcpm = ecpm;
    const theo = T.req * avgEcpm / 1000;
    const afterFill = T.fill * avgEcpm / 1000;
    const wfItems = [
      { name: '理论收入', v: Math.round(theo), type: 'total' },
      { name: '填充损失', v: Math.round(afterFill - theo) },
      { name: '展示损失', v: Math.round(T.rev - afterFill) },
      { name: '实际收入', v: Math.round(T.rev), type: 'total' }
    ];

    /* 剧集 */
    const dramaRows = D.dramas.map(d => `<tr class="row-btn" data-row="drama:${d.name}">
      <td><span class="name">${d.name}</span><div class="sub">共 ${d.eps} 集</div></td>
      <td class="num">${Charts.fmt(d.uv)}</td>
      <td class="num">${d.finish}%</td>
      <td class="num">${d.epPerUser}</td>
      <td class="num">${d.unlock}%</td>
      <td class="num">${Charts.fmt(d.imp)}</td>
      <td class="num">¥${(d.rev / d.imp * 1000).toFixed(2)}</td>
      <td class="num"><b>${money(d.rev)}</b></td>
      <td class="num">${pct(d.rev, D.dramas.reduce((s, x) => s + x.rev, 0))}</td>
    </tr>`).join('');

    return `
      <div class="card">${kpi}</div>

      <div class="grid g-1-2">
        <div class="card">
          <div class="card-head"><div class="card-title">收入结构<small>点击图例筛选广告位</small></div></div>
          <div class="card-body">
            <div class="donut-wrap">${donutHTML}</div>
            <div class="dl-list">${donutLegend}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-head">
            <div class="card-title">分时表现<small>${MC.slot === '全部广告位' ? '全广告位合计' : MC.slot} · 24 小时</small></div>
            <div class="right">
              <div class="seg">${metricSeg}</div>
              <select class="select" id="mcSlotSel">
                <option ${MC.slot === '全部广告位' ? 'selected' : ''}>全部广告位</option>
                ${D.adSlots.map(s => `<option ${MC.slot === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-wrap">${hourlyChart}</div>
            <div class="legend">
              <span class="lg"><i style="background:${isRate ? '#eb2f96' : '#2f6bff'}"></i>${MC.slot}</span>
              ${showBase ? `<span class="lg"><i style="background:#c9cfd8"></i>全站均值</span>` : ''}
            </div>
            <div class="note mt12"><span>💡</span><div>峰值出现在 <b>${D.hourly.labels[peakIdx]}</b>，${MC.metric === 'ecpm'
        ? '晚高峰 eCPM 比凌晨高 ' + ((Math.max.apply(null, S.cur) / Math.min.apply(null, S.cur) - 1) * 100).toFixed(0) + '%，建议把高价值广告位的请求集中在 19:00-22:00。'
        : '与 DAU 活跃曲线一致，可据此调整广告位请求节奏与库存配比。'}</div></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">广告位变现明细<small>请求 → 填充 → 展示 → 收入</small></div>
          <div class="right"><button class="btn sm" id="mcColBtn">自定义列</button><button class="btn sm" id="mcSlotExport">导出</button><button class="btn sm primary" id="mcBoardBtn">创建广告位看板</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr>
            <th>广告位 / 场景</th><th class="num">请求量</th><th class="num">填充率</th><th class="num">展示率</th>
            <th class="num">展示量</th><th class="num">eCPM</th><th class="num">收入</th>
            <th class="num">收入占比</th><th class="num">人均展示</th>
          </tr></thead><tbody>${slotRows}</tbody></table></div>
      </div>

      <div class="grid g2">
        <div class="card">
          <div class="card-head"><div class="card-title">广告源分层<small>按 eCPM 排序的 Waterfall 阶梯</small></div>
            <div class="right"><div class="seg" id="mcSrcSeg">
              <button class="${MC.srcView === 'waterfall' ? 'active' : ''}" data-mcsrc="waterfall">Waterfall</button>
              <button class="${MC.srcView === 'bidding' ? 'active' : ''}" data-mcsrc="bidding">Bidding 测算</button>
            </div></div></div>
          <div class="card-body">
            ${MC.srcView === 'waterfall'
        ? `<div class="ladder">${ladder}</div>
                 <div class="note mt12"><span>💡</span><div>穿山甲 + 优量汇贡献 69.4% 收入且 eCPM &gt; ¥21，建议置顶；百度联盟 eCPM ¥8.6、填充率 84.6%，下沉为兜底层。</div></div>`
        : `<div class="tbl-wrap"><table class="tbl">
                    <thead><tr><th>广告源</th><th class="num">当前 eCPM</th><th class="num">Bidding 预估</th><th class="num">填充率</th>
                      <th class="num">当前收入</th><th class="num">增量</th><th class="num">提升</th><th>建议</th></tr></thead>
                    <tbody>${biddingRows}</tbody></table></div>
                   <div class="note mt12"><span>💡</span><div>若全部切换为 Bidding 竞价，预计月增收 <b class="up">${(biddingGain / 10000).toFixed(1)} 万元</b>（+${(biddingGain / T.rev * 100).toFixed(1)}%）。建议先用穿山甲做 10% 流量灰度。</div></div>`}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">广告源质量四象限<small>填充率 × eCPM · 气泡为收入</small></div></div>
          <div class="card-body"><div class="chart-wrap">${scatter}</div>
            <div class="note mt8"><span>💡</span><div>右上象限（高填充 + 高 eCPM）应加大流量倾斜；左下（低填充 + 低 eCPM）只作兜底，避免占用请求配额。</div></div>
          </div>
        </div>
      </div>

      <div class="grid g-2-1">
        <div class="card">
          <div class="card-head"><div class="card-title">收入缺口拆解<small>理论收入 → 实际收入</small></div></div>
          <div class="card-body">
            <div class="chart-wrap">${qWaterfall(wfItems, { width: 600, height: 210 })}</div>
            <div class="note mt8"><span>⚠️</span><div>填充损失 <b>${((theo - T.rev) / 10000 * 0.62).toFixed(1)} 万元</b> 占缺口主要部分（无填充 / 请求超时），展示损失来自开屏跳过与插屏关闭。优先补广告源比优化展示率 ROI 更高。</div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">分时 × 广告位展示热力<small>单位：次</small></div></div>
          <div class="tbl-wrap"><table class="tbl heat">
            <thead><tr><th>广告位</th>${buckets.map(b => `<th class="num">${b}</th>`).join('')}<th class="num">合计</th></tr></thead>
            <tbody>${heat}</tbody></table></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">剧集维度变现<small>内容即流量入口</small></div>
          <div class="right"><button class="btn sm" id="mcDramaAll">全部 128 部剧</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>剧集</th><th class="num">播放人数</th><th class="num">完播率</th><th class="num">人均集数</th>
            <th class="num">解锁率</th><th class="num">广告展示</th><th class="num">eCPM</th><th class="num">收入</th><th class="num">收入占比</th></tr></thead>
          <tbody>${dramaRows}</tbody></table></div>
      </div>`;
  },

  after() {
    document.querySelectorAll('[data-mcmetric]').forEach(b => {
      b.addEventListener('click', () => { MC.metric = b.dataset.mcmetric; go('monetize'); });
    });
    document.querySelectorAll('[data-mcsrc]').forEach(b => {
      b.addEventListener('click', () => { MC.srcView = b.dataset.mcsrc; go('monetize'); });
    });
    const sel = $('#mcSlotSel'), top = $('#mcSlotTop');
    [sel, top].forEach(el => {
      if (!el) return;
      el.addEventListener('change', () => { MC.slot = el.value; go('monetize'); Toast(`已筛选「${MC.slot}」`); });
    });
    document.querySelectorAll('[data-mcslot]').forEach(el => {
      el.addEventListener('click', () => {
        const n = el.dataset.mcslot;
        MC.slot = MC.slot === n ? '全部广告位' : n;
        go('monetize');
      });
    });
    document.querySelectorAll('[data-src]').forEach(el => {
      el.addEventListener('click', () => {
        const name = decodeURIComponent(el.dataset.src);
        const s = D.adSources.find(x => x.name === name);
        if (!s) return;
        openDrawerHTML(`广告源 · ${s.name}`, `
          <div class="dw-grid">
            <div class="dw-item"><span class="k">eCPM</span><span class="v">¥${s.ecpm.toFixed(1)}</span></div>
            <div class="dw-item"><span class="k">填充率</span><span class="v">${s.fillRate}%</span></div>
            <div class="dw-item"><span class="k">请求量</span><span class="v">${Charts.fmt(s.req)}</span></div>
            <div class="dw-item"><span class="k">收入</span><span class="v">${(s.rev / 10000).toFixed(1)}万</span></div>
          </div>
          <div class="card-title mt16" style="font-size:13px">近 14 天 eCPM 走势</div>
          <div class="dw-chart">${Charts.line({
          labels: DATES.slice(-14).map(d => d.slice(5)), height: 150, area: true,
          series: [{ name: s.name, data: qdist(Math.round(s.ecpm * 100), 14, qhash(s.name)).map(v => +(v / 100).toFixed(2)), color: '#eb2f96' }],
          yFormat: v => '¥' + v.toFixed(1)
        })}</div>
          <div class="card-title mt16" style="font-size:13px">分层建议</div>
          <div class="note mt8"><span>💡</span><div>${s.ecpm >= 20
          ? '高 eCPM 主力层，建议置顶并提高请求优先级，同时开启 Bidding 竞价获取更高出价。'
          : s.ecpm >= 12 ? '中等质量，保留在第二层，按填充率动态调整配额。' : '低 eCPM 兜底层，仅在高层无填充时请求，避免占用有效请求。'}</div></div>
          <div class="dw-acts"><button class="btn" id="dwSrcCfg">调整分层</button><button class="btn" id="dwSrcLog">查看请求日志</button></div>`);
        const b1 = document.getElementById('dwSrcCfg');
        if (b1) b1.addEventListener('click', () => { closeDrawer(); Toast('已打开分层配置（原型）'); });
        const b2 = document.getElementById('dwSrcLog');
        if (b2) b2.addEventListener('click', () => { closeDrawer(); go('event'); EV.k = 'AdError'; EV.n = '广告加载失败'; go('event'); });
      });
    });
    const ex = $('#mcSlotExport');
    if (ex) ex.addEventListener('click', () => {
      dtlCsv('广告位变现', [['广告位', '请求量', '填充率', '展示率', '展示量', 'eCPM', '收入', '收入占比', '人均展示']]
        .concat(D.adSlots.map(s => [s.name, s.req, pct(s.fill, s.req), pct(s.show, s.fill), s.show, s.ecpm, s.rev, pct(s.rev, mcTotals().rev), s.cpu])));
    });
    const cb = $('#mcColBtn');
    if (cb) cb.addEventListener('click', () => Modal.open({
      title: '自定义列',
      body: `<div class="muted" style="font-size:12px;margin-bottom:10px">勾选需要的指标列，设置会保存在本地。</div>`
    }));
    const bb = $('#mcBoardBtn');
    if (bb) bb.addEventListener('click', () => Toast('已创建广告位看板，可在「我的看板」查看'));
    const da = $('#mcDramaAll');
    if (da) da.addEventListener('click', () => Toast(`已加载全部 128 部剧集（当前展示 TOP ${D.dramas.length}）`));
    const ab = $('#mcAttrBtn');
    if (ab) ab.addEventListener('click', () => {
      Modal.open({
        title: '归因口径',
        body: `<div class="muted" style="font-size:12px;margin-bottom:10px">广告收入按哪种口径归因到渠道 / 计划。</div>`,
        fields: [{ label: '归因方式', key: 'm', type: 'select', options: ['渠道归因（首日）', '渠道归因（30 日 LTV）', '广告展示归因', '不做归因'] }],
        okText: '应用',
        onOk: v => Toast(`归因口径已切换为「${v.m}」`)
      });
    });
  }
};


