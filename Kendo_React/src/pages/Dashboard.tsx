import { useEffect, useState } from "react";
import CommonLoader from "../components/CommonLoader";
import KPICard from "../components/KPICard";
import DashBoardFilters from "../components/DashBoardFilters";
import { getDashboardSummary, type DashboardSummary } from "../services/EmployeeService";
import { useSelector} from "react-redux";
import type { RootState } from "../store/store";

import {
  type DashBoardKPI,
} from "../data/dashBoard";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

const {department,employmentType,location}=useSelector((state:RootState)=>state.filters)


const dashboardData: DashBoardKPI[] = [
    {
        id: 1,
        title: "Total Employees",
        value: summary?.totalEmployees ?? 0,
    },
    {
        id: 2,
        title: "Active Employees",
        value: summary?.activeEmployees ?? 0,
    },
    {
        id: 3,
        title: "Average Attendance",
        value: summary?.averageAttendance ?.toFixed(2)??"0.00",
        suffix: "%",
    },
    {
        id: 4,
        title: "Average Performance",
        value: summary?.averagePerformance ?.toFixed(2)??"0.00" ,
    },

];

useEffect(() => {
    const loadSummary = async () => {
        setLoading(true);
        try {
            const data = await getDashboardSummary({
                departmentId: department?.id || undefined,
                employmentTypeId: employmentType?.id || undefined,
                locationId: location?.id || undefined,
            });
            setSummary(data);
        } catch (error) {
            console.error("Error loading dashboard summary:", error);
        } finally {
            setLoading(false);
        }
    };
    loadSummary();
}, [department, employmentType, location]);

  if (loading) {
    return (
      <CommonLoader message="Loading dashboard..." />
    );
  }

  return (
    <div>
      <h1 className="text-4xl mb-6">Dashboard</h1>
        <DashBoardFilters/>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dashboardData.map((kpi) => (
          <KPICard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            suffix={kpi.suffix}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
