// primitives.jsx — shared visual primitives (chips, AI marks, radial, buttons)

// ── Category chip ───────────────────────────────────────────────────────────
// Two concentric circles per your pick: outline (rest) / filled (selected).
// `style` prop: 'rings' (default), 'pill', 'block', 'mono'
function CategoryChip({ cat, selected, size = 72, onClick, palette, style = 'rings', representation = 'mono' }) {
  const p = palette;
  if (style === 'pill') return <CatPill cat={cat} selected={selected} onClick={onClick} palette={p} representation={representation} />;
  if (style === 'block') return <CatBlock cat={cat} selected={selected} size={size} onClick={onClick} palette={p} representation={representation} />;
  if (style === 'mono') return <CatMono cat={cat} selected={selected} onClick={onClick} palette={p} representation={representation} />;

  const ring = selected ? p.accent : p.lineStrong;
  const fill = selected ? p.accent : 'transparent';
  const ink  = selected ? p.accentInk : p.fg;
  const useIcon = representation === 'icon';
  return (
    <button onClick={onClick} className="cat-rings" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
      fontFamily: FONT_DISPLAY,
    }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `1.5px solid ${ring}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        transition: 'all 180ms cubic-bezier(.3,.7,.4,1)',
      }}>
        <div style={{
          width: size - 14, height: size - 14, borderRadius: '50%',
          background: fill,
          border: selected ? 'none' : `1px solid ${p.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_MONO, fontSize: size * 0.28, fontWeight: 500,
          color: ink, letterSpacing: '-0.02em',
          transition: 'all 180ms cubic-bezier(.3,.7,.4,1)',
        }}>{useIcon ? catIcon(cat.id, ink, size * 0.46) : cat.mono}</div>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 500, color: selected ? p.fg : p.fgMuted,
        letterSpacing: '-0.01em',
      }}>{cat.label}</span>
    </button>
  );
}

function CatPill({ cat, selected, onClick, palette: p, representation = 'mono' }) {
  const useIcon = representation === 'icon';
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 14px 8px 10px', borderRadius: 999,
      background: selected ? p.accent : 'transparent',
      color: selected ? p.accentInk : p.fg,
      border: `1px solid ${selected ? p.accent : p.lineStrong}`,
      fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500,
      cursor: 'pointer', transition: 'all 160ms',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: selected ? p.accentInk : p.surface2,
        color: selected ? p.accent : p.fg,
        fontFamily: FONT_MONO, fontSize: 10, fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{useIcon ? catIcon(cat.id, selected ? p.accent : p.fg, 13) : cat.mono}</span>
      {cat.label}
    </button>
  );
}

function CatBlock({ cat, selected, size = 72, onClick, palette: p, representation = 'mono' }) {
  const useIcon = representation === 'icon';
  const ink = selected ? p.accentInk : p.fg;
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
      width: size + 16, padding: 8, background: selected ? p.accent : p.surface,
      color: ink,
      border: `1px solid ${selected ? p.accent : p.line}`,
      borderRadius: 10, cursor: 'pointer', fontFamily: FONT_DISPLAY,
      transition: 'all 160ms',
    }}>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 18, fontWeight: 500,
        letterSpacing: '-0.04em',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: useIcon ? 22 : 'auto', height: useIcon ? 22 : 'auto',
      }}>{useIcon ? catIcon(cat.id, ink, 20) : cat.mono}</span>
      <span style={{ fontSize: 11, fontWeight: 500 }}>{cat.label}</span>
    </button>
  );
}

function CatMono({ cat, selected, onClick, palette: p, representation = 'mono' }) {
  const useIcon = representation === 'icon';
  const ink = selected ? p.accent : p.fg;
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 4px', width: '100%', textAlign: 'left',
      background: 'transparent', border: 0, borderBottom: `1px dashed ${p.line}`,
      cursor: 'pointer', fontFamily: FONT_MONO, fontSize: 13,
      color: ink,
    }}>
      <span style={{ color: selected ? p.accent : p.fgDim, display: 'flex', alignItems: 'center' }}>
        {useIcon ? catIcon(cat.id, ink, 14) : (selected ? '●' : '○')}
      </span>
      <span style={{ flex: 1 }}>{cat.label.toLowerCase()}</span>
      <span style={{ color: p.fgDim }}>{cat.mono.toLowerCase()}</span>
    </button>
  );
}

