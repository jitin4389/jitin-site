/**
 * Slide primitives for article decks: one 16:9 SVG per idea, self-contained (own surface), so a slide
 * reads the same on the site in both themes, on Medium/LinkedIn, and as a video frame.
 *
 * Design tokens: one warm-neutral surface, three ink levels, two semantic hues (indigo = what the
 * machine moves, amber = where a person decides). Type scale 14 · 17 · 22 · 26 · 44, two weights.
 */

export const W = 1600;
export const H = 900;
export const M = 96; // outer margin
export const BODY_TOP = 212; // below the title block
export const BODY_BOTTOM = H - 96; // above the footer

export const C = {
  surface: "#FBFAF7",
  card: "#FFFFFF",
  hair: "#DCDBD5",
  tint: "#F1EFEA", // table header, soft panels
  ink: "#14151A",
  ink2: "#5B5F6B",
  ink3: "#8A8F9C",
  flow: "#4F46E5", // indigo: machine, data moving
  flowTint: "#EEEDFC",
  human: "#B45309", // amber: a person decides
  humanTint: "#FBF0E3",
  bad: "#B91C1C", // used only for "fails" marks
  badTint: "#FBECEC",
};

export const T = { foot: 14, label: 17, sub: 22, node: 26, h1: 44 } as const;
const FONT =
  "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export type TextOpts = {
  size?: number;
  fill?: string;
  weight?: 400 | 600;
  anchor?: "start" | "middle" | "end";
  halo?: boolean;
  tracking?: number;
  mono?: boolean;
  italic?: boolean;
};

export function text(
  x: number,
  y: number,
  s: string,
  o: TextOpts = {},
): string {
  const attrs = [
    `x="${r(x)}"`,
    `y="${r(y)}"`,
    `font-size="${o.size ?? T.label}"`,
    `font-weight="${o.weight ?? 400}"`,
    `fill="${o.fill ?? C.ink}"`,
    `text-anchor="${o.anchor ?? "start"}"`,
  ];
  if (o.halo)
    attrs.push(
      `paint-order="stroke" stroke="${C.surface}" stroke-width="8" stroke-linejoin="round"`,
    );
  if (o.tracking) attrs.push(`letter-spacing="${o.tracking}"`);
  if (o.mono) attrs.push(`font-family="${MONO}"`);
  if (o.italic) attrs.push(`font-style="italic"`);
  return `<text ${attrs.join(" ")}>${esc(s)}</text>`;
}

/** Several lines, top-aligned at y (baseline of the first line). */
export function lines(
  x: number,
  y: number,
  rows: string[],
  o: TextOpts & { lineHeight?: number } = {},
): string {
  const lh = o.lineHeight ?? (o.size ?? T.label) * 1.45;
  return rows.map((s, i) => text(x, y + i * lh, s, o)).join("\n");
}

