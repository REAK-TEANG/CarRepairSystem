export default function Logo({ size = 20, className = '', strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Geometric Car Body Contour */}
      <path
        d="M3 20H6L9 13H17L22 17H29V20H26"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Geometric Cabin / Windshield */}
      <path
        d="M10 13L13 8H20L24 13"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Geometric Window Divider */}
      <line
        x1="17"
        y1="8"
        x2="17"
        y2="13"
        stroke="currentColor"
        strokeWidth={Math.max(1, strokeWidth - 0.5)}
        strokeLinecap="round"
      />
      {/* Geometric Wheels / Hexagonal Hubs */}
      <circle
        cx="8"
        cy="20"
        r="2.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <circle
        cx="23"
        cy="20"
        r="2.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      {/* Center Underchassis Line */}
      <line
        x1="10.5"
        y1="20"
        x2="20.5"
        y2="20"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Subtle Precision Geometric Accent / Tool Spark */}
      <path
        d="M27 7L24 10M27 10L24 7"
        stroke="currentColor"
        strokeWidth={Math.max(1, strokeWidth - 0.5)}
        strokeLinecap="round"
      />
    </svg>
  )
}
