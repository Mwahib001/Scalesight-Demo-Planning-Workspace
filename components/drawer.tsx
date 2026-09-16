"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
export function Drawer({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const el = dialog.current;
    el?.showModal();
    heading.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el?.close();
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`drawer ${wide ? "drawer-wide" : ""}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        closeRef.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.clientX < rect.left) onClose();
        }
      }}
    >
      <div className="drawer-heading">
        <div>
          <span className="eyebrow">NORTHSTAR COMMERCE</span>
          <h2 id={id} ref={heading} tabIndex={-1}>
            {title}
          </h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close drawer"
        >
          <X size={20} />
        </button>
      </div>
      <div className="drawer-content">{children}</div>
    </dialog>
  );
}
