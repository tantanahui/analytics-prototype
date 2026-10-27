/* ===========================================================
   全局交互层：Toast / Modal / 抽屉 / 排序 / 导出 / 行详情
   目标：原型内所有可点击元素都有明确反馈
   =========================================================== */

/* ---------- Toast ---------- */
function Toast(msg, type) {
  let box = document.getElementById('toastBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toastBox';
    box.className = 'toast-box';
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.innerHTML = `<span class="ti">${type === 'error' ? '✕' : type === 'warn' ? '!' : '✓'}</span><span>${msg}</span>`;
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => {
    el.classList.remove('in');
    setTimeout(() => el.remove(), 260);
  }, 2400);
}
window.Toast = Toast;

/* ---------- 抽屉（通用） ---------- */
function openDrawerHTML(title, html) {
  const d = document.getElementById('drawer');
  document.getElementById('drawerTitle').innerHTML = title;
  document.getElementById('drawerBody').innerHTML = html;
  d.classList.add('show');
  document.getElementById('mask').classList.add('show');
  d.scrollTop = 0;
  document.getElementById('drawerBody').scrollTop = 0;
}
window.openDrawerHTML = openDrawerHTML;

/* ---------- Modal ---------- */
const Modal = {
  open(opts) {
    const { title = '操作', body = '', fields = [], okText = '确定', cancelText = '取消', onOk } = opts;
    const mask = document.getElementById('modalMask');
    document.getElementById('modalTitle').innerHTML = title;
    document.getElementById('modalBody').innerHTML = body + fields.map(f => `
      <div class="fm-row">
        <label>${f.label}${f.req ? '<i>*</i>' : ''}</label>
        ${f.type === 'select'
        ? `<select class="select" data-f="${f.key}" style="width:100%">${f.options.map(o => `<option>${o}</option>`).join('')}</select>`
        : f.type === 'textarea'
          ? `<textarea class="input ta" data-f="${f.key}" placeholder="${f.ph || ''}">${f.value || ''}</textarea>`
          : `<input class="input" data-f="${f.key}" style="width:100%" value="${f.value || ''}" placeholder="${f.ph || ''}">`}
        ${f.tip ? `<div class="fm-tip">${f.tip}</div>` : ''}
      </div>`).join('');
    const ok = document.getElementById('modalOk');
    ok.textContent = okText;
    document.getElementById('modalCancel').textContent = cancelText;
    ok.onclick = () => {
      const vals = {};
      document.querySelectorAll('#modalBody [data-f]').forEach(i => vals[i.dataset.f] = i.value);
      Modal.close();
      if (onOk) onOk(vals); else Toast(`${okText}成功`);
    };
    mask.classList.add('show');
  },
  close() { document.getElementById('modalMask').classList.remove('show'); }
};
window.Modal = Modal;

/* ---------- 复制 ---------- */
function copyText(text, tip) {
  try {
    navigator.clipboard.writeText(text);
  } catch (e) { /* 原型环境忽略 */ }
  Toast(tip || '已复制到剪贴板');
}
window.copyText = copyText;

