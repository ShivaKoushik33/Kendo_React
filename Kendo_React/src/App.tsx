import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import Employees from "./pages/Employees";
import EmployeesVirtualized from "./pages/EmployeesVirtualized";
import Projects from "./pages/Projects";
import Attendance from "./pages/Attendance";
import Performance from "./pages/Performance";
import Salary from "./pages/Salary";
import Leaves from "./pages/Leaves";
import Organization from "./pages/Organization";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route element={<ProtectedRoute />}>
          {/* Private pages */}
          <Route element={<MainLayout />}>
            <Route path='/' element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees-virtualized" element={<EmployeesVirtualized />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/salary" element={<Salary />} />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/organization" element={<Organization />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>


    </BrowserRouter>
  )
}

export default App
