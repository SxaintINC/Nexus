import { BrowserRouter, Route, Routes } from "react-router-dom";

import Landing from "./landing-page/page";
import Home from "./home/page";
import Getstarted from "./getstarted/page";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/getstarted" element={<Getstarted />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
