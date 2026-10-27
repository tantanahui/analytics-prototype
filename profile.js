/* ===============================
   9. 用户画像（机型 / IP 归属 / 网络 / 价值分层）
   10. 用户分群（规则圈选 + 人群运营）
   =============================== */
let selSeg = 'sg_001';
let segDraft = { mode: 'AND', conds: ['近 7 日 AdRewarded 次数 ≥ 5'] };

const COND_POOL = [
  { t: '行为', label: '近 7 日 AdRewarded 次数 ≥ 5', w: .151 },
  { t: '行为', label: '近 7 日 UnlockSuccess 次数 ≥ 3', w: .186 },
  { t: '行为', label: '近 7 日 EpisodeFinish 次数 ≥ 20', w: .164 },
  { t: '行为', label: '近 7 日 活跃天数 ≥ 5', w: .226 },
  { t: '行为', label: '近 7 日 UnlockPopupShow ≥ 3 且未解锁', w: .117 },
  { t: '行为', label: '当日 AdError(no_fill) ≥ 3', w: .078 },
  { t: '行为', label: '首日 EpisodeFinish ≤ 1', w: .195 },
  { t: '属性', label: 'device_tier = ¥0-1000', w: .264 },
  { t: '属性', label: 'device_tier ≥ ¥3000', w: .238 },
  { t: '属性', label: 'city_tier ∈ 一线 / 新一线', w: .368 },
  { t: '属性', label: 'login_status = 游客', w: .827 },
  { t: '属性', label: 'NotificationEnable = 已开启', w: .588 },
  { t: '属性', label: 'channel = 巨量引擎', w: .346 },
  { t: '属性', label: 'network_type = 弱网 / 4G', w: .130 },
  { t: '属性', label: 'os_version ≤ Android 11', w: .126 }
];

function dauOf(share) { return Math.round(D.summary.dau * share / 100); }

/* ===============================
   9. 用户画像
   =============================== */
