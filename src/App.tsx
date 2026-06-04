import { BrowserRouter, Route, Routes } from "react-router-dom";

import Landing from "./landing-page/page";
import RegistrationForm from "./getstarted/page";

import RouteLoader from "./Loader/routerLoader";

import { LoaderProvider } from "./Loader/loadercontext";

function App() {
  return (
    <LoaderProvider>
      <BrowserRouter>
        <RouteLoader />

        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/getstarted" element={<RegistrationForm />} />
        </Routes>
      </BrowserRouter>
    </LoaderProvider>
  );
}

export default App;
