import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginFake from "./view/LoginFake";
import CargaForm from "./view/CargaForm";
import NotFoundView from "./view/NotFoundView";
import OperatorForm from "./view/OperatorForm";
import SupervisorCargaView from "./view/SupervisorCargaView";
import SupervisorDashboard from "./view/SupervisorDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<LoginFake />}
        />
        <Route path="/operador" element={<OperatorForm />} />
        <Route
          path="/carga"
          element={<CargaForm />}
        />
        <Route
          path="/supervisor/perforacion"
          element={<SupervisorDashboard />}
        />
        <Route path="/supervisor/carga" element={<SupervisorCargaView />} />
        <Route
          path="/sup"
          element={<Navigate to="/supervisor/perforacion" replace />}
        />
        <Route
          path="*"
          element={<NotFoundView />}
        />
      </Routes>
    </BrowserRouter>
  );
}
