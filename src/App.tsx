import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Getstarted from "./pages/Getstarted";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/getstarted" element={<Getstarted />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