/* ---------- CSV 导出（真实下载） ---------- */
function exportCsv(btn) {
  const scope = btn.closest('.card') || document.getElementById('view');
  const tbl = scope.querySelector('table.tbl') || document.querySelector('#view table.tbl');
  if (!tbl) { Toast('当前区域没有可导出的表格', 'warn'); return; }
  const rows = [];
  tbl.querySelectorAll('tr').forEach(tr => {
    const cells = [];
    tr.querySelectorAll('th,td').forEach(td => {
      let t = td.textContent.replace(/\s+/g, ' ').trim();
      t = t.replace(/"/g, '""');
      cells.push('"' + t + '"');
    });
    if (cells.length) rows.push(cells.join(','));
  });
  const title = (scope.querySelector('.card-title') || {}).textContent || '导出';
  const name = (title.split(/small|·/)[0] || 'export').trim().replace(/\s+/g, '_');
  try {
    const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { /* 部分环境不支持下载，仅提示 */ }
  Toast(`已导出「${name}」· ${rows.length - 1} 行`);
}
window.exportCsv = exportCsv;

/* ===========================================================
   表格排序
   =========================================================== */
function numOf(s) {
  const t = String(s).replace(/[,，%\s¥元人天次分]/g, '');
  if (/^[-+]?[\d.]+万$/.test(String(s).trim())) return parseFloat(t) * 10000;
  if (/^[-+]?[\d.]+亿$/.test(String(s).trim())) return parseFloat(t) * 1e8;
  const v = parseFloat(t);
  return isNaN(v) ? null : v;
}
function makeSortable() {
  document.querySelectorAll('#view table.tbl').forEach(tbl => {
    const ths = tbl.querySelectorAll('thead th');
    ths.forEach((th, idx) => {
      if (th.classList.contains('nosort')) return;
      if (!th.querySelector('.srt')) {
        th.innerHTML += '<span class="srt">↕</span>';
        th.classList.add('sortable');
      }
      th.onclick = () => {
        const body = tbl.tBodies[0];
        const dir = th.dataset.dir === 'asc' ? 'desc' : 'asc';
        ths.forEach(t => { t.dataset.dir = ''; const s = t.querySelector('.srt'); if (s) s.textContent = '↕'; });
        th.dataset.dir = dir;
        th.querySelector('.srt').textContent = dir === 'asc' ? '↑' : '↓';
        const rows = Array.from(body.rows);
        rows.sort((a, b) => {
          const ca = (a.cells[idx] || {}).textContent || '';
          const cb = (b.cells[idx] || {}).textContent || '';
          const na = numOf(ca), nb = numOf(cb);
          let r;
          if (na !== null && nb !== null) r = na - nb;
          else r = ca.localeCompare(cb, 'zh-CN');
          return dir === 'asc' ? r : -r;
        });
        rows.forEach(r => body.appendChild(r));
      };
    });
  });
}

/* ===========================================================
   通用 seg（分段控件）
   =========================================================== */
function bindSegs() {
  document.querySelectorAll('#view .seg').forEach(seg => {
    if (seg.dataset.bound) return;
    if (seg.querySelector('[data-rdim],[data-prop],[data-dtab],[data-ntab],[data-ndim],[data-mode],[data-grain],[data-ec]')) return;
    seg.dataset.bound = '1';
    seg.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        seg.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const card = seg.closest('.card');
        const t = card ? (card.querySelector('.card-title') || {}).textContent : '';
        Toast(`「${t ? t.split('·')[0].trim() : '视图'}」已切换为「${b.textContent.trim()}」`);
      });
    });
  });
}

/* ===========================================================
   通用 select
   =========================================================== */
function bindSelects() {
  document.querySelectorAll('#topfilters select, #view .card-head select, #view .filter-row select').forEach(sel => {
    if (sel.dataset.bound) return;
    sel.dataset.bound = '1';
    sel.addEventListener('change', () => {
      const v = sel.options[sel.selectedIndex].text;
      sel.classList.add('sel-active');
      Toast(`筛选已应用：${v}`);
    });
  });
}

/* ===========================================================
   通用按钮行为（兜底，保证每个按钮都有反馈）
   =========================================================== */
const ACT_RULES = [
  [/导出|下载|CSV/, 'export'],
  [/复制/, 'copy'],
  [/新建事件/, 'newEvent'],
  [/新建分群|创建分群|圈选/, 'newSegment'],
  [/新建链路|维护关联链路/, 'newChain'],
  [/新建任务|下发|Push 下发|发送/, 'newPush'],
  [/新建|创建|\+ 添加|添加/, 'create'],
  [/重置/, 'reset'],
  [/保存|订阅|应用|确认/, 'save'],
  [/重新计算|计算分群|刷新|查询/, 'calc'],
  [/下钻|详情|查看|明细|对比分析|分析|全部|历史版本|查看全部/, 'drill'],
  [/运营|批量|A\/B 实验|广告策略|实验/, 'ops'],
  [/管理|配置|设置|自定义列|配置阈值|配置分层|素材库|阈值/, 'config'],
];

