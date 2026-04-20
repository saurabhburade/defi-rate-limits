import React from "react";
import { Toast, ToastPosition, toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/20/solid";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

type NotificationProps = {
  content: React.ReactNode;
  status: "success" | "info" | "loading" | "error" | "warning";
  duration?: number;
  icon?: string;
  position?: ToastPosition;
};

type NotificationOptions = {
  duration?: number;
  icon?: string;
  position?: ToastPosition;
};

const ENUM_STATUSES = {
  success: <CheckCircleIcon className="w-6 text-white" />,
  loading: <span className="spinner text-white" />,
  error: <ExclamationCircleIcon className="w-6 text-white" />,
  info: <InformationCircleIcon className="w-6 text-white" />,
  warning: <ExclamationTriangleIcon className="w-6 text-white" />,
};

const DEFAULT_DURATION = 3000;
const DEFAULT_POSITION: ToastPosition = "top-center";

/**
 * Custom Notification
 */
const Notification = ({
  content,
  status,
  duration = DEFAULT_DURATION,
  icon,
  position = DEFAULT_POSITION,
}: NotificationProps) => {
  return toast.custom(
    (t: Toast) => (
      <div
        className={`relative flex max-w-sm transform-gpu items-start justify-between space-x-3 rounded-2xl border border-white/10 bg-[#0b0b0b] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition-all duration-500 ease-in-out
        ${
          position.substring(0, 3) == "top"
            ? `hover:translate-y-1 ${t.visible ? "top-0" : "-top-96"}`
            : `hover:-translate-y-1 ${t.visible ? "bottom-0" : "-bottom-96"}`
        }`}
      >
        <div className="leading-[0] self-center">{icon ? icon : ENUM_STATUSES[status]}</div>
        <div
          className={`overflow-x-hidden break-words whitespace-pre-line text-sm text-white/82 ${icon ? "mt-1" : ""}`}
        >
          {content}
        </div>

        <div
          className={`cursor-pointer text-lg text-white/50 ${icon ? "mt-1" : ""}`}
          onClick={() => toast.dismiss(t.id)}
        >
          <XMarkIcon className="w-6 cursor-pointer" onClick={() => toast.remove(t.id)} />
        </div>
      </div>
    ),
    {
      duration: status === "loading" ? Infinity : duration,
      position,
    },
  );
};

export const notification = {
  success: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "success", ...options });
  },
  info: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "info", ...options });
  },
  warning: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "warning", ...options });
  },
  error: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "error", ...options });
  },
  loading: (content: React.ReactNode, options?: NotificationOptions) => {
    return Notification({ content, status: "loading", ...options });
  },
  remove: (toastId: string) => {
    toast.remove(toastId);
  },
};
