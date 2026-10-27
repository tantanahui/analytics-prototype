/* ===============================
   其余视图 + 初始化（短剧 IAA 场景）
   =============================== */
let selEvent = { k: 'AdShow', n: '广告展示' };
let funnelKey = 'full';
let evChart = 'line';
let retDim = 'behavior';
let dictTab = 'list';
let propDim = 'tier';

/* ---------- 简化桑基图 ---------- */
function sankey(cols, links, opts = {}) {
  const { width = 880, h = 330, nodeW = 118, gapY = 10 } = opts;
  const ncol = cols.length;
  const colGap = (width - ncol * nodeW) / (ncol - 1);
  const scale = cols.map(c => (h - (c.length - 1) * gapY) / c.reduce((s, n) => s + n.value, 0));
  const pos = {};
  cols.forEach((c, ci) => {
    let y = 0;
    c.forEach(n => {
      const nh = n.value * scale[ci];
      pos[n.name] = { x: ci * (nodeW + colGap), y, h: nh, ci };
      y += nh + gapY;
    });
  });
  const outOff = {}, inOff = {}, palette = ['#2f6bff', '#17b26a', '#f5a623', '#7a4ddd', '#00b8d9', '#f54a45', '#eb2f96'];
  let g = '';
  links.forEach((l, i) => {
    const a = pos[l.from], b = pos[l.to];
    if (!a || !b) return;
    const ao = outOff[l.from] || 0, bo = inOff[l.to] || 0;
    const ah = l.value * scale[a.ci], bh = l.value * scale[b.ci];
    const x1 = a.x + nodeW, x2 = b.x, mx = (x1 + x2) / 2;
    const y1 = a.y + ao, y2 = b.y + bo;
    g += `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2} L${x2},${y2 + bh} C${mx},${y2 + bh} ${mx},${y1 + ah} ${x1},${y1 + ah} Z" fill="${palette[i % palette.length]}" opacity="0.16"><title>${l.from} → ${l.to}：${fmt(l.value)}</title></path>`;
    outOff[l.from] = ao + ah; inOff[l.to] = bo + bh;
  });
  cols.forEach((c, ci) => c.forEach(n => {
    const p = pos[n.name], col = palette[ci % palette.length];
    g += `<rect x="${p.x}" y="${p.y}" width="${nodeW}" height="${Math.max(p.h, 4)}" rx="3" fill="${col}"/>`;
    g += `<text x="${p.x + 7}" y="${p.y + Math.min(p.h / 2 + 4, 16)}" font-size="11.5" fill="#fff" font-weight="500">${n.name}</text>`;
    if (p.h > 26) g += `<text x="${p.x + 7}" y="${p.y + Math.min(p.h / 2 + 19, 32)}" font-size="10.5" fill="rgba(255,255,255,.9)">${fmt(n.value)}</text>`;
  }));
  return `<svg class="chart" viewBox="0 0 ${width} ${h + 6}">${g}</svg>`;
}

/* ===============================
   2. 事件分析
   =============================== */
