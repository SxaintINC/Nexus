import { useEffect, useRef } from "react";

import { useLocation } from "react-router-dom";

import { useLoader } from "./loadercontext";

export default function RouteLoader() {
  const location = useLocation();

  const firstLoad = useRef(true);

  const { showLoader } = useLoader();

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;

      return;
    }

    showLoader();
  }, [location.pathname]);

  return null;
}
