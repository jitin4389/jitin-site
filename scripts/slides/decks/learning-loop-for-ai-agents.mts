import {
  arrow,
  BODY_TOP,
  C,
  card,
  check,
  cross,
  diamond,
  lines,
  M,
  rect,
  table,
  text,
  W,
  type Legend,
} from "../lib.mts";

export const deck = {
  slug: "learning-loop-for-ai-agents",
  name: "“It doesn’t learn”: a learning loop for AI agents",
  author: "Jitin Gupta",
};

export type Slide = {
  file: string;
  title: string;
  sub: string;
  describe: string;
  legend?: Legend;
  body: () => string;
  caption: string;
};

const BW = W - 2 * M; // body width 1408

// ---------- 1. the complaint ----------
function complaint(): string {
  const y = BODY_TOP + 12,
    h = 272,
    w = 600;
  const chat = (
    x: number,
    day: string,
    user: string[],
    bot: string[],
    bad: boolean,
  ) =>
    [
      rect(x, y, w, h),
      text(x + 28, y + 36, day, {
        size: 12,
        fill: C.ink3,
        weight: 600,
        tracking: 1.4,
      }),
      text(x + 28, y + 80, "USER", {
        size: 12,
        fill: C.flow,
        weight: 600,
        tracking: 1.2,
      }),
      lines(x + 28, y + 106, user, { size: 19 }),
      text(x + 28, y + 170, "ASSISTANT", {
        size: 12,
        fill: C.ink3,
        weight: 600,
        tracking: 1.2,
      }),
      lines(x + 28, y + 196, bot, { size: 19, fill: C.ink2 }),
      bad ? cross(x + w - 40, y + 40) : check(x + w - 40, y + 40),
    ].join("\n");
  const gapX = M + w + 40;
  return [
    chat(
      M,
      "MONDAY · SESSION 1",
      ["“Never use the word ‘skyrocket’", "in anything you write for me.”"],
      ["“Understood. I will avoid it.”"],
      false,
    ),
    arrow(gapX, y + h / 2 + 10, gapX + 128, y + h / 2 + 10, { dashed: true }),
    text(gapX + 64, y + h / 2 - 30, "new session", {
      fill: C.ink2,
      anchor: "middle",
    }),
    text(gapX + 64, y + h / 2 - 8, "empty context", {
      fill: C.ink2,
      anchor: "middle",
    }),
    chat(
      M + w + 208,
      "TUESDAY · SESSION 2",
      ["“What will office paper cost", "next quarter?”"],
      ["“Prices will probably skyrocket…”"],
      true,
    ),
    text(
      M,
      y + h + 70,
      "The model is not the part that fails to learn. Three things are missing around it:",
      { size: T_SUB(), fill: C.ink },
    ),
    ...[
      "Nothing records the correction in a checkable form",
      "Nothing decides which notes should shape future answers",
      "Nothing measures whether answers got better",
    ].map((s, i) =>
      card(M + i * (448 + 32), y + h + 104, 448, 110, {
        title: "",
        sub: splitTwo(s),
        fill: C.tint,
        stroke: C.tint,
      }),
    ),
  ].join("\n");
}
const T_SUB = () => 20;
function splitTwo(s: string): string[] {
  const words = s.split(" "),
    half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(" "), words.slice(half).join(" ")];
}

// ---------- 2. why store-and-inject fails ----------
function storeInject(): string {
  const y = BODY_TOP + 8;
  const notes = [
    rect(M, y, 300, 128),
    text(M + 24, y + 34, "corrections.txt", {
      size: 14,
      mono: true,
      fill: C.ink3,
    }),
    lines(
      M + 24,
      y + 62,
      [
        "- never say skyrocket",
        "- prices rose 8%",
        "- watch the new mill",
        "- …and 200 more",
      ],
      { size: 15, mono: true, fill: C.ink2, lineHeight: 20 },
    ),
  ].join("\n");
  const prompt = [
    rect(M + 560, y, 300, 128),
    text(M + 584, y + 34, "every prompt", {
      size: 14,
      mono: true,
      fill: C.ink3,
    }),
    lines(
      M + 584,
      y + 62,
      ["system text", "+ all corrections", "+ the question"],
      { size: 15, mono: true, fill: C.ink2, lineHeight: 20 },
    ),
  ].join("\n");
  const tiles = [
    [
      "Kinds get mixed",
      [
        "A style rule, a stale claim and",
        "a standing request sit in one",
        "flat list; all applied alike.",
      ],
    ],
    [
      "Facts go stale",
      [
        "A number repeated as fact,",
        "undated and unsourced,",
        "months after it changed.",
      ],
    ],
    [
      "Text leaks",
      [
        "Notes echo back in answers:",
        "the user’s own words, or",
        "“as per my rules…”.",
      ],
    ],
    [
      "The list grows",
      [
        "Every correction is one more",
        "line in every prompt. Cost",
        "rises; recall falls.",
      ],
    ],
    [
      "Nothing is measured",
      ["Answers change. Nobody", "can say whether they", "improved."],
    ],
  ] as const;
  const tw = 256,
    gap = (BW - 5 * tw) / 4,
    ty = y + 176;
  return [
    notes,
    arrow(M + 300 + 16, y + 64, M + 560 - 16, y + 64, {
      label: "pasted in, every turn",
    }),
    prompt,
    ...tiles.map(([title, body], i) => {
      const x = M + i * (tw + gap);
      return [
        rect(x, ty, tw, 256),
        text(x + 24, ty + 48, String(i + 1), {
          size: 34,
          weight: 600,
          fill: C.human,
        }),
        text(x + 24, ty + 96, title, { size: 21, weight: 600 }),
        lines(x + 24, ty + 134, [...body], {
          size: 16,
          fill: C.ink2,
          lineHeight: 24,
        }),
      ].join("\n");
    }),
  ].join("\n");
}