VIEWS.event = {
  render() {
    $('#topfilters').innerHTML = topFilters(`
      <select class="select"><option>全部用户</option><option>新用户</option><option>老用户</option></select>`);

    const evTotal = D.eventTree.reduce((s, g) => s + g.items.length, 0);
    const tree = D.eventTree.map(g => `
      <div class="tree-group" data-grp="${g.group}">${g.icon} ${g.group}<span class="cnt">${g.items.length}</span></div>
      ${g.items.map(i => `<div class="tree-item ${i.k === selEvent.k ? 'sel' : ''}" data-ev="${i.k}" data-evn="${i.n}" data-grp="${g.group}">
        ${i.n}<span class="cnt">${fmt(i.c)}</span></div>`).join('')}`).join('');

    const _cur = sl(D.trend.activation), _prev = _cur.map(v => Math.round(v * 0.88));
    const _cum = a => a.reduce((acc, v) => (acc.push((acc.length ? acc[acc.length - 1] : 0) + v), acc), []);
    const evTrend = evChart === 'bar'
      ? Charts.bar({
        labels: sl(DATES), height: 250,
        series: [{ name: selEvent.n, data: _cur, color: '#2f6bff' }]
      })
      : Charts.line({
        labels: sl(DATES), height: 250, area: evChart === 'line',
        series: [
          { name: evChart === 'cum' ? selEvent.n + '（累计）' : selEvent.n, data: evChart === 'cum' ? _cum(_cur) : _cur, color: '#2f6bff' },
          { name: '上一周期', data: evChart === 'cum' ? _cum(_prev) : _prev, color: '#c9cfd8', dash: true }
        ]
      });

    const dimRows = D.dimSplit.map(d => `<tr>
      <td>${d.name}</td><td class="num">${fmt(d.v)}</td><td class="num">${d.r}%</td>
      <td><div class="bar-cell"><div class="mini-bar" style="width:${(d.r * 2.6).toFixed(0)}px"></div></div></td>
      <td class="num">¥${(0.34 + d.r * 0.004).toFixed(3)}</td></tr>`).join('');

    const slotRows = D.slotSplit.map((d, i) => `<tr>
      <td>${d.name}</td><td class="num">${fmt(d.v)}</td><td class="num">${d.r}%</td>
      <td class="num">¥${D.adSlots[i] ? D.adSlots[i].ecpm : '—'}</td></tr>`).join('');

    const errRows = [
      { r: '无广告填充 no_fill', v: 1642000, s: 'AdError · code=2001' },
      { r: '请求超时 timeout', v: 642000, s: 'AdError · code=3002' },
      { r: 'SDK 配置 / 未初始化', v: 286000, s: 'AdError · code=1004' },
      { r: '网络异常', v: 118000, s: 'AdError · code=4001' },
      { r: '频次控制被拦截', v: 52000, s: 'AdError · code=5003' }
    ].map(f => `<tr><td>${f.r}</td><td class="num">${fmt(f.v)}</td><td class="num">${pct(f.v, 2740000)}</td><td><span class="code">${f.s}</span></td></tr>`).join('');

    const ltRows = D.loginTypeSplit.map(d => `<tr>
      <td>${d.name}</td><td class="num">${fmt(d.v)}</td><td class="num">${d.r}%</td>
      <td class="num">¥${(0.28 + d.r * 0.003).toFixed(3)}</td></tr>`).join('');

    /* ---------- 事件关联 ---------- */
    const rel = D.eventRelation[selEvent.k];
    const chain = D.eventChains.find(c => c.steps.indexOf(selEvent.k) >= 0);
    const relChain = rel ? `
      <div class="rel-chain">
        ${rel.up.map(e => `<span class="rel-node" data-jump="${e}">${e}</span>`).join('<span class="rel-arrow">→</span>')}
        <span class="rel-arrow">→</span>
        <span class="rel-node cur">${selEvent.k}</span>
        <span class="rel-arrow">→</span>
        ${rel.down.map(e => `<span class="rel-node" data-jump="${e}">${e}</span>`).join('<span class="rel-arrow">·</span>')}
      </div>
      <div class="rel-attrs mt8">
        <span class="lb">可下钻属性</span>
        ${rel.attrs.map(a => `<span class="tag blue">${a}</span>`).join('')}
      </div>` : `<div class="muted">该事件未配置上下游关联，可在「埋点事件管理 → 事件关联」中维护链路</div>`;
    const relRows = rel ? rel.related.map(r => `<tr>
      <td><span class="name">${r.ev}</span></td>
      <td class="num"><b>${r.rate}%</b></td>
      <td class="muted">${r.desc}</td>
      <td><button class="btn sm">对比分析</button></td></tr>`).join('') : '';

    /* ---------- 用户属性拆分 ---------- */
    const evItem = D.eventTree.flatMap(g => g.items).find(i => i.k === selEvent.k) || { c: 0 };
    const PROP = {
      tier: { title: '机型档位', list: D.deviceTier.map(t => ({ n: t.name, share: t.share, ecpm: t.ecpm, arpu: t.arpu, ret: t.ret1 })) },
      city: { title: '城市线级', list: D.cityTier.map(t => ({ n: t.name, share: t.share, ecpm: t.ecpm, arpu: t.arpu, ret: t.ret1 })) },
      net: { title: '网络环境', list: D.networkType.map(t => ({ n: t.name, share: t.share, ecpm: t.ecpm, arpu: t.arpu, ret: '' })) },
      prov: { title: 'IP 归属省份', list: D.provinces.slice(0, 8).map(t => ({ n: t.name, share: t.share, ecpm: t.ecpm, arpu: t.arpu, ret: t.ret1 })) }
    };
    const propTitle = PROP[propDim].title;
    const propTabs = Object.keys(PROP).map(k =>
      `<button class="${k === propDim ? 'active' : ''}" data-prop="${k}">${PROP[k].title}</button>`).join('');
    const maxShare = Math.max.apply(null, PROP[propDim].list.map(x => x.share));
    const propRows = PROP[propDim].list.map(x => {
      const cnt = Math.round(evItem.c * x.share / 100);
      const users = Math.max(1, Math.round(D.summary.dau * x.share / 100));
      return `<tr>
        <td><span class="name">${x.n}</span></td>
        <td class="num">${x.share}%</td>
        <td class="num">${fmt(cnt)}</td>
        <td class="num">${(cnt / users).toFixed(1)}</td>
        <td class="num">¥${x.ecpm} / ¥${x.arpu}</td>
        <td class="num">${x.ret ? x.ret + '%' : '—'}</td>
        <td><div class="bar-cell"><div class="mini-bar" style="width:${(x.share / maxShare * 70).toFixed(0)}px"></div></div></td>
      </tr>`;
    }).join('');

    return `
      <div style="display:grid;grid-template-columns:252px 1fr;gap:16px;align-items:start">
        <div class="panel">
          <div class="panel-head">事件库<small class="muted" style="font-weight:400">${evTotal} 个事件</small><div style="margin-left:auto"><button class="btn sm ghost">管理</button></div></div>
          <div class="panel-body" style="max-height:720px;overflow-y:auto">
            <input class="input" id="evSearch" style="width:100%;margin-bottom:8px" placeholder="搜索事件名 / 事件标识（如 AdShow）">
            <div class="tree">${tree}</div>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-body tight">
              <div class="filter-row">
                <span class="lb">分析事件</span>
                <div class="chips"><span class="chip">${selEvent.n}<span class="code">${selEvent.k}</span><span class="x">×</span></span>
                <span class="chip" style="background:#f4f6fa;color:#646a73;border-color:#e8ebf0">+ 添加对比事件</span></div>
              </div>
              <div class="filter-row mt12">
                <span class="lb">分析指标</span>
                <div class="seg"><button class="active">触发次数</button><button>触发用户数</button><button>人均次数</button><button>数值求和</button></div>
                <span class="lb" style="margin-left:8px">维度拆分</span>
                <select class="select"><option>归因渠道</option><option>广告位</option><option>广告源</option><option>触发场景</option><option>剧集</option><option>机型</option></select>
                <span class="lb">时间粒度</span>
                <select class="select"><option>按天</option><option>按小时</option><option>按周</option></select>
                <button class="btn sm">+ 过滤条件</button>
              </div>
              <div class="filter-row mt12">
                <span class="tag blue">ad_position = rewarded</span>
                <span class="tag blue">scene = unlock_episode</span>
                <span class="tag">+ 添加</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">${selEvent.n} 趋势<small>${RANGE_TEXT[GS.range]}</small></div>
            <div class="right"><div class="seg" id="evChartSeg">
              <button class="${evChart === 'line' ? 'active' : ''}" data-ec="line">折线</button>
              <button class="${evChart === 'bar' ? 'active' : ''}" data-ec="bar">柱状</button>
              <button class="${evChart === 'cum' ? 'active' : ''}" data-ec="cum">累计</button>
            </div></div></div>
            <div class="card-body"><div class="chart-wrap">${evTrend}</div>
              <div class="legend"><span><i style="background:#2f6bff"></i>${selEvent.n}</span><span><i style="background:#c9cfd8"></i>上一周期</span></div>
            </div>
          </div>

          <div class="grid g2">
            <div class="card">
              <div class="card-head"><div class="card-title">按归因渠道拆分<small>含人均广告收入</small></div></div>
              <div class="tbl-wrap"><table class="tbl"><thead><tr><th>归因渠道</th><th class="num">触发次数</th><th class="num">占比</th><th>分布</th><th class="num">人均收入</th></tr></thead><tbody>${dimRows}</tbody></table></div>
            </div>
            <div class="card">
              <div class="card-head"><div class="card-title">按广告位拆分<small>仅广告类事件</small></div></div>
              <div class="tbl-wrap"><table class="tbl"><thead><tr><th>广告位</th><th class="num">展示量</th><th class="num">占比</th><th class="num">eCPM</th></tr></thead><tbody>${slotRows}</tbody></table></div>
              <div class="card-body tight">${Charts.hbar(D.slotSplit.map((d, i) => ({ name: d.name, value: d.v, color: Charts.C[i] })))}</div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">关联分析：广告加载失败原因<small>AdError · 无填充直接损失收入</small></div>
              <div class="right"><button class="btn sm">下钻到用户分群</button></div></div>
            <div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>失败原因</th><th class="num">失败次数</th><th class="num">占比</th><th>错误码</th></tr></thead>
              <tbody>${errRows}</tbody></table></div>
            <div class="card-body tight">
              <div class="note"><span>💡</span><div>无填充 164.2 万次占比 60%，按激励视频 eCPM ¥22.4 估算，每日潜在损失约 <b class="up">¥36,780</b>。建议补充穿山甲 / 优量汇备用广告源并开启 Bidding 竞价。</div></div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">事件关联分析<small>${selEvent.k} 的上下游事件与后续行为</small></div>
              <div class="right"><button class="btn sm">维护关联链路</button><button class="btn sm primary">创建分群</button></div></div>
            <div class="card-body">
              <div class="card-title" style="font-size:12.5px;margin-bottom:8px">关联链路${chain ? ` · ${chain.name}` : ''}</div>
              ${relChain}
              ${chain ? `<div class="muted mt8" style="font-size:12px">${chain.desc}</div>` : ''}
              <div class="tbl-wrap mt12"><table class="tbl">
                <thead><tr><th>关联事件</th><th class="num">触发占比</th><th>说明</th><th></th></tr></thead>
                <tbody>${relRows || `<tr><td colspan="4" class="muted">该事件未配置关联事件，可在「埋点事件管理 → 关联链路」中添加</td></tr>`}</tbody></table></div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">按用户属性拆分<small>事件 × 机型 / 城市 / 网络 / IP 归属</small></div>
              <div class="right"><div class="seg" id="propSeg">${propTabs}</div><button class="btn sm">导出</button></div></div>
            <div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>${propTitle}</th><th class="num">用户占比</th><th class="num">触发次数</th><th class="num">人均次数</th><th class="num">eCPM / ARPU</th><th class="num">次留</th><th>分布</th></tr></thead>
              <tbody>${propRows}</tbody></table></div>
            <div class="card-body tight">
              <div class="note"><span>💡</span><div>任意事件都可以与用户属性交叉：机型档位、城市线级、网络环境、IP 归属、归因渠道、登录状态。点击右上角「创建分群」可把当前拆分结果直接沉淀为人群包。</div></div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">登录与留存<small>IAA 场景以游客为主，登录用于跨设备追剧</small></div></div>
            <div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>登录方式</th><th class="num">用户数</th><th class="num">占比</th><th class="num">人均广告收入</th></tr></thead>
              <tbody>${ltRows}</tbody></table></div>
          </div>
        </div>
      </div>`;
  },
  after() {
    document.querySelectorAll('[data-ev]').forEach(el => {
      el.addEventListener('click', () => {
        selEvent = { k: el.dataset.ev, n: el.dataset.evn };
        go('event');
      });
    });
    document.querySelectorAll('[data-prop]').forEach(b => {
      b.addEventListener('click', () => { propDim = b.dataset.prop; go('event'); });
    });
    document.querySelectorAll('[data-ec]').forEach(b => {
      b.addEventListener('click', () => { evChart = b.dataset.ec; go('event'); });
    });
    document.querySelectorAll('[data-jump]').forEach(el => {
      el.addEventListener('click', () => {
        const k = el.dataset.jump;
        const it = D.eventTree.flatMap(g => g.items).find(i => i.k === k);
        selEvent = { k, n: it ? it.n : k };
        go('event');
      });
    });
    /* 事件库搜索 */
    const si = $('#evSearch');
    if (si) si.addEventListener('input', () => {
      const q = (si.value || '').trim().toLowerCase();
      document.querySelectorAll('[data-ev]').forEach(el => {
        const txt = (el.dataset.ev + ' ' + el.dataset.evn).toLowerCase();
        el.style.display = !q || txt.indexOf(q) >= 0 ? '' : 'none';
      });
    });
    /* 分组折叠 */
    document.querySelectorAll('.tree-group[data-grp]').forEach(g => {
      g.addEventListener('click', () => {
        const name = g.dataset.grp;
        const items = document.querySelectorAll('.tree-item[data-grp="' + name + '"]');
        const hide = items.length && items[0].style.display !== 'none';
        items.forEach(el => el.style.display = hide ? 'none' : '');
      });
    });
  }
};

/* ===============================
   3. 漏斗分析
   =============================== */
