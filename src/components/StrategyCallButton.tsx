"use client";

import { useState } from "react";
import Script from "next/script";
import { ArrowRight } from "lucide-react";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

export function StrategyCallButton() {
  const url = process.env.NEXT_PUBLIC_CALENDLY_URL;
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  function openWidget() {
    if (!url) return;
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url });
      setLoading(false);
    } else {
      setLoading(true);
      setRequested(true);
    }
  }

  return (
    <div className="strategy-call">
      {url && (
        <link
          rel="stylesheet"
          href="https://assets.calendly.com/assets/external/widget.css"
        />
      )}
      {requested && (
        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          onReady={openWidget}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      )}
      <button
        type="button"
        className="button"
        onClick={openWidget}
        disabled={!url || loading || failed}
        aria-busy={loading}
      >
        {loading ? "Loading Calendly…" : "Book A Strategy Call"}
        <ArrowRight size={16} aria-hidden="true" />
      </button>
      {failed && (
        <p role="alert">
          Calendly couldn’t load. <a href={url}>Open the booking page</a>.
        </p>
      )}
      {!url && <p>Online booking is currently unavailable.</p>}
    </div>
  );
}
