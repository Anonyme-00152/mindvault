"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Share, SquarePlus, X } from "lucide-react";
import { isIOS, isStandalone } from "@/lib/pwa";

/**
 * iPhone: Web Push only reaches installed web apps, so the first thing to do on
 * Safari is "Add to Home Screen". Shown once per browser until dismissed.
 */
export function InstallBanner() {
  const [show, setShow] = useState(false);
  // Only on the dashboard: it must never sit on top of a composer or a form.
  const pathname = usePathname();

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("mv-install-dismissed") === "1";
    } catch {}
    setShow(isIOS() && !isStandalone() && !dismissed);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem("mv-install-dismissed", "1");
    } catch {}
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && pathname === "/app" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{ bottom: "calc(1rem + var(--sab))" }}
          className="fixed left-4 right-4 z-[55] glass !bg-bg-elev !border-brand/40 p-4 shadow-2xl"
          role="dialog"
          aria-label="Install MindVault"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-grad shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium">Add MindVault to your Home Screen</p>
              <p className="text-[12.5px] text-fg-muted mt-1 leading-relaxed">
                Tap <Share size={12} className="inline -mt-0.5" /> <b className="text-fg">Share</b>, then <SquarePlus size={12} className="inline -mt-0.5" /> <b className="text-fg">Add to Home Screen</b>. You&apos;ll get an app icon, full screen, offline access — and notifications.
              </p>
            </div>
            <button className="btn-icon shrink-0" onClick={dismiss} aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
