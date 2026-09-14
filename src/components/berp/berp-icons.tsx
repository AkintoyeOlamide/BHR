type IconProps = { className?: string };

export function IconDashboard({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 13.5V6.8c0-.4.3-.8.8-.8H10c.4 0 .8.4.8.8v6.7c0 .4-.4.8-.8.8H4.8c-.5 0-.8-.4-.8-.8Zm9.2-4.7V6.8c0-.4.4-.8.8-.8h5.2c.5 0 .8.4.8.8v2c0 .4-.3.8-.8.8H14c-.4 0-.8-.4-.8-.8ZM13.2 17.2v-5.2c0-.4.4-.8.8-.8h5.2c.5 0 .8.4.8.8v5.2c0 .5-.3.8-.8.8H14c-.4 0-.8-.3-.8-.8ZM4 17.2v-1.2c0-.4.3-.8.8-.8H10c.4 0 .8.4.8.8v1.2c0 .5-.4.8-.8.8H4.8c-.5 0-.8-.3-.8-.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconAttendance({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 8.5V12l2.6 1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLeave({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect
        x="4.25"
        y="5.25"
        width="15.5"
        height="14.5"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 3.75v3M16 3.75v3M4.5 9.5h15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconUpdates({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 17.5V8.8c0-.6.5-1.1 1.1-1.1h7.8c.6 0 1.1.5 1.1 1.1v6.2c0 .6-.5 1.1-1.1 1.1H9.2L7 17.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10 11h4M10 13.5h2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconStaff({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="9" cy="8.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.8 17.2c.4-2.3 2.2-3.7 4.2-3.7s3.8 1.4 4.2 3.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="16.2" cy="9" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M19.4 17.2c-.3-1.8-1.6-3-3.2-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconReports({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 16.5V8M12 16.5V11M18 16.5V6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSettings({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 4.5v1.4M12 18.1v1.4M19.5 12h-1.4M5.9 12H4.5M17.3 6.7l-1 1M7.7 16.3l-1 1M17.3 17.3l-1-1M7.7 7.7l-1-1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSearch({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M16 16.5 20 20.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconBell({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6.2 16.5h11.6l-1.1-2.1V10.4A5.3 5.3 0 0 0 12 5.2a5.3 5.3 0 0 0-5.3 5.2v4.0L6.2 16.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.4a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMegaphone({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 10.5v3c0 .6.4 1 1 1h2.2L10 17v-2.5h2.7l5.8 2.6V7.9L12.7 10.5H5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLive({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="9" cy="8.2" r="2.3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.8 16.8c.5-2.2 2.1-3.5 4.2-3.5 2.1 0 3.7 1.3 4.2 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="16.4" cy="8.6" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M19.3 16.8c-.3-1.6-1.4-2.7-2.9-2.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconLate({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 8.2V12l2.8 1.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMenu({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 7h14M5 12h14M5 17h14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
