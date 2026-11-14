import type { Dossier } from "@/lib/schema";

type Kind = Dossier["art"];
const F = "#0C1430"; // panel fill

function Wheel({ x, y, r = 14 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#050816" stroke="currentColor" strokeWidth={2} />
      <circle cx={x} cy={y} r={r * 0.45} fill={F} stroke="currentColor" strokeWidth={1.5} />
      {[0, 60, 120].map((a) => <line key={a} x1={x - r * 0.45 * Math.cos((a * Math.PI) / 180)} y1={y - r * 0.45 * Math.sin((a * Math.PI) / 180)} x2={x + r * 0.45 * Math.cos((a * Math.PI) / 180)} y2={y + r * 0.45 * Math.sin((a * Math.PI) / 180)} stroke="currentColor" strokeWidth={1} />)}
    </g>
  );
}
const Foot = ({ x, y }: { x: number; y: number }) => <ellipse cx={x} cy={y} rx={11} ry={3.5} fill={F} stroke="currentColor" strokeWidth={1.8} />;

const ART: Record<Kind, () => JSX.Element> = {
  mirror: () => (
    <g>
      <line x1="24" y1="22" x2="158" y2="72" stroke="#EAF1FF" strokeWidth="2" strokeDasharray="5 5" opacity=".9" />
      <line x1="158" y1="80" x2="30" y2="30" stroke="#EAF1FF" strokeWidth="1.5" strokeDasharray="2 6" opacity=".5" />
      <line x1="165" y1="112" x2="165" y2="132" stroke="currentColor" strokeWidth="3" /><Foot x={165} y={133} />
      <polygon points="108,44 224,44 236,112 96,112" fill={F} stroke="currentColor" strokeWidth="2.2" />
      {Array.from({ length: 5 }).flatMap((_, i) => Array.from({ length: 3 }).map((_, j) => <circle key={`${i}${j}`} cx={124 + i * 22 + j * 1.5} cy={58 + j * 18} r={6.5} fill="#7FD6FF" fillOpacity=".25" stroke="currentColor" strokeWidth="1.4" />))}
    </g>
  ),
  buggy: () => (
    <g>
      <line x1="196" y1="92" x2="196" y2="50" stroke="currentColor" strokeWidth="2.4" />
      <ellipse cx="196" cy="46" rx="18" ry="7" transform="rotate(-18 196 46)" fill={F} stroke="currentColor" strokeWidth="2" />
      <polygon points="84,94 238,94 248,106 76,106" fill={F} stroke="currentColor" strokeWidth="2.2" />
      <path d="M120 94 V72 H136 V94 M150 94 V72 H166 V94" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="176" y="80" width="14" height="14" fill={F} stroke="currentColor" strokeWidth="1.6" />
      <Wheel x={100} y={116} r={16} /><Wheel x={224} y={116} r={16} />
    </g>
  ),
  "rover-small": () => (
    <g>
      <polygon points="100,78 222,78 230,88 92,88" fill="#7FD6FF" fillOpacity=".22" stroke="currentColor" strokeWidth="2" />
      <rect x="104" y="88" width="114" height="24" rx="3" fill={F} stroke="currentColor" strokeWidth="2.2" />
      <line x1="118" y1="112" x2="118" y2="120" stroke="currentColor" strokeWidth="2" /><line x1="204" y1="112" x2="204" y2="120" stroke="currentColor" strokeWidth="2" />
      <Wheel x={118} y={122} r={10} /><Wheel x={161} y={122} r={10} /><Wheel x={204} y={122} r={10} />
      <line x1="222" y1="84" x2="244" y2="64" stroke="currentColor" strokeWidth="2" /><circle cx="246" cy="62" r="3" fill="currentColor" />
    </g>
  ),
  rover: () => (
    <g>
      <line x1="190" y1="78" x2="190" y2="38" stroke="currentColor" strokeWidth="2.4" /><rect x="180" y="30" width="22" height="11" rx="2" fill={F} stroke="currentColor" strokeWidth="2" />
      <polygon points="84,80 220,80 230,90 76,90" fill="#7FD6FF" fillOpacity=".22" stroke="currentColor" strokeWidth="2" />
      <rect x="96" y="90" width="118" height="26" rx="3" fill={F} stroke="currentColor" strokeWidth="2.2" />
      <polyline points="214,100 248,92 262,108" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="124" cy="72" r="9" fill={F} stroke="currentColor" strokeWidth="2" /><line x1="124" y1="80" x2="124" y2="86" stroke="currentColor" strokeWidth="2" />
      <Wheel x={116} y={124} r={12} /><Wheel x={155} y={124} r={12} /><Wheel x={194} y={124} r={12} />
    </g>
  ),
  "lander-legs": () => (
    <g>
      <line x1="160" y1="92" x2="102" y2="130" stroke="currentColor" strokeWidth="2.4" /><line x1="160" y1="92" x2="220" y2="130" stroke="currentColor" strokeWidth="2.4" /><line x1="160" y1="92" x2="160" y2="132" stroke="currentColor" strokeWidth="2.4" />
      <Foot x={100} y={132} /><Foot x={222} y={132} /><Foot x={160} y={134} />
      <line x1="126" y1="104" x2="194" y2="104" stroke="currentColor" strokeWidth="1.6" />
      <polygon points="136,84 184,84 192,98 128,98" fill={F} stroke="currentColor" strokeWidth="2.2" />
      <line x1="160" y1="84" x2="160" y2="46" stroke="currentColor" strokeWidth="2.4" />
      <polygon points="124,38 196,32 200,42 128,48" fill="#7FD6FF" fillOpacity=".22" stroke="currentColor" strokeWidth="2" />
      <rect x="168" y="62" width="16" height="11" rx="2" fill={F} stroke="currentColor" strokeWidth="1.8" />
    </g>
  ),
  "lander-viking": () => (
    <g>
      <line x1="120" y1="104" x2="90" y2="132" stroke="currentColor" strokeWidth="2.4" /><line x1="162" y1="106" x2="160" y2="136" stroke="currentColor" strokeWidth="2.4" /><line x1="204" y1="104" x2="232" y2="132" stroke="currentColor" strokeWidth="2.4" />
      <Foot x={88} y={134} /><Foot x={160} y={138} /><Foot x={234} y={134} />
      <polygon points="104,90 216,90 228,104 92,104" fill={F} stroke="currentColor" strokeWidth="2.2" />
      <rect x="126" y="68" width="68" height="22" rx="3" fill={F} stroke="currentColor" strokeWidth="2" />
      <line x1="118" y1="76" x2="118" y2="62" stroke="currentColor" strokeWidth="2" /><ellipse cx="118" cy="56" rx="14" ry="6" transform="rotate(-25 118 56)" fill={F} stroke="currentColor" strokeWidth="2" />
      <polyline points="194,82 238,70 256,84" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" /><circle cx="257" cy="85" r="4" fill="#EAF1FF" />
    </g>
  ),
  "lander-solar": () => (
    <g>
      <circle cx="74" cy="66" r="42" fill="#7FD6FF" fillOpacity=".14" stroke="currentColor" strokeWidth="2.2" /><circle cx="74" cy="66" r="14" fill={F} stroke="currentColor" strokeWidth="1.6" />
      <circle cx="246" cy="66" r="42" fill="#7FD6FF" fillOpacity=".14" stroke="currentColor" strokeWidth="2.2" /><circle cx="246" cy="66" r="14" fill={F} stroke="currentColor" strokeWidth="1.6" />
      {[0, 45, 90, 135].flatMap((a) => [74, 246].map((cx) => <line key={`${a}${cx}`} x1={cx - 40 * Math.cos((a * Math.PI) / 180)} y1={66 - 40 * Math.sin((a * Math.PI) / 180)} x2={cx + 40 * Math.cos((a * Math.PI) / 180)} y2={66 + 40 * Math.sin((a * Math.PI) / 180)} stroke="currentColor" strokeWidth="0.8" opacity=".5" />))}
      <line x1="120" y1="100" x2="106" y2="130" stroke="currentColor" strokeWidth="2.2" /><line x1="200" y1="100" x2="214" y2="130" stroke="currentColor" strokeWidth="2.2" /><Foot x={104} y={132} /><Foot x={216} y={132} />
      <ellipse cx="160" cy="96" rx="58" ry="11" fill={F} stroke="currentColor" strokeWidth="2.2" />
      <path d="M128 92 Q160 56 192 92" fill={F} stroke="currentColor" strokeWidth="2" />
      <polyline points="176,100 196,118 226,122" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M232 132 a14 9 0 0 1 28 0 z" fill={F} stroke="currentColor" strokeWidth="1.8" />
    </g>
  ),
  helicopter: () => (
    <g>
      <rect x="136" y="50" width="48" height="7" rx="2" fill="#7FD6FF" fillOpacity=".25" stroke="currentColor" strokeWidth="1.8" />
      <line x1="160" y1="57" x2="160" y2="94" stroke="currentColor" strokeWidth="2.4" />
      <rect x="40" y="64" width="240" height="4.5" rx="2" fill={F} stroke="currentColor" strokeWidth="1.8" />
      <rect x="52" y="76" width="216" height="4.5" rx="2" fill={F} stroke="currentColor" strokeWidth="1.8" />
      <rect x="140" y="94" width="40" height="22" rx="4" fill={F} stroke="currentColor" strokeWidth="2.2" />
      <line x1="146" y1="116" x2="124" y2="136" stroke="currentColor" strokeWidth="2" /><line x1="174" y1="116" x2="196" y2="136" stroke="currentColor" strokeWidth="2" />
      <line x1="152" y1="116" x2="146" y2="136" stroke="currentColor" strokeWidth="2" /><line x1="168" y1="116" x2="176" y2="136" stroke="currentColor" strokeWidth="2" />
      <Foot x={123} y={137} /><Foot x={197} y={137} />
    </g>
  ),
};

const LABEL: Record<Kind, string> = { mirror: "laser reflector panel", buggy: "lunar roving vehicle", "rover-small": "small rover", rover: "six-wheeled rover", "lander-legs": "three-legged lander", "lander-viking": "lander with sampling arm", "lander-solar": "lander with round solar panels", helicopter: "helicopter" };

// A simple drawn illustration so every card shows "what it looks like" even before a NASA photo is added.
export default function MachineArt({ kind, color, className = "h-auto w-full" }: { kind: Kind; color: string; className?: string }) {
  const Art = ART[kind];
  return (
    <svg viewBox="0 0 320 160" role="img" aria-label={`Illustration: ${LABEL[kind]}`} className={className} style={{ color, filter: `drop-shadow(0 0 6px ${color}55)` }}>
      <g fill="#EAF1FF" opacity=".5">{[[20, 20], [60, 110], [290, 30], [270, 88], [240, 14], [38, 62], [300, 120], [210, 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 0.8 : 1.3} />)}</g>
      <Art />
      <line x1="8" y1="146" x2="312" y2="146" stroke={color} strokeOpacity=".35" strokeWidth="1.4" strokeDasharray="3 6" />
    </svg>
  );
}
