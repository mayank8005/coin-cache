// desktop.jsx — responsive desktop layout

function DesktopLayout({ palette, aiAccent, chipStyle, catRep = 'mono', vizStyle = 'pie', aiOnline }) {
  const p = palette;
  const [selectedCat, setSelectedCat] = React.useState('food');
  const [hoverCat, setHoverCat] = React.useState(null);
  const [amount, setAmount] = React.useState('14');
  const [note, setNote] = React.useState('Lunch with Sara');

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: p.bg, color: p.fg,
      fontFamily: FONT_DISPLAY, display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: `1px solid ${p.line}`,
        gap: 20, flexWrap: 'nowrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7, background: p.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT_MONO, fontSize: 12, color: p.accentInk, fontWeight: 600,
            letterSpacing: '-0.05em',
          }}>£</div>
          <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            Ledger
            <span style={{ color: p.fgDim, fontFamily: FONT_MONO, fontSize: 10, marginLeft: 8, letterSpacing: '0.08em' }}>
              hartley.home
            </span>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 22, fontSize: 13, color: p.fgMuted, flexShrink: 0 }}>
          {['Month', 'History', 'Budgets', 'Accounts'].map((l, i) => (
            <span key={l} style={{
              color: i === 0 ? p.fg : p.fgMuted, fontWeight: i === 0 ? 500 : 400,
              borderBottom: i === 0 ? `1.5px solid ${p.accent}` : 'none',
              paddingBottom: 4, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{l}</span>
          ))}
        </nav>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px',
          border: `1px solid ${p.line}`, borderRadius: 999,
          fontFamily: FONT_MONO, fontSize: 10, color: aiOnline ? p.fgMuted : p.fgDim,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 3,
            background: aiOnline ? p.accent : p.fgDim, flexShrink: 0,
          }} />
          {aiOnline ? 'ai · local' : 'ai offline'}
        </div>
      </div>

      {/* Three-column body */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '320px minmax(0, 1fr) 320px',
        minHeight: 0,
      }}>
        {/* LEFT: ledger timeline */}
        <div style={{
          borderRight: `1px solid ${p.line}`, overflow: 'auto',
          padding: '22px 24px 40px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
              letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>Ledger · April</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: p.fgMuted }}>
              {TRANSACTIONS.length} txns
            </div>
          </div>

          {TRANSACTIONS.map((t, i) => (
            <div key={t.id}>
              {(i === 0 || TRANSACTIONS[i-1].when.split(' · ')[0] !== t.when.split(' · ')[0]) && (
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '14px 0 6px', borderTop: i === 0 ? 'none' : `1px solid ${p.line}`,
                }}>{t.when.split(' · ')[0]}</div>
              )}
              <TxnRow t={t} palette={p} aiAccent={aiAccent} aiOnline={aiOnline} />
            </div>
          ))}
        </div>

        {/* CENTER: hero add-expense canvas + radial */}
        <div style={{
          overflow: 'auto', padding: '28px 32px 40px', minWidth: 0,
          display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          {/* Hero: big radial + numbers */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 28, alignItems: 'center',
            padding: '22px 26px', borderRadius: 16,
            background: p.surface, border: `1px solid ${p.line}`,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
                letterSpacing: '0.14em', textTransform: 'uppercase',
              }}>Left to spend · 6 days</div>
              <div style={{ marginTop: 6 }}>
                <span style={{
                  fontFamily: FONT_DISPLAY, fontSize: 52, fontWeight: 500,
                  color: p.fg, letterSpacing: '-0.05em', lineHeight: 1.05,
                  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                }}>£{(MONTH_BUDGET - MONTH_SPENT).toLocaleString()}</span>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <DeskStat label="Spent" value={`£${MONTH_SPENT.toLocaleString()}`} palette={p} />
                <DeskStat label="Budget" value={`£${MONTH_BUDGET.toLocaleString()}`} palette={p} />
                <DeskStat label="Income" value={`£${MONTH_INCOME.toLocaleString()}`} palette={p} positive />
                <DeskStat label="Daily" value="£54" palette={p} />
              </div>
            </div>
            <CategoryViz vizStyle={vizStyle} totals={MONTH_TOTALS} palette={p} size={180}
              spent={MONTH_SPENT} budget={MONTH_BUDGET}
              selected={hoverCat} onSelect={setHoverCat} />
          </div>

          {/* Add expense composer */}
          <div style={{
            padding: '28px 32px', borderRadius: 16,
            background: p.surface, border: `1px solid ${p.line}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>Add expense</div>
                <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4 }}>
                  Three taps, then done
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <PlusMinusButton kind="−" palette={p} size={52} />
                <PlusMinusButton kind="+" palette={p} size={52} />
              </div>
            </div>

            {/* Amount + note */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24,
            }}>
              <div style={{
                padding: '18px 20px', borderRadius: 12,
                background: p.bg, border: `1px solid ${p.line}`,
              }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Amount</div>
                <div style={{
                  fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 500,
                  letterSpacing: '-0.04em', lineHeight: 1, marginTop: 8,
                  fontVariantNumeric: 'tabular-nums',
                }}>−£{amount}</div>
              </div>
              <div style={{
                padding: '18px 20px', borderRadius: 12,
                background: p.bg, border: `1px solid ${p.line}`,
              }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Note</div>
                <input value={note} onChange={(e) => setNote(e.target.value)} style={{
                  width: '100%', background: 'transparent', border: 0, outline: 0,
                  color: p.fg, fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 500,
                  letterSpacing: '-0.02em', marginTop: 8, padding: 0,
                }} />
              </div>
            </div>

            {/* Categories */}
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
              letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12,
            }}>Category</div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, rowGap: 22,
            }}>
              {CATEGORIES.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                  <CategoryChip cat={c} palette={p}
                    selected={selectedCat === c.id} size={60}
                    style={chipStyle === 'mono' ? 'rings' : chipStyle}
                    representation={catRep}
                    onClick={() => setSelectedCat(c.id)} />
                  {aiOnline && c.id === 'groc' && note.toLowerCase().includes('waitrose') && (
                    <div style={{
                      position: 'absolute', top: -2, right: 10,
                      width: 8, height: 8, borderRadius: 4, background: p.aiLine,
                    }} />
                  )}
                </div>
              ))}
            </div>

            {/* NL input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px', borderRadius: 12,
              background: p.bg, border: `1px solid ${p.line}`, marginTop: 24,
            }}>
              <span style={{
                fontFamily: FONT_MONO, fontSize: 11,
                color: aiOnline ? p.aiLine : p.fgDim, letterSpacing: '0.12em',
              }}>··</span>
              <div style={{
                flex: 1, fontFamily: FONT_MONO, fontSize: 13,
                color: aiOnline ? p.fgMuted : p.fgDim,
              }}>
                {aiOnline ? 'Try: "thai takeaway 22 on apr 18" · "waitrose 58.43"' : 'Natural-language input unavailable offline'}
              </div>
              <div style={{
                fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
                border: `1px solid ${p.line}`, padding: '3px 6px', borderRadius: 4,
              }}>⌘ K</div>
            </div>
          </div>
        </div>

        {/* RIGHT: AI insights rail */}
        <div style={{
          borderLeft: `1px solid ${p.line}`, overflow: 'auto',
          padding: '22px 22px 40px',
        }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16,
          }}>Insights</div>

          {aiOnline ? (
            <>
              <AIMark variant="tint" palette={p}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: p.aiLine, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Monthly summary
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  {AI_INSIGHTS.summary}
                </div>
              </AIMark>

              <div style={{ height: 12 }} />

              <AIMark variant="tint" palette={p}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: p.aiLine, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  This week
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.55 }}>
                  {AI_INSIGHTS.narrative}
                </div>
              </AIMark>

              <div style={{ height: 12 }} />

              <AIMark variant="tint" palette={p}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: p.aiLine, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Unusual
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
                  {AI_INSIGHTS.callout}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{
                    flex: 1, background: p.accent, color: p.accentInk, border: 0,
                    padding: '8px 0', borderRadius: 8, fontFamily: FONT_DISPLAY,
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}>Confirm Fun</button>
                  <button style={{
                    flex: 1, background: 'transparent', color: p.fg,
                    border: `1px solid ${p.lineStrong}`, padding: '8px 0',
                    borderRadius: 8, fontFamily: FONT_DISPLAY, fontSize: 12, cursor: 'pointer',
                  }}>Recategorise</button>
                </div>
              </AIMark>
            </>
          ) : (
            <div style={{
              padding: '18px', borderRadius: 12, border: `1px dashed ${p.line}`,
              fontFamily: FONT_MONO, fontSize: 11, color: p.fgDim, lineHeight: 1.6,
            }}>
              Insights pause when the local AI server is unreachable. Everything else works as normal. Reconnect to resume summaries.
            </div>
          )}

          {/* Category breakdown */}
          <div style={{ marginTop: 28 }}>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 10, color: p.fgDim,
              letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12,
            }}>Breakdown</div>
            {MONTH_TOTALS.map((t, i) => {
              const c = CAT_BY_ID[t.cat];
              const max = MONTH_TOTALS[0].amount;
              return (
                <div key={t.cat} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', borderBottom: `1px solid ${p.line}`,
                }}>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10, color: p.fgMuted,
                    width: 22, letterSpacing: '0.04em',
                  }}>{c.mono}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: p.fg, marginBottom: 4 }}>{c.label}</div>
                    <div style={{
                      height: 3, background: p.line, borderRadius: 2, overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${(t.amount / max) * 100}%`, height: '100%',
                        background: i === 0 ? p.accent : p.fg,
                        opacity: i === 0 ? 1 : 0.6 - i * 0.04,
                      }} />
                    </div>
                  </div>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 11, color: p.fg,
                    fontVariantNumeric: 'tabular-nums',
                  }}>£{t.amount}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeskStat({ label, value, palette, positive }) {
  const p = palette;
  return (
    <div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 9, color: p.fgDim,
        letterSpacing: '0.14em', textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 16, fontWeight: 500,
        color: positive ? p.pos : p.fg, marginTop: 3,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
    </div>
  );
}

Object.assign(window, { DesktopLayout });
