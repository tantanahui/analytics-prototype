/* ===========================================================
   11. 召回与触达
   通知权限授权 · Push 触达 · 桌面快捷方式与组件 · 回流归因
   =========================================================== */
let recallTab = 'notify';
let notifyDim = 'channel';

const pctf = v => (+v).toFixed(1) + '%';

/* ---------- 共用：KPI 头部 ---------- */
function recallKpi() {
  const k = [
    ['通知授权率', '58.8', '%', 'up', '▲ 4.2pt', '较上周 · 可触达池 486,200 人', 'notify'],
    ['Push 日均触达', '114.8', '万', 'up', '▲ 6.2%', '到达率 91.4%', 'push'],
    ['Push 点击率', '6.5', '%', 'down', '▼ 0.2pt', '行业均值 8% · 待优化', 'push'],
    ['日均 Push 回流', '61,800', '人', 'up', '▲ 8.4%', '占次日回访 32.4%', 'effect'],
    ['桌面组件覆盖', '42,800', '人', 'up', '▲ 12.6%', '点击率 17.7% · D7 41.6%', 'desktop'],
    ['桌面快捷方式', '52,400', '人', 'up', '▲ 9.8%', 'Android 添加率 8.6%', 'desktop']
  ];
  return `<div class="grid" style="grid-template-columns:repeat(6,1fr);gap:12px">` + k.map(x => `
    <div class="kpi" data-goto="recall" data-rtab="${x[6]}">
      <div class="label">${x[0]}</div>
      <div class="value" style="font-size:22px">${x[1]}<span class="unit">${x[2]}</span></div>
      <div class="delta"><span class="${x[3]}">${x[4]}</span></div>
      <div class="delta"><span class="cmp" style="font-size:11px">${x[5]}</span></div>
    </div>`).join('') + `</div>`;
}

/* ===========================================================
   Tab 1 · 通知权限授权
   =========================================================== */