// ---------- 3. the loop ----------
function loop(): string {
  const stages: [string, string][] = [
    ["Record", "immutable, with provenance"],
    ["Enrich", "add-only, versioned"],
    ["Group", "frozen vocabulary"],
    ["Extract", "typed, verbatim quotes"],
    ["Serve", "budgeted, layered"],
    ["Evaluate", "replay with vs without"],
    ["Approve", "a person signs off"],
  ];
  const moves = [
    "records",
    "labels",
    "subject members",
    "items",
    "candidate package",
    "scores",
    "live package, next session",
  ];
  const CX = 800,
    CY = 548,
    RX = 540,
    RY = 228,
    NW = 236,
    NH = 96,
    n = stages.length;
  const pos = (i: number) => {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
    return [CX + RX * Math.cos(a), CY + RY * Math.sin(a)] as const;
  };
  const exitPt = (x0: number, y0: number, x1: number, y1: number, pad = 12) => {
    const dx = x1 - x0,
      dy = y1 - y0,
      d = Math.hypot(dx, dy),
      ux = dx / d,
      uy = dy / d;
    const t =
      Math.min(
        ux ? NW / 2 / Math.abs(ux) : 1e9,
        uy ? NH / 2 / Math.abs(uy) : 1e9,
      ) + pad;
    return [x0 + ux * t, y0 + uy * t] as const;
  };
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pos(i),
      [x1, y1] = pos((i + 1) % n);
    const [sx, sy] = exitPt(x0, y0, x1, y1),
      [ex, ey] = exitPt(x1, y1, x0, y0, 16);
    parts.push(
      `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${C.flow}" stroke-width="2" marker-end="url(#ah-flow)"/>`,
    );
    let lx = sx + (ex - sx) * 0.42,
      ly = sy + (ey - sy) * 0.42;
    const vx = lx - CX,
      vy = ly - CY,
      vd = Math.hypot(vx, vy);
    lx += (vx / vd) * 34;
    ly += (vy / vd) * 34 + 5;
    parts.push(
      text(lx, ly, moves[i], {
        fill: C.ink2,
        anchor: Math.abs(vx) < 150 ? "middle" : vx > 0 ? "start" : "end",
        halo: true,
      }),
    );
    parts.push(diamond(sx + (ex - sx) * 0.84, sy + (ey - sy) * 0.84));
  }
  const [ax, ay] = pos(5),
    [bx, by] = pos(3);
  const [sx, sy] = exitPt(ax, ay, bx, by, 14),
    [fx, fy] = exitPt(bx, by, ax, ay, 18);
  parts.push(
    `<path d="M${sx.toFixed(1)} ${sy.toFixed(1)} Q ${CX} ${CY + 150} ${fx.toFixed(1)} ${fy.toFixed(1)}" stroke="${C.ink3}" stroke-width="2" stroke-dasharray="6 6" fill="none" marker-end="url(#ah-muted)"/>`,
  );
  parts.push(
    text(CX, CY + 64, "what failed replay goes back for re-extraction", {
      fill: C.ink2,
      anchor: "middle",
      halo: true,
    }),
  );
  stages.forEach(([verb, sub], i) => {
    const [x, y] = pos(i);
    parts.push(
      card(x - NW / 2, y - NH / 2, NW, NH, {
        eyebrow: `Stage ${i + 1}`,
        title: verb,
        sub,
      }),
    );
  });
  return parts.join("\n");
}

