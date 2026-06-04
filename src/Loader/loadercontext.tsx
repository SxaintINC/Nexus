import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

import { LoadingScreen } from "./loader";

type LoaderContextType = {
  showLoader: () => void;
};

const LoaderContext = createContext<LoaderContextType>({
  showLoader: () => {},
});

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);

  const showLoader = () => {
    setLoading((prev) => {
      if (prev) return prev;

      return true;
    });
  };

  return (
    <LoaderContext.Provider
      value={{
        showLoader,
      }}
    >
      {children}

      {loading && (
        <LoadingScreen
          onDone={() => {
            setLoading(false);
          }}
        />
      )}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  return useContext(LoaderContext);
}
