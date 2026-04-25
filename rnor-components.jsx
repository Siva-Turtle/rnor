// ---------- RNOR UI Components ----------
const { useState, useEffect, useRef } = React;

const T = {
  ink: '#1D1D1D',
  mint: '#2FDEBF',
  mintDark: '#1FB89D',
  mintSoft: '#E8FBF6',
  paper: '#FEFEFE',
  muted: '#8A8F98',
  mutedDark: '#5A5F68',
  border: '#E5E7EB',
  subtle: '#F7F8F9',
  amber: '#D97706',
  amberSoft: '#FEF3C7',
  nrBg: '#F1F2F3',
  nrFg: '#6B7280',
  red: '#EF4444',
  redSoft: '#FEF2F2',
};

const font = {
  sans: '"DM Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  serif: '"Instrument Serif", Georgia, serif',
};

// ---------- Status Pill ----------
function StatusPill({ s, large }) {
  const map = {
    NR:   { bg: T.nrBg, fg: T.nrFg, label: 'NR' },
    RNOR: { bg: T.mint, fg: '#0D5C4A', label: 'RNOR' },
    ROR:  { bg: T.amberSoft, fg: T.amber, label: 'ROR' },
  };
  const st = map[s] || map.NR;
  return (
    <span style={{
      display: 'inline-block',
      padding: large ? '4px 14px' : '3px 10px',
      borderRadius: 999,
      background: st.bg,
      color: st.fg,
      fontSize: large ? 13 : 11,
      fontWeight: 700,
      letterSpacing: 0.5,
      fontFamily: font.mono,
      lineHeight: 1.3,
    }}>
      {st.label}
    </span>
  );
}

// ---------- Input Field ----------
function InputField({ label, value, onChange, type = 'text', suffix, placeholder, disabled, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <span style={{
        fontSize: 12, fontWeight: 600, color: T.mutedDark,
        letterSpacing: 0.3, fontFamily: font.sans,
      }}>
        {label}
      </span>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: disabled ? T.subtle : T.paper,
        border: `1.5px solid ${focused ? T.mint : T.border}`,
        borderRadius: 10, padding: '10px 14px',
        opacity: disabled ? 0.55 : 1,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: focused ? `0 0 0 3px ${T.mint}22` : 'none',
      }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 15, color: T.ink, fontFamily: font.sans,
            width: '100%', minWidth: 0,
          }}
        />
        {suffix && (
          <span style={{
            fontSize: 12, color: T.muted, marginLeft: 8,
            whiteSpace: 'nowrap', fontFamily: font.mono,
          }}>
            {suffix}
          </span>
        )}
      </div>
      {hint && <span style={{ fontSize: 11, color: T.muted, marginTop: -2 }}>{hint}</span>}
    </label>
  );
}

// ---------- Toggle ----------
function ToggleSwitch({ label, active, onChange, description }) {
  return (
    <button
      onClick={() => onChange(!active)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: active ? T.mintSoft : T.paper,
        border: `1.5px solid ${active ? T.mint : T.border}`,
        borderRadius: 12, transition: 'all 0.2s',
        flex: '1 1 0', minWidth: 220, cursor: 'pointer',
        textAlign: 'left', fontFamily: font.sans,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{label}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>{description}</div>
      </div>
      <div style={{
        position: 'relative', width: 42, height: 24, borderRadius: 999,
        background: active ? T.ink : '#D1D5DB', flexShrink: 0, transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: active ? 20 : 2,
          width: 20, height: 20, borderRadius: '50%',
          background: active ? T.mint : T.paper,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </div>
    </button>
  );
}

// ---------- Editable Days Cell ----------
function EditableDaysCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef(null);

  useEffect(() => { if (!editing) setDraft(String(value)); }, [value, editing]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.select(); }, [editing]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= 0 && n <= 365) onChange(n);
    else setDraft(String(value));
    setEditing(false);
  };

  if (editing) {
    return (
      <input ref={inputRef} type="number" min={0} max={365} value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
        }}
        style={{
          width: 48, padding: '2px 4px', border: `2px solid ${T.mint}`,
          borderRadius: 6, textAlign: 'center', fontSize: 13,
          fontFamily: font.mono, outline: 'none', background: T.mintSoft,
        }}
      />
    );
  }

  return (
    <span onClick={() => setEditing(true)} style={{
      cursor: 'pointer', padding: '2px 8px', borderRadius: 6,
      border: `1px dashed ${T.border}`, display: 'inline-block', minWidth: 28,
      transition: 'all 0.15s',
    }}
      onMouseOver={e => { e.currentTarget.style.borderColor = T.mint; e.currentTarget.style.background = T.mintSoft; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}
      title="Click to edit"
    >
      {value}
    </span>
  );
}