// ---------- 4. taxonomy ----------
function taxonomy(): string {
  const y = BODY_TOP + 4;
  return [
    table(
      M,
      y,
      [230, 440, 340, 180, 218],
      ["Kind", "The user’s words", "Served as", "Goes stale?", "Layer"],
      [
        [
          "World fact",
          "“prices rose about 8% last quarter”",
          "a dated claim: verify, then apply",
          "yes, by date",
          "third",
        ],
        [
          "Method rule",
          "“cite a source for every number”",
          "an instruction: apply directly",
          "rarely",
          "first",
        ],
        [
          "Answer shape",
          "“label every figure with its year and unit”",
          "an instruction: apply directly",
          "rarely",
          "second",
        ],
        [
          "Profile",
          "“I work on a two-year horizon”",
          "context: apply directly",
          "slowly",
          "first",
        ],
        [
          "Standing watch",
          "“keep an eye on news about the new mill”",
          "conditional: mention only if relevant",
          "yes, by event",
          "last",
        ],
      ],
      { rowH: 62, size: 18 },
    ),
    ...[
      ["Scope", "general, or specific to one subject"],
      ["Owner", "one user, or shared after its own review"],
      [
        "Precedence",
        "per-user beats shared · specific beats general · newer beats older",
      ],
    ].map(([k, v], i) =>
      [
        text(M + 20, y + 62 * 6 + 70 + i * 40, k.toUpperCase(), {
          size: 12,
          fill: C.ink3,
          weight: 600,
          tracking: 1.4,
        }),
        text(M + 150, y + 62 * 6 + 70 + i * 40, v, { size: 19, fill: C.ink }),
      ].join("\n"),
    ),
  ].join("\n");
}

// ---------- 5. one correction's journey ----------
function journey(): string {
  const steps: [string, string, string[]][] = [
    [
      "1 · Monday 09:12",
      "The user writes",
      ["“Cite a source for", "every number.”"],
    ],
    [
      "2 · Record",
      "ses-0002 · turn 2",
      ["answer shown, feedback kept,", "nothing edited later"],
    ],
    [
      "3 · Enrich",
      "labels beside the record",
      ["turn-shape: instruction", "topic: sourcing-rule"],
    ],
    [
      "4 · Group",
      "subject: office-paper",
      ["from the frozen vocabulary;", "routed, then verified"],
    ],
    [
      "5 · Extract",
      "item li-003",
      ["kind: method_rule · general", "quote checked verbatim ✓"],
    ],
    ["6 · Serve", "package v3", ["layer “How to work”,", "within budget"]],
    [
      "7 · Evaluate",
      "replay on later questions",
      ["correction “source per number”", "met ✓ · no leak flags"],
    ],
    [
      "8 · Approve → Tuesday",
      "a person signs off",
      ["live pointer moves to v3;", "Tuesday’s session starts with it"],
    ],
  ];
  const cw = 316,
    ch = 150,
    gap = (BW - 4 * cw) / 3,
    y1 = BODY_TOP + 24,
    y2 = y1 + ch + 104;
  const parts: string[] = [];
  steps.forEach(([eyebrow, title, sub], i) => {
    const row = i < 4 ? 0 : 1,
      col = row === 0 ? i : 7 - i; // second row runs right-to-left (a snake)
    const x = M + col * (cw + gap),
      y = row === 0 ? y1 : y2;
    parts.push(
      card(x, y, cw, ch, {
        eyebrow,
        title,
        sub,
        titleSize: 22,
        fill: i === 7 ? C.humanTint : C.card,
        stroke: i === 7 ? C.human : C.hair,
      }),
    );
    if (i < 3)
      parts.push(
        arrow(x + cw + 8, y + ch / 2, x + cw + gap - 8, y + ch / 2, {
          gate: i === 2 ? false : false,
        }),
      );
    if (i === 3)
      parts.push(
        `<path d="M${x + cw / 2} ${y + ch + 8} L${x + cw / 2} ${y2 - 8}" stroke="${C.flow}" stroke-width="2" fill="none" marker-end="url(#ah-flow)"/>`,
      );
    if (i >= 4 && i < 7)
      parts.push(arrow(x - 8, y + ch / 2, x - gap + 8, y + ch / 2, {}));
  });
  parts.push(
    text(
      M,
      y2 + ch + 60,
      "Every step writes a file the next step reads. A person signs off before the package goes live.",
      { size: 20, fill: C.ink2 },
    ),
  );
  return parts.join("\n");
}

