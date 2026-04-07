function AssuranceIcon({ children }) {
  return (
    <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center text-[#6c7584]">
      {children}
    </div>
  );
}

function QualityIcon() {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full" fill="none" aria-hidden="true">
      <path
        d="M36 8.5L43.4 11.2L51.1 10.4L55.1 17.1L62.1 20.5L61.3 28.2L64 35.5L58.2 40.7L56.5 48.3L48.8 49.2L43 54.3L36 50.9L29 54.3L23.2 49.2L15.5 48.3L13.8 40.7L8 35.5L10.7 28.2L9.9 20.5L16.9 17.1L20.9 10.4L28.6 11.2L36 8.5Z"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path d="M28.5 57.5V50.4L36 46.8L43.5 50.4V57.5L36 53.4L28.5 57.5Z" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
      <circle cx="36" cy="29.5" r="11.5" stroke="currentColor" strokeWidth="2.8" />
      <path d="M31 29.8L34.8 33.5L42 25.8" stroke="#FFA20A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SecurePaymentIcon() {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full" fill="none" aria-hidden="true">
      <path d="M16 24L20.5 53H51.5L56 24" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 24L19.5 13" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M48 24L52.5 13" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="24" cy="58" r="4.8" fill="currentColor" />
      <circle cx="48" cy="58" r="4.8" fill="currentColor" />
      <circle cx="36" cy="23" r="10.5" fill="#FFD24A" />
      <path d="M31.8 23L35 26.2L40.6 20.6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReplacementIcon() {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full" fill="none" aria-hidden="true">
      <path d="M36 15C48.7 15 59 25.3 59 38V41" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M53.8 12.5L59.2 18.1L64.4 12.8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 57C23.3 57 13 46.7 13 34V31" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M18.2 59.5L12.8 53.9L7.6 59.2" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25.5 25.5L46.5 21.5L49.5 42.5L28.5 46.5L25.5 25.5Z" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M32 31.5H40" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M32 37.5H36.5" stroke="#FFA20A" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M43 37.5H43.1" stroke="#FFA20A" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

function CheckoutTrustStrip() {
  const items = [
    {
      label: "Quality Assurance",
      icon: <QualityIcon />,
    },
    {
      label: "100% Secure Payment",
      icon: <SecurePaymentIcon />,
    },
    {
      label: "Easy Replacements",
      icon: <ReplacementIcon />,
    },
  ];

  return (
    <section className="grid grid-cols-3 gap-3 px-1 pt-1 sm:gap-5 sm:px-2">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center text-center">
          <AssuranceIcon>{item.icon}</AssuranceIcon>
          <p className="mt-2 text-[0.92rem] font-semibold uppercase leading-6 tracking-[0.01em] text-[#8b93a3] sm:text-[0.98rem]">
            {item.label}
          </p>
        </div>
      ))}
    </section>
  );
}

export default CheckoutTrustStrip;