export function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  o: {
    fill?: string;
    stroke?: string;
    sw?: number;
    rx?: number;
    dash?: string;
  } = {},
): string {
  return `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${o.rx ?? 12}" fill="${o.fill ?? C.card}" stroke="${o.stroke ?? C.hair}" stroke-width="${o.sw ?? 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
}

/** A card with the standard three-line anatomy: eyebrow, title, sub. Any line may be omitted. */
export function card(
  x: number,
  y: number,
  w: number,
  h: number,
  o: {
    eyebrow?: string;
    title?: string;
    sub?: string | string[];
    fill?: string;
    stroke?: string;
    titleSize?: number;
  },
): string {
  const cx = x + w / 2;
  const subs = typeof o.sub === "string" ? [o.sub] : (o.sub ?? []);
  const parts = [rect(x, y, w, h, { fill: o.fill, stroke: o.stroke })];
  // vertical rhythm: eyebrow at 28, title at 58, subs from 84
  let cy = y + 28;
  if (o.eyebrow) {
    parts.push(
      text(cx, cy, o.eyebrow.toUpperCase(), {
        size: 12,
        fill: C.ink3,
        weight: 600,
        anchor: "middle",
        tracking: 1.4,
      }),
    );
    cy += 30;
  } else cy += 6;
  if (o.title) {
    parts.push(
      text(cx, cy, o.title, {
        size: o.titleSize ?? T.node,
        weight: 600,
        anchor: "middle",
      }),
    );
    cy += 26;
  }
  subs.forEach((s, i) =>
    parts.push(
      text(cx, cy + i * 22, s, { size: 16, fill: C.ink2, anchor: "middle" }),
    ),
  );
  return parts.join("\n");
}

export function diamond(
  x: number,
  y: number,
  size = 14,
  fill = C.human,
): string {
  return `<rect x="${r(x - size / 2)}" y="${r(y - size / 2)}" width="${size}" height="${size}" transform="rotate(45 ${r(x)} ${r(y)})" fill="${fill}" stroke="${C.surface}" stroke-width="3"/>`;
}

export function check(x: number, y: number, color = C.flow): string {
  return `<circle cx="${r(x)}" cy="${r(y)}" r="11" fill="${color}"/><path d="M${r(x - 5)} ${r(y)} l3.5 3.5 l7 -8" stroke="${C.card}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export function cross(x: number, y: number, color = C.bad): string {
  return `<circle cx="${r(x)}" cy="${r(y)}" r="11" fill="${color}"/><path d="M${r(x - 4)} ${r(y - 4)} l8 8 M${r(x + 4)} ${r(y - 4)} l-8 8" stroke="${C.card}" stroke-width="2.5" stroke-linecap="round"/>`;
}

/** Straight arrow with an optional label (haloed, offset perpendicular) and a sign-off diamond near the head. */
export function arrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  o: {
    label?: string;
    dashed?: boolean;
    gate?: boolean;
    color?: string;
    labelSide?: 1 | -1;
    labelAt?: number;
  } = {},
): string {
  const color = o.color ?? (o.dashed ? C.ink3 : C.flow);
  const marker = o.dashed
    ? "url(#ah-muted)"
    : o.color === C.human
      ? "url(#ah-human)"
      : "url(#ah-flow)";
  const parts = [
    `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${color}" stroke-width="2"${o.dashed ? ' stroke-dasharray="6 6"' : ""} marker-end="${marker}"/>`,
  ];
  const dx = x2 - x1,
    dy = y2 - y1,
    d = Math.hypot(dx, dy) || 1;
  if (o.label) {
    const t = o.labelAt ?? 0.5;
    const px = -dy / d,
      py = dx / d; // perpendicular
    const side = o.labelSide ?? -1;
    const lx = x1 + dx * t + px * 18 * side,
      ly = y1 + dy * t + py * 18 * side + 5;
    parts.push(
      text(lx, ly, o.label, { fill: C.ink2, anchor: "middle", halo: true }),
    );
  }
  if (o.gate) parts.push(diamond(x1 + dx * 0.84, y1 + dy * 0.84));
  return parts.join("\n");
}

