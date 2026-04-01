import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

export const HeartIcon: React.FC<IconProps> = ({ size = 100, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path
      d="M50 88C50 88 10 65 10 35C10 20 22 10 35 10C43 10 48 14 50 20C52 14 57 10 65 10C78 10 90 20 90 35C90 65 50 88 50 88Z"
      fill={color}
    />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size = 100, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path
      d="M50 25C20 25 2 50 2 50C2 50 20 75 50 75C80 75 98 50 98 50C98 50 80 25 50 25Z"
      fill={color}
    />
    <circle cx="50" cy="50" r="16" fill="#C45A3C" />
    <circle cx="50" cy="50" r="8" fill="#2D1810" />
    <circle cx="45" cy="45" r="3" fill="rgba(255,255,255,0.6)" />
  </svg>
);

export const TeaCupIcon: React.FC<IconProps> = ({ size = 100, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Steam wisps */}
    <path d="M35 30C35 22 40 18 40 10" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
    <path d="M50 28C50 20 55 16 55 8" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
    <path d="M65 30C65 22 60 18 60 10" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
    {/* Cup body */}
    <path
      d="M18 38H72L65 85C65 88 62 90 58 90H32C28 90 25 88 25 85L18 38Z"
      fill={color}
    />
    {/* Handle */}
    <path
      d="M72 45C80 45 88 50 88 60C88 70 80 75 72 75"
      stroke={color}
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    {/* Tea color inside */}
    <rect x="24" y="44" width="42" height="6" rx="2" fill="#C45A3C" opacity="0.4" />
  </svg>
);

export const RocketIcon: React.FC<IconProps> = ({ size = 100, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Rocket body */}
    <path
      d="M50 5C50 5 35 25 35 55L35 70H65L65 55C65 25 50 5 50 5Z"
      fill={color}
    />
    {/* Nose cone detail */}
    <path
      d="M50 5C50 5 43 20 40 35H60C57 20 50 5 50 5Z"
      fill="#E8E8E8"
      opacity="0.3"
    />
    {/* Window */}
    <circle cx="50" cy="42" r="8" fill="#C45A3C" />
    <circle cx="50" cy="42" r="5" fill="#2D1810" />
    <circle cx="47" cy="39" r="2" fill="rgba(255,255,255,0.4)" />
    {/* Left fin */}
    <path d="M35 55L20 75L35 70Z" fill={color} />
    {/* Right fin */}
    <path d="M65 55L80 75L65 70Z" fill={color} />
    {/* Flame */}
    <path d="M40 70L50 95L60 70Z" fill="#FFB347" />
    <path d="M44 70L50 88L56 70Z" fill="#FF6B35" />
  </svg>
);

export const PencilIcon: React.FC<IconProps> = ({ size = 100, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <g transform="rotate(45, 50, 50)">
    {/* Pencil body */}
    <rect x="38" y="10" width="24" height="60" rx="2" fill={color} />
    {/* Pencil stripe */}
    <rect x="38" y="25" width="24" height="8" fill="#C45A3C" opacity="0.5" />
    {/* Metal ferrule */}
    <rect x="36" y="70" width="28" height="10" rx="1" fill="#D4D4D4" />
    {/* Tip */}
    <path d="M38 80L50 98L62 80Z" fill="#FFD700" />
    <path d="M44 86L50 98L56 86Z" fill="#2D1810" />
    {/* Eraser */}
    <rect x="40" y="5" width="20" height="8" rx="3" fill="#FF8FAB" />
    </g>
  </svg>
);

export const GaugeIcon: React.FC<IconProps> = ({ size = 100, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Gauge arc */}
    <path
      d="M15 70A40 40 0 0 1 85 70"
      stroke={color}
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    {/* Tick marks */}
    <line x1="20" y1="55" x2="26" y2="58" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <line x1="30" y1="38" x2="35" y2="42" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <line x1="50" y1="30" x2="50" y2="36" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <line x1="70" y1="38" x2="65" y2="42" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <line x1="80" y1="55" x2="74" y2="58" stroke={color} strokeWidth="3" strokeLinecap="round" />
    {/* Needle */}
    <line x1="50" y1="68" x2="72" y2="42" stroke="#FF6B35" strokeWidth="4" strokeLinecap="round" />
    {/* Center dot */}
    <circle cx="50" cy="68" r="6" fill={color} />
    <circle cx="50" cy="68" r="3" fill="#C45A3C" />
    {/* Label area */}
    <rect x="30" y="75" width="40" height="15" rx="4" fill={color} />
    <rect x="34" y="78" width="32" height="3" rx="1" fill="#C45A3C" opacity="0.4" />
    <rect x="38" y="84" width="24" height="3" rx="1" fill="#C45A3C" opacity="0.3" />
  </svg>
);

export const ICON_MAP: Record<string, React.FC<IconProps>> = {
  L: HeartIcon,
  i: EyeIcon,
  t: TeaCupIcon,
  R: RocketIcon,
  P: PencilIcon,
  G: GaugeIcon,
};
