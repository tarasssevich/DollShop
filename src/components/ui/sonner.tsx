"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-espresso group-[.toaster]:border group-[.toaster]:border-linen-dark group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl font-sans",
          description: "group-[.toast]:text-muted text-xs",
          actionButton:
            "group-[.toast]:bg-terracotta group-[.toast]:text-white group-[.toast]:hover:bg-terracotta-hover",
          cancelButton:
            "group-[.toast]:bg-linen group-[.toast]:text-espresso group-[.toast]:hover:bg-linen-dark",
          success:
            "group-[.toaster]:border-emerald-200 group-[.toaster]:text-espresso",
          error:
            "group-[.toaster]:border-red-200 group-[.toaster]:text-espresso",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