VIEWS.funnel = {
  render() {
    $('#topfilters').innerHTML = topFilters(`
      <select class="select"><option>全部渠道</option><option>巨量引擎</option><option>腾讯广告</option></select>`);

    const f = D.funnels[funnelKey];
    const steps = f.steps;
    const totalRate = steps[steps.length - 1].value / steps[0].value * 100;

    const stepList = steps.map((s, i) => `
      <div class="step-item">
        <span class="idx">${i + 1}</span>
        <span class="nm">${s.name}</span>
        <span class="muted">${fmt(s.value)}</span>
        <span class="op">≡</span>
      </div>`).join('') + `<div class="step-item add">+ 添加步骤</div>`;

    const detailRows = steps.map((s, i) => {
      const prev = i === 0 ? s.value : steps[i - 1].value;
      const conv = s.value / prev * 100;
      const loss = prev - s.value;
      return `<tr>
        <td>${i + 1}</td><td><span class="name">${s.name}</span></td>
        <td class="num">${fmt(s.value)}</td>
        <td class="num">${i === 0 ? '—' : pct(s.value, prev)}</td>
        <td class="num">${i === 0 ? '100%' : pct(s.value, steps[0].value)}</td>
        <td class="num">${i === 0 ? '—' : fmt(loss)}</td>
        <td class="num ${i > 0 && conv < 70 ? 'up' : ''}">${i === 0 ? '—' : (100 - conv).toFixed(2) + '%'}</td>
        <td class="num">${i === 0 ? '—' : (i * 8.6 + 4).toFixed(1) + ' min'}</td>
      </tr>`;
    }).join('');

    const slotRows = D.funnelBySlot.map(c => {
      const [req, fill, show, done] = c.steps;
      return `<tr>
        <td><span class="name">${c.name}</span></td>
        <td class="num">${fmt(req)}</td>
        <td class="num ${fill / req * 100 >= 95 ? 'down' : fill / req * 100 < 90 ? 'up' : ''}">${pct(fill, req)}</td>
        <td class="num">${pct(show, fill)}</td>
        <td class="num ${done / show * 100 >= 90 ? 'down' : 'up'}">${pct(done, show)}</td>
        <td><div class="bar-cell"><div class="mini-bar" style="width:${(done / req * 100 * 2.4).toFixed(0)}px;background:#17b26a"></div></div></td>
      </tr>`;
    }).join('');

    const chRows = D.funnelByChannel.map(c => {
      const [a, play, fin, unlock] = c.steps;
      return `<tr>
        <td><span class="name">${c.name}</span></td>
        <td class="num">${fmt(a)}</td>
        <td class="num">${pct(play, a)}</td>
        <td class="num">${pct(fin, a)}</td>
        <td class="num ${unlock / a * 100 >= 36 ? 'up' : 'down'}">${pct(unlock, a)}</td>
        <td><div class="bar-cell"><div class="mini-bar" style="width:${(unlock / a * 100 * 6).toFixed(0)}px;background:#2f6bff"></div></div></td>
      </tr>`;
    }).join('');

    const _tl = sl(DATES).slice(-14);
    const trend = Charts.line({
      labels: _tl, height: 200,
      series: [
        { name: '广告填充率', data: [92.1, 92.8, 93.4, 92.6, 93.9, 94.2, 93.1, 92.8, 94.1, 94.6, 94.8, 93.6, 93.2, 93.6].slice(-_tl.length), color: '#2f6bff' },
        { name: '解锁成功率', data: [88.4, 89.1, 90.2, 89.6, 90.8, 91.2, 90.4, 89.8, 91.6, 92.1, 91.4, 90.6, 91.0, 91.3].slice(-_tl.length), color: '#17b26a' }
      ]
    });

    return `
      <div class="funnel-layout">
        <div>
          <div class="card">
            <div class="card-head"><div class="card-title">漏斗配置</div></div>
            <div class="card-body">
              <div style="font-size:12px;color:#8f959e;margin-bottom:6px">选择漏斗</div>
              <select class="select" style="width:100%" id="fsel">
                ${Object.keys(D.funnels).map(k => `<option value="${k}" ${k === funnelKey ? 'selected' : ''}>${D.funnels[k].name}</option>`).join('')}
              </select>
              <div class="filter-row mt12">
                <span class="lb">转化窗口</span>
                <select class="select"><option>${f.window}</option><option>1 天</option><option>7 天</option><option>会话内</option></select>
              </div>
              <div class="filter-row mt12">
                <span class="lb">维度拆分</span>
                <select class="select"><option>不拆分</option><option>归因渠道</option><option>广告位</option><option>广告源</option><option>剧集</option></select>
              </div>
              <div class="filter-row mt12">
                <span class="lb">步骤顺序</span>
                <div class="seg"><button class="active">有序</button><button>无序</button></div>
              </div>
              <div class="step-list mt16">${stepList}</div>
              <button class="btn primary mt16" style="width:100%;justify-content:center">重新计算</button>
            </div>
          </div>
        </div>

        <div>
          <div class="grid g3" style="margin-bottom:16px">
            <div class="kpi"><div class="label">整体转化率</div><div class="value">${totalRate.toFixed(2)}<span class="unit">%</span></div><div class="delta"><span class="up">▲ 0.34pt</span><span class="cmp">较上周</span></div></div>
            <div class="kpi"><div class="label">最大流失环节</div><div class="value" style="font-size:20px">${funnelKey === 'full' ? '下载完成 → 激活' : '点击解锁 → 广告请求'}</div><div class="delta"><span class="up">流失 ${funnelKey === 'full' ? '95.84%' : '可控'}</span><span class="cmp">${funnelKey === 'full' ? '受包体与下载中断影响' : '填充率决定上限'}</span></div></div>
            <div class="kpi"><div class="label">漏斗平均转化时长</div><div class="value">${funnelKey === 'full' ? '86.8' : '1.4'}<span class="unit">${funnelKey === 'full' ? 'min' : 'min'}</span></div><div class="delta"><span class="down">▼ 4.2 min</span><span class="cmp">较上周</span></div></div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">${f.name}<small>${f.window}</small></div>
              <div class="right"><div class="seg"><button class="active">梯形</button><button>条形</button></div><button class="btn sm">保存为看板</button></div></div>
            <div class="card-body">${Charts.funnel(steps)}</div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">转化明细</div><div class="right"><button class="btn sm">导出</button></div></div>
            <div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>#</th><th>步骤</th><th class="num">用户数</th><th class="num">单步转化率</th><th class="num">累计转化率</th><th class="num">流失人数</th><th class="num">流失率</th><th class="num">平均耗时</th></tr></thead>
              <tbody>${detailRows}</tbody></table></div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">关键转化率趋势<small>近 14 天</small></div></div>
            <div class="card-body"><div class="chart-wrap">${trend}</div>
              <div class="legend"><span><i style="background:#2f6bff"></i>广告填充率</span><span><i style="background:#17b26a"></i>解锁成功率</span></div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">分广告位变现漏斗<small>请求 → 填充 → 展示 → 完整播放</small></div></div>
            <div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>广告位</th><th class="num">请求量</th><th class="num">填充率</th><th class="num">展示率</th><th class="num">完播率</th><th>端到端效率</th></tr></thead>
              <tbody>${slotRows}</tbody></table></div>
          </div>

          <div class="card">
            <div class="card-head"><div class="card-title">分渠道内容转化对比<small>激活 → 首集播放 → 完播 → 看广告解锁</small></div></div>
            <div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>渠道</th><th class="num">激活</th><th class="num">首集播放率</th><th class="num">完播率</th><th class="num">广告解锁率</th><th>解锁率分布</th></tr></thead>
              <tbody>${chRows}</tbody></table></div>
            <div class="card-body tight">
              <div class="note"><span>💡</span><div>商店渠道（小米 44.2% / 华为 45.0%）解锁率显著高于信息流，用户更愿意为追剧看广告，可在扩量时给商店渠道更高出价系数。</div></div>
            </div>
          </div>
        </div>
      </div>`;
  },
  after() {
    $('#fsel').addEventListener('change', e => { funnelKey = e.target.value; go('funnel'); });
  }
};

/* ===============================
   4. 广告变现分析（IAA 核心）
   =============================== */