// ---------- 6. anatomy of a served item ----------
function anatomy(): string {
  const y = BODY_TOP + 8,
    lw = 760,
    lh = 400;
  const rows: [string, string, string][] = [
    ["kind", "world_fact", "one of five kinds; decides the serving rule"],
    ["scope", "subject · office-paper", "general, or specific to one subject"],
    [
      "quote",
      "“office paper prices rose about 8% last quarter”",
      "the user’s exact words; checked by code",
    ],
    [
      "source",
      "ses-0002 · turn 2 · 2025-03-09",
      "the record it came from, and when",
    ],
    ["status", "active", "changes by appending, never by editing"],
  ];
  const parts = [
    rect(M, y, lw, lh),
    text(M + 28, y + 40, "LEARNING ITEM li-004", {
      size: 12,
      fill: C.ink3,
      weight: 600,
      tracking: 1.4,
    }),
  ];
  rows.forEach(([k, v, note], i) => {
    const ry = y + 92 + i * 62;
    parts.push(text(M + 28, ry, k, { size: 16, mono: true, fill: C.flow }));
    parts.push(text(M + 130, ry, v, { size: 18, weight: 600 }));
    parts.push(text(M + 130, ry + 24, note, { size: 15, fill: C.ink2 }));
    if (i < rows.length - 1)
      parts.push(
        `<line x1="${M + 28}" y1="${ry + 38}" x2="${M + lw - 28}" y2="${ry + 38}" stroke="${C.hair}"/>`,
      );
  });
  const rx = M + lw + 56,
    rw = BW - lw - 56;
  const rendered = (
    ry: number,
    eyebrow: string,
    body: string[],
    tint: string,
    stroke: string,
  ) =>
    [
      rect(rx, ry, rw, 150, { fill: tint, stroke }),
      text(rx + 24, ry + 34, eyebrow, {
        size: 12,
        fill: C.ink3,
        weight: 600,
        tracking: 1.4,
      }),
      lines(rx + 24, ry + 66, body, { size: 16, mono: true, lineHeight: 24 }),
    ].join("\n");
  parts.push(
    rendered(
      y,
      "A METHOD RULE, RENDERED · APPLY DIRECTLY",
      [
        "- Cite a source for every number.",
        "  (user’s words: “Cite a source for",
        "  every number”) [src: ses-0002 t2 2025-03-09]",
      ],
      C.flowTint,
      C.flowTint,
    ),
    rendered(
      y + 186,
      "A WORLD FACT, RENDERED · VERIFY, THEN APPLY",
      [
        "- VERIFY BEFORE USE: on 2025-03-09 the user",
        "  said “office paper prices rose about 8% last",
        "  quarter”. Check against a current source.",
      ],
      C.humanTint,
      C.humanTint,
    ),
    text(
      rx,
      y + 380,
      "A world fact is never restated as a fact: the model cannot check it",
      { size: 17, fill: C.ink2 },
    ),
    text(
      rx,
      y + 406,
      "from inside the prompt, so it is served as a dated claim with an instruction.",
      { size: 17, fill: C.ink2 },
    ),
  );
  parts.push(
    text(
      M,
      y + lh + 56,
      "Withdrawal is an appended event, so a quote can be removed everywhere by rebuilding the views, never by editing a record.",
      { size: 18, fill: C.ink2 },
    ),
  );
  return parts.join("\n");
}

// ---------- 7. budget and layers ----------
function budget(): string {
  const y = BODY_TOP + 8,
    lw = 740;
  const layers: [string, string, number, string][] = [
    ["1 · HOW TO WORK", "apply directly · method rules", 92, C.flowTint],
    [
      "2 · HOW TO SHAPE ANSWERS",
      "apply directly · answer shape, profile",
      76,
      C.flowTint,
    ],
    [
      "3 · WHAT THE USER SAID ABOUT THE WORLD",
      "verify, then apply · dated claims",
      92,
      C.humanTint,
    ],
    ["4 · STANDING WATCHES", "mention only if relevant", 76, C.tint],
  ];
  const parts: string[] = [
    text(M, y + 20, "CONTEXT PACKAGE v3 · one user · one subject", {
      size: 12,
      fill: C.ink3,
      weight: 600,
      tracking: 1.4,
    }),
  ];
  let ly = y + 40;
  layers.forEach(([k, v, h, tint], i) => {
    parts.push(rect(M, ly, lw, h, { fill: tint, stroke: tint, rx: 10 }));
    parts.push(
      text(M + 24, ly + 34, k, {
        size: 12,
        fill: C.ink3,
        weight: 600,
        tracking: 1.4,
      }),
    );
    parts.push(
      text(M + 24, ly + 60, v, { size: 17, fill: i === 3 ? C.ink3 : C.ink }),
    );
    ly += h + 10;
  });
  const budgetY = ly - 86 - 14; // cuts through layer 4
  parts.push(
    `<line x1="${M - 16}" y1="${budgetY}" x2="${M + lw + 16}" y2="${budgetY}" stroke="${C.bad}" stroke-width="2" stroke-dasharray="8 6"/>`,
  );
  parts.push(
    text(M + lw + 24, budgetY + 6, "budget", {
      size: 15,
      fill: C.bad,
      weight: 600,
    }),
  );
  parts.push(rect(M, ly + 6, lw, 70, { dash: "6 6", fill: C.surface }));
  parts.push(
    text(
      M + 24,
      ly + 34,
      "NOT INCLUDED (OVER BUDGET) · OUTSIDE THE BUDGET, SO NEVER ITSELF CUT",
      { size: 12, fill: C.ink3, weight: 600, tracking: 1.2 },
    ),
  );
  parts.push(
    text(M + 24, ly + 60, "li-005 · watch · subject", {
      size: 16,
      mono: true,
      fill: C.ink2,
    }),
  );
  const rx = M + lw + 120,
    rw = BW - lw - 120;
  const notes: [string, string[]][] = [
    [
      "Position matters",
      [
        "Models read the start and the end of a",
        "long context best; the middle gets lost.",
      ],
    ],
    [
      "Order is a design decision",
      [
        "How-to-work rules first; conditional",
        "watches last. Not alphabetical, not by date.",
      ],
    ],
    [
      "Cuts are listed, never silent",
      [
        "The reader and the model both see",
        "what was left out, and can ask for it.",
      ],
    ],
    [
      "Stable bytes, cheaper prompts",
      [
        "A byte-stable package placed before",
        "the user turn is cacheable within a session.",
      ],
    ],
  ];
  notes.forEach(([t, b], i) => {
    const ny = y + 30 + i * 128;
    parts.push(text(rx, ny, t, { size: 20, weight: 600 }));
    parts.push(
      lines(rx, ny + 32, b, { size: 16, fill: C.ink2, lineHeight: 24 }),
    );
    void rw;
  });
  return parts.join("\n");
}

