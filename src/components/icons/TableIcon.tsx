interface TableIconProps {
  className?: string
}

export default function TableIcon({ className }: TableIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="4" width="16" height="2" fill="currentColor" />
      <rect x="2" y="9" width="16" height="2" fill="currentColor" />
      <rect x="2" y="14" width="16" height="2" fill="currentColor" />
    </svg>
  )
}