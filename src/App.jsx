import { BrowserRouter, Route } from "react-router-dom";
import OperatorForm from "./view/OperatorForm";
import SupervisorDashboard from "./view/SupervisorDashboard";
import { Routes } from "react-router-dom";


export default function App() {
  return (
  <BrowserRouter>
    {/* Routes */}
    <Routes>
      <Route path="/" element={<OperatorForm />} />
      <Route path="/sup" element={<SupervisorDashboard />} /> 
    </Routes>
  </BrowserRouter>
  );
}