// ---------- 8. replay evaluation ----------
function replay(): string {
  const y = BODY_TOP;
  // time bar
  const parts = [
    rect(M, y, 760, 56, { fill: C.flowTint, stroke: C.flowTint, rx: 10 }),
    text(
      M + 24,
      y + 34,
      "sessions before the cutoff  →  packages are built from these only",
      { size: 16 },
    ),
    `<line x1="${M + 776}" y1="${y - 10}" x2="${M + 776}" y2="${y + 66}" stroke="${C.human}" stroke-width="3"/>`,
    text(M + 776, y - 18, "cutoff date", {
      size: 14,
      fill: C.human,
      weight: 600,
      anchor: "middle",
    }),
    rect(M + 792, y, BW - 792, 56, { fill: C.tint, stroke: C.tint, rx: 10 }),
    text(
      M + 816,
      y + 34,
      "sessions after  →  their questions become the test; the package never saw them",
      { size: 16 },
    ),
  ];
  const fy = y + 110,
    ch = 118;
  const col = (
    x: number,
    w: number,
    eyebrow: string,
    title: string,
    sub: string[],
    tint = C.card,
    stroke = C.hair,
  ) =>
    card(x, fy + 60, w, ch + 40, {
      eyebrow,
      title,
      sub,
      titleSize: 22,
      fill: tint,
      stroke,
    });
  parts.push(
    col(M, 250, "Input", "A later question", [
      "the first question of a",
      "session after the cutoff",
    ]),
  );
  // arms
  parts.push(
    card(M + 330, fy, 300, 100, {
      eyebrow: "Arm A",
      title: "As today",
      sub: "the agent as deployed",
      titleSize: 22,
    }),
  );
  parts.push(
    card(M + 330, fy + 136, 300, 100, {
      eyebrow: "Arm B",
      title: "With the package",
      sub: "+ the user’s rules list",
      titleSize: 22,
      fill: C.flowTint,
      stroke: C.flowTint,
    }),
  );
  parts.push(
    arrow(M + 258, fy + 118, M + 322, fy + 50, {}),
    arrow(M + 258, fy + 122, M + 322, fy + 186, {}),
  );
  // judge + guards
  parts.push(
    card(M + 720, fy - 6, 330, 118, {
      eyebrow: "Blind judge",
      title: "A model, seeded order",
      sub: ["scores method, sourcing, needs;", "never the domain call"],
      titleSize: 20,
    }),
  );
  parts.push(
    card(M + 720, fy + 130, 330, 120, {
      eyebrow: "Code guards",
      title: "Deterministic checks",
      sub: ["leak scan · self-reference ·", "length and structure"],
      titleSize: 20,
    }),
  );
  parts.push(
    arrow(M + 638, fy + 50, M + 712, fy + 50, {}),
    arrow(M + 638, fy + 186, M + 712, fy + 186, {}),
  );
  // verdict
  parts.push(
    card(M + 1140, fy + 40, 268, 160, {
      eyebrow: "Verdict",
      title: "Pass line met?",
      sub: ["main score: later corrections", "met, B minus A"],
      titleSize: 22,
      fill: C.humanTint,
      stroke: C.human,
    }),
  );
  parts.push(
    arrow(M + 1058, fy + 50, M + 1132, fy + 110, {}),
    arrow(M + 1058, fy + 186, M + 1132, fy + 130, {}),
  );
  // ground truth note
  parts.push(rect(M, fy + 290, BW, 110, { fill: C.tint, stroke: C.tint }));
  parts.push(
    text(M + 28, fy + 330, "GROUND TRUTH THE PACKAGE NEVER SAW", {
      size: 12,
      fill: C.ink3,
      weight: 600,
      tracking: 1.4,
    }),
  );
  parts.push(
    text(
      M + 28,
      fy + 362,
      "What the user asked for, or corrected, later in that same session. If arm B already does it unprompted, the package worked.",
      { size: 18 },
    ),
  );
  parts.push(
    text(
      M + 28,
      fy + 388,
      "Guards stop the easy wins: an answer that says less, repeats the package’s words, or refers to “my rules”.",
      { size: 18, fill: C.ink2 },
    ),
  );
  return parts.join("\n");
}

