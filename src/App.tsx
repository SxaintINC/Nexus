import { BrowserRouter, Route, Routes } from "react-router-dom";

import Landing from "./landing-page/page";
import RegistrationForm from "./getstarted/page";

import RouteLoader from "./Loader/routerLoader";

import { LoaderProvider } from "./Loader/loadercontext";

import { AlertProvider } from "./Alert/alertcontext";

function App() {
  return (
    <LoaderProvider>
      <AlertProvider
        position="bottom-right"
        maxAlerts={5}
        defaultDuration={5000}
      >
        <BrowserRouter>
          <RouteLoader />

          <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/getstarted" element={<RegistrationForm />} />
          </Routes>
        </BrowserRouter>
      </AlertProvider>
    </LoaderProvider>
  );
}

export default App;