function notifyBody() {
  const f = D.notifyFunnel;
  const endRate = f[f.length - 1].value / f[0].value * 100;

  const lossRows = D.notifyLoss.map(l => `<tr>
    <td><span class="name">${l.name}</span></td>
    <td class="num">${fmt(l.value)}</td>
    <td class="num">${pct(l.value, 106000)}</td>
    <td class="num">${pct(l.value, 257200)}</td>
    <td><div class="bar-cell"><div class="mini-bar" style="width:${(l.value / 62400 * 80).toFixed(0)}px;background:${l.color}"></div></div></td>
  </tr>`).join('');

  const sceneRows = D.notifyScene.map(s => `<tr class="${s.allow >= 70 ? 'hl-row' : ''}">
    <td><span class="name">${s.scene}</span>${s.allow >= 70 ? `<span class="tag green" style="margin-left:6px">推荐</span>` : ''}</td>
    <td class="num">${fmt(s.exp)}</td>
    <td class="num ${s.allow >= 70 ? 'down' : s.allow < 45 ? 'up' : ''}"><b>${s.allow}%</b></td>
    <td class="num">${s.sys}%</td>
    <td class="num">${fmt(Math.round(s.exp * s.sys / 100))}</td>
    <td class="muted">${s.note}</td>
    <td><button class="btn sm">设为默认</button></td>
  </tr>`).join('');

  const trend = Charts.line({
    labels: D.notifyTrend.labels, height: 260, area: true,
    yFormat: v => v + '%',
    series: [
      { name: '通知授权率', data: D.notifyTrend.authRate, color: '#2f6bff' },
      { name: 'Push 到达率', data: D.notifyTrend.arriveRate, color: '#17b26a' },
      { name: 'Push 点击率', data: D.notifyTrend.ctr, color: '#f5a623' }
    ]
  });

  const DIM = {
    os: { t: '操作系统', list: D.notifyByOs },
    tier: { t: '机型档位', list: D.notifyByTier },
    channel: { t: '归因渠道', list: D.notifyByChannel }
  };
  const dim = DIM[notifyDim];
  const dimTabs = Object.keys(DIM).map(k =>
    `<button class="${k === notifyDim ? 'active' : ''}" data-ndim="${k}">${DIM[k].t}</button>`).join('');
  const dimRows = dim.list.map(x => `<tr data-row="${notifyDim === 'tier' ? 'tier' : notifyDim === 'channel' ? 'channel' : 'none'}:${x.name}">
    <td><span class="name">${x.name}</span></td>
    <td class="num">${x.share}%</td>
    <td class="num ${x.auth >= 60 ? 'down' : x.auth < 52 ? 'up' : ''}"><b>${x.auth}%</b></td>
    <td class="num">${x.arrive}%</td>
    <td class="num">${x.ctr}%</td>
    <td class="num">${fmt(Math.round(D.summary.dau * x.share / 100 * x.auth / 100))}</td>
    <td><div class="bar-cell"><div class="mini-bar" style="width:${(x.auth * 1.1).toFixed(0)}px;background:${x.auth >= 60 ? '#17b26a' : x.auth >= 52 ? '#f5a623' : '#f54a45'}"></div></div></td>
  </tr>`).join('');

  return `
    <div class="grid g-1-2">
      <div class="card">
        <div class="card-head"><div class="card-title">通知授权漏斗<small>近 30 日新装用户</small></div></div>
        <div class="card-body">
          ${Charts.funnel(f, { width: 300 })}
          <div class="mt12" style="text-align:center;color:#8f959e;font-size:12px">
            端到端「新装 → Push 回流」转化率 <b class="up">${endRate.toFixed(2)}%</b>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">未授权原因构成<small>合计 106,000 人 · 占新装 41.2%</small></div>
          <div class="right"><button class="btn sm">下钻到分群</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>原因</th><th class="num">人数</th><th class="num">占未授权</th><th class="num">占新装</th><th>分布</th></tr></thead>
          <tbody>${lossRows}</tbody></table></div>
        <div class="card-body tight">
          <div class="note"><span>💡</span><div>「主动拒绝」62,400 人是最大损失来源（58.9%），其根因是<b>弹窗时机太早</b>——首启弹窗授权率仅 42.1%，而首次解锁成功后弹窗达 78.4%。把弹窗时机后移是投入最小、收益最大的改动。</div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><div class="card-title">授权弹窗时机对比<small>决定 41.2% 用户能否被触达</small></div>
        <div class="right"><button class="btn sm">查看 A/B 实验</button><button class="btn sm primary">一键应用最优策略</button></div></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>触发时机</th><th class="num">弹窗曝光</th><th class="num">点击允许率</th><th class="num">系统层授权率</th><th class="num">授权人数</th><th>结论</th><th></th></tr></thead>
        <tbody>${sceneRows}</tbody></table></div>
    </div>

    <div class="card">
      <div class="card-head"><div class="card-title">授权率 / 到达率 / 点击率 趋势<small>近 14 天</small></div>
        <div class="right"><div class="seg"><button class="active">按日</button><button>按周</button></div><button class="btn sm">下载 CSV</button></div></div>
      <div class="card-body">
        <div class="chart-wrap">${trend}</div>
        <div class="legend">
          <span><i style="background:#2f6bff"></i>通知授权率</span>
          <span><i style="background:#17b26a"></i>Push 到达率</span>
          <span><i style="background:#f5a623"></i>Push 点击率</span>
        </div>
        <div class="note mt12"><span>💡</span><div>授权率 14 天提升 6.7pt（52.1% → 58.8%），主要来自「解锁后弹窗」策略全量；点击率同期仅 +0.7pt，说明<b>可触达池已扩大但内容没跟上</b>，下一步重点是 Push 文案与场景化。</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><div class="card-title">授权率分布<small>哪些人群更难拿到通知权限</small></div>
        <div class="right"><div class="seg" id="ndimSeg">${dimTabs}</div><button class="btn sm">创建分群</button></div></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>${dim.t}</th><th class="num">用户占比</th><th class="num">授权率</th><th class="num">到达率</th><th class="num">点击率</th><th class="num">可触达人数</th><th>授权率分布</th></tr></thead>
        <tbody>${dimRows}</tbody></table></div>
      <div class="card-body tight">
        ${Charts.hbar(dim.list.map(x => ({ name: x.name, value: x.auth, color: x.auth >= 60 ? '#17b26a' : x.auth >= 52 ? '#f5a623' : '#f54a45', extra: `点击率 ${x.ctr}%` })), { unit: '%', max: 80 })}
        <div class="note mt12"><span>💡</span><div>百度信息流（48.4%）、知乎微博（44.2%）等泛人群渠道授权率显著偏低，这类用户对 App 认知弱；建议在首批 Push 前插入「先给 2 集免费」的价值前置流程。</div></div>
      </div>
    </div>`;
}