// ---------- 9. pre-registration and gates ----------
function prereg(): string {
  const y = BODY_TOP + 8,
    lw = 664;
  const parts = [
    rect(M, y, lw, 420),
    text(M + 28, y + 40, "registration.json · written before the run", {
      size: 14,
      mono: true,
      fill: C.ink3,
    }),
  ];
  const fields = [
    ['"experiment":', '"EXP-R1"'],
    ['"hypothesis":', '"packages raise later-corrections-met"'],
    ['"pass_line":', '"B − A ≥ 10 points; 0 unresolved leaks"'],
    ['"sample":', '"10 queries after 2025-08-01, seed 20250401"'],
    ['"judge_prompt_sha256":', '"3f9c…"'],
    ['"code_sha256":', '"4f3a…"'],
    ['"deviations":', "[]"],
  ];
  fields.forEach(([k, v], i) => {
    parts.push(
      text(M + 28, y + 86 + i * 40, k, { size: 16, mono: true, fill: C.flow }),
    );
    parts.push(
      text(M + 246, y + 86 + i * 40, v, { size: 16, mono: true, fill: C.ink }),
    );
  });
  parts.push(
    cross(M + 40, y + 388),
    text(
      M + 64,
      y + 394,
      "hash of code or prompt differs from the file → the run is refused",
      { size: 16, fill: C.bad, weight: 600 },
    ),
  );
  const rx = M + lw + 56,
    rw = BW - lw - 56;
  parts.push(
    text(rx, y + 24, "ONE SIGN-OFF PER STAGE · WHAT THE PERSON CHECKS", {
      size: 12,
      fill: C.ink3,
      weight: 600,
      tracking: 1.4,
    }),
  );
  const gates: [string, string][] = [
    ["Record", "parser output on a sample of sessions"],
    ["Enrich", "labels on a sealed sample; stability on a rerun"],
    ["Group", "the vocabulary and the registry, then frozen"],
    ["Extract", "items with their quotes; anything paraphrased rejected"],
    ["Serve", "the rendered package and its listed cuts"],
    ["Evaluate", "the judge against a hand-scored sample"],
    ["Approve", "go live, or keep the previous package"],
  ];
  gates.forEach(([g, what], i) => {
    const gy = y + 64 + i * 52;
    parts.push(diamond(rx + 10, gy - 6, 12));
    parts.push(text(rx + 34, gy, g, { size: 18, weight: 600 }));
    parts.push(text(rx + 150, gy, what, { size: 17, fill: C.ink2 }));
    if (i < gates.length - 1)
      parts.push(
        `<line x1="${rx}" y1="${gy + 18}" x2="${rx + rw}" y2="${gy + 18}" stroke="${C.hair}"/>`,
      );
  });
  parts.push(
    text(
      M,
      y + 470,
      "Deviations happen. Record them in the file; never edit the pass line after seeing results.",
      { size: 19, fill: C.ink2 },
    ),
  );
  return parts.join("\n");
}