function bindButtons() {
  document.querySelectorAll('#view .btn, #topfilters .btn').forEach(btn => {
    if (btn.dataset.bound || btn.id) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', e => {
      const txt = btn.textContent.trim();
      for (const [re, act] of ACT_RULES) {
        if (re.test(txt)) return runAct(act, btn, txt, e);
      }
      Toast(`已触发：${txt}`);
    });
  });
}

function runAct(act, btn, txt, e) {
  switch (act) {
    case 'export': exportCsv(btn); break;
    case 'copy':
      const pre = document.querySelector('#drawerBody pre.codeblock');
      copyText(pre ? pre.textContent : txt);
      break;
    case 'newEvent':
      Modal.open({
        title: '新建埋点事件', okText: '创建事件',
        fields: [
          { key: 'key', label: '事件标识', ph: '如 UnlockPopupShow', req: 1, tip: '英文驼峰，创建后不可修改' },
          { key: 'name', label: '显示名称', ph: '如 解锁弹窗曝光', req: 1 },
          { key: 'group', label: '所属分组', type: 'select', options: D.eventTree.map(g => g.group) },
          { key: 'type', label: '采集方式', type: 'select', options: ['代码埋点', '全埋点', 'SDK 自采集'] },
          { key: 'owner', label: '负责人', ph: '如 李敏' }
        ],
        onOk: v => Toast(`事件 <b>${v.key || 'NewEvent'}</b> 已创建，进入「待接入」状态`)
      });
      break;
    case 'newSegment':
      Modal.open({
        title: '创建用户分群', okText: '保存分群',
        body: `<div class="fm-tip" style="margin-bottom:10px">将基于当前分析结果的过滤条件创建分群，创建后 T+1 08:00 全量重算。</div>`,
        fields: [
          { key: 'name', label: '分群名称', ph: '如 首日未解锁用户', req: 1 },
          { key: 'window', label: '行为时间窗口', type: 'select', options: ['近 7 日', '近 14 日', '近 30 日'] },
          { key: 'update', label: '更新频率', type: 'select', options: ['每日 08:00 全量', '每日 2 次', '实时（分钟级）'] }
        ],
        onOk: v => Toast(`分群「${v.name || '未命名'}」已保存，预计 ${fmt(Math.round(D.summary.dau * 0.18))} 人`)
      });
      break;
    case 'newPush':
      Modal.open({
        title: '创建 Push 下发任务', okText: '提交任务',
        fields: [
          { key: 'name', label: '任务名称', ph: '如 追剧断点提醒（20:00）', req: 1 },
          { key: 'scene', label: '推送场景', type: 'select', options: D.pushScene.map(s => s.scene) },
          { key: 'seg', label: '定向分群', type: 'select', options: D.segments.map(s => s.name) },
          { key: 'content', label: '推送文案', type: 'textarea', ph: '《剧名》看到第 N 集，解锁继续 →', tip: '带剧名与断点集数的文案 CTR 高出 6.0pt' },
          { key: 'time', label: '发送时间', type: 'select', options: ['每日 20:00', '每日 12:00', '实时触发', '每周三 15:00'] }
        ],
        onOk: v => Toast(`任务「${v.name || '未命名'}」已提交，等待审核后下发`)
      });
      break;
    case 'newChain':
      Modal.open({
        title: '维护事件关联链路', okText: '保存链路',
        fields: [
          { key: 'name', label: '链路名称', ph: '如 解锁转化链路', req: 1 },
          { key: 'steps', label: '链路步骤（按顺序，逗号分隔）', ph: 'EpisodeStart,UnlockPopupShow,AdShow,UnlockSuccess' },
          { key: 'win', label: '转化窗口', type: 'select', options: ['会话内', '1 天', '7 天', '30 天'] }
        ],
        onOk: () => Toast('链路已保存，关联图谱将在下次计算后更新')
      });
      break;
    case 'create':
      Modal.open({
        title: txt.replace(/^\+\s*/, ''), okText: '确定',
        fields: [{ key: 'name', label: '名称', ph: '请输入名称', req: 1 }],
        onOk: v => Toast(`「${v.name || '未命名'}」已添加`)
      });
      break;
    case 'reset':
      document.querySelectorAll('#view .input').forEach(i => i.value = '');
      document.querySelectorAll('#view select').forEach(s => { s.selectedIndex = 0; s.classList.remove('sel-active'); });
      Toast('筛选条件已重置');
      break;
    case 'save': Toast(`已保存：${txt}`); break;
    case 'calc': Toast('计算任务已提交，预计 30 秒内返回结果'); break;
    case 'drill': Toast(`正在打开：${txt}`); break;
    case 'ops':
      Modal.open({
        title: `${txt} · 运营动作`, okText: '确认执行',
        body: `<div class="fm-tip" style="margin-bottom:10px">运营动作将作用于所选对象，执行后可在「用户分群 → 运营记录」中查看效果回收。</div>`,
        fields: [
          { key: 'act', label: '动作类型', type: 'select', options: ['Push 文案下发', '调整 Ad Load', '创建 A/B 实验', '导出人群包'] },
          { key: 'date', label: '生效时间', type: 'select', options: ['立即', '次日 00:00', '指定时间'] }
        ],
        onOk: () => Toast('运营动作已提交，效果将在 24h 后回收')
      });
      break;
    case 'config':
      Modal.open({
        title: txt, okText: '保存配置',
        fields: [
          { key: 'k1', label: '配置项', ph: '如 D7 留存阈值', value: '15' },
          { key: 'k2', label: '触发条件', type: 'select', options: ['低于阈值', '高于阈值', '环比降幅 > 5%'] }
        ],
        onOk: () => Toast('配置已保存并生效')
      });
      break;
  }
}

