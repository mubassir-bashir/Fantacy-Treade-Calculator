// app/components/Logo.js
export default function Logo({ size = 28 }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#2563EB" />
        <path
          d="M9 13L13 9M13 9L17 13M13 9V19"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23 19L19 23M19 23L15 19M19 23V13"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-semibold text-lg tracking-tight">Trade Calculator</span>
    </div>
  )
}