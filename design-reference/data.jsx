// data.jsx — seed data for the prototype

// Family / household for login screen
const HOUSEHOLD = {
  name: 'Hartley',
  server: 'hartley.local',
  members: [
    { id: 'a', name: 'Alex',     initials: 'AL', color: '#D7FF3A', role: 'Admin'   },
    { id: 'e', name: 'Eva',      initials: 'EV', color: '#FFB27A', role: 'Member'  },
    { id: 'j', name: 'Jamie',    initials: 'JA', color: '#3DE0E0', role: 'Member'  },
    { id: 'k', name: 'Kids',     initials: 'KD', color: '#FF4D7A', role: 'Shared'  },
  ],
};


// Accounts — cash/card/bank. User can add custom ones (see NewAccountSheet).
const ACCOUNTS = [
  { id: 'main',    label: 'Main',      kind: 'current', mono: '04', last4: '4128', color: '#D7FF3A' },
  { id: 'amex',    label: 'Amex Gold', kind: 'credit',  mono: 'AX', last4: '1007', color: '#3DE0E0' },
  { id: 'joint',   label: 'Joint',     kind: 'current', mono: 'JT', last4: '8821', color: '#FFB27A' },
  { id: 'cash',    label: 'Cash',      kind: 'cash',    mono: '££', last4: null,   color: '#F6F02E' },
  { id: 'savings', label: 'Savings',   kind: 'savings', mono: 'SV', last4: '6604', color: '#FF4D7A' },
];

const ACCT_BY_ID = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a]));

const CATEGORIES = [
  { id: 'food',    label: 'Food',     mono: 'Fo', hue: 82  },
  { id: 'rent',    label: 'Rent',     mono: 'Re', hue: 220 },
  { id: 'groc',    label: 'Groceries',mono: 'Gr', hue: 150 },
  { id: 'trans',   label: 'Transit',  mono: 'Tr', hue: 18  },
  { id: 'bills',   label: 'Bills',    mono: 'Bi', hue: 280 },
  { id: 'fun',     label: 'Fun',      mono: 'Fu', hue: 320 },
  { id: 'health',  label: 'Health',   mono: 'He', hue: 190 },
  { id: 'kids',    label: 'Kids',     mono: 'Ki', hue: 45  },
  { id: 'home',    label: 'Home',     mono: 'Ho', hue: 260 },
  { id: 'gifts',   label: 'Gifts',    mono: 'Gi', hue: 340 },
  { id: 'subs',    label: 'Subs',     mono: 'Su', hue: 200 },
  { id: 'misc',    label: 'Misc',     mono: 'Mi', hue: 0   },
];

const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// Transactions for the month (most recent first).
const TRANSACTIONS = [
  { id: 't1',  amount: -14.20,  cat: 'food',   note: 'Lunch with Sara',          when: 'Today · 13:42',      ai: true,  conf: 0.92, acct: 'amex' },
  { id: 't2',  amount: -6.80,   cat: 'trans',  note: 'Metro top-up',             when: 'Today · 09:18',      ai: false, acct: 'cash' },
  { id: 't3',  amount: -58.43,  cat: 'groc',   note: 'Waitrose',                 when: 'Yesterday · 18:04',  ai: true,  conf: 0.98, acct: 'amex' },
  { id: 't4',  amount: -12.00,  cat: 'fun',    note: 'Cinema — Eva',             when: 'Yesterday · 20:30',  ai: false, flagged: true, acct: 'main' },
  { id: 't5',  amount: +3200,   cat: 'misc',   note: 'Salary',                   when: 'Apr 23 · 08:00',     ai: false, income: true, acct: 'main' },
  { id: 't6',  amount: -1250,   cat: 'rent',   note: 'April rent',               when: 'Apr 22 · 09:00',     ai: false, acct: 'joint' },
  { id: 't7',  amount: -42.10,  cat: 'bills',  note: 'Electric — SSE',           when: 'Apr 21 · 11:22',     ai: true,  conf: 0.88, acct: 'joint' },
  { id: 't8',  amount: -17.50,  cat: 'subs',   note: 'Netflix',                  when: 'Apr 20 · 00:00',     ai: false, acct: 'amex' },
  { id: 't9',  amount: -38.00,  cat: 'kids',   note: 'Swimming lessons',         when: 'Apr 19 · 16:00',     ai: false, acct: 'main' },
  { id: 't10', amount: -22.40,  cat: 'food',   note: 'Takeaway — Thai',          when: 'Apr 18 · 19:44',     ai: false, acct: 'cash' },
  { id: 't11', amount: -9.60,   cat: 'trans',  note: 'Uber home',                when: 'Apr 18 · 23:10',     ai: true,  conf: 0.81, acct: 'amex' },
  { id: 't12', amount: -64.00,  cat: 'health', note: 'Pharmacy',                 when: 'Apr 17 · 14:00',     ai: false, acct: 'main' },
];

