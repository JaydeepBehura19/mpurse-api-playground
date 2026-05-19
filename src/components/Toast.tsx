import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface ToastProps {
  toasts: Array<{ id: string; message: string; type: "success" | "error" | "info" }>;
}

export function ToastContainer({ toasts }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          let Icon = Info;
          let bgColor = "bg-white border-zinc-200 text-zinc-800";
          let iconColor = "text-primary";

          if (toast.type === "success") {
            Icon = CheckCircle2;
            bgColor = "bg-success-light border-emerald-200 text-emerald-900";
            iconColor = "text-success";
          } else if (toast.type === "error") {
            Icon = AlertCircle;
            bgColor = "bg-error-light border-red-200 text-red-900";
            iconColor = "text-error";
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-sm pointer-events-auto ${bgColor}`}
            >
              <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${iconColor}`} />
              <div className="flex-1 text-sm font-medium leading-relaxed">
                {toast.message}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