/* ===========================================================
   Tab 2 · Push 触达
   =========================================================== */
function pushBody() {
  const sceneRows = D.pushScene.map(s => `<tr data-row="scene:${s.scene}">
    <td><span class="name">${s.icon} ${s.scene}</span></td>
    <td class="num">${fmt(s.send)}</td>
    <td class="num">${s.arrive}%</td>
    <td class="num ${s.ctr >= 8 ? 'down' : s.ctr < 5 ? 'up' : ''}"><b>${s.ctr}%</b></td>
    <td class="num">${s.back}%</td>
    <td class="num">${s.imp}</td>
    <td class="num">${money(s.rev)}</td>
    <td class="num">¥${(s.rev / (s.send * s.arrive / 100 * s.ctr / 100)).toFixed(3)}</td>
    <td class="muted">${s.tip}</td>
  </tr>`).join('');

  const hourChart = Charts.bar({
    labels: D.pushHour.labels, height: 220,
    series: [
      { name: '点击率', data: D.pushHour.ctr, color: '#2f6bff' },
      { name: '回流率', data: D.pushHour.back, color: '#17b26a' }
    ]
  });

  const taskRows = D.pushTasks.map(t => `<tr data-row="push:${t.id}">
    <td><span class="name">${t.name}</span><div class="sub code">${t.id} · ${t.owner}</div></td>
    <td>${t.scene}</td>
    <td class="muted">${t.seg}</td>
    <td class="num">${fmt(t.send)}</td>
    <td class="num">${t.arrive}%</td>
    <td class="num ${t.ctr >= 10 ? 'down' : t.ctr < 4 ? 'up' : ''}"><b>${t.ctr}%</b></td>
    <td class="num">${fmt(t.back)}</td>
    <td class="num">${money(t.rev)}</td>
    <td><span class="tag ${t.status === '运行中' ? 'green' : t.status === '实验中' ? 'purple' : t.status === '观察中' ? 'orange' : ''}">${t.status}</span></td>
    <td class="muted">${t.time}</td>
  </tr>`).join('');

  return `
    <div class="card">
      <div class="card-head"><div class="card-title">推送场景效果对比<small>点击率决定回流体量，回流后的广告行为决定收入</small></div>
        <div class="right"><button class="btn sm">导出</button><button class="btn sm primary">+ 新建推送任务</button></div></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr>
          <th>推送场景</th><th class="num">发送量</th><th class="num">到达率</th><th class="num">点击率</th>
          <th class="num">回流率</th><th class="num">人均展示</th><th class="num">带来收入</th>
          <th class="num">单次点击收益</th><th>优化建议</th>
        </tr></thead><tbody>${sceneRows}</tbody></table></div>
      <div class="card-body tight">
        <div class="note"><span>💡</span><div>「追剧断点提醒」CTR 11.2%、回流率 82.4%，是唯一同时做到高点击 + 高留存的场景，应把 60% 以上的推送配额分配给它；「签到/做任务」CTR 仅 4.6% 且收益递减，建议降频到每周 2 次。</div></div>
      </div>
    </div>

    <div class="grid g2">
      <div class="card">
        <div class="card-head"><div class="card-title">分时点击率<small>20-21 点为黄金时段</small></div></div>
        <div class="card-body">
          <div class="chart-wrap">${hourChart}</div>
          <div class="legend"><span><i style="background:#2f6bff"></i>点击率</span><span><i style="background:#17b26a"></i>回流率</span></div>
          <div class="note mt12"><span>💡</span><div>20:00-21:00 CTR 9.1%（全天最高，是凌晨的 11 倍），建议把自动任务集中在 20:00 发送，凌晨 00:00-06:00 停止发送（CTR &lt; 1.2% 且影响卸载率）。</div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">推送通道质量<small>厂商通道决定到达率</small></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>通道</th><th class="num">占比</th><th class="num">到达率</th><th class="num">点击率</th><th>状态</th></tr></thead>
          <tbody>
            <tr data-row="none:x"><td><span class="name">小米推送</span></td><td class="num">18.6%</td><td class="num down">96.2%</td><td class="num">7.8%</td><td><span class="tag green">正常</span></td></tr>
            <tr data-row="none:x"><td><span class="name">华为推送</span></td><td class="num">16.4%</td><td class="num down">95.4%</td><td class="num">7.4%</td><td><span class="tag green">正常</span></td></tr>
            <tr data-row="none:x"><td><span class="name">APNs（iOS）</span></td><td class="num">39.6%</td><td class="num down">94.2%</td><td class="num">7.1%</td><td><span class="tag green">正常</span></td></tr>
            <tr data-row="none:x"><td><span class="name">OPPO / vivo / 荣耀</span></td><td class="num">21.8%</td><td class="num">88.6%</td><td class="num">6.2%</td><td><span class="tag orange">配额受限</span></td></tr>
            <tr data-row="none:x"><td><span class="name">自建长连接</span></td><td class="num">3.6%</td><td class="num up">62.4%</td><td class="num">5.4%</td><td><span class="tag red">进程被杀</span></td></tr>
          </tbody></table></div>
        <div class="card-body tight">
          <div class="note"><span>💡</span><div>自建长连接到达率仅 62.4%，是拉低整体到达率的主因；应按机型厂商接入对应 push 通道，预计整体到达率可从 91.4% 提升至 95%+（+4.2 万人/日触达）。</div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><div class="card-title">Push 任务列表<small>点击任意任务查看转化漏斗与文案预览</small></div>
        <div class="right"><button class="btn sm">批量暂停</button><button class="btn sm">导出</button><button class="btn sm primary">+ 新建任务</button></div></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr>
          <th>任务</th><th>场景</th><th>定向分群</th><th class="num">发送量</th><th class="num">到达率</th>
          <th class="num">点击率</th><th class="num">回流人数</th><th class="num">带来收入</th><th>状态</th><th>发送时间</th>
        </tr></thead><tbody>${taskRows}</tbody></table></div>
    </div>`;
}