/* ===========================================================
   行详情抽屉（data-row="type:key"）
   =========================================================== */
const ROW_DRAWERS = {
  channel(key) {
    const c = D.channels.find(x => x.name === key);
    if (!c) return null;
    const cpa = c.cost ? c.cost / c.act : 0;
    const r30 = c.cost ? c.act * c.ltv30 / c.cost * 100 : 0;
    return {
      title: `${c.name} · 渠道详情`,
      html: `
        ${kvBlock([
          ['渠道', `${c.name}（${c.sub}）`], ['归因方式', '点击归因 · 24h 窗口'],
          ['曝光 / 点击', `${fmt(c.imp || 0)} / ${fmt(c.clk || 0)}`],
          ['CTR', c.imp ? pct(c.clk, c.imp) : '—'],
          ['消耗', c.cost ? money(c.cost) : '自然量'],
          ['新增激活', fmt(c.act)], ['CPA', cpa ? '¥' + cpa.toFixed(2) : '—'],
          ['次日留存', c.ret1 + '%'], ['LTV7 / LTV30', `¥${c.ltv7.toFixed(2)} / ¥${c.ltv30.toFixed(2)}`],
          ['30 日 ROAS', r30 ? r30.toFixed(1) + '%' : '—']
        ])}
        <div class="card-title mt16" style="font-size:13px">留存曲线（D1-D7）</div>
        <div class="chart-wrap mt8">${Charts.line({
          labels: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'], height: 170,
          series: [{ name: c.name, data: (D.retentionByChannel.find(x => x.name === c.name) || { data: [40, 30, 20, 18, 16, 14, 12] }).data.slice(0, 7), color: '#2f6bff' }]
        })}</div>
        <div class="card-title mt16" style="font-size:13px">该渠道用户构成</div>
        <div class="mt8">${Charts.hbar(D.deviceTier.map((t, i) => ({ name: t.name, value: +(t.share * (0.9 + i * 0.04)).toFixed(1), color: Charts.C[4 - i] })), { unit: '%' })}</div>
        <div class="filter-row mt16">
          <button class="btn primary" data-act="create-seg">基于此渠道创建分群</button>
          <button class="btn" data-act="toast">查看广告计划</button>
          <button class="btn" data-act="toast">下载明细</button>
        </div>`
    };
  },
  slot(key) {
    const s = D.adSlots.find(x => x.name === key);
    if (!s) return null;
    return {
      title: `${s.name} · 广告位详情`,
      html: `
        ${kvBlock([
          ['广告位', s.name], ['触发场景', s.scene],
          ['请求量', fmt(s.req)], ['填充量', fmt(s.fill)], ['填充率', pct(s.fill, s.req)],
          ['展示量', fmt(s.show)], ['展示率', pct(s.show, s.fill)],
          ['eCPM', '¥' + s.ecpm.toFixed(2)], ['收入', money(s.rev)], ['人均展示', s.cpu + ' 次']
        ])}
        <div class="card-title mt16" style="font-size:13px">该广告位请求 → 收入漏斗</div>
        <div class="mt8">${Charts.funnel([
          { name: '广告请求', value: s.req }, { name: '填充成功', value: s.fill },
          { name: '广告展示', value: s.show }, { name: '完整播放', value: Math.round(s.show * 0.86) }
        ], { width: 380 })}</div>
        <div class="card-title mt16" style="font-size:13px">广告源 eCPM 对比</div>
        <div class="mt8">${Charts.hbar(D.adSources.map((x, i) => ({ name: x.name, value: +(x.ecpm * (s.ecpm / 18.25)).toFixed(1), color: Charts.C[i] })), { unit: ' 元' })}</div>`
    };
  },
  source(key) {
    const s = D.adSources.find(x => x.name === key);
    if (!s) return null;
    return {
      title: `${s.name} · 广告源详情`,
      html: kvBlock([
        ['广告源', s.name], ['请求量', fmt(s.req)], ['填充率', s.fillRate + '%'],
        ['eCPM', '¥' + s.ecpm.toFixed(1)], ['收入', money(s.rev)],
        ['收入占比', pct(s.rev, D.adSources.reduce((a, b) => a + b.rev, 0))],
        ['分层建议', s.ecpm >= 20 ? '置顶优先' : s.ecpm >= 12 ? '中层补充' : '兜底'],
        ['建议水位', s.ecpm >= 20 ? 'Waterfall 第 1-2 层' : s.ecpm >= 12 ? 'Waterfall 第 3-4 层' : 'Bidding 兜底']
      ]) + `<div class="filter-row mt16"><button class="btn primary" data-act="toast">调整分层</button><button class="btn" data-act="toast">切换 Bidding</button></div>`
    };
  },
  drama(key) {
    const d = D.dramas.find(x => x.name === key);
    if (!d) return null;
    return {
      title: `${d.name} · 剧集详情`,
      html: kvBlock([
        ['剧集', d.name], ['总集数', d.eps + ' 集'], ['播放人数', fmt(d.uv)],
        ['完播率', d.finish + '%'], ['人均集数', d.epPerUser], ['解锁率', d.unlock + '%'],
        ['广告展示', fmt(d.imp)], ['eCPM', '¥' + (d.rev / d.imp * 1000).toFixed(2)],
        ['广告收入', money(d.rev)], ['ARPU', '¥' + (d.rev / d.uv).toFixed(3)]
      ]) + `<div class="card-title mt16" style="font-size:13px">分集留存（前 10 集）</div>
      <div class="chart-wrap mt8">${Charts.line({
        labels: Array.from({ length: 10 }, (_, i) => 'E' + (i + 1)), height: 170,
        series: [{ name: '集间留存', data: [100, 92, 86, 81, 74, 68, 62, 58, 54, 51], color: '#eb2f96' }]
      })}</div>`
    };
  },
  plan(key) {
    const p = D.pushTasks.find(x => x.id === key) || null;
    const id = key.split(' ')[0];
    return {
      title: `广告计划 ${id} · 详情`,
      html: kvBlock([
        ['计划 ID', id], ['状态', '投放中'], ['出价方式', 'oCPM 双出价'],
        ['目标', '激活 + 次留'], ['日预算', '¥' + fmt(12000)], ['建议', 'ROI 达标，可阶梯放量 20%']
      ]) + `<div class="card-title mt16" style="font-size:13px">近 7 日 CPA / 次留趋势</div>
      <div class="chart-wrap mt8">${Charts.line({
        labels: DATES.slice(-7), height: 170,
        series: [{ name: 'CPA', data: [5.1, 5.0, 4.9, 4.9, 4.8, 4.8, 4.79], color: '#f5a623' }]
      })}</div>
      <div class="filter-row mt16"><button class="btn primary" data-act="toast">调整出价</button><button class="btn" data-act="toast">复制计划</button><button class="btn" data-act="toast">暂停</button></div>`
    };
  },
  push(key) {
    const t = D.pushTasks.find(x => x.id === key);
    if (!t) return null;
    const funnel = [
      { name: '发送量', value: t.send },
      { name: '到达', value: Math.round(t.send * t.arrive / 100) },
      { name: '展示', value: Math.round(t.send * t.arrive / 100 * 0.86) },
      { name: '点击', value: Math.round(t.send * t.arrive / 100 * t.ctr / 100) },
      { name: '回流', value: t.back }
    ];
    return {
      title: `${t.name} · 推送任务详情`,
      html: `
        ${kvBlock([
          ['任务 ID', t.id], ['推送场景', t.scene], ['定向分群', t.seg],
          ['发送时间', t.time], ['频次控制', t.freq], ['负责人', t.owner], ['状态', t.status]
        ])}
        <div class="card-title mt16" style="font-size:13px">文案预览</div>
        <div class="push-preview mt8">
          <div class="pp-app">星河短剧 <span>现在</span></div>
          <div class="pp-title">${t.scene === '追剧断点提醒' ? '《总裁的小娇妻》看到第 8 集' : t.scene === '沉默召回' ? '你追的剧更新了，回来免费看 2 集' : t.name}</div>
          <div class="pp-body">${t.scene === '追剧断点提醒' ? '解锁继续，爽点就在下一集 →' : '点开即看，无需等待'}</div>
        </div>
        <div class="card-title mt16" style="font-size:13px">转化漏斗</div>
        <div class="mt8">${Charts.funnel(funnel, { width: 380 })}</div>
        <div class="card-title mt16" style="font-size:13px">近 7 日点击率趋势</div>
        <div class="chart-wrap mt8">${Charts.line({
          labels: DATES.slice(-7), height: 170,
          series: [{ name: '点击率', data: [t.ctr * .92, t.ctr * .96, t.ctr * 1.02, t.ctr * .98, t.ctr * 1.05, t.ctr * 1.01, t.ctr], color: '#2f6bff' }]
        })}</div>
        <div class="filter-row mt16">
          <button class="btn primary" data-act="new-push">复制并新建任务</button>
          <button class="btn" data-act="toast">查看分群</button>
          <button class="btn" data-act="toast">暂停任务</button>
        </div>`
    };
  },
  scene(key) {
    const s = D.pushScene.find(x => x.scene === key);
    if (!s) return null;
    return {
      title: `${s.icon} ${s.scene} · 场景效果`,
      html: kvBlock([
        ['场景', s.scene], ['发送量', fmt(s.send)], ['到达率', s.arrive + '%'],
        ['点击率', s.ctr + '%'], ['回流率', s.back + '%'],
        ['回流后人均展示', s.imp + ' 次'], ['带来广告收入', money(s.rev)],
        ['单次点击收益', '¥' + (s.rev / (s.send * s.arrive / 100 * s.ctr / 100)).toFixed(3)]
      ]) + `<div class="note mt16"><span>💡</span><div>${s.tip}</div></div>
      <div class="filter-row mt16"><button class="btn primary" data-act="new-push">按此场景创建任务</button></div>`
    };
  },
  prov(key) {
    const p = D.provinces.find(x => x.name === key);
    if (!p) return null;
    return {
      title: `${p.name} · IP 归属详情`,
      html: kvBlock([
        ['省份', p.name], ['用户占比', p.share + '%'], ['DAU', fmt(Math.round(D.summary.dau * p.share / 100))],
        ['eCPM', '¥' + p.ecpm.toFixed(1)], ['ARPU', '¥' + p.arpu.toFixed(2)],
        ['次日留存', p.ret1 + '%'],
        ['主要城市', ['深圳 / 广州', '杭州 / 宁波', '南京 / 苏州', '成都 / 绵阳', '武汉 / 宜昌'][D.provinces.indexOf(p) % 5]],
        ['价值判断', p.ecpm >= 20 ? '高价值地区，可提高 Ad Load' : p.ecpm >= 16 ? '中等，按大盘策略' : '低 eCPM，建议提高激励视频密度']
      ]) + `<div class="card-title mt16" style="font-size:13px">机型档位构成</div>
      <div class="mt8">${Charts.hbar(D.deviceTier.map((t, i) => ({ name: t.name, value: +(t.share * (1.08 - i * 0.03)).toFixed(1), color: Charts.C[4 - i] })), { unit: '%' })}</div>`
    };
  },
  model(key) {
    const m = D.deviceModels.find(x => x.name === key);
    if (!m) return null;
    return {
      title: `${m.name} · 机型详情`,
      html: kvBlock([
        ['机型', m.name], ['档位', m.tier], ['份额', m.share + '%'],
        ['DAU', fmt(Math.round(D.summary.dau * m.share / 100))],
        ['eCPM', '¥' + m.ecpm.toFixed(1)], ['ARPU', '¥' + m.arpu.toFixed(2)],
        ['次日留存', m.ret1 + '%'], ['LTV30', '¥' + m.ltv30.toFixed(2)],
        ['优化建议', m.tier === '¥0-1000' ? '低端机：单独 Waterfall + 性能兜底' : m.share >= 3 ? '主力机型：优先适配与压测' : '常规维护']
      ])
    };
  },
  segment(key) {
    const s = D.segments.find(x => x.id === key);
    if (!s) return null;
    return {
      title: `${s.name} · 分群详情`,
      html: kvBlock([
        ['分群 ID', s.id], ['类型', s.type], ['人数', fmt(s.count) + `（${s.share}%）`],
        ['ARPU', '¥' + s.arpu.toFixed(2)], ['D7 留存', s.ret7 + '%'], ['LTV30', '¥' + s.ltv30.toFixed(2)],
        ['负责人', s.owner], ['更新时间', s.updated], ['状态', s.status]
      ]) + `<div class="card-title mt16" style="font-size:13px">分群规则</div>
      <div class="chips mt8">${s.rules.map(r => `<span class="chip">${r}</span>`).join('')}</div>
      <div class="card-title mt16" style="font-size:13px">可用运营动作</div>
      <div class="filter-row mt8">
        <button class="btn primary" data-act="new-push">Push 文案下发</button>
        <button class="btn" data-act="toast">调整 Ad Load</button>
        <button class="btn" data-act="toast">创建 A/B 实验</button>
        <button class="btn" data-act="toast">导出人群包</button>
      </div>`
    };
  },
  warn(key) {
    const w = D.retentionWarn.find(x => x.obj === key);
    if (!w) return null;
    return {
      title: `${w.obj} · 预警详情`,
      html: kvBlock([
        ['监测对象', w.obj], ['监测指标', w.metric], ['当前值', w.val],
        ['环比', w.delta], ['告警阈值', w.thr], ['状态', w.level === 'red' ? '告警' : '关注'],
        ['建议动作', w.act], ['负责人', '陈昊'], ['触发时间', '2026-10-26 08:00']
      ]) + `<div class="note mt16"><span>⚠️</span><div>该对象已连续 ${w.level === 'red' ? '3' : '2'} 天触及阈值，建议按「${w.act}」处理并 48h 后复查。</div></div>
      <div class="filter-row mt16"><button class="btn primary" data-act="create-seg">创建处置分群</button><button class="btn" data-act="toast">订阅告警</button></div>`
    };
  },
  event(key) {
    if (typeof openDrawer === 'function') { openDrawer(key); return { silent: true }; }
    return null;
  }
};