// ---------- Flexible Date Parser ----------
function parseFlexDate(s) {
  if (!s) return null;
  // Strip ordinal suffixes (1st, 2nd, 3rd, 4th, etc.)
  const str = s.trim().replace(/(\d+)(st|nd|rd|th)\b/gi, '$1');
  const monthMap = {
    jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
    january:1,february:2,march:3,april:4,june:6,july:7,august:8,september:9,october:10,november:11,december:12,
  };

  // dd/mmm/yyyy or dd-mmm-yyyy (e.g. 15/Jan/2024, 15-Jan-2024)
  let m = str.match(/^(\d{1,2})[\/\-]([A-Za-z]{3,})[\/\-](\d{4})$/);
  if (m) {
    const mo = monthMap[m[2].toLowerCase()];
    if (mo) return toISO(parseInt(m[3]), mo, parseInt(m[1]));
  }

  // dd-mm-yyyy or dd/mm/yyyy
  m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return toISO(parseInt(m[3]), parseInt(m[2]), parseInt(m[1]));

  // yyyy-mm-dd (ISO)
  m = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) return toISO(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));

  // dd mmm yyyy (e.g. 15 Jan 2024)
  m = str.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (m) {
    const mo = monthMap[m[2].toLowerCase()];
    if (mo) return toISO(parseInt(m[3]), mo, parseInt(m[1]));
  }

  // mmm dd, yyyy or mmmm dd, yyyy (e.g. Jan 6, 2018 / December 8, 2017)
  m = str.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const mo = monthMap[m[1].toLowerCase()];
    if (mo) return toISO(parseInt(m[3]), mo, parseInt(m[2]));
  }

  return null;
}

function toISO(y, m, d) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// ---------- Copy Prompt Button ----------
const AI_PROMPT = `I am sharing a travel history. It may be in one of these formats:
- A travel history document issued by India (lists arrivals/departures in reverse chronological order)
- A personal note or message describing trips in natural language (e.g. "Went to India on Dec 8, 2017")
- Any other format describing when someone traveled to and from India

Context on "A travel history document issued by India":
- The Location Column is either From where they have come to India / to where they are going from India - this shows location of other side only 
- lists arrivals/departures in reverse chronological order

Rules:
- Extract only trips to India (ignore Mexico, UAE, or any other country)
- A trip starts when the person arrives in India and ends when they leave India
- If the source is an Indian travel history document (arrival/departure rows):
  - Start from the last row and work upward
  - Arrival = arrived in India, Departure = left India
  - The first row (oldest) is always an Arrival — the person was outside India before that
  - If the most recent entry is an Arrival with no Departure, mark end as "Present"
- If the source is a personal note or natural language:
  - "Went to India" = arrived in India
  - "Came to USA" / "Came back" / "Returned to USA" = left India
  - Ignore any travel that does not involve India

Output format — one trip per line, no explanations, no headers:
"""
DD MMM, YYYY to DD MMM, YYYY
DD MMM, YYYY to Present;
"""
`

function CopyPromptButton() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(AI_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px',
        background: copied ? T.mintSoft : T.paper,
        border: `1px solid ${copied ? T.mint : T.border}`,
        borderRadius: 6, cursor: 'pointer',
        fontSize: 11, fontWeight: 600,
        color: copied ? T.mintDark : T.mutedDark,
        fontFamily: font.sans,
        transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Copied!' : '⎘ Copy AI Prompt'}
    </button>
  );
}