/* ===========================================================
   Tab 3 · 桌面快捷方式 / 桌面组件
   =========================================================== */
function desktopBody() {
  const sc = D.shortcut, wg = D.widget;

  const scSceneRows = sc.byScene.map(s => `<tr>
    <td><span class="name">${s.name}</span></td>
    <td class="num">${fmt(s.exp)}</td>
    <td class="num ${s.click >= 38 ? 'down' : 'up'}">${s.click}%</td>
    <td class="num"><b>${s.ok}%</b></td>
    <td class="num">${fmt(Math.round(s.exp * s.ok / 100))}</td>
    <td><div class="bar-cell"><div class="mini-bar" style="width:${(s.ok * 2).toFixed(0)}px;background:#17b26a"></div></div></td>
  </tr>`).join('');

  const wgTypeRows = wg.types.map(t => `<tr>
    <td><span class="name">${t.name}</span></td>
    <td class="num">${t.add}%</td>
    <td class="num">${t.exp}%</td>
    <td class="num ${t.ctr >= 18 ? 'down' : ''}"><b>${t.ctr}%</b></td>
    <td class="num">${t.back}%</td>
  </tr>`).join('');

  const liftRows = [
    ['已添加桌面组件', wg.lift],
    ['已添加桌面快捷方式', sc.lift]
  ].map(x => {
    const l = x[1];
    return `<tr>
      <td><span class="name">${x[0]}</span></td>
      <td class="num down"><b>${l.ret7}%</b><span class="muted"> / ${l.ret7Base}%</span></td>
      <td class="num down">¥${l.arpu.toFixed(2)}<span class="muted"> / ¥${l.arpuBase.toFixed(2)}</span></td>
      <td class="num down">${l.imp}<span class="muted"> / ${l.impBase}</span></td>
      <td class="num down">¥${l.ltv30.toFixed(2)}<span class="muted"> / ¥${l.ltv30Base.toFixed(2)}</span></td>
      <td class="num up">+${(l.ret7 - l.ret7Base).toFixed(1)}pt</td>
    </tr>`;
  }).join('');

  return `
    <div class="grid g2">
      <div class="card">
        <div class="card-head"><div class="card-title">桌面快捷方式 · 添加漏斗<small>不依赖 Push 授权的被动回流</small></div>
          <div class="right"><button class="btn sm">创建分群</button></div></div>
        <div class="card-body">
          ${Charts.funnel(sc.funnel, { width: 320 })}
          <div class="tbl-wrap mt12"><table class="tbl">
            <thead><tr><th>引导时机</th><th class="num">曝光</th><th class="num">点击率</th><th class="num">添加成功率</th><th class="num">添加人数</th><th>效果</th></tr></thead>
            <tbody>${scSceneRows}</tbody></table></div>
          <div class="tbl-wrap mt12"><table class="tbl">
            <thead><tr><th>系统</th><th class="num">覆盖率</th><th class="num">快捷启动次数/日</th><th class="num">添加成功率</th></tr></thead>
            <tbody>${sc.byOs.map(o => `<tr><td><span class="name">${o.name}</span></td><td class="num">${o.cov}%</td><td class="num">${fmt(o.launch)}</td><td class="num">${o.ok}%</td></tr>`).join('')}</tbody></table></div>
          <div class="note mt12"><span>💡</span><div>Android 可直接添加桌面图标（成功率 76.8%），iOS 只能引导添加「快捷指令」（41.2%）。应对 iOS 用户主推桌面组件，对 Android 用户主推桌面图标。</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">桌面组件 · 覆盖与唤醒<small>点击率 17.7% · 远高于 Push 的 6.5%</small></div>
          <div class="right"><button class="btn sm">组件配置</button></div></div>
        <div class="card-body">
          <div class="grid g3" style="gap:12px">
            <div class="mini-kpi"><div class="l">添加用户</div><div class="v">${fmt(42800)}</div><div class="s">占 DAU 5.2%</div></div>
            <div class="mini-kpi"><div class="l">日均曝光</div><div class="v">${fmt(386400)}</div><div class="s">人均 9.0 次/日</div></div>
            <div class="mini-kpi"><div class="l">日均点击</div><div class="v">${fmt(68400)}</div><div class="s">点击率 17.7%</div></div>
          </div>
          ${Charts.funnel(wg.funnel, { width: 320 })}
          <div class="tbl-wrap mt12"><table class="tbl">
            <thead><tr><th>组件类型</th><th class="num">添加占比</th><th class="num">曝光占比</th><th class="num">点击率</th><th class="num">唤起占比</th></tr></thead>
            <tbody>${wgTypeRows}</tbody></table></div>
          <div class="tbl-wrap mt12"><table class="tbl">
            <thead><tr><th>系统</th><th class="num">渗透率</th><th class="num">添加量</th><th class="num">人均日曝光</th><th class="num">点击率</th></tr></thead>
            <tbody>${wg.byOs.map(o => `<tr><td><span class="name">${o.name}</span></td><td class="num">${o.cov}%</td><td class="num">${fmt(o.add)}</td><td class="num">${o.expPerDay}</td><td class="num">${o.ctr}%</td></tr>`).join('')}</tbody></table></div>
          <div class="note mt12"><span>💡</span><div>「追剧进度 2×2」是主力组件：点击率 21.4%、贡献 62.4% 唤起。组件上直接展示「第 9 集 · 看广告解锁」并给一键续播按钮，点击后可直达播放器，省掉选剧路径。</div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><div class="card-title">桌面入口的价值提升<small>对比大盘基线（斜杠后为基线值）</small></div>
        <div class="right"><button class="btn sm">导出</button><button class="btn sm primary">+ 创建引导任务</button></div></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>人群</th><th class="num">D7 留存</th><th class="num">ARPU</th><th class="num">人均日展示</th><th class="num">LTV30</th><th class="num">留存提升</th></tr></thead>
        <tbody>${liftRows}</tbody></table></div>
      <div class="card-body tight">
        <div class="note"><span>💡</span><div>组件用户 D7 留存 41.6%、LTV30 ¥8.14，是大盘（19.2% / ¥4.58）的 <b class="up">2.2 倍 / 1.8 倍</b>。按当前 42,800 覆盖量测算，渗透率每提升 1pt（约 8,300 人），年化广告收入增量约 <b class="up">¥108 万</b>。</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><div class="card-title">三层回流通路协同<small>通知授权 → 组件 → 快捷方式，逐层兜底</small></div></div>
      <div class="card-body">
        <div class="rel-chain" style="gap:8px">
          <span class="chain-node">新装用户 257,200</span>
          <span class="rel-arrow"><i>58.8%</i>→</span>
          <span class="chain-node">Push 可触达 151,200</span>
          <span class="rel-arrow"><i>+5.2%</i>→</span>
          <span class="chain-node">叠加桌面组件 194,000</span>
          <span class="rel-arrow"><i>+6.3%</i>→</span>
          <span class="chain-node">叠加桌面图标 246,400</span>
          <span class="rel-arrow">→</span>
          <span class="chain-node">实际可召回池</span>
        </div>
        <div class="grid g4 mt16">
          <div class="mini-kpi"><div class="l">第一层 · Push</div><div class="v">58.8<span class="unit">%</span></div><div class="s">主动触达，需授权</div></div>
          <div class="mini-kpi"><div class="l">第二层 · 桌面组件</div><div class="v">5.2<span class="unit">%</span></div><div class="s">被动曝光，无需授权</div></div>
          <div class="mini-kpi"><div class="l">第三层 · 桌面图标</div><div class="v">6.3<span class="unit">%</span></div><div class="s">习惯性启动</div></div>
          <div class="mini-kpi"><div class="l">短信 / 站外兜底</div><div class="v">1.4<span class="unit">%</span></div><div class="s">仅用于深度沉默用户</div></div>
        </div>
        <div class="note mt12"><span>💡</span><div>对未授权 Push 的 106,000 名新装用户，<b>桌面组件 + 快捷方式是唯一可持续的召回通路</b>。建议在「首次解锁成功」这一高意愿时刻，同时完成通知授权弹窗与组件/图标引导，一次弹窗拿两条通路。</div></div>
      </div>
    </div>`;
}

