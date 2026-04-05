type Point = { label: string; earnings: number };

type Props = {
    points: Point[];
    loading?: boolean;
};

const W = 720;
const H = 280;
const PAD_L = 52;
const PAD_R = 20;
const PAD_T = 24;
const PAD_B = 52;

function formatInr(n: number) {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${Math.round(n)}`;
}

export default function RevenueChart({ points, loading }: Props) {
    if (loading) {
        return (
            <div className="h-[280px] flex items-center justify-center bg-neutral-g1/40 border-t border-neutral-black/5">
                <div className="font-display text-[11px] font-black uppercase tracking-[2px] text-neutral-g4 animate-pulse">
                    Syncing ledger…
                </div>
            </div>
        );
    }

    const n = points.length;
    const maxE = Math.max(...points.map((p) => p.earnings), 0);
    const maxY = maxE <= 0 ? 1 : maxE * 1.12;

    const innerW = W - PAD_L - PAD_R;
    const innerH = H - PAD_T - PAD_B;

    const xAt = (i: number) => PAD_L + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const yAt = (v: number) => PAD_T + innerH - (v / maxY) * innerH;

    const lineD =
        n === 0
            ? ""
            : points
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p.earnings).toFixed(1)}`)
                  .join(" ");

    const baseY = PAD_T + innerH;
    const areaD =
        n === 0
            ? ""
            : `M ${xAt(0).toFixed(1)} ${baseY} ` +
              points.map((p, i) => `L ${xAt(i).toFixed(1)} ${yAt(p.earnings).toFixed(1)}`).join(" ") +
              ` L ${xAt(n - 1).toFixed(1)} ${baseY} Z`;

    const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => PAD_T + innerH * (1 - t));

    const xLabelIndices =
        n <= 5 ? points.map((_, i) => i) : [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1];

    return (
        <div className="relative w-full overflow-hidden bg-neutral-g1/30">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(255 222 0)" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="rgb(255 222 0)" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="revenueLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgb(234 179 8)" />
                        <stop offset="100%" stopColor="rgb(255 222 0)" />
                    </linearGradient>
                </defs>

                {gridYs.map((gy, i) => (
                    <line
                        key={i}
                        x1={PAD_L}
                        y1={gy}
                        x2={W - PAD_R}
                        y2={gy}
                        stroke="rgba(0,0,0,0.06)"
                        strokeWidth="1"
                    />
                ))}

                {gridYs.map((gy, i) => {
                    const val = maxY * (1 - (gy - PAD_T) / innerH);
                    return (
                        <text
                            key={`y-${i}`}
                            x={PAD_L - 8}
                            y={gy + 4}
                            textAnchor="end"
                            fill="#737373"
                            style={{ fontSize: 9, fontWeight: 700 }}
                        >
                            {formatInr(val)}
                        </text>
                    );
                })}

                {n > 0 && <path d={areaD} fill="url(#revenueArea)" />}

                {n > 0 && (
                    <path
                        d={lineD}
                        fill="none"
                        stroke="url(#revenueLine)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {n > 0 &&
                    points.map((p, i) => (
                        <circle
                            key={i}
                            cx={xAt(i)}
                            cy={yAt(p.earnings)}
                            r={p.earnings > 0 ? 4 : 3}
                            fill="#FFDE00"
                            stroke="#0a0a0a"
                            strokeWidth={1.5}
                        />
                    ))}

                {xLabelIndices.map((i) => (
                    <text
                        key={i}
                        x={xAt(i)}
                        y={H - 16}
                        textAnchor="middle"
                        fill="#737373"
                        style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.04em" }}
                    >
                        {points[i]?.label ?? ""}
                    </text>
                ))}
            </svg>

            {n === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-6">
                    <p className="font-display text-[11px] font-black uppercase tracking-[1px] text-neutral-g3">
                        No paid orders in this range yet
                    </p>
                </div>
            )}
        </div>
    );
}