// Month totals by category (for the radial)
const MONTH_TOTALS = [
  { cat: 'rent',   amount: 1250 },
  { cat: 'groc',   amount: 412 },
  { cat: 'food',   amount: 198 },
  { cat: 'bills',  amount: 164 },
  { cat: 'trans',  amount: 92 },
  { cat: 'kids',   amount: 88 },
  { cat: 'subs',   amount: 52 },
  { cat: 'fun',    amount: 48 },
  { cat: 'health', amount: 64 },
];

const MONTH_BUDGET = 2600;
const MONTH_SPENT = MONTH_TOTALS.reduce((s, x) => s + x.amount, 0);
const MONTH_INCOME = 3200;

const AI_INSIGHTS = {
  summary: "Groceries are running 18% above your 4-week average — mostly weekend runs. Transit is down £14. You're tracking £212 under budget with 6 days left.",
  callout: "Cinema on Tue looked unusual for a weekday — tap to confirm it's Fun.",
  narrative: "This week bent toward home basics: one big Waitrose run and the electric bill landed. Dining out was quiet — only Thai takeaway and lunch with Sara.",
  suggestions: [
    { from: 'food', to: 'groc', reason: 'Waitrose is usually Groceries', conf: 0.98 },
  ],
};

Object.assign(window, { HOUSEHOLD, ACCOUNTS, ACCT_BY_ID, CATEGORIES, CAT_BY_ID, TRANSACTIONS, MONTH_TOTALS, MONTH_BUDGET, MONTH_SPENT, MONTH_INCOME, AI_INSIGHTS });

// icons.jsx — category glyphs (line-art, stroke-based, original)

// Uses currentColor; width/height passed via props. Square viewBox 24.
function catIcon(id, color = 'currentColor', size = 22) {
  const sw = 1.6;
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    food:   <><path d="M6 3v8M6 11c-1.5 0-2.5 1-2.5 2.5S4.5 16 6 16v5M6 3v2M6 3c1 0 1.5.5 1.5 1.5V7c0 1.5-.7 2-1.5 2s-1.5-.5-1.5-2V4.5C4.5 3.5 5 3 6 3z"/><path d="M16 3c-2 2-2 6 0 8v10"/><path d="M20 3c0 3 0 6-2 8" /></>,
    rent:   <><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></>,
    groc:   <><path d="M3 4h3l2 12h11"/><path d="M6 8h15l-2 7"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></>,
    trans:  <><rect x="4" y="4" width="16" height="14" rx="2"/><path d="M4 13h16M8 18v2M16 18v2"/><circle cx="8" cy="15" r="0.8" fill={color} stroke="none"/><circle cx="16" cy="15" r="0.8" fill={color} stroke="none"/></>,
    bills:  <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
    fun:    <><circle cx="12" cy="12" r="9"/><path d="M8 14c0 1.5 2 2.5 4 2.5s4-1 4-2.5M9 10h.01M15 10h.01"/></>,
    health: <><path d="M12 4v16M4 12h16"/><rect x="3" y="3" width="18" height="18" rx="3"/></>,
    kids:   <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3-7 8-7s8 3 8 7"/></>,
    home:   <><path d="M4 10l8-6 8 6v10H4z"/><path d="M10 20v-5h4v5"/></>,
    gifts:  <><rect x="3" y="8" width="18" height="12" rx="1"/><path d="M3 12h18M12 8v12"/><path d="M8 8c-2 0-3-1-3-2.5S6 3 8 3c2 0 4 2.5 4 5M16 8c2 0 3-1 3-2.5S18 3 16 3c-2 0-4 2.5-4 5"/></>,
    subs:   <><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></>,
    misc:   <><circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/></>,
  };
  return <svg {...common}>{paths[id] || paths.misc}</svg>;
}

Object.assign(window, { catIcon });