VIEWS.monetize = {
  render() {
    $('#topfilters').innerHTML = topFilters(`
      <select class="select"><option>全部广告位</option><option>激励视频</option><option>插屏广告</option></select>
      <button class="btn ghost">归因：渠道归因</button>`);

    const totalRev = D.adSlots.reduce((s, x) => s + x.rev, 0);
    const totalImp = D.adSlots.reduce((s, x) => s + x.show, 0);
    const totalReq = D.adSlots.reduce((s, x) => s + x.req, 0);
    const totalFill = D.adSlots.reduce((s, x) => s + x.fill, 0);

    const kpi = `
      <div class="kpi"><div class="label">广告收入</div><div class="value">${(totalRev / 10000).toFixed(2)}<span class="unit">万元</span></div><div class="delta"><span class="up">▲ 18.2%</span><span class="cmp">较上周</span></div></div>
      <div class="kpi"><div class="label">整体 eCPM</div><div class="value">${(totalRev / totalImp * 1000).toFixed(2)}<span class="unit">元</span></div><div class="delta"><span class="up">▲ 4.1%</span></div></div>
      <div class="kpi"><div class="label">人均广告展示</div><div class="value">${(totalImp / D.summary.dau).toFixed(1)}<span class="unit">次</span></div><div class="delta"><span class="up">▲ 2.1%</span></div></div>
      <div class="kpi"><div class="label">ARPU</div><div class="value">${(totalRev / D.summary.dau).toFixed(3)}<span class="unit">元</span></div><div class="delta"><span class="up">▲ 6.3%</span></div></div>
      <div class="kpi"><div class="label">广告填充率</div><div class="value">${(totalFill / totalReq * 100).toFixed(2)}<span class="unit">%</span></div><div class="delta"><span class="up">▲ 0.6pt</span></div></div>
      <div class="kpi"><div class="label">激励视频收入占比</div><div class="value">${(D.adSlots[0].rev / totalRev * 100).toFixed(1)}<span class="unit">%</span></div><div class="delta"><span class="muted">短剧 IAA 主力广告位</span></div></div>`;

    const slotRows = D.adSlots.map(s => `<tr data-row="slot:${s.name}">
      <td><span class="name">${s.name}</span><div class="sub">${s.scene}</div></td>
      <td class="num">${fmt(s.req)}</td>
      <td class="num ${s.fill / s.req * 100 >= 95 ? 'down' : s.fill / s.req * 100 < 90 ? 'up' : ''}">${pct(s.fill, s.req)}</td>
      <td class="num">${pct(s.show, s.fill)}</td>
      <td class="num">${fmt(s.show)}</td>
      <td class="num"><b>¥${s.ecpm.toFixed(2)}</b></td>
      <td class="num">${money(s.rev)}</td>
      <td class="num">${pct(s.rev, totalRev)}</td>
      <td class="num">${s.cpu}</td>
    </tr>`).join('');

    const srcRows = D.adSources.map((s, i) => `<tr data-row="source:${s.name}">
      <td><span class="name">${s.name}</span></td>
      <td class="num">${fmt(s.req)}</td>
      <td class="num ${s.fillRate >= 92 ? 'down' : 'up'}">${s.fillRate}%</td>
      <td class="num"><b>¥${s.ecpm.toFixed(1)}</b></td>
      <td class="num">${money(s.rev)}</td>
      <td class="num">${pct(s.rev, totalRev)}</td>
      <td><div class="bar-cell"><div class="mini-bar" style="width:${(s.rev / D.adSources[0].rev * 90).toFixed(0)}px;background:${Charts.C[i]}"></div></div></td>
      <td><span class="tag ${s.ecpm >= 20 ? 'green' : s.ecpm >= 12 ? 'orange' : 'red'}">${s.ecpm >= 20 ? '优先' : s.ecpm >= 12 ? '补充' : '兜底'}</span></td>
    </tr>`).join('');

    const dramaRows = D.dramas.map(d => `<tr data-row="drama:${d.name}">
      <td><span class="name">${d.name}</span><div class="sub">共 ${d.eps} 集</div></td>
      <td class="num">${fmt(d.uv)}</td>
      <td class="num">${d.finish}%</td>
      <td class="num">${d.epPerUser}</td>
      <td class="num">${d.unlock}%</td>
      <td class="num">${fmt(d.imp)}</td>
      <td class="num">¥${(d.rev / d.imp * 1000).toFixed(2)}</td>
      <td class="num"><b>${money(d.rev)}</b></td>
      <td class="num">¥${(d.rev / d.uv).toFixed(3)}</td>
    </tr>`).join('');

    const ecpmChart = Charts.line({
      labels: D.hourly.labels, height: 220, area: true,
      series: [{ name: 'eCPM', data: D.hourly.ecpm, color: '#eb2f96' }]
    });
    const impChart = Charts.bar({
      labels: D.hourly.labels, height: 220,
      series: [{ name: '广告展示量', data: D.hourly.imp, color: '#2f6bff' }]
    });

    return `
      <div class="grid g3">${kpi}</div>

      <div class="card">
        <div class="card-head"><div class="card-title">广告位变现明细<small>请求 → 填充 → 展示 → 收入</small></div>
          <div class="right"><button class="btn sm">自定义列</button><button class="btn sm">导出</button><button class="btn sm primary">创建广告位看板</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr>
            <th>广告位 / 场景</th><th class="num">请求量</th><th class="num">填充率</th><th class="num">展示率</th>
            <th class="num">展示量</th><th class="num">eCPM</th><th class="num">收入</th>
            <th class="num">收入占比</th><th class="num">人均展示</th>
          </tr></thead><tbody>${slotRows}</tbody></table></div>
      </div>

      <div class="grid g2">
        <div class="card">
          <div class="card-head"><div class="card-title">分时 eCPM<small>晚 20-22 点为价格高峰</small></div></div>
          <div class="card-body"><div class="chart-wrap">${ecpmChart}</div></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">分时广告展示量<small>与 DAU 活跃曲线一致</small></div></div>
          <div class="card-body"><div class="chart-wrap">${impChart}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">广告源聚合（Waterfall / Bidding）<small>按 eCPM 分层</small></div>
          <div class="right"><button class="btn sm">配置分层</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>广告源</th><th class="num">请求量</th><th class="num">填充率</th><th class="num">eCPM</th><th class="num">收入</th><th class="num">占比</th><th>收入分布</th><th>分层建议</th></tr></thead>
          <tbody>${srcRows}</tbody></table></div>
        <div class="card-body tight">
          <div class="note"><span>💡</span><div>穿山甲 + 优量汇贡献 69.4% 收入且 eCPM &gt; ¥21，建议置顶；百度联盟 eCPM ¥8.6 且填充率 84.6%，建议下沉为兜底层。</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">剧集维度变现 TOP<small>内容即流量入口</small></div>
          <div class="right"><button class="btn sm">全部 128 部剧</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>剧集</th><th class="num">播放人数</th><th class="num">完播率</th><th class="num">人均集数</th><th class="num">解锁率</th><th class="num">广告展示</th><th class="num">eCPM</th><th class="num">收入</th><th class="num">ARPU</th></tr></thead>
          <tbody>${dramaRows}</tbody></table></div>
      </div>`;
  }
};

/* ===============================
   5. 投放归因分析
   =============================== */
VIEWS.ad = {
  render() {
    $('#topfilters').innerHTML = topFilters(`
      <select class="select"><option>全部渠道</option><option>巨量引擎</option></select>
      <button class="btn ghost">归因模型：点击归因</button>`);

    const cost = D.channels.reduce((s, c) => s + c.cost, 0);
    const act = D.channels.reduce((s, c) => s + c.act, 0);
    const rev1 = D.channels.reduce((s, c) => s + c.rev1, 0);
    const ltv30 = D.channels.reduce((s, c) => s + c.act * c.ltv30, 0);

    const kpi = `
      <div class="kpi"><div class="label">投放消耗</div><div class="value">${wan(cost)}<span class="unit">元</span></div><div class="delta"><span class="up">▲ 8.7%</span></div></div>
      <div class="kpi"><div class="label">新增激活</div><div class="value">${fmt(act)}</div><div class="delta"><span class="up">▲ 12.4%</span></div></div>
      <div class="kpi"><div class="label">激活成本 CPA</div><div class="value">¥${(cost / act).toFixed(2)}</div><div class="delta"><span class="down">▼ 3.2%</span></div></div>
      <div class="kpi"><div class="label">首日广告收入</div><div class="value">${money(rev1)}</div><div class="delta"><span class="up">▲ 16.8%</span></div></div>
      <div class="kpi"><div class="label">首日 ROAS</div><div class="value">${(rev1 / cost * 100).toFixed(2)}<span class="unit">%</span></div><div class="delta"><span class="up">▲ 0.52pt</span></div></div>
      <div class="kpi"><div class="label">30 日 ROAS（预估）</div><div class="value">${(ltv30 / cost * 100).toFixed(1)}<span class="unit">%</span></div><div class="delta"><span class="cmp">回本周期约 35 天</span></div></div>`;

    const rows = D.channels.map(c => {
      const cpa = c.cost ? c.cost / c.act : 0;
      const r1 = c.cost ? c.rev1 / c.cost * 100 : 0;
      const r7 = c.cost ? c.act * c.ltv7 / c.cost * 100 : 0;
      const r30 = c.cost ? c.act * c.ltv30 / c.cost * 100 : 0;
      const payback = c.cost ? Math.round(30 * cpa / c.ltv30) : 0;
      return `<tr>
        <td><span class="name">${c.name}</span><div class="sub">${c.sub}</div></td>
        <td class="num">${c.imp ? fmt(c.imp) : '—'}</td>
        <td class="num">${c.clk ? fmt(c.clk) : '—'}</td>
        <td class="num">${c.imp ? pct(c.clk, c.imp) : '—'}</td>
        <td class="num">${c.cost ? money(c.cost) : '—'}</td>
        <td class="num"><b>${fmt(c.act)}</b></td>
        <td class="num">${cpa ? '¥' + cpa.toFixed(2) : '—'}</td>
        <td class="num">${c.ret1}%</td>
        <td class="num">${money(c.rev1)}</td>
        <td class="num">${r1 ? r1.toFixed(1) + '%' : '—'}</td>
        <td class="num ${r7 >= 40 ? 'up' : r7 < 30 ? 'down' : ''}">${r7 ? r7.toFixed(1) + '%' : '—'}</td>
        <td class="num ${r30 >= 100 ? 'up' : ''}">${r30 ? r30.toFixed(0) + '%' : '—'}</td>
        <td><span class="tag ${payback && payback <= 30 ? 'green' : payback <= 40 ? 'orange' : 'red'}">${payback ? payback + ' 天' : '—'}</span></td>
      </tr>`;
    }).join('');

    const plans = [
      ['cmp_10231 · 番茄通投-剧情兴趣', '巨量引擎', 142800, 29800, 4.79, 38.6, 7.8, '放量'],
      ['cmp_10288 · 相似人群扩展', '巨量引擎', 118600, 24600, 4.82, 39.2, 8.1, '放量'],
      ['cmp_10302 · 抖音爽剧兴趣包', '巨量引擎', 96400, 19800, 4.87, 37.1, 7.2, '观察'],
      ['cmp_8802 · 微信朋友圈-竖屏', '腾讯广告', 106400, 21200, 5.02, 41.2, 7.4, '放量'],
      ['cmp_8815 · 小程序激励位', '腾讯广告', 82400, 16400, 5.02, 40.8, 7.1, '观察'],
      ['cmp_4401 · 快手主信息流', '快手磁力', 76400, 14800, 5.16, 35.8, 6.6, '观察'],
      ['cmp_4412 · 快手极速版', '快手磁力', 62800, 11800, 5.32, 34.2, 6.1, '缩量'],
      ['cmp_2208 · 百度搜索词包', '百度信息流', 48600, 9200, 5.28, 34.1, 5.9, '缩量'],
      ['cmp_7710 · 商店搜索-短剧词', '小米商店', 42800, 9600, 4.46, 46.8, 9.4, '放量'],
      ['asa_0912 · ASA 品牌词', 'Apple Search Ads', 38600, 5200, 7.42, 44.2, 6.4, '观察']
    ].map(p => `<tr data-row="plan:${p[0]}">
      <td><span class="name">${p[0]}</span></td><td>${p[1]}</td>
      <td class="num">${money(p[2])}</td><td class="num">${fmt(p[3])}</td>
      <td class="num">¥${p[4]}</td><td class="num">${p[5]}%</td>
      <td class="num ${p[6] >= 8 ? 'up' : p[6] < 6.5 ? 'down' : ''}">${p[6]}%</td>
      <td><span class="tag ${p[7] === '放量' ? 'green' : p[7] === '缩量' ? 'red' : 'orange'}">${p[7]}</span></td>
    </tr>`).join('');

    const cpaBars = D.channels.filter(c => c.cost).map(c => ({ name: c.name, value: +(c.cost / c.act).toFixed(2), color: c.cost / c.act <= 5 ? '#17b26a' : c.cost / c.act <= 5.5 ? '#f5a623' : '#f54a45' }));
    const ltvBars = D.channels.filter(c => c.cost).map(c => ({ name: c.name, value: +c.ltv30.toFixed(2), color: '#2f6bff' }));

    return `
      <div class="grid g3">${kpi}</div>

      <div class="card">
        <div class="card-head"><div class="card-title">渠道投放 × 变现归因<small>买量成本 vs 广告收入回本</small></div>
          <div class="right"><button class="btn sm">自定义列</button><button class="btn sm">导出报表</button><button class="btn sm primary">创建分渠道看板</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr>
            <th>渠道</th><th class="num">曝光</th><th class="num">点击</th><th class="num">CTR</th>
            <th class="num">消耗</th><th class="num">激活</th><th class="num">CPA</th>
            <th class="num">次留</th><th class="num">首日收入</th><th class="num">首日 ROAS</th>
            <th class="num">7 日 ROAS</th><th class="num">30 日 ROAS</th><th>回本预估</th>
          </tr></thead><tbody>${rows}</tbody></table></div>
      </div>

      <div class="grid g2">
        <div class="card">
          <div class="card-head"><div class="card-title">渠道 CPA 对比<small>越低越好</small></div></div>
          <div class="card-body">${Charts.hbar(cpaBars.sort((a, b) => a.value - b.value), { unit: ' 元' })}
            <div class="legend mt12"><span><i style="background:#17b26a"></i>≤ ¥5 优质</span><span><i style="background:#f5a623"></i>¥5-5.5 观察</span><span><i style="background:#f54a45"></i>&gt; ¥5.5 偏高</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">渠道 LTV30 对比<small>越高越好，决定出价上限</small></div></div>
          <div class="card-body">${Charts.hbar(ltvBars.sort((a, b) => b.value - a.value), { unit: ' 元', color: '#2f6bff' })}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">广告计划 TOP 10<small>按消耗排序 · 附投放建议</small></div>
          <div class="right"><button class="btn sm">查看全部 304 个计划</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>广告计划</th><th>渠道</th><th class="num">消耗</th><th class="num">激活</th><th class="num">CPA</th><th class="num">次留</th><th class="num">首日 ROAS</th><th>投放建议</th></tr></thead>
          <tbody>${plans}</tbody></table></div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">素材效果对比<small>近 7 天 · ROAS 为首日口径</small></div>
          <div class="right"><button class="btn sm">按 CTR 排序</button><button class="btn sm">素材库</button></div></div>
        <div class="card-body">
          <div class="creative-grid">
            ${D.creatives.map(c => `
              <div class="creative">
                <div class="thumb" style="background:${c.bg}">${c.name}</div>
                <div class="info">
                  <div class="t">${c.name}</div>
                  <div class="kv"><span>${c.ch}</span><span>${fmt(c.imp)} 曝光</span></div>
                  <div class="kv"><span>点击率</span><b>${c.ctr}%</b></div>
                  <div class="kv"><span>激活 / CPA</span><b>${fmt(c.act)} / ¥${c.cpa}</b></div>
                  <div class="kv"><span>首日 ROAS</span><b class="${c.roas1 >= 7 ? 'up' : 'down'}">${c.roas1}%</b></div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  }
};