/* ===========================================================
   Tab 4 · 召回效果归因
   =========================================================== */
function effectBody() {
  const chRows = D.recallChannels.map(c => `<tr>
    <td><span class="name">${c.icon} ${c.name}</span></td>
    <td class="num">${fmt(c.reach)}</td>
    <td class="num">${c.rate1}%</td>
    <td class="num ${c.rate2 >= 20 ? 'down' : c.rate2 < 5 ? 'up' : ''}"><b>${c.rate2}%</b></td>
    <td class="num">${fmt(c.back)}</td>
    <td class="num">${c.share}%</td>
    <td class="num">${c.cost ? '¥' + c.cost : '免费'}</td>
    <td class="num">¥${c.arpu.toFixed(2)}</td>
    <td class="num">${c.imp}</td>
    <td><span class="tag ${c.tag === '主力' ? 'blue' : c.tag === '免费·高质' ? 'green' : c.tag === '付费' ? 'orange' : ''}">${c.tag}</span></td>
  </tr>`).join('');

  const liftRows = D.recallLift.map(l => `<tr>
    <td><span class="name"><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${l.color};margin-right:6px"></i>${l.name}</span></td>
    <td class="num">${fmt(l.dau)}</td>
    <td class="num">${l.ret1}%</td>
    <td class="num ${l.ret7 >= 30 ? 'down' : 'up'}"><b>${l.ret7}%</b></td>
    <td class="num">${l.ret30}%</td>
    <td class="num">${l.imp}</td>
    <td class="num">¥${l.arpu.toFixed(2)}</td>
    <td class="num"><b>¥${l.ltv30.toFixed(2)}</b></td>
    <td class="num">${l.days}</td>
  </tr>`).join('');

  const cmp = Charts.bar({
    labels: ['次日留存', '7 日留存', '30 日留存'], height: 230,
    yFormat: v => v + '%',
    series: [
      { name: '通知已授权', data: [46.8, 26.4, 13.8], color: '#2f6bff' },
      { name: '未授权 / 已关闭', data: [22.4, 8.2, 3.6], color: '#f54a45' },
      { name: '已添加桌面组件', data: [58.6, 41.6, 23.4], color: '#7a4ddd' }
    ]
  });

  const abCards = D.recallAB.map(a => `
    <div class="ab-card">
      <div class="ab-head"><span class="ab-name">${a.name}</span><span class="tag ${a.res === '已全量' ? 'green' : 'purple'}">${a.res}</span></div>
      <div class="ab-body">
        <div class="ab-side">
          <div class="ab-lb">对照组 A</div><div class="ab-tx">${a.a}</div><div class="ab-v">${a.av}</div>
        </div>
        <div class="ab-mid"><span class="ab-metric">${a.metric}</span><span class="ab-lift up">${a.lift}</span></div>
        <div class="ab-side win">
          <div class="ab-lb">实验组 B · 胜出</div><div class="ab-tx">${a.b}</div><div class="ab-v up">${a.bv}</div>
        </div>
      </div>
      <div class="ab-note">${a.note}</div>
    </div>`).join('');

  const actRows = D.recallActions.map(a => `<tr class="hl-row">
    <td><span class="name">${a.t}</span></td>
    <td><span class="tag ${a.lv === 'red' ? 'red' : 'orange'}">${a.lv === 'red' ? '高优先级' : '中优先级'}</span></td>
    <td class="muted">${a.d}</td>
    <td class="num down"><b>${a.g}</b></td>
    <td>${a.owner}</td>
    <td><button class="btn sm">创建分群</button><button class="btn sm">下发任务</button></td>
  </tr>`).join('');

  return `
    <div class="card">
      <div class="card-head"><div class="card-title">召回渠道效果对比<small>日均口径 · 按回流人次排序</small></div>
        <div class="right"><button class="btn sm">导出</button><button class="btn sm">配置归因窗口</button></div></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr>
          <th>召回渠道</th><th class="num">触达量</th><th class="num">到达 / 曝光率</th><th class="num">点击 / 唤起率</th>
          <th class="num">回流人数</th><th class="num">占次日回访</th><th class="num">单次成本</th>
          <th class="num">回流用户 ARPU</th><th class="num">人均日展示</th><th>定位</th>
        </tr></thead><tbody>${chRows}</tbody></table></div>
      <div class="card-body tight">
        <div class="note"><span>💡</span><div>Push 与桌面入口合计贡献 61.0% 的次日回访，且<b>零边际成本</b>；广告再营销单次成本 ¥1.86 而回流用户 ARPU 仅 ¥0.42，需 4.4 天才能回本，建议只用于高价值流失用户。</div></div>
      </div>
    </div>

    <div class="grid g-1-2">
      <div class="card">
        <div class="card-head"><div class="card-title">沉默用户召回漏斗<small>7 日未活跃 428,600 人</small></div></div>
        <div class="card-body">
          ${Charts.funnel(D.recallFunnel, { width: 300 })}
          <div class="note mt12"><span>💡</span><div>33.2% 的沉默用户因<b>未授权 Push</b> 完全无法触达（142,200 人）。这批人只能靠桌面组件 / 短信覆盖，是「可触达池」的最大缺口。</div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">可触达状态 × 用户价值<small>授权与否造成的价值断层</small></div></div>
        <div class="card-body">
          <div class="chart-wrap">${cmp}</div>
          <div class="legend">
            <span><i style="background:#2f6bff"></i>通知已授权</span>
            <span><i style="background:#f54a45"></i>未授权 / 已关闭</span>
            <span><i style="background:#7a4ddd"></i>已添加桌面组件</span>
          </div>
          <div class="tbl-wrap mt12"><table class="tbl">
            <thead><tr><th>人群</th><th class="num">DAU</th><th class="num">次留</th><th class="num">7 日留存</th><th class="num">30 日留存</th><th class="num">人均日展示</th><th class="num">ARPU</th><th class="num">LTV30</th><th class="num">月活跃天数</th></tr></thead>
            <tbody>${liftRows}</tbody></table></div>
          <div class="note mt12"><span>💡</span><div>授权用户 LTV30 ¥6.42，未授权用户仅 ¥2.18，<b class="up">相差 2.9 倍</b>。按当前 340,200 未授权用户测算，授权率每提升 1pt（约 8,264 人），LTV 增量约 <b class="up">¥35,000</b>——这是留存优化里单位成本最低的动作。</div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><div class="card-title">触达策略 A/B 实验<small>点击卡片查看完整实验配置</small></div>
        <div class="right"><button class="btn sm">实验平台</button><button class="btn sm primary">+ 新建实验</button></div></div>
      <div class="card-body"><div class="grid g2">${abCards}</div></div>
    </div>

    <div class="card">
      <div class="card-head"><div class="card-title">行动建议<small>按优先级排序 · 附收益测算</small></div>
        <div class="right"><button class="btn sm">导出</button><button class="btn sm primary">一键创建任务</button></div></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>问题</th><th>优先级</th><th>建议动作</th><th class="num">预期收益</th><th>负责人</th><th></th></tr></thead>
        <tbody>${actRows}</tbody></table></div>
    </div>`;
}

