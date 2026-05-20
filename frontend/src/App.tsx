import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Loans from "./pages/Loan";
import AuthPage from "./pages/AuthPage";
import AddLoan from "./pages/AddLoan";
import History from "./pages/History";
import Calendar from "./pages/Calender";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Main routes */}
        <Route path="/login" element={<AuthPage/>}/>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-loans" element={<Loans />} />
        <Route path="/add-loan" element={<AddLoan />} />
        <Route path="/history" element={<History />} />
        <Route path="/calendar" element={<Calendar />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;