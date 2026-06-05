// contexts/AlertContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

export type AlertType = "success" | "error" | "info" | "warning";

export interface AlertMessage {
  id: string;
  type: AlertType;
  message: string;
  duration?: number;
}

interface AlertContextType {
  showAlert: (type: AlertType, message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  removeAlert: (id: string) => void;
  alerts: AlertMessage[];
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
  maxAlerts?: number;
  defaultDuration?: number;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
}

export const AlertProvider: React.FC<AlertProviderProps> = ({
  children,
  maxAlerts = 5,
  defaultDuration = 5000,
  position = "bottom-right",
}) => {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const showAlert = useCallback(
    (type: AlertType, message: string, duration: number = defaultDuration) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newAlert: AlertMessage = { id, type, message, duration };

      setAlerts((prev) => {
        const newAlerts = [...prev, newAlert];
        // Limit the number of alerts shown at once
        return newAlerts.slice(-maxAlerts);
      });

      // Auto remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeAlert(id);
        }, duration);
      }
    },
    [defaultDuration, maxAlerts, removeAlert],
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showAlert("success", message, duration);
    },
    [showAlert],
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      showAlert("error", message, duration);
    },
    [showAlert],
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showAlert("info", message, duration);
    },
    [showAlert],
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showAlert("warning", message, duration);
    },
    [showAlert],
  );

  const value = {
    showAlert,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeAlert,
    alerts,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertContainer position={position} />
    </AlertContext.Provider>
  );
};

// Alert Container Component
const AlertContainer: React.FC<{ position: string }> = ({ position }) => {
  const { alerts, removeAlert } = useAlert();

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={`fixed z-[1200] space-y-3 ${positionClasses[position as keyof typeof positionClasses]}`}
    >
      {alerts.map((alert) => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </div>
  );
};

// Individual Alert Item Component
const AlertItem: React.FC<{ alert: AlertMessage; onClose: () => void }> = ({
  alert,
  onClose,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const config = {
    success: {
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    error: {
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    warning: {
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-800",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    info: {
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  };

  const { bgColor, borderColor, textColor, icon } = config[alert.type];

  return (
    <div
      className={`min-w-[320px] max-w-md rounded-xl shadow-lg p-4 flex items-center justify-between border ${bgColor} ${borderColor} ${textColor} transition-all duration-300 ${
        isExiting
          ? "opacity-0 transform translate-x-full"
          : "opacity-100 transform translate-x-0"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{alert.message}</span>
      </div>
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};