function kvBlock(pairs) {
  return `<div class="desc-list">${pairs.map(p => `<div class="k">${p[0]}</div><div>${p[1]}</div>`).join('')}</div>`;
}
window.kvBlock = kvBlock;

function bindRows() {
  document.querySelectorAll('#view [data-row]').forEach(tr => {
    if (tr.dataset.bound) return;
    tr.dataset.bound = '1';
    tr.classList.add('row-btn');
    tr.addEventListener('click', e => {
      if (e.target.closest('.btn')) return;
      const [type, key] = tr.dataset.row.split(':');
      const fn = ROW_DRAWERS[type];
      if (!fn) return;
      const r = fn(key);
      if (r && !r.silent) openDrawerHTML(r.title, r.html);
    });
  });
}

/* ===========================================================
   抽屉内按钮（data-act）
   =========================================================== */
function bindDrawerActs() {
  document.querySelectorAll('#drawerBody [data-act]').forEach(b => {
    if (b.dataset.bound) return;
    b.dataset.bound = '1';
    b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'new-push') return runAct('newPush', b, b.textContent.trim());
      if (a === 'create-seg') return runAct('newSegment', b, b.textContent.trim());
      Toast(`已触发：${b.textContent.trim()}`);
    });
  });
}

/* ===========================================================
   入口
   =========================================================== */