VIEWS.profile = {
  render() {
    $('#topfilters').innerHTML = topFilters(`
      <select class="select"><option>全部用户</option><option>新用户</option><option>老用户</option><option>Push 可触达</option></select>
      <button class="btn ghost">口径：DAU 去重</button>`);

    const kpi = [
      ['活跃用户 DAU', fmt(D.summary.dau), '', '当日触发 AppStart 的去重用户', '#2f6bff'],
      ['主力机型档位', '¥1000-2000', '28.6% 占比', '中低端机是量主体，但 eCPM 仅 ¥15.2', '#f5a623'],
      ['一线+新一线占比', '36.8', '%', '贡献 44.2% 广告收入', '#17b26a'],
      ['游客未登录占比', '82.7', '%', 'D7 留存低于登录用户 18.6pt', '#eb2f96'],
      ['Push 可触达占比', '58.8', '%', '通知权限已授权，召回主阵地', '#7a4ddd'],
      ['机型平均 eCPM 极差', '2.6', '倍', '¥0-1000 档 ¥11.8 vs ¥5000+ 档 ¥30.2', '#00b8d9']
    ].map(k => `<div class="kpi">
      <div class="label">${k[0]}</div>
      <div class="value">${k[1]}${k[2] ? `<span class="unit">${k[2]}</span>` : ''}</div>
      <div class="delta"><span class="cmp">${k[3]}</span></div>
    </div>`).join('');

    /* 机型档位 */
    const tierRows = D.deviceTier.map((t, i) => `<tr>
      <td><span class="name">${t.name}</span></td>
      <td class="num">${t.share}%</td>
      <td class="num">${fmt(dauOf(t.share))}</td>
      <td class="num ${t.fill >= 95 ? 'down' : t.fill < 90 ? 'up' : ''}">${t.fill}%</td>
      <td class="num"><b>¥${t.ecpm.toFixed(1)}</b></td>
      <td class="num">¥${t.arpu.toFixed(2)}</td>
      <td class="num">${t.ret1}%</td>
      <td class="num">${t.ret7}%</td>
      <td class="num">¥${t.ltv30.toFixed(2)}</td>
      <td class="num ${t.crash >= 1.5 ? 'up' : ''}">${t.crash}%</td>
      <td><div class="bar-cell"><div class="mini-bar" style="width:${(t.ltv30 * 12).toFixed(0)}px;background:${Charts.C[4 - i]}"></div></div></td>
    </tr>`).join('');

    const tierBars = D.deviceTier.map((t, i) => ({
      name: t.name, value: t.share, color: Charts.C[4 - i], extra: `eCPM ¥${t.ecpm}`
    }));

    /* 机型 TOP */
    const modelRows = D.deviceModels.map(m => `<tr data-row="model:${m.name}">
      <td><span class="name">${m.name}</span></td>
      <td><span class="tag ${m.tier === '¥5000+' || m.tier === '¥3000-5000' ? 'purple' : m.tier === '¥0-1000' ? 'red' : ''}">${m.tier}</span></td>
      <td class="num">${m.share}%</td>
      <td class="num">${fmt(dauOf(m.share))}</td>
      <td class="num">¥${m.ecpm.toFixed(1)}</td>
      <td class="num">¥${m.arpu.toFixed(2)}</td>
      <td class="num">${m.ret1}%</td>
      <td class="num">¥${m.ltv30.toFixed(2)}</td>
    </tr>`).join('');

    /* IP 归属 */
    const provRows = D.provinces.map(p => `<tr data-row="prov:${p.name}">
      <td><span class="name">${p.name}</span></td>
      <td class="num">${p.share}%</td>
      <td class="num">${fmt(dauOf(p.share))}</td>
      <td class="num">¥${p.ecpm.toFixed(1)}</td>
      <td class="num">¥${p.arpu.toFixed(2)}</td>
      <td class="num">${p.ret1}%</td>
      <td><div class="bar-cell"><div class="mini-bar" style="width:${(p.share * 6).toFixed(0)}px;background:${p.ecpm >= 20 ? '#2f6bff' : p.ecpm >= 16 ? '#f5a623' : '#f54a45'}"></div></div></td>
    </tr>`).join('');

    const provBars = D.provinces.slice(0, 12).map(p => ({
      name: p.name, value: p.share, color: p.ecpm >= 20 ? '#2f6bff' : p.ecpm >= 16 ? '#f5a623' : '#f54a45',
      extra: `ARPU ¥${p.arpu}`
    }));

    const cityRows = D.cityTier.map((c, i) => `<tr>
      <td><span class="name">${c.name}</span></td>
      <td class="num">${c.share}%</td>
      <td class="num">${fmt(dauOf(c.share))}</td>
      <td class="num">¥${c.ecpm.toFixed(1)}</td>
      <td class="num">¥${c.arpu.toFixed(2)}</td>
      <td class="num">${c.ret1}%</td>
      <td class="num">${c.ret7}%</td>
    </tr>`).join('');

    const cityStack = Charts.stackBar(D.cityTier.map((c, i) => ({ name: c.name, v: c.share, color: Charts.C[4 - i] })));

    /* 系统 / 网络 / 运营商 */
    const osBars = D.osVersion.map(o => ({ name: o.name, value: o.share, color: o.name.indexOf('iOS') === 0 ? '#2f6bff' : '#17b26a' }));
    const netBars = D.networkType.map(n => ({ name: n.name, value: n.share, color: '#00b8d9', extra: `eCPM ¥${n.ecpm}` }));
    const carrierBars = D.carrier.map(c => ({ name: c.name, value: c.share, color: '#7a4ddd', extra: `eCPM ¥${c.ecpm}` }));

    /* 用户归属 */
    const ownRows = D.channelOwn.map(c => `<tr>
      <td><span class="name">${c.name}</span></td>
      <td class="num">${c.share}%</td>
      <td class="num">${fmt(dauOf(c.share))}</td>
      <td class="num">¥${c.arpu.toFixed(2)}</td>
      <td class="num">${c.ret1}%</td>
      <td class="num">¥${c.ltv30.toFixed(2)}</td>
      <td><div class="bar-cell"><div class="mini-bar" style="width:${(c.share * 6).toFixed(0)}px"></div></div></td>
    </tr>`).join('');

    const typeRows = D.userType.map(u => `<tr>
      <td><span class="name">${u.name}</span></td>
      <td class="num">${u.share}%</td>
      <td class="num">${fmt(dauOf(u.share))}</td>
      <td class="num">${u.imp}</td>
      <td class="num">¥${u.arpu.toFixed(2)}</td>
    </tr>`).join('');

    const valueRows = D.valueLevel.map((v, i) => `<tr>
      <td><span class="name">${v.name}</span></td>
      <td class="num">${v.share}%</td>
      <td class="num">${fmt(dauOf(v.share))}</td>
      <td class="num">${v.days}</td>
      <td class="num">${v.imp}</td>
      <td class="num">¥${v.arpu.toFixed(2)}</td>
      <td class="num">¥${v.ltv30.toFixed(2)}</td>
      <td class="num"><b>${v.revShare}%</b></td>
      <td class="num">${v.ret1}%</td>
      <td><div class="bar-cell"><div class="mini-bar" style="width:${(v.revShare * 2).toFixed(0)}px;background:${['#2f6bff', '#17b26a', '#f5a623', '#c9cfd8'][i]}"></div></div></td>
    </tr>`).join('');

    return `
      <div class="grid g3">${kpi}</div>

      <div class="card">
        <div class="card-head"><div class="card-title">机型档位 × 变现能力<small>低端机是量主体，也是变现与留存的洼地</small></div>
          <div class="right"><button class="btn sm">按 LTV 排序</button><button class="btn sm">导出</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr>
            <th>机型档位</th><th class="num">用户占比</th><th class="num">DAU</th><th class="num">广告填充率</th>
            <th class="num">eCPM</th><th class="num">ARPU</th><th class="num">次留</th><th class="num">7 日留存</th>
            <th class="num">LTV30</th><th class="num">崩溃率</th><th>LTV 分布</th>
          </tr></thead><tbody>${tierRows}</tbody></table></div>
        <div class="card-body tight">
          ${Charts.hbar(tierBars, { unit: '%' })}
          <div class="note mt12"><span>💡</span><div>¥0-1000 档占 26.4% 用户，但 eCPM 仅 ¥11.8（高端机的 39%）、填充率 88.6%、崩溃率 1.86%，是"量大人低"的典型洼地。建议：① 低端机单独配置 Waterfall 与轻量素材；② 优先修复 Android 11 及以下崩溃堆栈。</div></div>
        </div>
      </div>

      <div class="grid g-1-2">
        <div class="card">
          <div class="card-head"><div class="card-title">机型 TOP 14<small>按 DAU 份额</small></div>
            <div class="right"><button class="btn sm">全部 1,286 款</button></div></div>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr><th>机型</th><th>档位</th><th class="num">份额</th><th class="num">DAU</th><th class="num">eCPM</th><th class="num">ARPU</th><th class="num">次留</th><th class="num">LTV30</th></tr></thead>
            <tbody>${modelRows}</tbody></table></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">IP 归属地分布<small>基于 IP 解析 · 省份 TOP 16</small></div>
            <div class="right"><button class="btn sm">按城市查看（368 城）</button></div></div>
          <div class="card-body">
            ${Charts.hbar(provBars, { unit: '%' })}
            <div class="legend mt12"><span><i style="background:#2f6bff"></i>eCPM ≥ ¥20 高价值地区</span><span><i style="background:#f5a623"></i>¥16-20</span><span><i style="background:#f54a45"></i>&lt; ¥16</span></div>
          </div>
        </div>
      </div>

      <div class="grid g2">
        <div class="card">
          <div class="card-head"><div class="card-title">省份变现明细<small>广东 / 浙江 / 江苏 eCPM 领跑</small></div></div>
          <div class="tbl-wrap" style="max-height:420px;overflow-y:auto"><table class="tbl">
            <thead><tr><th>省份</th><th class="num">占比</th><th class="num">DAU</th><th class="num">eCPM</th><th class="num">ARPU</th><th class="num">次留</th><th>分布</th></tr></thead>
            <tbody>${provRows}</tbody></table></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">城市线级分布<small>下沉市场量大价低，需差异化 Ad Load</small></div></div>
          <div class="card-body">
            ${cityStack}
            <div class="legend mt12">${D.cityTier.map((c, i) => `<span><i style="background:${Charts.C[4 - i]}"></i>${c.name} ${c.share}%</span>`).join('')}</div>
            <div class="tbl-wrap mt12"><table class="tbl">
              <thead><tr><th>城市线级</th><th class="num">占比</th><th class="num">DAU</th><th class="num">eCPM</th><th class="num">ARPU</th><th class="num">次留</th><th class="num">7 日留存</th></tr></thead>
              <tbody>${cityRows}</tbody></table></div>
            <div class="note mt12"><span>💡</span><div>四线及以下占 18% 用户但 eCPM 仅 ¥10.6（一线 40%），建议下沉城市提高激励视频密度、降低插屏频控；一线城市可测试品牌广告提升 eCPM 上限。</div></div>
          </div>
        </div>
      </div>

      <div class="grid g3">
        <div class="card">
          <div class="card-head"><div class="card-title">操作系统版本<small>iOS 39.6% · Android 60.4%</small></div></div>
          <div class="card-body">
            ${Charts.hbar(osBars, { unit: '%' })}
            <div class="legend mt12"><span><i style="background:#2f6bff"></i>iOS</span><span><i style="background:#17b26a"></i>Android</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">网络环境<small>弱网直接拉低填充与完播</small></div></div>
          <div class="card-body">
            ${Charts.hbar(netBars, { unit: '%' })}
            <div class="note mt12"><span>💡</span><div>弱网 / 4G 用户 eCPM 比 WiFi 低 26%，且广告加载超时率高 3.2 倍，建议弱网场景预加载广告并放宽超时阈值。</div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">运营商<small>IP 归属的另一维度</small></div></div>
          <div class="card-body">
            ${Charts.hbar(carrierBars, { unit: '%' })}
            <div class="note mt12"><span>💡</span><div>三大运营商 eCPM 差异仅 4%，可作为验证"IP 解析准确性"的辅助维度，异常占比通常意味着 VPN / 代理刷量。</div></div>
          </div>
        </div>
      </div>

      <div class="grid g-1-2">
        <div class="card">
          <div class="card-head"><div class="card-title">用户归属（首次归因渠道）<small>决定出价与内容策略</small></div></div>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr><th>归属渠道</th><th class="num">占比</th><th class="num">DAU</th><th class="num">ARPU</th><th class="num">次留</th><th class="num">LTV30</th><th>分布</th></tr></thead>
            <tbody>${ownRows}</tbody></table></div>
          <div class="card-body tight">
            <div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>用户类型</th><th class="num">占比</th><th class="num">DAU</th><th class="num">人均展示</th><th class="num">ARPU</th></tr></thead>
              <tbody>${typeRows}</tbody></table></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">用户价值分层<small>由留存 × 广告行为计算 · 用于分群与差异化 Ad Load</small></div>
            <div class="right"><button class="btn sm">创建分群</button></div></div>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr>
              <th>价值分层</th><th class="num">用户占比</th><th class="num">人数</th><th class="num">月均活跃天数</th>
              <th class="num">人均日展示</th><th class="num">ARPU</th><th class="num">LTV30</th><th class="num">收入贡献</th><th class="num">次留</th><th>贡献分布</th>
            </tr></thead><tbody>${valueRows}</tbody></table></div>
          <div class="card-body tight">
            <div class="note"><span>💡</span><div>12.6% 的高价值用户贡献 41.8% 广告收入，LTV30 ¥8.42；而 22.4% 的沉默用户仅贡献 6.2%。运营重点应放在"把中低价值用户推进解锁循环"，而非平均加广告密度。</div></div>
          </div>
        </div>
      </div>`;
  }
};

