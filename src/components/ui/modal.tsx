"use client";

import { Fragment, type ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showClose?: boolean;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  showClose = true,
  footer,
}: ModalProps) {
  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[90vw]",
  };
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-theme-text/50" aria-hidden="true" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={cn(
                "w-full rounded-xl bg-theme-surface border border-theme-border shadow-xl",
                sizes[size]
              )}
            >
              {(title || showClose) && (
                <div className="flex items-center justify-between border-b border-theme-border px-6 py-4">
                  {title && (
                    <Dialog.Title className="text-lg font-semibold text-theme-text">
                      {title}
                    </Dialog.Title>
                  )}
                  <div className={title ? "" : "ml-auto"} />
                  {showClose && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              )}
              <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                {children}
              </div>
              {footer && (
                <div className="border-t border-theme-border px-6 py-4 flex justify-end gap-2">
                  {footer}
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