// ---------- 10. when not to build this ----------
function whenNot(): string {
  const y = BODY_TOP + 4;
  return [
    table(
      M,
      y,
      [330, 170, 190, 190, 190, 170, 168],
      [
        "Approach",
        "Per-user",
        "Provenance",
        "Staleness",
        "Withdrawal",
        "Measured",
        "Build cost",
      ],
      [
        [
          "Notes in the prompt",
          "yes",
          "no",
          "no",
          "edit by hand",
          "no",
          "hours",
        ],
        [
          "Vendor memory tool",
          "yes",
          "partial",
          "no",
          "delete entries",
          "no",
          "hours",
        ],
        [
          "RAG over transcripts",
          "yes",
          "yes, by hit",
          "no",
          "delete source",
          "rarely",
          "days",
        ],
        [
          "Fine-tuning on preferences",
          "no",
          "no",
          "no",
          "retrain",
          "offline evals",
          "weeks",
        ],
        [
          "This loop",
          "yes",
          "verbatim quote",
          "dated, verify",
          "appended event",
          "replay, blind",
          "weeks",
        ],
      ],
      {
        rowH: 60,
        size: 18,
        align: [
          "start",
          "middle",
          "middle",
          "middle",
          "middle",
          "middle",
          "middle",
        ],
      },
    ),
    text(M, y + 60 * 6 + 64, "Good enough without the loop", {
      size: 20,
      weight: 600,
    }),
    lines(
      M,
      y + 60 * 6 + 96,
      [
        "One user, low stakes, no audit need: a vendor memory tool.",
        "Recall-shaped questions (“what did I say about X?”): retrieval over transcripts.",
      ],
      { size: 18, fill: C.ink2, lineHeight: 28 },
    ),
    text(M + 760, y + 60 * 6 + 64, "Build the loop when", {
      size: 20,
      weight: 600,
    }),
    lines(
      M + 760,
      y + 60 * 6 + 96,
      [
        "corrections are per-user and recur across sessions,",
        "and someone is accountable for a wrong answer.",
      ],
      { size: 18, fill: C.ink2, lineHeight: 28 },
    ),
  ].join("\n");
}

// ---------- 11. day 1 / week 1 ----------
function checklist(): string {
  const y = BODY_TOP + 8,
    cw = (BW - 48) / 2,
    ch = 412;
  const column = (x: number, eyebrow: string, title: string, items: string[]) =>
    [
      rect(x, y, cw, ch),
      text(x + 28, y + 40, eyebrow, {
        size: 12,
        fill: C.ink3,
        weight: 600,
        tracking: 1.4,
      }),
      text(x + 28, y + 78, title, { size: 24, weight: 600 }),
      ...items.map((s, i) =>
        [
          `<rect x="${x + 28}" y="${y + 112 + i * 46}" width="18" height="18" rx="4" fill="none" stroke="${C.ink3}" stroke-width="1.5"/>`,
          text(x + 60, y + 126 + i * 46, s, { size: 18, fill: C.ink }),
        ].join("\n"),
      ),
    ].join("\n");
  return [
    column(M, "DAY 1 · HALF A DAY · ONE ENGINEER", "Make learning checkable", [
      "A record schema with provenance, written once",
      "The taxonomy as an enum: kind, scope, owner, status",
      "A code check: every quote is verbatim in its record",
      "World facts rendered as dated claims to verify",
      "A package budget, with every cut listed",
      "Stamp each answer with the package it was served",
    ]),
    column(
      M + cw + 48,
      "WEEK 1 · ENGINEER + ONE REVIEWER",
      "Make learning provable",
      [
        "A cutoff date: build before it, test after it",
        "An extraction prompt and a hand-labelled sample",
        "A judge prompt, calibrated against that sample",
        "The first registration file, hashes included",
        "A named approver per stage, and where it is recorded",
        "A withdrawal path and a cost ceiling per stage",
      ],
    ),
    text(M, y + ch + 64, "Approval is a step, not a hope.", {
      size: 28,
      weight: 600,
    }),
  ].join("\n");
}