/* ===============================
   6. 留存分析
   =============================== */
VIEWS.retain = {
  render() {
    $('#topfilters').innerHTML = topFilters(`
      <select class="select"><option>新增用户留存</option><option>活跃用户留存</option><option>按渠道留存</option></select>
      <button class="btn ghost">留存定义：回访并触发 AppStart</button>`);

    const curve = D.retentionCurve;
    const labels = Array.from({ length: 30 }, (_, i) => 'D' + (i + 1));

    const kpi = [
      ['次日留存', curve[0].toFixed(1), '%', 'up', '▲ 1.2pt', '较上周'],
      ['3 日留存', curve[2].toFixed(1), '%', 'up', '▲ 0.8pt', '较上周'],
      ['7 日留存', curve[6].toFixed(1), '%', 'down', '▼ 0.4pt', '较上周'],
      ['30 日留存', curve[29].toFixed(1), '%', 'up', '▲ 0.3pt', '较上周']
    ].map(k => `<div class="kpi">
      <div class="label">${k[0]}</div>
      <div class="value">${k[1]}<span class="unit">${k[2]}</span></div>
      <div class="delta"><span class="${k[3]}">${k[4]}</span><span class="cmp">${k[5]}</span></div>
    </div>`).join('');

    const main = Charts.line({
      labels, height: 260, area: true,
      series: [
        { name: '本周', data: curve, color: '#2f6bff' },
        { name: '上周同期', data: D.retentionCompare.lastWeek, color: '#f5a623', dash: true },
        { name: '上月同期', data: D.retentionCompare.lastMonth, color: '#c9cfd8', dash: true }
      ]
    });

    /* 留存明细热力表（近期日期 D30 未到期） */
    const heat = D.retention.map(r => {
      const cells = [0, 1, 2, 3, 4].map(i => {
        const v = r.vals[i];
        if (v == null) return `<td class="h" style="background:#fafbfc;color:#c9cfd8">—</td>`;
        const a = Math.min(0.92, 0.12 + v / 45);
        return `<td class="h" style="background:rgba(47,107,255,${a.toFixed(2)});color:${a > 0.55 ? '#fff' : '#1f2329'}">${v}%</td>`;
      }).join('');
      return `<tr><td><span class="name">${r.name}</span></td><td class="num">${fmt(r.base)}</td>${cells}</tr>`;
    }).join('');

    /* 留存 × LTV */
    const ltvChart = Charts.line({
      labels, height: 240, area: true,
      series: [{ name: '累计人均广告收入 LTV', data: D.ltvCurve, color: '#eb2f96' }]
    });

    /* 分群留存对比 */
    const DIM = {
      behavior: { title: '首日解锁广告次数', list: D.retentionByBehavior, note: '首日是否进入"看广告解锁"循环，是留存的最强预测因子：未解锁用户 D1 仅 18.2%，解锁 10 次以上高达 68.6%，相差 50.4pt。产品侧应把"首集免费 + 首次解锁引导"作为新用户核心目标。' },
      episode: { title: '首日观看集数', list: D.retentionByEpisode, note: '首日看满 6 集是分水岭：D7 留存从 7.8% 跃升到 32.4%。建议新用户前 6 集免广告解锁，把用户推进剧情钩子后再开启 Ad Load。' },
      tier: { title: '机型档位', list: D.retentionByTier, note: '高端机 D30 留存 11.4%，低端机仅 6.4%，差 5pt。低端机卡顿与崩溃是主因，需优先做性能兜底。' },
      city: { title: '城市线级', list: D.retentionByCity, note: '一线到四线 D7 留存差 3.8pt，差异小于机型维度，说明留存主要由设备性能与内容匹配决定，而非地域。' },
      channel: { title: '归因渠道', list: D.retentionByChannel, note: '商店渠道（小米 D30 8.6% / 华为 8.4% / ASA 8.2%）用户主动搜索安装，D30 留存约为信息流买量的 1.5 倍；投放上应给商店渠道更高出价系数。' }
    };
    const dim = DIM[retDim];
    const dimLabels = ['D1', 'D3', 'D7', 'D14', 'D30'];
    const dimChart = Charts.line({
      labels: dimLabels, height: 260,
      series: dim.list.map((c, i) => ({ name: c.name, data: c.data, color: Charts.C[i] }))
    });
    const dimRows = dim.list.map(c => {
      const [d1, d3, d7, d14, d30] = c.data;
      return `<tr>
        <td><span class="name">${c.name}</span>${c.note ? `<div class="sub">${c.note}</div>` : ''}</td>
        <td class="num">${d1}%</td><td class="num">${d3}%</td>
        <td class="num ${d7 >= 30 ? 'up' : d7 < 15 ? 'down' : ''}"><b>${d7}%</b></td>
        <td class="num">${d14}%</td><td class="num">${d30}%</td>
        <td class="num ${d30 / d1 >= 0.35 ? 'up' : ''}">${(d30 / d1 * 100).toFixed(1)}%</td>
        <td><div class="bar-cell"><div class="mini-bar" style="width:${(d30 * 4).toFixed(0)}px;background:${Charts.C[0]}"></div></div></td>
      </tr>`;
    }).join('');

    const dimTabs = Object.keys(DIM).map(k =>
      `<button class="${k === retDim ? 'active' : ''}" data-rdim="${k}">${DIM[k].title}</button>`).join('');

    /* 渠道留存 × LTV 四象限 */
    const scatter = Charts.scatter(
      D.channelRetLtv.map(c => ({ name: c.name, x: c.ret7, y: c.ltv30, r: c.act })),
      { xLabel: 'D7 留存率', yLabel: 'LTV30（元）', quadX: 24, quadY: 4.6, height: 300 }
    );

    const returnBars = Charts.hbar(D.returnPath.map(p => ({ name: p.name, value: p.v, color: p.color })), { unit: '%' });

    const warnRows = D.retentionWarn.map(w => `<tr data-row="warn:${w.obj}">
      <td><span class="name">${w.obj}</span></td>
      <td>${w.metric}</td>
      <td class="num"><b class="${w.level === 'red' ? 'up' : ''}">${w.val}</b></td>
      <td class="num ${w.delta.startsWith('-') ? 'down' : 'up'}">${w.delta}</td>
      <td class="num muted">${w.thr}</td>
      <td><span class="tag ${w.level === 'red' ? 'red' : 'orange'}">${w.level === 'red' ? '告警' : '关注'}</span></td>
      <td>${w.act}</td>
      <td><button class="btn sm">创建分群</button></td>
    </tr>`).join('');

    /* 留存 → 收入杠杆 */
    const leverRows = D.valueLevel.map(v => `<tr>
      <td><span class="name">${v.name}</span></td>
      <td class="num">${v.share}%</td>
      <td class="num">${v.ret1}%</td>
      <td class="num">${v.days}</td>
      <td class="num">${v.imp}</td>
      <td class="num">¥${v.arpu.toFixed(2)}</td>
      <td class="num">¥${v.ltv30.toFixed(2)}</td>
      <td class="num"><b>${v.revShare}%</b></td>
    </tr>`).join('');

    return `
      <div class="grid g4">${kpi}</div>

      <div class="card">
        <div class="card-head"><div class="card-title">新增用户留存曲线<small>D1 - D30 · 留存是 IAA 的 LTV 唯一来源</small></div>
          <div class="right"><div class="seg"><button class="active">留存率</button><button>留存人数</button><button>累计人均收入</button></div></div></div>
        <div class="card-body">
          <div class="chart-wrap">${main}</div>
          <div class="legend">
            <span><i style="background:#2f6bff"></i>本周</span>
            <span><i style="background:#f5a623"></i>上周同期</span>
            <span><i style="background:#c9cfd8"></i>上月同期</span>
          </div>
          <div class="note mt12"><span>💡</span><div>曲线在 D7-D10 后趋于平缓（斜率 &lt; 0.4pt/天），说明<b class="up">前 7 天是留存决定期</b>；D14 之后进入稳定长尾，D30 仍有 9.8% 用户在持续贡献广告收入。</div></div>
        </div>
      </div>

      <div class="grid g-1-2">
        <div class="card">
          <div class="card-head"><div class="card-title">留存明细（按新增日期）<small>颜色越深留存越高 · 未到期显示 —</small></div></div>
          <div class="tbl-wrap"><table class="tbl heat">
            <thead><tr><th>新增日期</th><th class="num">新增用户</th>${D.retentionCols.slice(1).map(c => `<th class="num">${c}</th>`).join('')}</tr></thead>
            <tbody>${heat}</tbody></table></div>
          <div class="card-body tight"><div class="legend"><span>10-04 之后的批次 D30 尚未到期</span></div></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">留存 × LTV 累计人均广告收入<small>LTV = 留存人日 × 活跃日 ARPU ¥0.94</small></div></div>
          <div class="card-body">
            <div class="chart-wrap">${ltvChart}</div>
            <div class="grid g3 mt12" style="gap:12px">
              <div class="mini-kpi"><div class="l">D1 LTV</div><div class="v">¥${D.ltvCurve[0].toFixed(2)}</div><div class="s">首日 ARPU</div></div>
              <div class="mini-kpi"><div class="l">D7 LTV</div><div class="v">¥${D.ltvCurve[6].toFixed(2)}</div><div class="s">占 LTV30 的 ${(D.ltvCurve[6] / D.ltvCurve[29] * 100).toFixed(0)}%</div></div>
              <div class="mini-kpi"><div class="l">D30 LTV</div><div class="v">¥${D.ltvCurve[29].toFixed(2)}</div><div class="s">CPA ¥5.00 → 回本约 35 天</div></div>
            </div>
            <div class="note mt12"><span>💡</span><div>ICP 口径说明：概览的 ARPU ¥0.42 是「DAU 口径」（含一次性打开的浅度用户摊薄），本页 LTV 使用「活跃日 ARPU ¥0.94」推导，两者不可直接相除。</div></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">分群留存对比<small>切换维度查看不同人群的留存差异</small></div>
          <div class="right"><div class="seg" id="rdimSeg">${dimTabs}</div></div></div>
        <div class="card-body">
          <div class="chart-wrap">${dimChart}</div>
          <div class="legend">${dim.list.map((c, i) => `<span><i style="background:${Charts.C[i]}"></i>${c.name}</span>`).join('')}</div>
          <div class="tbl-wrap mt12"><table class="tbl">
            <thead><tr><th>${dim.title}</th><th class="num">D1</th><th class="num">D3</th><th class="num">D7</th><th class="num">D14</th><th class="num">D30</th><th class="num">D30/D1 衰减比</th><th>D30 分布</th></tr></thead>
            <tbody>${dimRows}</tbody></table></div>
          <div class="note mt12"><span>💡</span><div>${dim.note}</div></div>
        </div>
      </div>

      <div class="grid g2">
        <div class="card">
          <div class="card-head"><div class="card-title">渠道留存 × LTV 四象限<small>气泡大小 = 激活量</small></div></div>
          <div class="card-body">
            <div class="chart-wrap">${scatter}</div>
            <div class="note mt12"><span>💡</span><div>右下象限（高留存 · 高 LTV）：小米商店、华为、ASA —— 可加大出价；左上象限：知乎/微博、百度 —— 留存与变现双低，建议缩量。</div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">次日回访入口分布<small>用户是怎么回来的</small></div></div>
          <div class="card-body">
            ${returnBars}
            <div class="note mt12"><span>💡</span><div>Push 贡献 32.4% 的次日回访，是最可控的留存杠杆：当前 Push 到达→点击率仅 6.5%，按"更新提醒 + 追剧断点"优化文案，点击率每提升 1pt 约带来 <b class="up">+0.5pt 次留</b>。</div></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">留存与变现杠杆<small>不同价值分层用户的留存 / 展示 / 收入贡献</small></div>
          <div class="right"><button class="btn sm">导出</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr>
            <th>价值分层</th><th class="num">用户占比</th><th class="num">次留</th><th class="num">月均活跃天数</th>
            <th class="num">人均日展示</th><th class="num">ARPU</th><th class="num">LTV30</th><th class="num">收入贡献</th>
          </tr></thead><tbody>${leverRows}</tbody></table></div>
        <div class="card-body tight">
          <div class="note"><span>💡</span><div>把 1% 的"低价值用户"（38.6% 占比）转化为"中价值"，相当于整体 LTV 提升约 <b class="up">¥0.032/人</b>，按当前买量规模（月 25.7 万激活）约等于每月 <b class="up">增加 ¥8,200</b> 广告收入 —— 留存优化的杠杆远大于单纯加广告密度。</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">留存预警<small>低于阈值的渠道 / 机型 / 人群</small></div>
          <div class="right"><button class="btn sm">配置阈值</button><button class="btn sm">订阅告警</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>对象</th><th>监测指标</th><th class="num">当前值</th><th class="num">环比</th><th class="num">阈值</th><th>状态</th><th>建议动作</th><th></th></tr></thead>
          <tbody>${warnRows}</tbody></table></div>
      </div>`;
  },
  after() {
    document.querySelectorAll('[data-rdim]').forEach(b => {
      b.addEventListener('click', () => { retDim = b.dataset.rdim; go('retain'); });
    });
  }
};