// ── AI mark ────────────────────────────────────────────────────────────────
// Small indicator that a piece of content was AI-derived. Four variants.
function AIMark({ variant, palette, children, confidence, inline = false }) {
  const p = palette;
  if (variant === 'glyph') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: FONT_MONO, fontSize: 11, color: p.fgMuted,
      }}>
        <span style={{ color: p.aiLine, letterSpacing: 2 }}>··</span>
        {children}
        {confidence != null && (
          <span style={{ color: p.fgDim }}>{Math.round(confidence * 100)}</span>
        )}
      </span>
    );
  }
  if (variant === 'underline') {
    return (
      <span style={{
        borderBottom: `1px dashed ${p.aiLine}`, paddingBottom: 1,
        fontStyle: 'normal',
      }}>{children}</span>
    );
  }
  if (variant === 'shimmer') {
    return (
      <span className="ai-shimmer" style={{
        background: `linear-gradient(90deg, ${p.fg} 0%, ${p.aiLine} 50%, ${p.fg} 100%)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text', backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>{children}</span>
    );
  }
  // default: 'tint' — tinted surface + dashed left edge
  return (
    <div style={{
      background: p.aiTint,
      borderLeft: `1px dashed ${p.aiLine}`,
      padding: inline ? '2px 10px' : '10px 14px',
      borderRadius: inline ? 4 : 8,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 8, right: 10,
        fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.1em',
        color: p.aiLine, textTransform: 'uppercase',
      }}>·· ai</div>
      {children}
    </div>
  );
}

// ── Segmented radial ────────────────────────────────────────────────────────
// A donut reinterpreted as concentric arcs — each category is its own ring,
// arc length proportional to its share. No labels inside; legend is separate.
function SegmentedRadial({ totals, palette, size = 240, spent, budget }) {
  const p = palette;
  const n = totals.length;
  const total = totals.reduce((s, x) => s + x.amount, 0);
  const cx = size / 2, cy = size / 2;

  // Reserve center space (innerR) for the text; fit all rings between innerR and maxR.
  const maxR = size / 2 - 4;
  const innerR = Math.max(52, size * 0.32);
  const span = maxR - innerR;
  const ringW = Math.max(3, Math.min(7, (span / n) * 0.55));
  const trackGap = Math.max(2, (span - ringW * n) / Math.max(1, n - 1));
  const gap = 0.06;

  const rings = totals.map((t, i) => ({
    ...t,
    r: innerR + i * (ringW + trackGap) + ringW / 2,
    share: t.amount / total,
  }));

  const arc = (r, a0, a1) => {
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };

  const pct = Math.round((spent / budget) * 100);
  // Text sizes: clamp so they always fit inside innerR (diameter = 2*innerR).
  const numFs = Math.min(size * 0.13, innerR * 0.55);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((r, i) => {
          const start = -Math.PI / 2 + gap;
          const end = start + Math.max(0.001, r.share) * (Math.PI * 2 - gap * 2);
          return (
            <g key={r.cat}>
              <circle cx={cx} cy={cy} r={r.r}
                fill="none" stroke={p.line} strokeWidth={ringW} />
              <path d={arc(r.r, start, end)}
                fill="none" stroke={i === 0 ? p.accent : p.fg}
                strokeWidth={ringW} strokeLinecap="round"
                opacity={i === 0 ? 1 : 0.85 - i * 0.05} />
            </g>
          );
        })}
      </svg>
      {/* center label (circle-clipped so it never escapes the inner ring) */}
      <div style={{
        position: 'absolute', left: cx - innerR + 4, top: cy - innerR + 4,
        width: (innerR - 4) * 2, height: (innerR - 4) * 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9, color: p.fgDim,
          letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1,
        }}>spent</div>
        <div style={{
          fontFamily: FONT_DISPLAY, fontSize: numFs, fontWeight: 500,
          color: p.fg, letterSpacing: '-0.04em', lineHeight: 1.05,
          marginTop: 4, fontVariantNumeric: 'tabular-nums',
        }}>£{Math.round(spent).toLocaleString()}</div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9, color: p.fgMuted,
          marginTop: 4, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        }}>{pct}% of £{budget.toLocaleString()}</div>
      </div>
    </div>
  );
}

// ── Pie chart ───────────────────────────────────────────────────────────────
// A proper donut pie, each category a filled segment. Tones shift around the
// wheel so adjacent categories stay distinguishable without bright rainbow hues.
function PieViz({ totals, palette, size = 240, spent, budget, onSelect, selected }) {
  const p = palette;
  const n = totals.length;
  const total = totals.reduce((s, x) => s + x.amount, 0);
  const cx = size / 2, cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = Math.max(58, size * 0.36);
  const gap = 0.014; // radians between slices

  // Build slice angles
  let acc = -Math.PI / 2;
  const slices = totals.map((t, i) => {
    const share = t.amount / total;
    const a0 = acc + gap / 2;
    const a1 = acc + share * Math.PI * 2 - gap / 2;
    acc += share * Math.PI * 2;
    return { ...t, i, share, a0, a1 };
  });

  // Shade ramp: start at accent, then alternate dense→dim greyscale tones.
  // Keeps the brand accent for the largest wedge only.
  const shadeFor = (i) => {
    if (i === 0) return p.accent;
    const tones = [p.fg, p.fgMuted, p.fgDim, p.lineStrong, p.line];
    return tones[(i - 1) % tones.length];
  };
  const inkFor = (i) => (i === 0 ? p.accentInk : p.bg);

  // Donut slice path (annular sector).
  const slicePath = (a0, a1, rO, rI) => {
    const x0o = cx + rO * Math.cos(a0), y0o = cy + rO * Math.sin(a0);
    const x1o = cx + rO * Math.cos(a1), y1o = cy + rO * Math.sin(a1);
    const x0i = cx + rI * Math.cos(a1), y0i = cy + rI * Math.sin(a1);
    const x1i = cx + rI * Math.cos(a0), y1i = cy + rI * Math.sin(a0);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0o} ${y0o}
            A ${rO} ${rO} 0 ${large} 1 ${x1o} ${y1o}
            L ${x0i} ${y0i}
            A ${rI} ${rI} 0 ${large} 0 ${x1i} ${y1i} Z`;
  };

  const pct = Math.round((spent / budget) * 100);
  const numFs = Math.min(size * 0.13, innerR * 0.55);
  const sel = selected != null ? slices.find((s) => s.cat === selected) : null;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* faint track */}
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2}
          fill="none" stroke={p.line} strokeWidth={outerR - innerR} />
        {slices.map((s) => {
          const isSel = selected === s.cat;
          const rO = isSel ? outerR + 2 : outerR;
          const rI = isSel ? innerR - 1 : innerR;
          return (
            <path key={s.cat} d={slicePath(s.a0, s.a1, rO, rI)}
              fill={shadeFor(s.i)}
              stroke={p.bg} strokeWidth={1.5}
              opacity={selected && !isSel ? 0.35 : 1}
              style={{ cursor: onSelect ? 'pointer' : 'default', transition: 'opacity 160ms' }}
              onMouseEnter={onSelect ? () => onSelect(s.cat) : undefined}
              onMouseLeave={onSelect ? () => onSelect(null) : undefined} />
          );
        })}
        {/* inner circle divider */}
        <circle cx={cx} cy={cy} r={innerR} fill={p.bg} />
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={p.line} strokeWidth={1} />
      </svg>
      {/* center label */}
      <div style={{
        position: 'absolute', left: cx - innerR + 4, top: cy - innerR + 4,
        width: (innerR - 4) * 2, height: (innerR - 4) * 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        textAlign: 'center',
      }}>
        {sel ? (
          <>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 9, color: p.fgDim,
              letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1,
            }}>{CAT_BY_ID[sel.cat]?.label || sel.cat}</div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: numFs, fontWeight: 500,
              color: p.fg, letterSpacing: '-0.04em', lineHeight: 1.05,
              marginTop: 4, fontVariantNumeric: 'tabular-nums',
            }}>£{Math.round(sel.amount).toLocaleString()}</div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 9, color: p.fgMuted,
              marginTop: 4, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            }}>{Math.round(sel.share * 100)}% of spend</div>
          </>
        ) : (
          <>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 9, color: p.fgDim,
              letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1,
            }}>spent</div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: numFs, fontWeight: 500,
              color: p.fg, letterSpacing: '-0.04em', lineHeight: 1.05,
              marginTop: 4, fontVariantNumeric: 'tabular-nums',
            }}>£{Math.round(spent).toLocaleString()}</div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 9, color: p.fgMuted,
              marginTop: 4, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            }}>{pct}% of £{budget.toLocaleString()}</div>
          </>
        )}
      </div>
    </div>
  );
}

