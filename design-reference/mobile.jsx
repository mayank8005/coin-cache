// mobile.jsx — mobile home screen + add-expense sheet

// ── HOME ───────────────────────────────────────────────────────────────────
function MobileHome({ palette, aiAccent, chipStyle, catRep = 'mono', vizStyle = 'pie', aiOnline, onOpenAdd, onOpenSub, view = 'home' }) {
  const p = palette;
  const spent = MONTH_SPENT;
  const [hoverCat, setHoverCat] = React.useState(null);
  const recent = TRANSACTIONS.slice(0, 5);

  return (
    <div style={{
      width: '100%', height: '100%', background: p.bg, color: p.fg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: FONT_DISPLAY,
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '58px 20px 8px',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            April · Week 4
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.03em', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Hartley household
          </div>
        </div>
        <div style={{
          flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px',
          border: `1px solid ${p.line}`, borderRadius: 999,
          fontFamily: FONT_MONO, fontSize: 10, color: aiOnline ? p.fgMuted : p.fgDim,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 3,
            background: aiOnline ? p.accent : p.fgDim,
            flexShrink: 0,
          }} />
          {aiOnline ? 'ai on' : 'offline'}
        </div>
      </div>

      {/* Radial */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 6px' }}>
        <CategoryViz vizStyle={vizStyle} totals={MONTH_TOTALS} palette={p} size={248}
          spent={spent} budget={MONTH_BUDGET}
          selected={hoverCat} onSelect={setHoverCat} />
      </div>

      {/* Balance line */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        padding: '4px 24px 12px',
      }}>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Left to spend
          </div>
          <Amount value={MONTH_BUDGET - spent} size={26} palette={p} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Income
          </div>
          <Amount value={MONTH_INCOME} size={18} palette={p} mono={true} />
        </div>
      </div>

      {/* AI monthly summary card (only when online) */}
      {aiOnline && (
        <div style={{ padding: '0 16px 14px' }}>
          <AIMark variant={aiAccent === 'tint' ? 'tint' : 'tint'} palette={p}>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: p.fg, maxWidth: '92%' }}>
              {aiAccent === 'underline' ? (
                <AIMark variant="underline" palette={p}>{AI_INSIGHTS.summary}</AIMark>
              ) : aiAccent === 'glyph' ? (
                <><span style={{ color: p.aiLine, fontFamily: FONT_MONO, letterSpacing: 2 }}>·· </span>{AI_INSIGHTS.summary}</>
              ) : (
                AI_INSIGHTS.summary
              )}
            </div>
          </AIMark>
        </div>
      )}
      {!aiOnline && (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            border: `1px dashed ${p.line}`, fontFamily: FONT_MONO,
            fontSize: 11, color: p.fgDim, letterSpacing: '0.02em',
          }}>
            ·· ai offline — insights will return when the server is back
          </div>
        </div>
      )}

      {/* Category strip */}
      <div style={{ padding: '4px 0 14px' }}>
        <div style={{
          display: 'flex', gap: 12, padding: '0 20px', overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {CATEGORIES.slice(0, 9).map((c) => (
            <div key={c.id} style={{ flexShrink: 0 }}>
              <CategoryChip cat={c} palette={p} style={chipStyle} representation={catRep} size={60} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 120px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          padding: '6px 0 10px', borderTop: `1px solid ${p.line}`,
        }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Recent
          </div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 11, color: p.accent,
            letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
          }}>
            See all {TRANSACTIONS.length} →
          </div>
        </div>
        {recent.map((t) => <TxnRow key={t.id} t={t} palette={p} aiAccent={aiAccent} aiOnline={aiOnline} />)}
      </div>

      {/* Bottom dock: + / − + NL input */}
      <BottomDock palette={p} onAdd={onOpenAdd} onSub={onOpenSub} aiOnline={aiOnline} />
    </div>
  );
}

// ── Transaction row ─────────────────────────────────────────────────────────
function TxnRow({ t, palette, aiAccent, aiOnline }) {
  const p = palette;
  const cat = CAT_BY_ID[t.cat];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: `1px solid ${p.line}`,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        border: `1px solid ${p.lineStrong}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT_MONO, fontSize: 10, color: p.fg,
        flexShrink: 0,
      }}>{cat.mono}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {t.ai && aiOnline && aiAccent === 'underline'
            ? <AIMark variant="underline" palette={p}>{t.note}</AIMark>
            : t.note}
          {t.flagged && aiOnline && (
            <span style={{
              marginLeft: 8, fontFamily: FONT_MONO, fontSize: 9,
              color: p.aiLine, letterSpacing: '0.1em',
            }}>·· CHECK</span>
          )}
        </div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
          letterSpacing: '0.04em', marginTop: 2,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span>{t.when}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{cat.label.toLowerCase()}</span>
          {t.acct && ACCT_BY_ID[t.acct] && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: ACCT_BY_ID[t.acct].color,
                }} />
                <span style={{ color: p.fgMuted }}>{ACCT_BY_ID[t.acct].label.toLowerCase()}</span>
              </span>
            </>
          )}
          {t.ai && aiOnline && aiAccent === 'glyph' && (
            <span style={{ color: p.aiLine }}>·· ai {Math.round(t.conf * 100)}</span>
          )}
        </div>
      </div>
      <Amount value={t.amount} size={15} palette={p} positive={t.income} />
    </div>
  );
}

// ── Bottom dock (sticky) ───────────────────────────────────────────────────
function BottomDock({ palette, onAdd, onSub, aiOnline }) {
  const p = palette;
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '0 16px 28px',
      background: `linear-gradient(to top, ${p.bg} 70%, transparent)`,
    }}>
      {/* NL input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderRadius: 12,
        background: p.surface,
        border: `1px solid ${p.line}`,
        marginBottom: 12,
      }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10,
          color: aiOnline ? p.aiLine : p.fgDim,
          letterSpacing: '0.12em',
        }}>··</span>
        <div style={{
          flex: 1, fontFamily: FONT_MONO, fontSize: 13,
          color: aiOnline ? p.fgMuted : p.fgDim,
        }}>
          {aiOnline ? '“lunch 14 with sara”' : 'add a note…'}
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: `1px solid ${p.lineStrong}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <rect x="3" y="1" width="6" height="9" rx="3" stroke={p.fgMuted} strokeWidth="1.2"/>
            <path d="M1 8 a5 5 0 0 0 10 0 M6 13 v2" stroke={p.fgMuted} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* +/− row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16,
      }}>
        <PlusMinusButton kind="−" palette={p} onClick={onSub} size={64} />
        <div style={{
          flex: 1, textAlign: 'center', fontFamily: FONT_MONO, fontSize: 10,
          color: p.fgDim, letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          tap to add · hold for voice
        </div>
        <PlusMinusButton kind="+" palette={p} onClick={onAdd} size={72} />
      </div>
    </div>
  );
}