/** Simple text table with a tinted header row and hairlines. Column widths in px; first column left-aligned. */
export function table(
  x: number,
  y: number,
  cols: number[],
  header: string[],
  rows: string[][],
  o: {
    rowH?: number;
    size?: number;
    headSize?: number;
    align?: ("start" | "middle")[];
    mono?: boolean[];
  } = {},
): string {
  const rowH = o.rowH ?? 54,
    size = o.size ?? 17;
  const width = cols.reduce((a, b) => a + b, 0);
  const parts = [rect(x, y, width, rowH * (rows.length + 1), { fill: C.card })];
  parts.push(
    `<rect x="${r(x)}" y="${r(y)}" width="${r(width)}" height="${rowH}" rx="12" fill="${C.tint}"/>`,
  );
  parts.push(
    `<rect x="${r(x)}" y="${r(y + rowH - 12)}" width="${r(width)}" height="12" fill="${C.tint}"/>`,
  );
  const cellX = (ci: number) =>
    x + cols.slice(0, ci).reduce((a, b) => a + b, 0);
  const alignOf = (ci: number) =>
    o.align?.[ci] ?? (ci === 0 ? "start" : "start");
  const tx = (ci: number) =>
    alignOf(ci) === "middle" ? cellX(ci) + cols[ci] / 2 : cellX(ci) + 20;
  header.forEach((h, ci) =>
    parts.push(
      text(tx(ci), y + rowH / 2 + 6, h.toUpperCase(), {
        size: o.headSize ?? 12,
        fill: C.ink3,
        weight: 600,
        tracking: 1.2,
        anchor: alignOf(ci),
      }),
    ),
  );
  rows.forEach((row, ri) => {
    const ry = y + rowH * (ri + 1);
    if (ri > 0)
      parts.push(
        `<line x1="${r(x + 16)}" y1="${r(ry)}" x2="${r(x + width - 16)}" y2="${r(ry)}" stroke="${C.hair}" stroke-width="1"/>`,
      );
    row.forEach((cell, ci) => {
      const cellLines = cell.split("\n");
      const base = ry + rowH / 2 + 6 - ((cellLines.length - 1) * 20) / 2;
      cellLines.forEach((s, li) =>
        parts.push(
          text(tx(ci), base + li * 20, s, {
            size: cellLines.length > 1 ? size - 2 : size,
            fill: ci === 0 ? C.ink : C.ink2,
            weight: ci === 0 ? 600 : 400,
            anchor: alignOf(ci),
            mono: o.mono?.[ci],
          }),
        ),
      );
    });
  });
  return parts.join("\n");
}

export type Legend = {
  kind: "dash" | "diamond" | "check" | "cross" | "swatch";
  label: string;
  color?: string;
}[];

export function frame(o: {
  title: string;
  sub: string;
  n: number;
  total: number;
  deck: string;
  author: string;
  body: string;
  legend?: Legend;
  describe: string;
}): string {
  const legend = (o.legend ?? [])
    .map((l, i) => {
      const y = H - 118 + i * 30,
        x = W - M;
      const mark =
        l.kind === "dash"
          ? `<line x1="${x - 96}" y1="${y - 5}" x2="${x - 76}" y2="${y - 5}" stroke="${C.ink3}" stroke-width="2" stroke-dasharray="5 5"/>`
          : l.kind === "diamond"
            ? diamond(x - 170, y - 6, 12, l.color)
            : l.kind === "check"
              ? check(x - 170, y - 6, l.color)
              : l.kind === "cross"
                ? cross(x - 170, y - 6, l.color)
                : `<rect x="${x - 176}" y="${y - 12}" width="14" height="14" rx="3" fill="${l.color}"/>`;
      return `${mark}\n${text(x, y, l.label, { fill: C.ink2, anchor: "end" })}`;
    })
    .join("\n");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">`,
    `<title id="t">${esc(o.title)}</title>`,
    `<desc id="d">${esc(o.describe)}</desc>`,
    "<defs>",
    `<marker id="ah-flow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9 z" fill="${C.flow}"/></marker>`,
    `<marker id="ah-muted" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9 z" fill="${C.ink3}"/></marker>`,
    `<marker id="ah-human" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9 z" fill="${C.human}"/></marker>`,
    "</defs>",
    `<rect width="${W}" height="${H}" fill="${C.surface}"/>`,
    `<g font-family="${FONT}">`,
    text(M, 118, o.title, { size: T.h1, weight: 600, tracking: -0.6 }),
    text(M, 162, o.sub, { size: T.sub, fill: C.ink2 }),
    o.body,
    legend,
    text(M, H - 40, `${o.author}  ·  ${o.deck}`, {
      size: T.foot,
      fill: C.ink3,
    }),
    text(W - M, H - 40, `${o.n} / ${o.total}`, {
      size: T.foot,
      fill: C.ink3,
      anchor: "end",
    }),
    "</g></svg>",
  ].join("\n");
}

function r(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
