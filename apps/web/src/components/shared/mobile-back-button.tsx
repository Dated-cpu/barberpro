'use client';

import { useRouter } from 'next/navigation';

export function MobileBackButton() {
  const router = useRouter();

  const handleClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Назад"
      className="fixed top-20 left-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 bg-bg-glass backdrop-blur-md text-text-secondary shadow-lg transition-all duration-200 hover:border-gold/40 hover:text-gold active:scale-90 md:hidden"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