// ── ADD EXPENSE SHEET ──────────────────────────────────────────────────────
function AddExpenseSheet({ palette, aiAccent, chipStyle, catRep = 'mono', aiOnline, onClose, kind = '-' }) {
  const p = palette;
  const [amount, setAmount] = React.useState('14');
  const [selectedCat, setSelectedCat] = React.useState('food');
  const [note, setNote] = React.useState('Lunch with Sara');
  const [selectedAcct, setSelectedAcct] = React.useState('amex');

  // AI suggestion rule: "lunch with sara" → food (already selected);
  // show alternative suggestion if note hints otherwise.
  const suggestion = React.useMemo(() => {
    if (!aiOnline) return null;
    const n = note.toLowerCase();
    if (n.includes('waitrose') || n.includes('tesco') || n.includes('groceries')) {
      return { catId: 'groc', conf: 0.98, reason: 'supermarket keyword' };
    }
    if (n.includes('lunch') || n.includes('dinner') || n.includes('thai') || n.includes('café')) {
      return { catId: 'food', conf: 0.93, reason: 'meal keyword' };
    }
    if (n.includes('uber') || n.includes('metro') || n.includes('train')) {
      return { catId: 'trans', conf: 0.89, reason: 'transport keyword' };
    }
    return null;
  }, [note, aiOnline]);

  return (
    <div style={{
      width: '100%', height: '100%', background: p.bg, color: p.fg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: FONT_DISPLAY,
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '58px 16px 8px', gap: 8,
      }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: 0, padding: 0,
          fontFamily: FONT_MONO, fontSize: 11, color: p.fgMuted,
          letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>← Cancel</button>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {kind === '+' ? 'Income' : 'Expense'}
        </div>
        <button style={{
          background: p.accent, color: p.accentInk, border: 0,
          padding: '8px 14px', borderRadius: 999,
          fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500,
          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        }}>Save</button>
      </div>

      {/* Amount display */}
      <div style={{
        padding: '22px 20px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 14,
      }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>{kind === '+' ? 'Receive' : 'Spend'}</div>
        <div style={{
          fontFamily: FONT_DISPLAY, fontSize: 60, fontWeight: 500,
          color: kind === '+' ? p.pos : p.fg,
          letterSpacing: '-0.05em', lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>{kind === '+' ? '+' : '−'}£{amount || '0'}</div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="add a note…"
          style={{
            display: 'block',
            fontFamily: FONT_MONO, fontSize: 12, color: p.fg,
            background: 'transparent',
            border: `1px solid ${p.line}`, borderRadius: 999,
            padding: '6px 16px', textAlign: 'center',
            outline: 0, width: '65%',
          }}
        />
      </div>

      {/* Account picker — horizontal scroll pills */}
      <div style={{ padding: '6px 16px 0' }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9, color: p.fgDim,
          letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6,
        }}>Account</div>
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          scrollbarWidth: 'none', paddingBottom: 4,
        }}>
          {ACCOUNTS.map((a) => {
            const sel = selectedAcct === a.id;
            return (
              <button key={a.id} onClick={() => setSelectedAcct(a.id)} style={{
                flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 12px 6px 6px', borderRadius: 999,
                background: sel ? p.surface : 'transparent',
                border: `1px solid ${sel ? a.color : p.line}`,
                cursor: 'pointer', fontFamily: FONT_DISPLAY, fontSize: 12,
                color: sel ? p.fg : p.fgMuted,
                transition: 'all 160ms',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: a.color, color: '#0B0B0C',
                  fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600,
                  letterSpacing: '-0.02em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{a.mono}</span>
                {a.label}
                {a.last4 && <span style={{
                  fontFamily: FONT_MONO, fontSize: 9, color: p.fgDim,
                  marginLeft: 2, letterSpacing: '0.04em',
                }}>·{a.last4.slice(-4)}</span>}
              </button>
            );
          })}
          <button style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 999,
            background: 'transparent', border: `1px dashed ${p.lineStrong}`,
            color: p.fgMuted, cursor: 'pointer',
            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.06em',
          }}>+ new</button>
        </div>
      </div>

      {/* AI suggestion bar */}
      {aiOnline && suggestion && suggestion.catId !== selectedCat && (
        <div style={{ padding: '10px 16px 0' }}>
          <AIMark variant="tint" palette={p}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontSize: 12, lineHeight: 1.4 }}>
                Looks like <b>{CAT_BY_ID[suggestion.catId].label}</b>
                <span style={{ color: p.fgMuted }}> — {suggestion.reason}</span>
              </div>
              <button onClick={() => setSelectedCat(suggestion.catId)} style={{
                background: p.accent, color: p.accentInk, border: 0,
                padding: '5px 10px', borderRadius: 999,
                fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 500, cursor: 'pointer',
              }}>Use</button>
            </div>
          </AIMark>
        </div>
      )}

      {/* Category grid */}
      <div style={{ padding: '20px 20px 10px', flex: 1, overflow: 'auto' }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
          letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14,
        }}>Category</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14,
          rowGap: 18,
        }}>
          {CATEGORIES.map((c) => {
            const isSel = selectedCat === c.id;
            const isSugg = aiOnline && suggestion?.catId === c.id && !isSel;
            return (
              <div key={c.id} style={{
                display: 'flex', justifyContent: 'center', position: 'relative',
              }}>
                <CategoryChip cat={c} palette={p} selected={isSel} size={54}
                  style={chipStyle === 'mono' ? 'rings' : chipStyle}
                  representation={catRep}
                  onClick={() => setSelectedCat(c.id)} />
                {isSugg && (
                  <div style={{
                    position: 'absolute', top: -4, right: 6,
                    width: 10, height: 10, borderRadius: 5,
                    background: p.aiLine, boxShadow: `0 0 0 2px ${p.bg}`,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Numpad */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
        background: p.line, padding: '1px 0',
      }}>
        {['1','2','3','4','5','6','7','8','9','.','0','⌫'].map((k) => (
          <button key={k} onClick={() => {
            if (k === '⌫') setAmount(amount.slice(0, -1));
            else setAmount(amount + k);
          }} style={{
            height: 54, background: p.bg, color: p.fg, border: 0,
            fontFamily: FONT_MONO, fontSize: 22, fontWeight: 500, cursor: 'pointer',
            letterSpacing: '-0.02em',
          }}>{k}</button>
        ))}
      </div>

      {/* Home indicator area */}
      <div style={{ height: 34 }} />
    </div>
  );
}

// ── ALL TRANSACTIONS ───────────────────────────────────────────────────────
function AllTransactions({ palette, aiAccent, aiOnline, onClose }) {
  const p = palette;
  const [filter, setFilter] = React.useState('all'); // all | expense | income | flagged
  const [acctFilter, setAcctFilter] = React.useState('any');
  const [query, setQuery] = React.useState('');
  const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  const MONTH_LABELS = { Nov: 'November 2025', Dec: 'December 2025', Jan: 'January 2026', Feb: 'February 2026', Mar: 'March 2026', Apr: 'April 2026' };
  const MONTH_FAKE_TOTAL = { Nov: 2148.23, Dec: 3042.91, Jan: 2286.55, Feb: 1972.40, Mar: 2314.08, Apr: null };
  const [month, setMonth] = React.useState('Apr');

  const filtered = React.useMemo(() => {
    // Other months: show an empty list with a fake stat — data only exists for April
    if (month !== 'Apr') return [];
    return TRANSACTIONS.filter((t) => {
      if (filter === 'expense' && t.amount > 0) return false;
      if (filter === 'income' && t.amount < 0) return false;
      if (filter === 'flagged' && !t.flagged && !(t.ai && t.conf < 0.9)) return false;
      if (acctFilter !== 'any' && t.acct !== acctFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const cat = CAT_BY_ID[t.cat];
        if (!t.note.toLowerCase().includes(q) && !cat.label.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [filter, query, month, acctFilter]);

  // Group by day
  const groups = React.useMemo(() => {
    const m = new Map();
    filtered.forEach((t) => {
      const day = t.when.split(' · ')[0];
      if (!m.has(day)) m.set(day, { day, items: [], total: 0 });
      const g = m.get(day);
      g.items.push(t);
      if (t.amount < 0) g.total += Math.abs(t.amount);
    });
    return [...m.values()];
  }, [filtered]);

  const total = month === 'Apr'
    ? filtered.reduce((s, t) => s + (t.amount < 0 ? Math.abs(t.amount) : 0), 0)
    : MONTH_FAKE_TOTAL[month];

  return (
    <div style={{
      width: '100%', height: '100%', background: p.bg, color: p.fg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: FONT_DISPLAY,
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '58px 16px 10px', gap: 8,
      }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: 0, padding: 0,
          fontFamily: FONT_MONO, fontSize: 11, color: p.fgMuted,
          letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>← Home</button>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>{MONTH_LABELS[month]}</div>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: `1px solid ${p.lineStrong}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_MONO, fontSize: 13, color: p.fgMuted,
        }}>⌕</div>
      </div>

      {/* Month strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 12px 6px',
      }}>
        <button
          onClick={() => {
            const i = MONTHS.indexOf(month);
            if (i > 0) setMonth(MONTHS[i - 1]);
          }}
          disabled={MONTHS.indexOf(month) === 0}
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'transparent', color: p.fgMuted,
            border: `1px solid ${p.line}`, cursor: 'pointer',
            fontFamily: FONT_MONO, fontSize: 14, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            opacity: MONTHS.indexOf(month) === 0 ? 0.3 : 1,
          }}>‹</button>
        <div style={{
          display: 'flex', gap: 4, flex: 1, overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {MONTHS.map((m) => {
            const sel = m === month;
            return (
              <button key={m} onClick={() => setMonth(m)} style={{
                padding: '6px 12px', borderRadius: 8,
                background: sel ? p.fg : 'transparent',
                color: sel ? p.bg : p.fgMuted,
                border: `1px solid ${sel ? p.fg : p.line}`,
                fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500,
                letterSpacing: '0.04em', cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>{m.toUpperCase()}</button>
            );
          })}
        </div>
        <button
          onClick={() => {
            const i = MONTHS.indexOf(month);
            if (i < MONTHS.length - 1) setMonth(MONTHS[i + 1]);
          }}
          disabled={MONTHS.indexOf(month) === MONTHS.length - 1}
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'transparent', color: p.fgMuted,
            border: `1px solid ${p.line}`, cursor: 'pointer',
            fontFamily: FONT_MONO, fontSize: 14, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            opacity: MONTHS.indexOf(month) === MONTHS.length - 1 ? 0.3 : 1,
          }}>›</button>
      </div>

      {/* Stat line */}
      <div style={{ padding: '4px 20px 14px' }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>{month === 'Apr' ? `${filtered.length} transactions` : 'archived month'}</div>
        <div style={{
          fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 500,
          color: p.fg, letterSpacing: '-0.04em', lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums', marginTop: 4,
        }}>£{(total || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 10px' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, categories…"
          style={{
            width: '100%', padding: '10px 14px',
            background: p.surface, border: `1px solid ${p.line}`,
            borderRadius: 10, color: p.fg, outline: 0,
            fontFamily: FONT_MONO, fontSize: 12,
          }}
        />
      </div>

      {/* Filter chips */}
      <div style={{
        display: 'flex', gap: 6, padding: '0 16px 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {[
          { id: 'all',      label: 'All' },
          { id: 'expense',  label: 'Expense' },
          { id: 'income',   label: 'Income' },
          { id: 'flagged',  label: aiOnline ? '·· Flagged' : 'Flagged' },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
            whiteSpace: 'nowrap',
            background: filter === f.id ? p.accent : 'transparent',
            color: filter === f.id ? p.accentInk : p.fgMuted,
            border: `1px solid ${filter === f.id ? p.accent : p.line}`,
            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.04em',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Account filter row */}
      <div style={{
        display: 'flex', gap: 6, padding: '0 16px 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        <button onClick={() => setAcctFilter('any')} style={{
          padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
          whiteSpace: 'nowrap', flexShrink: 0,
          background: acctFilter === 'any' ? p.fg : 'transparent',
          color: acctFilter === 'any' ? p.bg : p.fgMuted,
          border: `1px solid ${acctFilter === 'any' ? p.fg : p.line}`,
          fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.04em',
        }}>Any account</button>
        {ACCOUNTS.map((a) => {
          const sel = acctFilter === a.id;
          return (
            <button key={a.id} onClick={() => setAcctFilter(a.id)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px 4px 4px', borderRadius: 999, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
              background: sel ? p.surface : 'transparent',
              color: sel ? p.fg : p.fgMuted,
              border: `1px solid ${sel ? a.color : p.line}`,
              fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.04em',
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: a.color, color: '#0B0B0C',
                fontFamily: FONT_MONO, fontSize: 8, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{a.mono}</span>
              {a.label}
            </button>
          );
        })}
      </div>

      {/* Grouped list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 120px' }}>
        {groups.map((g) => (
          <div key={g.day}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '14px 0 4px', borderTop: `1px solid ${p.line}`,
            }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
                letterSpacing: '0.14em', textTransform: 'uppercase',
              }}>{g.day}</div>
              {g.total > 0 && (
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 11, color: p.fgMuted,
                  fontVariantNumeric: 'tabular-nums',
                }}>−£{g.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              )}
            </div>
            {g.items.map((t) => <TxnRow key={t.id} t={t} palette={p} aiAccent={aiAccent} aiOnline={aiOnline} />)}
          </div>
        ))}
        {groups.length === 0 && (
          <div style={{
            padding: '40px 0', textAlign: 'center',
            fontFamily: FONT_MONO, fontSize: 12, color: p.fgDim,
          }}>{month !== 'Apr' ? 'Tap a category on the pie to drill in —\n data archived' : 'No matches'}</div>
        )}
      </div>

      {/* Bottom indicator only (no dock here) */}
    </div>
  );
}

// ── NEW CATEGORY SHEET ─────────────────────────────────────────────────────
function NewCategorySheet({ palette, aiAccent, aiOnline, catRep = 'mono', onClose }) {
  const p = palette;
  const [name, setName] = React.useState('Coffee');
  const [mono, setMono] = React.useState('CF');
  const [iconId, setIconId] = React.useState('food');
  const [kind, setKind] = React.useState('expense'); // expense | income
  const [budget, setBudget] = React.useState('60');
  const [color, setColor] = React.useState(p.accent);

  // Palette swatches (palette-aware: pulls from fg/accent and a curated secondary ramp)
  const swatches = Array.from(new Set([
    p.accent,
    '#E8462B', '#2540F2', '#3F6B3A', '#6B2149',
    '#3DE0E0', '#FF4D7A', '#FFB27A', '#F6F02E',
    p.fg,
  ]));

  // Icon choices — reuse catIcon glyphs
  const iconChoices = ['food','rent','groc','trans','bills','fun','health','kids','home','gifts','subs','misc'];

  // Auto-derive mono code from name (2 uppercase chars)
  React.useEffect(() => {
    if (!name) return;
    const parts = name.trim().split(/\s+/);
    const code = parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
    setMono(code);
  }, [name]);

  const aiSuggestedIcon = aiOnline && /coffee|latte|brew|espresso/i.test(name)
    ? 'food' : null;

  return (
    <div style={{
      width: '100%', height: '100%', background: p.bg, color: p.fg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: FONT_DISPLAY,
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '58px 16px 10px',
      }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: 0, padding: 0,
          fontFamily: FONT_MONO, fontSize: 11, color: p.fgMuted,
          letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
        }}>← Cancel</button>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>New category</div>
        <button style={{
          background: p.accent, color: p.accentInk, border: 0,
          padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
          fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>Save</button>
      </div>

      {/* Live preview — the chip as it will appear */}
      <div style={{
        margin: '8px 16px 18px', padding: '22px 16px',
        background: p.surface, border: `1px solid ${p.line}`,
        borderRadius: 14, display: 'flex', alignItems: 'center',
        gap: 14,
      }}>
        {/* Preview chip */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          border: `1.5px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: p.accentInk,
          }}>
            {catRep === 'icon'
              ? catIcon(iconId, p.accentInk, 24)
              : <span style={{
                  fontFamily: FONT_MONO, fontSize: 17, fontWeight: 500,
                  color: p.accentInk, letterSpacing: '-0.03em',
                }}>{mono}</span>
            }
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 9, color: p.fgDim,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>preview</div>
          <div style={{
            fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 500,
            letterSpacing: '-0.02em', marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{name || 'Untitled'}</div>
          <div style={{
            display: 'flex', gap: 6, marginTop: 4, alignItems: 'center',
            fontFamily: FONT_MONO, fontSize: 10, color: p.fgMuted,
          }}>
            <span>{kind === 'expense' ? '−' : '+'} £{budget || '0'}/mo</span>
            <span style={{ color: p.fgDim }}>·</span>
            <span style={{ color: p.fgDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{mono}</span>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 120px' }}>
        {/* Name */}
        <FieldLabel palette={p}>Name</FieldLabel>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px', background: p.surface,
            border: `1px solid ${p.line}`, borderRadius: 10, color: p.fg,
            outline: 0, fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        />

        {/* Kind */}
        <FieldLabel palette={p} style={{ marginTop: 16 }}>Type</FieldLabel>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'expense', label: '− Expense' },
            { id: 'income',  label: '+ Income' },
          ].map((k) => {
            const sel = kind === k.id;
            return (
              <button key={k.id} onClick={() => setKind(k.id)} style={{
                flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                background: sel ? p.fg : 'transparent',
                color: sel ? p.bg : p.fgMuted,
                border: `1px solid ${sel ? p.fg : p.line}`,
                fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500,
              }}>{k.label}</button>
            );
          })}
        </div>

        {/* Icon picker */}
        <FieldLabel palette={p} style={{ marginTop: 16 }}>
          Icon
          {aiSuggestedIcon && (
            <span style={{
              marginLeft: 8, fontFamily: FONT_MONO, fontSize: 9,
              color: p.aiLine, letterSpacing: '0.12em',
            }}>·· suggested</span>
          )}
        </FieldLabel>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8,
        }}>
          {iconChoices.map((id) => {
            const sel = iconId === id;
            const isSugg = aiSuggestedIcon === id && id !== iconId;
            return (
              <button key={id} onClick={() => setIconId(id)} style={{
                aspectRatio: '1', borderRadius: 10, cursor: 'pointer',
                background: sel ? p.fg : 'transparent',
                color: sel ? p.bg : p.fg,
                border: `1px solid ${sel ? p.fg : (isSugg ? p.aiLine : p.line)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                {catIcon(id, sel ? p.bg : p.fg, 20)}
                {isSugg && (
                  <span style={{
                    position: 'absolute', top: 3, right: 4,
                    fontFamily: FONT_MONO, fontSize: 8, color: p.aiLine,
                    letterSpacing: '0.1em',
                  }}>··</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Color picker */}
        <FieldLabel palette={p} style={{ marginTop: 16 }}>Color</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {swatches.map((c, i) => {
            const sel = color === c;
            return (
              <button key={`${c}-${i}`} onClick={() => setColor(c)} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: c, cursor: 'pointer',
                border: sel ? `2px solid ${p.fg}` : `1px solid ${p.line}`,
                outline: sel ? `2px solid ${p.bg}` : 'none',
                outlineOffset: sel ? -4 : 0,
              }} />
            );
          })}
        </div>

        {/* Mono code */}
        <FieldLabel palette={p} style={{ marginTop: 16 }}>Mono code</FieldLabel>
        <input
          value={mono}
          onChange={(e) => setMono(e.target.value.slice(0, 3).toUpperCase())}
          style={{
            width: 120, padding: '10px 14px', background: p.surface,
            border: `1px solid ${p.line}`, borderRadius: 10, color: p.fg,
            outline: 0, fontFamily: FONT_MONO, fontSize: 15, fontWeight: 500,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        />
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
          marginTop: 4, letterSpacing: '0.08em',
        }}>2–3 chars. Auto-derived from name.</div>

        {/* Monthly budget */}
        <FieldLabel palette={p} style={{ marginTop: 16 }}>Monthly budget</FieldLabel>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: p.surface, border: `1px solid ${p.line}`,
          borderRadius: 10, padding: '0 14px',
        }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: p.fgMuted, fontWeight: 500 }}>£</span>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            style={{
              flex: 1, padding: '12px 8px', background: 'transparent',
              border: 0, color: p.fg, outline: 0,
              fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: p.fgDim, letterSpacing: '0.06em' }}>/ month</span>
        </div>

        {/* AI insight */}
        {aiOnline && (
          <div style={{
            marginTop: 18, padding: '12px 14px',
            background: p.aiTint, border: `1px dashed ${p.aiLine}`,
            borderRadius: 10,
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, color: p.aiLine,
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>·· Pattern found</div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: 13, color: p.fg,
              marginTop: 6, lineHeight: 1.4, textWrap: 'pretty',
            }}>
              Seven "Pret", "Grind" and "Costa" entries are tagged <span style={{ color: p.fgMuted }}>Fun</span> this month (£43.80 total). Move them to <span style={{ fontWeight: 600 }}>{name || 'this category'}</span>?
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button style={{
                padding: '6px 12px', borderRadius: 999,
                background: p.fg, color: p.bg, border: 0, cursor: 'pointer',
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.08em',
                textTransform: 'uppercase', fontWeight: 600,
              }}>Move 7</button>
              <button style={{
                padding: '6px 12px', borderRadius: 999,
                background: 'transparent', color: p.fgMuted,
                border: `1px solid ${p.line}`, cursor: 'pointer',
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>Skip</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldLabel({ palette, children, style }) {
  return (
    <div style={{
      fontFamily: FONT_MONO, fontSize: 10, color: palette.fgDim,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      marginBottom: 8, display: 'flex', alignItems: 'center',
      ...style,
    }}>{children}</div>
  );
}

// ── LOGIN SCREEN ───────────────────────────────────────────────────────────
// Self-hosted family app → pick a household member, enter PIN.
// Shows server + AI-online status so it feels like a home server, not SaaS.
function LoginScreen({ palette, aiAccent, aiOnline, onUnlock }) {
  const p = palette;
  const [selectedId, setSelectedId] = React.useState('a');
  const [pin, setPin] = React.useState('');
  const [shake, setShake] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState(false);
  const CORRECT = '2468';

  const member = HOUSEHOLD.members.find((m) => m.id === selectedId);

  const addDigit = (d) => {
    if (pin.length >= 4 || unlocked) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      // brief pause, then evaluate
      setTimeout(() => {
        if (next === CORRECT) {
          setUnlocked(true);
        } else {
          setShake(true);
          setTimeout(() => { setShake(false); setPin(''); }, 380);
        }
      }, 150);
    }
  };
  const delDigit = () => setPin((s) => s.slice(0, -1));

  const dots = [0, 1, 2, 3].map((i) => {
    const filled = i < pin.length;
    const ok = unlocked;
    return (
      <div key={i} style={{
        width: 14, height: 14, borderRadius: '50%',
        background: filled ? (ok ? p.pos : p.fg) : 'transparent',
        border: `1.5px solid ${filled ? (ok ? p.pos : p.fg) : p.lineStrong}`,
        transition: 'all 180ms cubic-bezier(.3,.7,.4,1)',
      }} />
    );
  });

  const KEYS = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']];

  return (
    <div style={{
      width: '100%', height: '100%', background: p.bg, color: p.fg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: FONT_DISPLAY, position: 'relative',
    }}>
      {/* Subtle grid texture */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${p.line} 1px, transparent 1px), linear-gradient(90deg, ${p.line} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
        opacity: 0.5, pointerEvents: 'none',
      }} />

      {/* Top status line — server + AI */}
      <div style={{
        padding: '58px 20px 0', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: p.pos,
            boxShadow: `0 0 6px ${p.pos}`,
          }} />
          {HOUSEHOLD.server}
        </div>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: aiOnline ? p.aiLine : p.fgDim,
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          {aiOnline ? '·· ai ready' : 'ai offline'}
        </div>
      </div>

      {/* Household logotype */}
      <div style={{
        padding: '32px 24px 6px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>Household</div>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4,
        }}>
          <div style={{
            fontFamily: FONT_DISPLAY, fontSize: 44, fontWeight: 500,
            color: p.fg, letterSpacing: '-0.04em', lineHeight: 1,
          }}>{HOUSEHOLD.name}</div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 11, color: p.accent,
            letterSpacing: '-0.02em',
          }}>budget</div>
        </div>
      </div>

      {/* Member picker — horizontal cards */}
      <div style={{
        padding: '18px 0 10px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          padding: '0 24px 10px',
          fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>Who's adding?</div>
        <div style={{
          display: 'flex', gap: 10, padding: '0 20px',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {HOUSEHOLD.members.map((m) => {
            const sel = selectedId === m.id;
            return (
              <button key={m.id} onClick={() => { setSelectedId(m.id); setPin(''); setUnlocked(false); }} style={{
                flexShrink: 0, width: 72, padding: '10px 6px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 8, cursor: 'pointer',
                background: sel ? p.surface : 'transparent',
                border: `1px solid ${sel ? p.lineStrong : 'transparent'}`,
                borderRadius: 14,
                transition: 'all 180ms',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: m.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_MONO, fontSize: 14, fontWeight: 600,
                  color: '#0B0B0C', letterSpacing: '-0.02em',
                  transform: sel ? 'scale(1.02)' : 'scale(0.9)',
                  opacity: sel ? 1 : 0.6,
                  transition: 'transform 180ms cubic-bezier(.3,.7,.4,1), opacity 180ms',
                  boxShadow: sel ? `0 6px 20px -6px ${m.color}aa` : 'none',
                }}>{m.initials}</div>
                <div style={{
                  fontFamily: FONT_DISPLAY, fontSize: 12, fontWeight: 500,
                  color: sel ? p.fg : p.fgMuted,
                }}>{m.name}</div>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 9, color: p.fgDim,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  marginTop: -4,
                }}>{m.role}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PIN section */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '10px 28px 24px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Greeting */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
            letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>
            {unlocked ? '·· unlocking' : (pin.length === 4 && !unlocked ? 'try again' : 'enter pin')}
          </div>
          <div style={{
            fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 500,
            color: p.fg, letterSpacing: '-0.01em', marginTop: 4,
          }}>Hi, {member.name}</div>
        </div>

        {/* Dots */}
        <div style={{
          display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 22,
          animation: shake ? 'budgetshake 0.38s cubic-bezier(.3,.7,.4,1)' : 'none',
        }}>
          {dots}
        </div>

        {/* Keypad */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        }}>
          {KEYS.flat().map((k, i) => {
            if (k === '') return <div key={i} />;
            if (k === '⌫') {
              return (
                <button key={i} onClick={delDigit} style={{
                  padding: '14px 0', borderRadius: 14,
                  background: 'transparent', border: `1px solid ${p.line}`,
                  color: p.fgMuted, cursor: 'pointer',
                  fontFamily: FONT_MONO, fontSize: 18, lineHeight: 1,
                }}>⌫</button>
              );
            }
            return (
              <button key={i} onClick={() => addDigit(k)} style={{
                padding: '14px 0', borderRadius: 14,
                background: p.surface, border: `1px solid ${p.line}`,
                color: p.fg, cursor: 'pointer',
                fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 500,
                letterSpacing: '-0.02em', lineHeight: 1,
                transition: 'all 100ms',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >{k}</button>
            );
          })}
        </div>

        {/* Tiny hint */}
        <div style={{
          marginTop: 14, textAlign: 'center',
          fontFamily: FONT_MONO, fontSize: 9, color: p.fgDim,
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          forgot pin? <span style={{ color: p.fgMuted, borderBottom: `1px dashed ${p.line}` }}>admin reset</span>
        </div>
      </div>

      {/* Shake keyframes (local) */}
      <style>{`
        @keyframes budgetshake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

// ── NEW ACCOUNT SHEET ──────────────────────────────────────────────────────
function NewAccountSheet({ palette, aiAccent, aiOnline, onClose }) {
  const p = palette;
  const [label, setLabel] = React.useState('Amex Gold');
  const [mono, setMono]   = React.useState('AX');
  const [last4, setLast4] = React.useState('1007');
  const [kind, setKind]   = React.useState('credit'); // current | credit | savings | cash
  const [color, setColor] = React.useState('#3DE0E0');
  const [balance, setBalance] = React.useState('2840.00');
  const [limit, setLimit]     = React.useState('5000');

  const swatches = Array.from(new Set([
    p.accent, '#D7FF3A', '#FFB27A', '#3DE0E0', '#FF4D7A',
    '#F6F02E', '#E8462B', '#2540F2', '#3F6B3A', p.fg,
  ]));

  const KINDS = [
    { id: 'current', label: '◉ Current' },
    { id: 'credit',  label: '◈ Credit' },
    { id: 'savings', label: '◧ Savings' },
    { id: 'cash',    label: '○ Cash' },
  ];

  // Auto-derive mono from label
  React.useEffect(() => {
    if (!label) return;
    const parts = label.trim().split(/\s+/);
    const code = parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : label.slice(0, 2).toUpperCase();
    setMono(code);
  }, [label]);

  const isCredit = kind === 'credit';
  const isCash   = kind === 'cash';

  return (
    <div style={{
      width: '100%', height: '100%', background: p.bg, color: p.fg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: FONT_DISPLAY,
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '58px 16px 10px',
      }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: 0, padding: 0,
          fontFamily: FONT_MONO, fontSize: 11, color: p.fgMuted,
          letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
        }}>← Cancel</button>
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>New account</div>
        <button style={{
          background: p.accent, color: p.accentInk, border: 0,
          padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
          fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>Save</button>
      </div>

      {/* Live card preview */}
      <div style={{ padding: '10px 16px 18px' }}>
        <div style={{
          position: 'relative',
          borderRadius: 14, padding: '18px 18px 16px',
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 60%, ${color}88 100%)`,
          color: '#0B0B0C',
          boxShadow: `0 10px 30px -8px ${color}66`,
          overflow: 'hidden',
        }}>
          {/* corner glyph */}
          <div aria-hidden style={{
            position: 'absolute', right: -20, bottom: -20,
            width: 120, height: 120, borderRadius: '50%',
            border: `1.5px solid rgba(11,11,12,0.15)`,
          }} />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.14em',
              textTransform: 'uppercase', opacity: 0.7,
            }}>{KINDS.find((k) => k.id === kind)?.label.replace(/^\S+\s/, '')}</div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
              letterSpacing: '0.08em',
            }}>{mono}</div>
          </div>
          <div style={{
            fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 500,
            letterSpacing: '-0.02em', marginTop: 22,
            textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
          }}>{label || 'Untitled'}</div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginTop: 6,
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.12em',
              opacity: 0.8,
            }}>{last4 ? `•••• ${last4.slice(-4).padStart(4, '•')}` : isCash ? 'no card' : '••••'}</div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600,
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
            }}>
              {isCredit ? '−' : ''}£{(balance || '0')}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 120px' }}>
        <FieldLabel palette={p}>Name</FieldLabel>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px', background: p.surface,
            border: `1px solid ${p.line}`, borderRadius: 10, color: p.fg,
            outline: 0, fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 500,
          }}
        />

        <FieldLabel palette={p} style={{ marginTop: 16 }}>Type</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {KINDS.map((k) => {
            const sel = kind === k.id;
            return (
              <button key={k.id} onClick={() => setKind(k.id)} style={{
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                background: sel ? p.fg : 'transparent',
                color: sel ? p.bg : p.fgMuted,
                border: `1px solid ${sel ? p.fg : p.line}`,
                fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500,
                textAlign: 'left',
              }}>{k.label}</button>
            );
          })}
        </div>

        {/* Last 4 (not for cash) */}
        {!isCash && (
          <>
            <FieldLabel palette={p} style={{ marginTop: 16 }}>Last 4 digits</FieldLabel>
            <input
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              style={{
                width: 140, padding: '10px 14px', background: p.surface,
                border: `1px solid ${p.line}`, borderRadius: 10, color: p.fg,
                outline: 0, fontFamily: FONT_MONO, fontSize: 15, fontWeight: 500,
                letterSpacing: '0.18em',
              }}
            />
          </>
        )}

        <FieldLabel palette={p} style={{ marginTop: 16 }}>Color</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {swatches.map((c, i) => {
            const sel = color === c;
            return (
              <button key={`${c}-${i}`} onClick={() => setColor(c)} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: c, cursor: 'pointer',
                border: sel ? `2px solid ${p.fg}` : `1px solid ${p.line}`,
                outline: sel ? `2px solid ${p.bg}` : 'none',
                outlineOffset: sel ? -4 : 0,
              }} />
            );
          })}
        </div>

        <FieldLabel palette={p} style={{ marginTop: 16 }}>Mono code</FieldLabel>
        <input
          value={mono}
          onChange={(e) => setMono(e.target.value.slice(0, 3).toUpperCase())}
          style={{
            width: 120, padding: '10px 14px', background: p.surface,
            border: `1px solid ${p.line}`, borderRadius: 10, color: p.fg,
            outline: 0, fontFamily: FONT_MONO, fontSize: 15, fontWeight: 500,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        />

        <FieldLabel palette={p} style={{ marginTop: 16 }}>
          {isCredit ? 'Current balance owed' : 'Starting balance'}
        </FieldLabel>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: p.surface, border: `1px solid ${p.line}`,
          borderRadius: 10, padding: '0 14px',
        }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: p.fgMuted, fontWeight: 500 }}>£</span>
          <input
            value={balance}
            onChange={(e) => setBalance(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            style={{
              flex: 1, padding: '12px 8px', background: 'transparent',
              border: 0, color: p.fg, outline: 0,
              fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
            }}
          />
        </div>

        {/* Credit-only: limit */}
        {isCredit && (
          <>
            <FieldLabel palette={p} style={{ marginTop: 16 }}>Credit limit</FieldLabel>
            <div style={{
              display: 'flex', alignItems: 'center',
              background: p.surface, border: `1px solid ${p.line}`,
              borderRadius: 10, padding: '0 14px',
            }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: p.fgMuted, fontWeight: 500 }}>£</span>
              <input
                value={limit}
                onChange={(e) => setLimit(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                style={{
                  flex: 1, padding: '12px 8px', background: 'transparent',
                  border: 0, color: p.fg, outline: 0,
                  fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
            </div>
            {/* utilization bar */}
            <div style={{
              marginTop: 8, height: 4, background: p.line, borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (parseFloat(balance) / parseFloat(limit || 1)) * 100)}%`,
                background: parseFloat(balance) / parseFloat(limit || 1) > 0.7 ? p.neg : color,
                transition: 'width 180ms',
              }} />
            </div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
              marginTop: 4, letterSpacing: '0.08em',
            }}>{Math.round((parseFloat(balance) / parseFloat(limit || 1)) * 100)}% utilized</div>
          </>
        )}

        {/* AI pattern-match card */}
        {aiOnline && (
          <div style={{
            marginTop: 18, padding: '12px 14px',
            background: p.aiTint, border: `1px dashed ${p.aiLine}`,
            borderRadius: 10,
          }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, color: p.aiLine,
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>·· Pattern found</div>
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: 13, color: p.fg,
              marginTop: 6, lineHeight: 1.4, textWrap: 'pretty',
            }}>
              {isCredit
                ? <>4 recurring charges look like <b>Amex Gold</b> cycles (Netflix, Spotify, Cloudflare). Auto-tag to this account going forward?</>
                : <>Import from Open Banking? Link <b>{label}</b> via your server's connector for auto-sync.</>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button style={{
                padding: '6px 12px', borderRadius: 999,
                background: p.fg, color: p.bg, border: 0, cursor: 'pointer',
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.08em',
                textTransform: 'uppercase', fontWeight: 600,
              }}>{isCredit ? 'Auto-tag' : 'Connect'}</button>
              <button style={{
                padding: '6px 12px', borderRadius: 999,
                background: 'transparent', color: p.fgMuted,
                border: `1px solid ${p.line}`, cursor: 'pointer',
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>Skip</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { MobileHome, AddExpenseSheet, TxnRow, AllTransactions, NewCategorySheet, LoginScreen, NewAccountSheet });
