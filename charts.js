/* ===============================
   轻量级 SVG 图表（零依赖）
   =============================== */
const Charts = (() => {
  const C = ['#2f6bff', '#17b26a', '#f5a623', '#7a4ddd', '#f54a45', '#00b8d9', '#eb2f96', '#8f959e'];

  const fmt = n => {
    if (typeof n !== 'number') return n;
    if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(2) + '亿';
    if (Math.abs(n) >= 1e4) return (n / 1e4).toFixed(1) + '万';
    return n.toLocaleString('zh-CN');
  };

  function niceMax(v) {
    if (v <= 0) return 10;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const r = v / p;
    const m = r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10;
    return m * p;
  }

  /* 图表数据存储，供 hover tooltip 使用 */
  const store = [];
  const put = o => (store.push(o), store.length - 1);

  /* ---------- 多系列折线 / 面积图 ---------- */
  function line(opts) {
    const {
      labels = [], series = [], height = 260, width = 900, area = false,
      yFormat = fmt, smooth = true, dualAxis = false
    } = opts;
    const padL = 52, padR = dualAxis ? 52 : 16, padT = 14, padB = 26;
    const iw = width - padL - padR, ih = height - padT - padB;
    const all = series.flatMap(s => s.data);
    const max = niceMax(Math.max(...all) * 1.12);
    const ticks = 4;
    const X = i => padL + (labels.length <= 1 ? iw / 2 : (i * iw) / (labels.length - 1));
    const Y = v => padT + ih - (v / max) * ih;

    let g = '';
    for (let i = 0; i <= ticks; i++) {
      const v = (max / ticks) * i, y = Y(v);
      g += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="#eef0f4" stroke-width="1"/>`;
      g += `<text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#a5abb5">${yFormat(Math.round(v))}</text>`;
    }
    const step = Math.ceil(labels.length / 8);
    labels.forEach((lb, i) => {
      if (i % step === 0 || i === labels.length - 1) {
        g += `<text x="${X(i).toFixed(1)}" y="${height - 7}" text-anchor="middle" font-size="11" fill="#a5abb5">${lb}</text>`;
      }
    });

    series.forEach((s, si) => {
      const color = s.color || C[si % C.length];
      const pts = s.data.map((v, i) => [X(i), Y(v)]);
      let d;
      if (smooth) {
        d = pts.map((p, i) => {
          if (i === 0) return `M${p[0].toFixed(1)},${p[1].toFixed(1)}`;
          const prev = pts[i - 1];
          const cx = (prev[0] + p[0]) / 2;
          return `C${cx.toFixed(1)},${prev[1].toFixed(1)} ${cx.toFixed(1)},${p[1].toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`;
        }).join(' ');
      } else {
        d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      }
      if (area) {
        const a = d + ` L${X(s.data.length - 1).toFixed(1)},${(padT + ih).toFixed(1)} L${padL},${(padT + ih).toFixed(1)} Z`;
        g += `<path d="${a}" fill="${color}" opacity="0.10"/>`;
      }
      g += `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${s.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
      pts.forEach(p => {
        g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" fill="#fff" stroke="${color}" stroke-width="1.6"/>`;
      });
    });

    // hover 竖线
    g += `<line class="hover-line" x1="0" y1="${padT}" x2="0" y2="${padT + ih}" stroke="#c9cfd8" stroke-dasharray="3 3" style="display:none"/>`;
    g += `<rect x="${padL}" y="${padT}" width="${iw}" height="${ih}" fill="transparent" class="hover-rect"/>`;

    const cid = put({ labels, series, yFormat, padL, padR, width, height });
    return `<svg class="chart" viewBox="0 0 ${width} ${height}" data-chart="line" data-cid="${cid}">${g}</svg>`;
  }

  /* ---------- 柱状图（分组） ---------- */
  function bar(opts) {
    const { labels = [], series = [], height = 250, width = 900, yFormat = fmt } = opts;
    const padL = 52, padR = 16, padT = 14, padB = 26;
    const iw = width - padL - padR, ih = height - padT - padB;
    const max = niceMax(Math.max(...series.flatMap(s => s.data)) * 1.12);
    const ticks = 4;
    let g = '';
    for (let i = 0; i <= ticks; i++) {
      const v = (max / ticks) * i, y = padT + ih - (v / max) * ih;
      g += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="#eef0f4"/>`;
      g += `<text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#a5abb5">${yFormat(Math.round(v))}</text>`;
    }
    const gw = iw / labels.length;
    const n = series.length;
    const bw = Math.min(22, (gw * 0.62) / n);
    labels.forEach((lb, i) => {
      series.forEach((s, si) => {
        const h = (s.data[i] / max) * ih;
        const x = padL + gw * i + gw / 2 - (bw * n) / 2 + si * bw;
        const y = padT + ih - h;
        g += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${Math.max(h, 1).toFixed(1)}" rx="2.5" fill="${s.color || C[si % C.length]}" opacity="0.92"><title>${s.name} ${lb}: ${fmt(s.data[i])}</title></rect>`;
      });
      g += `<text x="${(padL + gw * i + gw / 2).toFixed(1)}" y="${height - 7}" text-anchor="middle" font-size="11" fill="#a5abb5">${lb}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${width} ${height}">${g}</svg>`;
  }

  /* ---------- 横向条形（排行） ---------- */
  function hbar(items, opts = {}) {
    const { color = '#2f6bff', unit = '', max: fixedMax } = opts;
    const max = fixedMax || Math.max(...items.map(i => i.value));
    return `<div class="hbar-list">` + items.map(it => `
      <div class="hbar-row">
        <div class="hbar-name">${it.name}</div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${(it.value / max * 100).toFixed(1)}%;background:${it.color || color}"></div></div>
        <div class="hbar-val">${fmt(it.value)}${unit}${it.extra ? `<span class="hbar-ex">${it.extra}</span>` : ''}</div>
      </div>`).join('') + `</div>`;
  }

  /* ---------- 迷你 sparkline ---------- */
  function spark(data, color = '#2f6bff', w = 74, h = 30) {
    const max = Math.max(...data), min = Math.min(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => [
      (i / (data.length - 1)) * (w - 2) + 1,
      h - 2 - ((v - min) / range) * (h - 6)
    ]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="${pts[pts.length - 1][0].toFixed(1)}" cy="${pts[pts.length - 1][1].toFixed(1)}" r="2" fill="${color}"/>
    </svg>`;
  }

  /* ---------- 漏斗（梯形，SVG） ---------- */
  function funnel(steps, opts = {}) {
    const { width = 520, rowH = 56, gap = 30, padL = 128, padR = 108, sel = null } = opts;
    const total = width + padL + padR;
    const maxV = steps[0].value;
    const minW = width * 0.18;
    const W = v => Math.max(minW, (v / maxV) * width);
    const height = steps.length * rowH + (steps.length - 1) * gap + 6;
    const cx = padL + width / 2;
    let g = '';
    steps.forEach((s, i) => {
      const topW = W(s.value);
      const nextV = i < steps.length - 1 ? steps[i + 1].value : s.value * 0.7;
      const botW = W(nextV);
      const y = i * (rowH + gap) + 3;
      const alpha = 0.92 - i * (0.52 / Math.max(1, steps.length - 1));
      const color = s.color || `rgba(47,107,255,${alpha.toFixed(3)})`;
      const dark = !s.color && alpha < 0.56;
      const pts = `${(cx - topW / 2).toFixed(1)},${y} ${(cx + topW / 2).toFixed(1)},${y} ${(cx + botW / 2).toFixed(1)},${(y + rowH)} ${(cx - botW / 2).toFixed(1)},${(y + rowH)}`;
      const dimCls = sel !== null && sel !== i ? ' fn-poly dim' : ' fn-poly';
      g += `<polygon class="${dimCls.trim()}" data-step="${i}" points="${pts}" fill="${color}"><title>${s.name}：${fmt(s.value)}</title></polygon>`;
      g += `<text x="${cx}" y="${y + rowH / 2}" text-anchor="middle" font-size="13" fill="${dark ? '#1f2329' : '#fff'}" font-weight="500">${s.name}</text>`;
      g += `<text x="${cx}" y="${y + rowH / 2 + 16}" text-anchor="middle" font-size="11.5" fill="${dark ? 'rgba(31,35,41,.68)' : 'rgba(255,255,255,.92)'}">${fmt(s.value)}</text>`;
      // 左侧步骤名
      g += `<text x="2" y="${y + rowH / 2 - 2}" font-size="12" fill="#1f2329">${i + 1}. ${s.name}</text>`;
      g += `<text x="2" y="${y + rowH / 2 + 14}" font-size="11" fill="#a5abb5">${fmt(s.value)}</text>`;
      // 层间转化率
      if (i > 0) {
        const prev = steps[i - 1].value;
        const rate = s.value / prev;
        const midY = y - gap / 2 + 2;
        g += `<text x="${total - 2}" y="${midY}" text-anchor="end" font-size="12.5" fill="#f54a45" font-weight="600">转化 ${(rate * 100).toFixed(1)}%</text>`;
        g += `<text x="${total - 2}" y="${midY + 15}" text-anchor="end" font-size="11" fill="#a5abb5">流失 ${fmt(prev - s.value)}</text>`;
        g += `<line x1="${cx}" y1="${y - gap + 6}" x2="${cx}" y2="${y - 2}" stroke="#c9cfd8" stroke-dasharray="3 3"/>`;
      }
    });
    return `<svg class="chart" viewBox="0 0 ${total} ${height}" style="max-width:${total}px;margin:0 auto">${g}</svg>`;
  }

  /* ---------- 环形/进度 ---------- */
  function donut(pct, color = '#2f6bff', size = 96) {
    const r = size / 2 - 8, c = 2 * Math.PI * r;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#eef0f4" stroke-width="9"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="9"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="50%" y="50%" text-anchor="middle" dy="6" font-size="16" font-weight="600" fill="#1f2329">${(pct * 100).toFixed(1)}%</text>
    </svg>`;
  }

  /* ---------- 散点 / 气泡（留存 vs LTV 四象限） ---------- */
  function scatter(points, opts = {}) {
    const {
      width = 560, height = 320, xLabel = '', yLabel = '',
      xSuffix = '%', yPrefix = '¥', padL = 56, padR = 24, padT = 18, padB = 40,
      xMin = 0, quadX = null, quadY = null
    } = opts;
    const iw = width - padL - padR, ih = height - padT - padB;
    const xs = points.map(p => p.x), ys = points.map(p => p.y), rs = points.map(p => p.r || 1);
    const xMax = opts.xMax || niceMax(Math.max(...xs) * 1.1);
    const yMax = opts.yMax || niceMax(Math.max(...ys) * 1.12);
    const rMax = Math.max(...rs);
    const X = v => padL + ((v - xMin) / (xMax - xMin)) * iw;
    const Y = v => padT + ih - (v / yMax) * ih;
    let g = '';
    for (let i = 0; i <= 4; i++) {
      const y = padT + (ih / 4) * i;
      g += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="#eef0f4"/>`;
      g += `<text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#a5abb5">${yPrefix}${(yMax - (yMax / 4) * i).toFixed(1)}</text>`;
    }
    for (let i = 0; i <= 4; i++) {
      const v = xMin + ((xMax - xMin) / 4) * i, x = X(v);
      g += `<text x="${x.toFixed(1)}" y="${height - padB + 18}" text-anchor="middle" font-size="11" fill="#a5abb5">${v.toFixed(1)}${xSuffix}</text>`;
    }
    if (quadX !== null && quadY !== null) {
      g += `<line x1="${X(quadX).toFixed(1)}" y1="${padT}" x2="${X(quadX).toFixed(1)}" y2="${padT + ih}" stroke="#c9cfd8" stroke-dasharray="4 4"/>`;
      g += `<line x1="${padL}" y1="${Y(quadY).toFixed(1)}" x2="${width - padR}" y2="${Y(quadY).toFixed(1)}" stroke="#c9cfd8" stroke-dasharray="4 4"/>`;
      g += `<text x="${(width - padR - 6)}" y="${(Y(quadY) - 6).toFixed(1)}" text-anchor="end" font-size="10.5" fill="#17b26a">高留存 · 高 LTV（加大投放）</text>`;
      g += `<text x="${(padL + 6)}" y="${(padT + 14).toFixed(1)}" font-size="10.5" fill="#f54a45">高留存 · 低变现</text>`;
    }
    points.forEach((p, i) => {
      const cx = X(p.x), cy = Y(p.y), r = 5 + (p.r / rMax) * 11;
      const color = p.color || C[i % C.length];
      g += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="0.28" stroke="${color}" stroke-width="1.4"><title>${p.name}：${xLabel} ${p.x}${xSuffix} · ${yLabel} ${yPrefix}${p.y}</title></circle>`;
      g += `<text x="${(cx + r + 4).toFixed(1)}" y="${(cy + 4).toFixed(1)}" font-size="11" fill="#4e5969">${p.name}</text>`;
    });
    g += `<text x="${(width - padR)}" y="${height - 4}" text-anchor="end" font-size="11" fill="#a5abb5">${xLabel}</text>`;
    g += `<text x="${padL - 44}" y="${padT - 4}" font-size="11" fill="#a5abb5">${yLabel}</text>`;
    return `<svg class="chart" viewBox="0 0 ${width} ${height}">${g}</svg>`;
  }

  /* ---------- 堆叠占比条（构成对比） ---------- */
  function stackBar(parts, opts = {}) {
    const { width = 100 } = opts;
    return `<div class="stack-bar">` + parts.map(p =>
      `<span style="width:${p.v}%;background:${p.color}"><i>${p.name} ${p.v}%</i></span>`).join('') + `</div>`;
  }

  return { line, bar, hbar, spark, funnel, donut, scatter, stackBar, fmt, C, store };
})();