/* ===============================
   10. 用户分群
   =============================== */
VIEWS.segment = {
  render() {
    $('#topfilters').innerHTML = topFilters(`
      <select class="select"><option>全部分群类型</option><option>规则分群</option><option>AI 预测分群</option></select>
      <button class="btn primary">+ 新建分群</button>`);

    const total = D.segments.reduce((s, x) => s + x.count, 0);
    const sg = D.segments.find(x => x.id === selSeg) || D.segments[0];

    const kpi = [
      ['分群总数', D.segments.length + '', '个', '规则分群 11 · AI 预测 1'],
      ['已圈选用户', fmt(total), '人', `占 DAU ${(total / D.summary.dau * 100).toFixed(1)}%（分群可重叠）`],
      ['可运营分群', '11', '个', '支持 Push / 广告策略 / A-B 实验'],
      ['最近更新', '08:00', '', '每日 08:00 全量重算'],
      ['最大分群', '低频浅度用户', '', '218,600 人 · 占 26.4%']
    ].map(k => `<div class="kpi">
      <div class="label">${k[0]}</div>
      <div class="value" style="font-size:${k[1].length > 6 ? 20 : 26}px">${k[1]}${k[2] ? `<span class="unit">${k[2]}</span>` : ''}</div>
      <div class="delta"><span class="cmp">${k[3]}</span></div>
    </div>`).join('');

    /* 左侧分群列表 */
    const list = D.segments.map(s => `
      <div class="seg-item ${s.id === selSeg ? 'sel' : ''}" data-seg="${s.id}">
        <div class="seg-top">
          <span class="seg-name">${s.name}</span>
          <span class="seg-cnt">${fmt(s.count)}</span>
        </div>
        <div class="seg-meta">
          <span class="tag ${s.type === 'AI 预测分群' ? 'purple' : ''}">${s.type}</span>
          <span class="tag ${s.status === '已就绪' ? 'green' : 'orange'}">${s.status}</span>
          <span class="muted">${s.share}% · ARPU ¥${s.arpu}</span>
        </div>
      </div>`).join('');

    /* 右侧：选中分群详情 */
    const rules = sg.rules.map(r => `<span class="chip">${r}<span class="x">×</span></span>`).join('');

    const dist = (title, arr) => `
      <div class="dist-block">
        <div class="dist-title">${title}</div>
        ${arr.map((a, i) => `<div class="dist-row">
          <span class="dn">${a[0]}</span>
          <div class="dt"><div class="df" style="width:${(a[1] / arr[0][1] * 100).toFixed(0)}%;background:${Charts.C[i]}"></div></div>
          <span class="dv">${a[1]}%</span>
        </div>`).join('')}
      </div>`;

    const detail = `
      <div class="seg-detail">
        <div class="sd-head">
          <div>
            <div class="sd-name">${sg.name}<span class="tag ${sg.type === 'AI 预测分群' ? 'purple' : 'blue'}" style="margin-left:8px">${sg.type}</span></div>
            <div class="sd-desc">${sg.desc}</div>
          </div>
          <div class="right">
            <button class="btn sm">Push 下发</button>
            <button class="btn sm">广告策略</button>
            <button class="btn sm">A/B 实验</button>
            <button class="btn sm primary">导出人群包</button>
          </div>
        </div>

        <div class="grid g4" style="gap:12px;margin-top:14px">
          <div class="mini-kpi"><div class="l">分群人数</div><div class="v">${fmt(sg.count)}</div><div class="s">占 DAU ${sg.share}%</div></div>
          <div class="mini-kpi"><div class="l">ARPU</div><div class="v">¥${sg.arpu.toFixed(2)}</div><div class="s">人均日广告收入</div></div>
          <div class="mini-kpi"><div class="l">D7 留存</div><div class="v">${sg.ret7}%</div><div class="s">整体 19.2%</div></div>
          <div class="mini-kpi"><div class="l">LTV30</div><div class="v">¥${sg.ltv30.toFixed(2)}</div><div class="s">人均日展示 ${sg.imp} 次</div></div>
        </div>

        <div class="card-title mt16" style="font-size:13px">分群规则 <small>${sg.rules.length} 个条件 · AND 关系</small></div>
        <div class="chips mt8">${rules}<span class="chip" style="background:#f4f6fa;color:#646a73;border-color:#e8ebf0">+ 添加条件</span></div>

        <div class="grid g3" style="gap:12px;margin-top:14px">
          ${dist('机型档位构成', sg.device)}
          ${dist('IP 归属 TOP5', sg.province)}
          ${dist('渠道归属构成', sg.channel)}
        </div>

        <div class="note mt16"><span>💡</span><div>负责人 ${sg.owner} · 更新于 ${sg.updated} · 分群 ID <span class="code">${sg.id}</span>。该分群可直接用于：① Push 文案定向；② 调整 Ad Load 与 Waterfall 分层；③ 作为 A/B 实验的流量域。</div></div>
      </div>`;

    /* 分群对比全表 */
    const rows = D.segments.map(s => `<tr data-segrow="${s.id}">
      <td><span class="name">${s.name}</span><div class="sub">${s.type} · ${s.owner}</div></td>
      <td class="num">${fmt(s.count)}</td>
      <td class="num">${s.share}%</td>
      <td class="num ${s.arpu >= 0.5 ? 'up' : s.arpu < 0.2 ? 'down' : ''}">¥${s.arpu.toFixed(2)}</td>
      <td class="num">${s.ret7 ? s.ret7 + '%' : '—'}</td>
      <td class="num">${s.imp}</td>
      <td class="num">¥${s.ltv30.toFixed(2)}</td>
      <td><div class="bar-cell"><div class="mini-bar" style="width:${Math.max(3, s.count / 220000 * 90).toFixed(0)}px;background:${s.arpu >= 0.5 ? '#2f6bff' : s.arpu >= 0.25 ? '#f5a623' : '#f54a45'}"></div></div></td>
      <td><span class="tag ${s.status === '已就绪' ? 'green' : 'orange'}">${s.status}</span></td>
      <td class="muted">${s.updated.split(' ')[1]}</td>
      <td><button class="btn sm">运营</button></td>
    </tr>`).join('');

    /* 规则构建器 */
    const estimate = (() => {
      const ws = segDraft.conds.map(c => (COND_POOL.find(p => p.label === c) || { w: .2 }).w);
      const p = segDraft.mode === 'AND'
        ? ws.reduce((a, b) => a * b, 1)
        : 1 - ws.reduce((a, b) => a * (1 - b), 1);
      return Math.round(D.summary.dau * (ws.length ? p : 1));
    })();

    const poolChips = COND_POOL.map(c => `
      <span class="cond ${segDraft.conds.includes(c.label) ? 'used' : ''}" data-cond="${c.label}">
        <i class="ct ${c.t === '行为' ? 'b' : 'a'}">${c.t}</i>${c.label}
      </span>`).join('');

    const draftChips = segDraft.conds.length
      ? segDraft.conds.map((c, i) => `<span class="chip">${c}<span class="x" data-del="${i}">×</span></span>`).join('')
      : `<span class="muted">尚未添加条件，默认全量用户</span>`;

    const builder = `
      <div class="builder">
        <div class="filter-row">
          <span class="lb">条件关系</span>
          <div class="seg" id="modeSeg">
            <button class="${segDraft.mode === 'AND' ? 'active' : ''}" data-mode="AND">同时满足 AND</button>
            <button class="${segDraft.mode === 'OR' ? 'active' : ''}" data-mode="OR">任一满足 OR</button>
          </div>
          <span class="lb" style="margin-left:8px">时间窗口</span>
          <select class="select"><option>近 7 日</option><option>近 14 日</option><option>近 30 日</option><option>自然日（当日）</option></select>
        </div>
        <div class="chips mt12">${draftChips}</div>
        <div class="est mt16">
          <div class="est-num">${fmt(estimate)}<span class="unit">人</span></div>
          <div class="est-lb">预估分群人数 · 占 DAU ${(estimate / D.summary.dau * 100).toFixed(1)}%</div>
        </div>
        <div class="card-title mt16" style="font-size:12.5px">可选条件（点击添加）</div>
        <div class="cond-pool mt8">${poolChips}</div>
        <div class="filter-row mt16">
          <button class="btn primary">计算分群</button>
          <button class="btn">保存为分群</button>
          <button class="btn">查看 SQL</button>
          <span class="muted">条件来源：事件行为（埋点）+ 用户属性（设备 / IP / 归属）</span>
        </div>
      </div>`;

    return `
      <div class="grid" style="grid-template-columns:repeat(5,1fr)">${kpi}</div>

      <div class="card">
        <div class="card-head"><div class="card-title">分群对比<small>人数 · ARPU · 留存 · LTV 横向对照</small></div>
          <div class="right"><button class="btn sm">自定义列</button><button class="btn sm">导出</button><button class="btn sm primary">批量运营</button></div></div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr>
            <th>分群</th><th class="num">人数</th><th class="num">占比</th><th class="num">ARPU</th>
            <th class="num">D7 留存</th><th class="num">人均日展示</th><th class="num">LTV30</th>
            <th>规模分布</th><th>状态</th><th>更新</th><th></th>
          </tr></thead><tbody>${rows}</tbody></table></div>
      </div>

      <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;align-items:start">
        <div class="panel">
          <div class="panel-head">分群列表<div style="margin-left:auto"><button class="btn sm ghost">管理</button></div></div>
          <div class="panel-body">
            <input class="input" style="width:100%;margin-bottom:8px" placeholder="搜索分群">
            <div class="seg-list">${list}</div>
          </div>
        </div>
        <div>${detail}</div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">分群规则构建器<small>事件行为条件 × 用户属性条件</small></div>
          <div class="right"><button class="btn sm">历史版本</button></div></div>
        <div class="card-body">${builder}</div>
      </div>`;
  },
  after() {
    document.querySelectorAll('[data-seg]').forEach(el => {
      el.addEventListener('click', () => { selSeg = el.dataset.seg; go('segment'); });
    });
    document.querySelectorAll('[data-segrow]').forEach(tr => {
      tr.addEventListener('click', () => { selSeg = tr.dataset.segrow; go('segment'); });
    });
    document.querySelectorAll('[data-cond]').forEach(el => {
      el.addEventListener('click', () => {
        const l = el.dataset.cond;
        if (!segDraft.conds.includes(l)) segDraft.conds.push(l);
        go('segment');
      });
    });
    document.querySelectorAll('[data-del]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        segDraft.conds.splice(+el.dataset.del, 1);
        go('segment');
      });
    });
    const ms = document.querySelector('#modeSeg');
    if (ms) ms.querySelectorAll('[data-mode]').forEach(b => {
      b.addEventListener('click', () => { segDraft.mode = b.dataset.mode; go('segment'); });
    });
  }
};
