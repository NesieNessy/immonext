"use client";

import { Icons } from '@/components/common/Icons';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  show: boolean;
  /** DOM id of the result section to jump to / observe visibility of. */
  resultId: string;
  /** DOM id of an element near the top of the form to scroll back to. */
  formTopId: string;
}

/**
 * Mobile-only banner shown above the form on the quick-check pages.
 * Points down to the result while the form is in view, and flips to
 * point back up once the result has scrolled into view.
 */
export function MobileResultBanner({ show, resultId, formTopId }: Props) {
  const [resultVisible, setResultVisible] = useState(false);
  const observedId = useRef<string | null>(null);

  useEffect(() => {
    if (!show) return;
    const target = document.getElementById(resultId);
    if (!target) return;

    observedId.current = resultId;
    const observer = new IntersectionObserver(
      ([entry]) => setResultVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [show, resultId]);

  if (!show) return null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <button
      type="button"
      onClick={() => scrollTo(resultVisible ? formTopId : resultId)}
      className="lg:hidden w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg
                 bg-primary text-primary-foreground cursor-pointer"
    >
      <span className="flex items-center gap-2 font-medium">
        <Icons.CheckCircle className="w-5 h-5" />
        {resultVisible ? 'Eingaben ändern' : 'Ergebnis verfügbar'}
      </span>
      <span className="flex items-center gap-1 font-medium">
        {resultVisible ? 'Nach oben' : 'Zum Ergebnis'}
        {resultVisible ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
      </span>
    </button>
  );
}