// ---------- Trip Text Area ----------
function TripTextArea({ trips, setTrips }) {
  const [text, setText] = useState('');
  const [parseErrors, setParseErrors] = useState([]);
  const [parsedCount, setParsedCount] = useState(0);

  // Sync text from trips on mount
  useEffect(() => {
    if (trips.length > 0 && !text) {
      const lines = trips.map(t => {
        const inD = parseDate(t.in);
        const outD = parseDate(t.out);
        if (!inD || !outD) return '';
        const fmt = d => `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
        return `${fmt(inD)}  ${fmt(outD)}`;
      }).filter(Boolean);
      if (lines.length) setText(lines.join('\n'));
    }
  }, []);

  const handleParse = () => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const newTrips = [];
    const errors = [];

    lines.forEach((line, idx) => {
      // Split line: prefer " to " keyword, then tab, then 2+ spaces
      let parts = [];
      if (/\s+to\s+/i.test(line)) {
        parts = line.split(/\s+to\s+/i).map(s => s.trim()).filter(Boolean);
      } else if (/\t/.test(line)) {
        parts = line.split(/\t+/).map(s => s.trim()).filter(Boolean);
      } else {
        // Split on 2+ whitespace — but need to be smart about "Dec 8, 2017  Jan 6, 2018"
        // Find the split point: longest gap of whitespace
        const gaps = [];
        const re = /\s{2,}/g;
        let match;
        while ((match = re.exec(line)) !== null) {
          gaps.push({ idx: match.index, len: match[0].length });
        }
        if (gaps.length >= 1) {
          // Use the widest gap, or the first if equal
          const best = gaps.reduce((a, b) => b.len > a.len ? b : a, gaps[0]);
          parts = [line.slice(0, best.idx).trim(), line.slice(best.idx + best.len).trim()];
        } else {
          parts = [line]; // single token, will error
        }
      }

      if (parts.length < 2) {
        errors.push({ line: idx + 1, text: line, msg: 'Need two dates (arrived & departed)' });
        return;
      }

      const d1 = parseFlexDate(parts[0]);
      const d2 = parseFlexDate(parts[1]);

      if (!d1) { errors.push({ line: idx + 1, text: parts[0], msg: 'Cannot parse arrival date' }); return; }
      if (!d2) { errors.push({ line: idx + 1, text: parts[1], msg: 'Cannot parse departure date' }); return; }

      const inDate = parseDate(d1);
      const outDate = parseDate(d2);
      if (outDate < inDate) { errors.push({ line: idx + 1, text: line, msg: 'Departure before arrival' }); return; }

      newTrips.push({ in: d1, out: d2 });
    });

    setTrips(newTrips);
    setParseErrors(errors);
    setParsedCount(newTrips.length);
  };

  const totalDays = trips.reduce((sum, t) => {
    const inD = parseDate(t.in);
    const outD = parseDate(t.out);
    return sum + (inD && outD ? Math.round((outD - inD) / MS_PER_DAY) + 1 : 0);
  }, 0);

  return (
    <div style={{
      background: T.mintSoft, border: `1.5px solid ${T.mint}`,
      borderRadius: 14, padding: '16px 18px', marginTop: 14,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: 0.4,
          textTransform: 'uppercase', color: T.ink, fontFamily: font.sans,
        }}>
          Trips to India
        </div>
        {trips.length > 0 && (
          <span style={{
            fontSize: 11, color: T.mintDark, fontWeight: 600, fontFamily: font.mono,
          }}>
            {trips.length} trip{trips.length !== 1 ? 's' : ''} · {totalDays} days
          </span>
        )}
      </div>

      <div style={{ fontSize: 11, color: T.mutedDark, marginBottom: 8, lineHeight: 1.5 }}>
        One trip per line — <strong>arrival</strong> then <strong>departure</strong>, separated by <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3, fontFamily: font.mono, fontSize: 10 }}>to</code>, two+ spaces, or tab.<br />
        Accepted Formats: <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3, fontFamily: font.mono, fontSize: 10 }}>dd-mm-yyyy</code>{' '}
        <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3, fontFamily: font.mono, fontSize: 10 }}>dd/mmm/yyyy</code>{' '}
        <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3, fontFamily: font.mono, fontSize: 10 }}>dd mmm yyyy</code>{' '}
        <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3, fontFamily: font.mono, fontSize: 10 }}>mmm dd, yyyy</code>{' '}
        <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3, fontFamily: font.mono, fontSize: 10 }}>mmmm dd, yyyy</code>{' '}
        <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3, fontFamily: font.mono, fontSize: 10 }}>yyyy-mm-dd</code>{' '}
        · Ordinals like <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3, fontFamily: font.mono, fontSize: 10 }}>7th</code> OK<br />
        <CopyPromptButton />
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={"December 8, 2017 to Jan 6, 2018\nJan 13, 2022  April 7th, 2022\n01-12-2023 to 15-01-2024"}
        rows={5}
        style={{
          width: '100%', padding: '10px 12px',
          border: `1.5px solid ${T.border}`, borderRadius: 10,
          fontSize: 13, fontFamily: font.mono, lineHeight: 1.6,
          background: T.paper, color: T.ink, resize: 'vertical',
          outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = T.mint}
        onBlur={e => e.target.style.borderColor = T.border}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
        <button onClick={handleParse}
          style={{
            padding: '9px 20px', background: T.ink, color: T.paper,
            border: 'none', borderRadius: 8, fontSize: 13,
            fontWeight: 600, cursor: 'pointer', fontFamily: font.sans,
          }}>
          Parse Trips
        </button>
        {parsedCount > 0 && parseErrors.length === 0 && (
          <span style={{ fontSize: 12, color: T.mintDark, fontWeight: 500 }}>
            ✓ {parsedCount} trip{parsedCount !== 1 ? 's' : ''} parsed
          </span>
        )}
      </div>

      {parseErrors.length > 0 && (
        <div style={{
          marginTop: 10, padding: '8px 12px', background: T.redSoft,
          border: `1px solid ${T.red}33`, borderRadius: 8,
        }}>
          {parseErrors.map((e, i) => (
            <div key={i} style={{ fontSize: 11, color: T.red, marginBottom: i < parseErrors.length - 1 ? 4 : 0 }}>
              Line {e.line}: {e.msg} — <code style={{ fontFamily: font.mono }}>{e.text}</code>
            </div>
          ))}
        </div>
      )}

      {trips.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {trips.map((t, idx) => {
            const inD = parseDate(t.in);
            const outD = parseDate(t.out);
            const days = Math.round((outD - inD) / MS_PER_DAY) + 1;
            return (
              <div key={idx} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', background: T.paper,
                border: `1px solid ${T.mint}`, borderRadius: 999,
                fontSize: 11, fontFamily: font.mono,
              }}>
                <span>{t.in} → {t.out}</span>
                <span style={{ color: T.muted }}>({days}d)</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Timeline Visualization ----------
function TimelineViz({ fys, yearOfReturn }) {
  const relevant = fys.filter(f => f.endYear >= yearOfReturn - 2 && f.endYear <= yearOfReturn + 6);
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'end', height: 56 }}>
      {relevant.map(fy => {
        const colors = {
          NR: { bg: T.nrBg, border: T.border },
          RNOR: { bg: T.mint, border: T.mintDark },
          ROR: { bg: T.amberSoft, border: T.amber },
        };
        const c = colors[fy.status] || colors.NR;
        const h = fy.status === 'RNOR' ? 48 : fy.status === 'ROR' ? 36 : 24;
        return (
          <div key={fy.label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1,
          }}>
            <div style={{
              width: '100%', height: h, borderRadius: 6,
              background: c.bg, border: `1.5px solid ${c.border}`,
              transition: 'height 0.3s',
              position: 'relative',
            }}>
              {fy.isReturnYear && (
                <div style={{
                  position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 9, fontWeight: 700, color: T.mintDark, whiteSpace: 'nowrap',
                  letterSpacing: 0.5, fontFamily: font.mono,
                }}>
                  RETURN
                </div>
              )}
            </div>
            <span style={{
              fontSize: 9, color: T.muted, fontFamily: font.mono,
              fontWeight: fy.isReturnYear ? 700 : 400,
              whiteSpace: 'nowrap',
            }}>
              {fy.label.replace('FY ', '')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  T, font, StatusPill, InputField, ToggleSwitch, EditableDaysCell,
  TripTextArea, TimelineViz, parseFlexDate, CopyPromptButton,
});
