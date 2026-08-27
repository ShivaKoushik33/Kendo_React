import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { getEmployees } from "../services/EmployeeService";
import type { Employee } from "../types/employee";
import KPICard from "../components/KPICard";
import CommonLoader from "../components/CommonLoader";

import {
    Grid,
    GridColumn as Column,
} from "@progress/kendo-react-grid";

import {
    Chart,
    ChartSeries,
    ChartSeriesItem,
    ChartCategoryAxis,
    ChartCategoryAxisItem,
    ChartTitle
} from "@progress/kendo-react-charts";

function Projects() {

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    const {
        department,
        employmentType,
        location,
    } = useSelector((state: RootState) => state.filters);

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const data = await getEmployees();
                setEmployees(data);
            } catch (error) {
                console.error("Error loading employees:", error);
            } finally {
                setLoading(false);
            }
        };
        loadEmployees();
    }, []);

    const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
        const departmentMatch = !department || department.name === "All Departments" || employee.department === department.name;
        const employmentTypeMatch = !employmentType || employmentType.name === "All Types" || employee.employmentType === employmentType.name;
        const locationMatch = !location || location.name === "All Locations" || employee.location === location.name;
        return departmentMatch && employmentTypeMatch && locationMatch;
    });
}, [employees, department, employmentType, location]);



    const totalProjects=filteredEmployees.reduce((sum,e)=>sum+e.activeProjects,0);
    const averageProjects =
        filteredEmployees.length > 0
            ? Number((totalProjects / filteredEmployees.length).toFixed(1))
            : 0;

    const activeEmployees = filteredEmployees.filter(
        employee => employee.isActive
    ).length;

    const highestProjects = Math.max(
        ...filteredEmployees.map(employee => employee.activeProjects),
        0
    );

    const projectLoad = Object.values(
        filteredEmployees.reduce((result, employee) => {
            if (!result[employee.department]) {
                result[employee.department] = {
                    department: employee.department,
                    projects: 0
                };
            }

            result[employee.department].projects += employee.activeProjects;

            return result;

        }, {} as Record<string, { department: string; projects: number }>)
    );

    const topContributors = [...filteredEmployees]
        .sort((a, b) => b.activeProjects - a.activeProjects);

    if (loading) {
        return <CommonLoader message="Loading projects..." />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-semibold">
                Projects
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Projects"
                    value={totalProjects}
                />
                <KPICard
                    title="Average Projects"
                    value={averageProjects}
                />
                <KPICard
                    title="Active Employees"
                    value={activeEmployees}
                />
                <KPICard
                    title="Highest Allocation"
                    value={highestProjects}
                />
            </div>
            <Chart style={{ height: 350 }}>
                <ChartTitle text="Department Project Load" />
                <ChartCategoryAxis>
                    <ChartCategoryAxisItem
                        categories={projectLoad.map(item => item.department)}
                    />
                </ChartCategoryAxis>
                <ChartSeries>
                    <ChartSeriesItem
                        type="bar"
                        data={projectLoad.map(item => item.projects)}
                        name='Current'
                        gap={2}
                        spacing={0.25}
                        tooltip={{ visible: true }}
                    />
                </ChartSeries>
            </Chart>

            <Grid
                style={{ height: 500 }}
                data={topContributors}
                pageable
                sortable
                resizable
                // filterable
                autoProcessData
            >
                <Column field="employeeCode" title="Employee ID" />
                <Column field="name" title="Employee Name" />
                <Column field="department" title="Department" />
                <Column field="activeProjects" title="Projects" />
                <Column field="experienceYears" title="Experience" />
                <Column field="performance" title="Performance" />
            </Grid>
        </div>
    );
}

export default Projects;