/* ===========================================================
   视图主体
   =========================================================== */
VIEWS.recall = {
  render() {
    $('#topfilters').innerHTML = topFilters(`
      <select class="select"><option>全部用户</option><option>新用户</option><option>已授权用户</option><option>沉默用户（7 日）</option></select>`);

    const tabs = [
      ['notify', '通知权限授权'], ['push', 'Push 触达'],
      ['desktop', '桌面快捷方式 / 组件'], ['effect', '召回效果归因']
    ].map(t => `<button class="${recallTab === t[0] ? 'active' : ''}" data-ntab="${t[0]}">${t[1]}</button>`).join('');

    return `
      <div class="card">
        <div class="card-head">
          <div class="card-title">用户回流体系总览<small>通知授权 → Push / 组件 / 快捷方式 → 回流变现 · ${RANGE_TEXT[GS.range]}</small></div>
          <div class="right"><div class="seg" id="recallSeg">${tabs}</div><button class="btn sm primary">+ 新建触达任务</button></div>
        </div>
        <div class="card-body">${recallKpi()}</div>
      </div>

      ${recallTab === 'notify' ? notifyBody() : recallTab === 'push' ? pushBody() : recallTab === 'desktop' ? desktopBody() : effectBody()}`;
  },
  after() {
    document.querySelectorAll('[data-ntab]').forEach(b => {
      b.addEventListener('click', () => { recallTab = b.dataset.ntab; go('recall'); });
    });
    document.querySelectorAll('[data-ndim]').forEach(b => {
      b.addEventListener('click', () => { notifyDim = b.dataset.ndim; go('recall'); });
    });
  }
};