function bindUI() {
  makeSortable();
  bindSegs();
  bindSelects();
  bindButtons();
  bindRows();
  bindDrawerActs();
  /* KPI 卡点击：显示口径 */
  document.querySelectorAll('#view .kpi, #view .mini-kpi').forEach(k => {
    if (k.dataset.bound) return;
    k.dataset.bound = '1';
    k.classList.add('kpi-btn');
    k.addEventListener('click', () => {
      const l = (k.querySelector('.label, .l') || {}).textContent || '';
      const t = (k.querySelector('.help') || {}).title;
      if (k.dataset.rtab) { try { recallTab = k.dataset.rtab; } catch (e) { } }
      if (k.dataset.goto && VIEWS[k.dataset.goto]) { go(k.dataset.goto); return; }
      Toast(`指标口径 · ${l.replace(/\?/g, '').trim()}${t ? '：' + t : ''}`);
    });
  });
  /* 事件树 / 分群列表等条目：hover 已由 CSS 处理 */
}
window.bindUI = bindUI;

/* ---------- 全局快捷键 & 遮罩 ---------- */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('modalMask').classList.contains('show')) return Modal.close();
    if (typeof closeDrawer === 'function') closeDrawer();
  }
});
document.getElementById('modalMask').addEventListener('click', e => {
  if (e.target.id === 'modalMask') Modal.close();
});
document.getElementById('modalCancel').addEventListener('click', () => Modal.close());
document.getElementById('modalCancel2').addEventListener('click', () => Modal.close());
document.getElementById('mask').addEventListener('click', () => { if (typeof closeDrawer === 'function') closeDrawer(); });

/* ---------- 启动 ---------- */
renderNav();
go('overview');