export const slides: Slide[] = [
  {
    file: "01-the-complaint",
    title: "The complaint: corrected on Monday, repeated on Tuesday",
    sub: "The model is stateless by design. The system around it is what forgets.",
    describe:
      "Two chat sessions. On Monday the user says never use the word skyrocket and the assistant agrees. On Tuesday, in a new session with empty context, the assistant uses the word. Three missing things are listed: nothing records the correction in a checkable form, nothing decides which notes shape future answers, nothing measures improvement.",
    body: complaint,
    caption:
      "Corrected on Monday, repeated on Tuesday: the model is stateless by design, and nothing around it records, selects or measures.",
  },
  {
    file: "02-why-store-and-inject-fails",
    title: "Why “store the corrections and inject them” fails",
    sub: "The obvious first design breaks within a month, for five structural reasons.",
    describe:
      "A corrections file pasted into every prompt, then five numbered failures: kinds get mixed, facts go stale, text leaks, the list grows, nothing is measured.",
    body: storeInject,
    caption:
      "The naive design: a growing corrections file pasted into every prompt, and the five ways it fails.",
  },
  {
    file: "03-the-learning-loop",
    title: "The learning loop: seven stages, a sign-off at each gate",
    sub: "What moves between stages is a file. What decides is a person. Not a list in a prompt.",
    describe:
      "Record, enrich, group, extract, serve, evaluate and approve form a ring. Each arrow names the file that moves to the next stage and carries a sign-off marker. A dashed arrow returns what failed replay from evaluate to extract.",
    legend: [
      { kind: "dash", label: "feedback" },
      { kind: "diamond", label: "sign-off by a person" },
    ],
    body: loop,
    caption:
      "The loop: seven rerunnable stages. Every arrow carries a file; every gate has a person.",
  },
  {
    file: "04-kinds-of-learning",
    title: "Kinds of learning, and how each one is handled",
    sub: "The taxonomy decides the serving rule. Without it the serving layer cannot tell a fact from a preference.",
    describe:
      "A table of five kinds of learning: world fact, method rule, answer shape, profile and standing watch, each with an example in the user's words, how it is served, whether it goes stale and its layer. Below: scope, owner and precedence rules.",
    body: taxonomy,
    caption:
      "Five kinds of learning, each with its own serving rule, staleness and position in the package.",
  },
  {
    file: "05-one-corrections-journey",
    title: "One correction’s journey through the loop",
    sub: "Monday’s sentence becomes Tuesday’s behaviour, with a file at every step and a person at the gate.",
    describe:
      "Eight steps from a user's sentence on Monday, through record, enrich, group, extract, serve and evaluate, to approval and Tuesday's session starting with the new package.",
    body: journey,
    caption:
      "One rule, end to end: from the user's sentence to the next session's behaviour.",
  },
  {
    file: "06-anatomy-of-a-served-item",
    title: "Anatomy of a served item",
    sub: "Every item quotes the user’s own words. A world fact is served as a dated claim to check, never as a fact.",
    describe:
      "A learning item with kind, scope, verbatim quote, source record and status, each annotated. Two rendered lines: a method rule applied directly, and a world fact rendered as verify before use with its date.",
    body: anatomy,
    caption:
      "A learning item carries its kind, scope, verbatim quote and source; the rendering differs by kind.",
  },
  {
    file: "07-budget-and-layers",
    title: "A package has a budget and layers",
    sub: "How-to-work first, watches last. Anything cut is listed, never silently dropped.",
    describe:
      "A context package drawn as four stacked layers with a budget line cutting through the last layer and a not-included list below. Four notes: position matters, order is a design decision, cuts are listed, stable bytes cache well.",
    body: budget,
    caption:
      "The package: layered by kind, cut at a budget, with the cut list outside the budget.",
  },
  {
    file: "08-replay-evaluation",
    title: "Evaluate by replay before anything goes live",
    sub: "Later questions, answered with and without the package, judged blind, measured against what the user actually corrected.",
    describe:
      "A time bar splits sessions at a cutoff date: packages are built from the earlier ones, questions come from the later ones. A later question is answered in two arms, as today and with the package; a blind model judge and code guards score both; the verdict is the pass line on later corrections met.",
    body: replay,
    caption:
      "Replay: two arms, a blind judge, code guards, and a pass line on corrections the package never saw.",
  },
  {
    file: "09-pre-registration-and-gates",
    title: "Pre-register the test, pin the code, gate each stage",
    sub: "Write the pass line before the run. Hash the code and the prompt. A mismatch refuses the run.",
    describe:
      "A registration file with hypothesis, pass line, sample, prompt and code hashes and an empty deviations list; a note that a hash mismatch refuses the run. Beside it, seven stages with what the person checks at each sign-off.",
    body: prereg,
    caption:
      "The registration file fixes the test before the run; one person signs off at each stage.",
  },
  {
    file: "10-when-not-to-build-this",
    title: "When this loop is the wrong tool",
    sub: "Build it when corrections are per-user, recur across sessions, and a wrong answer has a cost.",
    describe:
      "A comparison table of notes in the prompt, a vendor memory tool, retrieval over transcripts, fine-tuning and this loop, across per-user, provenance, staleness, withdrawal, measurement and build cost. Below, when each simpler option is enough.",
    body: whenNot,
    caption:
      "Alternatives compared: where notes, vendor memory, retrieval or fine-tuning are enough, and where the loop earns its cost.",
  },
  {
    file: "11-day-1-and-week-1",
    title: "Day 1 and week 1",
    sub: "Make learning checkable first, then provable.",
    describe:
      "Two checklists. Day 1: record schema, taxonomy enum, verbatim-quote check, verify-then-apply rendering, budget with listed cuts, package stamp on each answer. Week 1: cutoff date, extraction prompt and sample, calibrated judge, registration file, named approvers, withdrawal path and cost ceiling. Closing line: approval is a step, not a hope.",
    body: checklist,
    caption: "What to build on day 1 and in week 1.",
  },
];