// Wrapper that selects the viz style.
function CategoryViz({ vizStyle = 'pie', ...rest }) {
  if (vizStyle === 'rings') return <SegmentedRadial {...rest} />;
  return <PieViz {...rest} />;
}

// ── Amount display (big number, with mono tabular nums) ────────────────────
function Amount({ value, size = 44, palette, positive, negative, mono = true }) {
  const p = palette;
  const color = positive ? p.pos : negative ? p.neg : p.fg;
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const abs = Math.abs(value);
  return (
    <span style={{
      fontFamily: mono ? FONT_MONO : FONT_DISPLAY,
      fontSize: size, fontWeight: 500, color,
      letterSpacing: '-0.04em', lineHeight: 1,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {sign}£{abs.toLocaleString(undefined, { minimumFractionDigits: abs % 1 ? 2 : 0, maximumFractionDigits: 2 })}
    </span>
  );
}

// ── Primary (+ / −) button ─────────────────────────────────────────────────
function PlusMinusButton({ kind, palette, onClick, size = 72 }) {
  const p = palette;
  const isPlus = kind === '+';
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      background: isPlus ? p.accent : p.surface2,
      color: isPlus ? p.accentInk : p.fg,
      border: isPlus ? 'none' : `1px solid ${p.lineStrong}`,
      fontFamily: FONT_DISPLAY, fontSize: size * 0.5, fontWeight: 400,
      cursor: 'pointer', boxShadow: isPlus ? `0 10px 30px -6px ${p.accent}55` : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      lineHeight: 1, paddingBottom: isPlus ? 4 : 6,
      transition: 'transform 120ms',
    }}
    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(.94)'}
    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      {isPlus ? '+' : '−'}
    </button>
  );
}

Object.assign(window, { CategoryChip, AIMark, SegmentedRadial, PieViz, CategoryViz, Amount, PlusMinusButton });