/* ===============================
   7. 路径分析
   =============================== */
VIEWS.path = {
  render() {
    $('#topfilters').innerHTML = topFilters();
    const cols = [
      [{ name: 'App 启动', value: 66800 }],
      [{ name: '开屏广告曝光', value: 54200 }, { name: '首页直达', value: 12600 }],
      [{ name: '推荐位选剧', value: 40000 }, { name: '搜索选剧', value: 11800 }, { name: '继续追剧', value: 15000 }],
      [{ name: '首集播放', value: 32400 }, { name: '跳出流失', value: 34400 }],
      [{ name: '看广告解锁', value: 24800 }, { name: '未解锁退出', value: 7600 }],
      [{ name: '继续下一集', value: 21200 }]
    ];
    const links = [
      { from: 'App 启动', to: '开屏广告曝光', value: 54200 },
      { from: 'App 启动', to: '首页直达', value: 12600 },
      { from: '开屏广告曝光', to: '推荐位选剧', value: 34000 },
      { from: '开屏广告曝光', to: '搜索选剧', value: 9200 },
      { from: '开屏广告曝光', to: '继续追剧', value: 11000 },
      { from: '首页直达', to: '推荐位选剧', value: 6000 },
      { from: '首页直达', to: '搜索选剧', value: 2600 },
      { from: '首页直达', to: '继续追剧', value: 4000 },
      { from: '推荐位选剧', to: '首集播放', value: 22000 },
      { from: '推荐位选剧', to: '跳出流失', value: 18000 },
      { from: '搜索选剧', to: '首集播放', value: 6200 },
      { from: '搜索选剧', to: '跳出流失', value: 5600 },
      { from: '继续追剧', to: '首集播放', value: 4200 },
      { from: '继续追剧', to: '跳出流失', value: 10800 },
      { from: '首集播放', to: '看广告解锁', value: 24800 },
      { from: '首集播放', to: '未解锁退出', value: 7600 },
      { from: '看广告解锁', to: '继续下一集', value: 21200 }
    ];
    const rows = [
      ['AppStart → 开屏广告 → 推荐位选剧 → 首集播放 → 看广告解锁 → 继续下一集', 18600, 27.8, '6分42秒', 4.2],
      ['AppStart → 开屏广告 → 继续追剧 → 首集播放 → 看广告解锁', 11200, 16.8, '5分18秒', 3.6],
      ['AppStart → 首页 → 搜索选剧 → 首集播放 → 未解锁退出', 8400, 12.6, '2分06秒', 1.2],
      ['AppStart → 开屏广告 → 推荐位选剧 → 跳出流失', 7600, 11.4, '42秒', 0.8],
      ['AppStart → 开屏广告 → 继续追剧 → 首集播放 → 看广告解锁 → 分享', 4200, 6.3, '8分12秒', 5.1],
      ['AppStart → 首页 → 推荐位选剧 → 首集播放 → 看广告解锁 → 退出', 3400, 5.1, '4分36秒', 2.8]
    ].map(r => `<tr>
      <td style="font-family:Menlo,monospace;font-size:11.5px">${r[0]}</td>
      <td class="num">${fmt(r[1])}</td><td class="num">${r[2]}%</td>
      <td class="num">${r[3]}</td>
      <td class="num">${r[4]} 次</td>
      <td><button class="btn sm">下钻</button></td></tr>`).join('');

    return `
      <div class="card">
        <div class="card-head"><div class="card-title">用户路径流转图<small>起始事件：App 启动 · 会话内路径</small></div>
          <div class="right">
            <select class="select"><option>起始事件：AppStart</option><option>结束事件：AdRewarded</option></select>
            <button class="btn sm">设置</button></div></div>
        <div class="card-body">${sankey(cols, links, { width: 880, nodeW: 108 })}</div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">Top 用户路径<small>按会话数排序</small></div>
          <div class="right"><button class="btn sm">导出</button><button class="btn sm">创建分群</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>路径序列</th><th class="num">会话数</th><th class="num">占比</th><th class="num">平均时长</th><th class="num">人均广告展示</th><th></th></tr></thead>
          <tbody>${rows}</tbody></table></div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">关键页面跳出分析<small>进入后无任何后续事件的占比</small></div></div>
        <div class="card-body">${Charts.hbar([
      { name: '解锁弹窗', value: 33.2, color: '#f54a45' },
      { name: '播放页', value: 18.4, color: '#f5a623' },
      { name: '剧集详情页', value: 12.6, color: '#7a4ddd' },
      { name: '开屏广告页', value: 8.2, color: '#2f6bff' },
      { name: '首页推荐', value: 6.4, color: '#17b26a' }
    ], { unit: '%' })}
          <div class="note mt12"><span>💡</span><div>解锁弹窗跳出 33.2% 是变现最大泄漏点：每降低 1pt 跳出，按当前 eCPM 估算可增加约 <b class="up">¥2,900/日</b> 广告收入，建议测试"看广告解锁整集"文案与倒计时权益提示。</div></div>
        </div>
      </div>`;
  }
};

