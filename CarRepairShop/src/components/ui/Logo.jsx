export default function Logo({
  size = 20,
  className = '',
  withText = false,
  textClassName = '',
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
      >
        {/* Pure Torx Precision Disc Emblem (Negative Space Star Profile) */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 50 2 A 48 48 0 1 0 50 98 A 48 48 0 1 0 50 2 Z M 41.748 26.536 A 8.500 8.500 0 0 1 58.252 26.536 A 4.773 4.773 0 0 0 66.194 31.121 A 8.500 8.500 0 0 1 74.446 45.415 A 4.773 4.773 0 0 0 74.446 54.585 A 8.500 8.500 0 0 1 66.194 68.879 A 4.773 4.773 0 0 0 58.252 73.464 A 8.500 8.500 0 0 1 41.748 73.464 A 4.773 4.773 0 0 0 33.806 68.879 A 8.500 8.500 0 0 1 25.554 54.585 A 4.773 4.773 0 0 0 25.554 45.415 A 8.500 8.500 0 0 1 33.806 31.121 A 4.773 4.773 0 0 0 41.748 26.536 Z"
          fill="currentColor"
        />
      </svg>

      {withText && (
        <span
          className={`font-black tracking-[0.2em] uppercase font-sans text-app-text select-none ${textClassName}`}
        >
          KAIRO
        </span>
      )}
    </div>
  )
}