/* ===============================
   8. 埋点事件管理
   =============================== */
VIEWS.dict = {
  render() {
    $('#topfilters').innerHTML = topFilters(`<button class="btn primary">+ 新建事件</button>`);

    const statusTag = s => ({ '已上线': 'green', '灰度中': 'orange', '未上报': 'red', '已废弃': '' }[s] || '');
    const checkTag = c => ({ '正常': 'green', '参数异常': 'red', '上报延迟': 'orange', '未接入': 'red', '已下线': '' }[c] || '');
    const maxToday = Math.max(...D.eventDict.map(e => e.today));

    const rows = D.eventDict.map(e => `<tr data-dict="${e.key}" data-g="${e.group}" data-s="${e.status}" data-t="${e.type}">
      <td><span class="name">${e.name}</span><div class="sub code">${e.key}</div></td>
      <td>${e.group}</td>
      <td><span class="tag ${e.type === '全埋点' ? 'purple' : e.type === 'SDK 自采集' ? 'blue' : ''}">${e.type}</span></td>
      <td><span class="tag ${statusTag(e.status)}">${e.status}</span></td>
      <td class="num">${e.params}</td>
      <td class="num"><div class="bar-cell"><div class="mini-bar" style="width:${Math.max(2, e.today / maxToday * 70).toFixed(0)}px;background:${e.today ? '#2f6bff' : '#d9dde3'}"></div><span>${e.today ? fmt(e.today) : '—'}</span></div></td>
      <td class="muted">${e.last}</td>
      <td>${e.owner}</td>
      <td><span class="tag ${checkTag(e.check)}">${e.check}</span></td>
      <td><button class="btn sm">详情</button></td>
    </tr>`).join('');

    const total = D.eventDict.length;
    const abnormal = D.eventDict.filter(e => e.check !== '正常').length;
    const todayAll = D.eventDict.reduce((s, e) => s + e.today, 0);

    /* 分组统计 */
    const groupStat = D.eventTree.map(g => ({
      icon: g.icon, name: g.group,
      n: g.items.length,
      cnt: g.items.reduce((s, i) => s + i.c, 0)
    }));

    const tabs = [['list', '事件列表'], ['graph', '事件关联图谱'], ['attr', '用户属性']]
      .map(t => `<button class="${dictTab === t[0] ? 'active' : ''}" data-dtab="${t[0]}">${t[1]}</button>`).join('');

    /* 关联图谱 */
    const graphCard = `
      <div class="card">
        <div class="card-head"><div class="card-title">事件关联图谱<small>6 条核心链路 · 点击节点查看事件定义</small></div>
          <div class="right"><button class="btn sm">+ 新建链路</button><button class="btn sm">导出 YAML</button></div></div>
        <div class="card-body">
          ${D.eventChains.map(c => {
      const nodes = c.steps.map((s, i) => {
        const e = D.eventDict.find(x => x.key === s);
        const prev = i ? D.eventDict.find(x => x.key === c.steps[i - 1]) : null;
        const rate = prev && e && prev.today ? (e.today / prev.today * 100) : null;
        return (i ? `<span class="rel-arrow">${rate ? `<i>${rate.toFixed(1)}%</i>` : ''}→</span>` : '') +
          `<span class="chain-node" data-dict-node="${s}">${e ? e.name : s}<i>${e ? fmt(e.today) : '—'}</i></span>`;
      }).join('');
      return `<div class="chain-block">
              <div class="chain-title">${c.icon} ${c.name}<span class="muted">${c.desc}</span></div>
              <div class="chain-nodes">${nodes}</div>
            </div>`;
    }).join('')}
          <div class="note mt12"><span>💡</span><div>链路上的百分比为相邻事件上报量之比，是"事件级转化率"的快速估算；精确漏斗请在「漏斗分析」中配置转化窗口与用户口径。</div></div>
        </div>
      </div>`;

    /* 用户属性 */
    const attrCard = `
      <div class="card">
        <div class="card-head"><div class="card-title">用户属性字典<small>可与任意事件交叉分析 · 支撑用户分群</small></div>
          <div class="right"><button class="btn sm">+ 新增属性</button></div></div>
        <div class="card-body">
          <div class="grid g2">
            ${D.userProps.map(g => `
              <div class="prop-card">
                <div class="pc-title">${g.group}<span class="muted">${g.items.length} 项</span></div>
                ${g.items.map(i => `<div class="pc-item"><span class="code">${i.split(' ')[0]}</span>${i.split(' ').slice(1).join(' ')}</div>`).join('')}
              </div>`).join('')}
          </div>
          <div class="note mt16"><span>💡</span><div>公共参数（${D.commonParams.length} 项）由全埋点 SDK 自动采集，所有事件均携带；业务参数需在事件定义中显式声明，未声明的参数会被服务端丢弃。</div></div>
        </div>
      </div>`;

    const listCard = `
      <div class="card">
        <div class="card-body tight">
          <div class="filter-row">
            <input class="input" id="dictSearch" placeholder="搜索事件名 / 事件标识 / 负责人">
            <select class="select" id="dictGroup"><option>全部分组</option>${D.eventTree.map(g => `<option>${g.group}</option>`).join('')}</select>
            <select class="select" id="dictStatus"><option>全部状态</option><option>已上线</option><option>灰度中</option><option>未上报</option><option>已废弃</option></select>
            <select class="select" id="dictType"><option>全部类型</option><option>代码埋点</option><option>全埋点</option><option>SDK 自采集</option></select>
            <button class="btn" id="dictReset">重置</button>
            <div style="margin-left:auto" class="muted" id="dictCount">共 ${total} 个事件 · 其中 ${abnormal} 项异常</div>
          </div>
        </div>
        <div class="tbl-wrap" style="max-height:620px;overflow-y:auto">
          <table class="tbl">
            <thead><tr>
              <th>事件</th><th>所属分组</th><th>采集方式</th><th>状态</th><th class="num">参数数</th>
              <th class="num">今日上报量</th><th>最近上报时间</th><th>负责人</th><th>校验状态</th><th></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;

    return `
      <div class="card">
        <div class="card-head"><div class="card-title">埋点体系总览<small>${total} 个事件 · ${D.eventTree.length} 个分组 · 今日上报 ${fmt(todayAll)} 次</small></div>
          <div class="right"><div class="seg" id="dictSeg">${tabs}</div><button class="btn sm primary">+ 新建事件</button></div></div>
        <div class="card-body">
          <div class="grid g4" style="gap:12px">
            ${groupStat.map(g => `<div class="mini-kpi">
              <div class="l">${g.icon} ${g.name}</div>
              <div class="v">${g.n}<span class="unit">个事件</span></div>
              <div class="s">今日 ${fmt(g.cnt)} 次上报</div>
            </div>`).join('')}
          </div>
        </div>
      </div>

      ${dictTab === 'list' ? listCard : dictTab === 'graph' ? graphCard : attrCard}

      <div class="card">
        <div class="card-head"><div class="card-title">上报质量概览</div></div>
        <div class="card-body">
          <div class="grid g4">
            <div class="kpi"><div class="label">事件总数</div><div class="value">${total}</div><div class="delta muted">本周新增 3 · 废弃 1</div></div>
            <div class="kpi"><div class="label">今日上报总量</div><div class="value">${(todayAll / 1e8).toFixed(2)}<span class="unit">亿</span></div><div class="delta"><span class="up">▲ 6.4%</span></div></div>
            <div class="kpi"><div class="label">参数校验通过率</div><div class="value">95.8<span class="unit">%</span></div><div class="delta"><span class="down">▼ 1.8pt</span></div></div>
            <div class="kpi"><div class="label">异常告警</div><div class="value" style="color:#f54a45">${abnormal}</div><div class="delta muted">需 24h 内处理</div></div>
          </div>
          <div class="note mt16"><span>⚠️</span><div>AdRewarded 的 <span class="code">ecpm</span> 字段有 2.8% 为空，导致收入归因偏低；UnlockSuccess 平均上报延迟 6.8 分钟；NewAdPositionShow 尚未接入，需确认新广告位是否已上线。</div></div>
        </div>
      </div>`;
  },
  after() {
    document.querySelectorAll('[data-dict]').forEach(tr => {
      tr.addEventListener('click', () => openDrawer(tr.dataset.dict));
    });
    document.querySelectorAll('[data-dict-node]').forEach(el => {
      el.addEventListener('click', () => openDrawer(el.dataset.dictNode));
    });
    document.querySelectorAll('[data-dtab]').forEach(b => {
      b.addEventListener('click', () => { dictTab = b.dataset.dtab; go('dict'); });
    });
    /* 事件列表筛选（真实生效） */
    const applyDictFilter = () => {
      const q = (($('#dictSearch') || {}).value || '').trim().toLowerCase();
      const g = ($('#dictGroup') || {}).value || '全部分组';
      const s = ($('#dictStatus') || {}).value || '全部状态';
      const t = ($('#dictType') || {}).value || '全部类型';
      let n = 0;
      document.querySelectorAll('[data-dict]').forEach(tr => {
        const ok = (!q || (tr.textContent + ' ' + tr.dataset.dict).toLowerCase().indexOf(q) >= 0)
          && (g === '全部分组' || tr.dataset.g === g)
          && (s === '全部状态' || tr.dataset.s === s)
          && (t === '全部类型' || tr.dataset.t === t);
        tr.style.display = ok ? '' : 'none';
        if (ok) n++;
      });
      const c = $('#dictCount');
      if (c) c.textContent = `筛选出 ${n} 个事件 · 共 ${D.eventDict.length} 个`;
    };
    ['dictSearch', 'dictGroup', 'dictStatus', 'dictType'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', applyDictFilter);
    });
    const rst = document.getElementById('dictReset');
    if (rst) rst.addEventListener('click', () => {
      const si = $('#dictSearch'); if (si) si.value = '';
      ['dictGroup', 'dictStatus', 'dictType'].forEach(id => { const e = document.getElementById(id); if (e) e.selectedIndex = 0; });
      applyDictFilter();
      Toast('筛选条件已重置');
    });
  }
};

/* ---------- 事件详情抽屉 ---------- */
function sampleFor(key) {
  const base = { user_id: 'u_8892134', channel: '巨量引擎', network_type: 'wifi', app_version: '6.2.0', time: 1761409200000 };
  const map = {
    AdShow: { event: 'AdShow', ad_position: 'rewarded', ad_source: 'gromore', ad_type: 'video', scene: 'unlock_episode', drama_id: 'd_10231', episode_no: 8, ecpm: 22.4, is_first_show: false },
    AdRewarded: { event: 'AdRewarded', ad_position: 'rewarded', ad_source: 'gromore', scene: 'unlock_episode', drama_id: 'd_10231', episode_no: 9, reward_type: 'unlock_episode', verify_status: 'success', duration_ms: 32400, ecpm: 22.4 },
    UnlockSuccess: { event: 'UnlockSuccess', drama_id: 'd_10231', episode_no: 9, unlock_type: 'ad_watch', ad_watched_count: 4, is_first_unlock: false },
    LoginSuccess: { event: 'LoginSuccess', login_type: 'one_click', is_new_user: false, campaign_id: 'cmp_10231', duration_ms: 842, device_model: 'iPhone 15 Pro' }
  };
  return Object.assign({}, base, (D.eventParams[key] ? map[key] : null) || {});
}

function openDrawer(key) {
  const e = D.eventDict.find(x => x.key === key) || D.eventDict[0];
  const params = D.eventParams[key] || [];
  $('#drawerBody').innerHTML = `
    <div class="desc-list">
      <div class="k">事件标识</div><div><span class="code">${e.key}</span></div>
      <div class="k">显示名称</div><div>${e.name}</div>
      <div class="k">所属分组</div><div>${e.group}</div>
      <div class="k">采集方式</div><div><span class="tag ${e.type === '全埋点' ? 'purple' : 'blue'}">${e.type}</span></div>
      <div class="k">状态</div><div><span class="tag green">${e.status}</span></div>
      <div class="k">负责人</div><div>${e.owner}</div>
      <div class="k">最近上报</div><div>${e.last}</div>
      <div class="k">今日上报量</div><div>${e.today ? fmt(e.today) : '—'}</div>
      <div class="k">关联看板</div><div><a href="#">广告变现分析</a> · <a href="#">渠道 LTV 分析</a></div>
      <div class="k">关联链路</div><div>${(() => {
        const cs = D.eventChains.filter(c => c.steps.indexOf(e.key) >= 0);
        return cs.length ? cs.map(c => `<span class="tag blue">${c.name}</span>`).join(' ') : '<span class="muted">未加入任何链路</span>';
      })()}</div>
    </div>

    ${(() => {
      const rel = D.eventRelation[e.key];
      if (!rel) return '';
      return `<div class="card-title mt16" style="font-size:13px">关联事件 <small>上下游与后续行为</small></div>
      <div class="rel-chain mt8">
        ${rel.up.map(x => `<span class="rel-node">${x}</span>`).join('<span class="rel-arrow">→</span>')}
        <span class="rel-arrow">→</span><span class="rel-node cur">${e.key}</span><span class="rel-arrow">→</span>
        ${rel.down.map(x => `<span class="rel-node">${x}</span>`).join('<span class="rel-arrow">·</span>')}
      </div>
      <div class="tbl-wrap mt8"><table class="tbl">
        <thead><tr><th>后续事件</th><th class="num">触发占比</th><th>说明</th></tr></thead>
        <tbody>${rel.related.map(r => `<tr><td><span class="code">${r.ev}</span></td><td class="num">${r.rate}%</td><td class="muted">${r.desc}</td></tr>`).join('')}</tbody>
      </table></div>`;
    })()}

    <div class="card-title mt16" style="font-size:13px">公共参数 <small>全埋点自动采集 ${D.commonParams.length} 项</small></div>
    <div class="tbl-wrap mt8"><table class="tbl">
      <thead><tr><th>参数名</th><th>类型</th><th>采集</th><th>说明</th></tr></thead>
      <tbody>${D.commonParams.map(p => `<tr><td><span class="code">${p.p}</span></td><td><span class="tag">${p.t}</span></td><td>${p.req}</td><td class="muted">${p.d}</td></tr>`).join('')}</tbody>
    </table></div>

    <div class="card-title mt16" style="font-size:13px">业务参数定义 <small>${params.length ? params.length + ' 个' : '暂无业务参数'}</small></div>
    ${params.length ? `<div class="tbl-wrap mt8"><table class="tbl">
      <thead><tr><th>参数名</th><th>类型</th><th>必填</th><th>说明</th></tr></thead>
      <tbody>${params.map(p => `<tr><td><span class="code">${p.p}</span></td><td><span class="tag">${p.t}</span></td><td>${p.req}</td><td class="muted">${p.d}</td></tr>`).join('')}</tbody>
    </table></div>` : `<div class="muted mt8" style="font-size:12px">该事件仅依赖公共参数，无需额外业务参数声明。</div>`}

    <div class="card-title mt16" style="font-size:13px">上报示例${params.length ? '' : '（公共参数）'}</div>
    <pre class="codeblock mt8">${JSON.stringify(sampleFor(key), null, 2)}</pre>

    <div class="card-title mt16" style="font-size:13px">近 7 日上报趋势</div>
    <div class="chart-wrap mt8">${Charts.line({
      labels: DATES.slice(-7), height: 170,
      series: [{ name: '上报量', data: [92, 98, 95, 103, 108, 104, 100].map(x => Math.round(x * (e.today ? e.today / 100 : 10000))) }]
    })}</div>

    <div class="filter-row mt16">
      <button class="btn primary">埋点校验</button>
      <button class="btn">查看明细日志</button>
      <button class="btn">编辑事件</button>
    </div>`;
  $('#drawerTitle').textContent = e.name;
  $('#drawer').classList.add('show');
  $('#mask').classList.add('show');
}
function closeDrawer() {
  $('#drawer').classList.remove('show');
  $('#mask').classList.remove('show');
}

/* ===============================
   初始化（由 ui.js 在最后统一启动）
   =============================== */
$('#nav').addEventListener('click', e => {
  const it = e.target.closest('[data-nav]');
  if (it) go(it.dataset.nav);
});
$('#drawerClose').addEventListener('click', closeDrawer);
