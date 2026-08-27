import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Grid, GridColumn as Column } from "@progress/kendo-react-grid";
import { ProgressBar } from "@progress/kendo-react-progressbars";

import KPICard from "../components/KPICard";
import CommonLoader from "../components/CommonLoader";
import { getEmployees } from "../services/EmployeeService";
import type { Employee } from "../types/employee";
import type { RootState } from "../store/store";

function Attendance() {

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

            const departmentMatch =
                !department ||
                department.name === "All Departments" ||
                employee.department === department.name;

            const employmentMatch =
                !employmentType ||
                employmentType.name === "All Types" ||
                employee.employmentType === employmentType.name;

            const locationMatch =
                !location ||
                location.name === "All Locations" ||
                employee.location === location.name;

            return (
                departmentMatch &&
                employmentMatch &&
                locationMatch
            );

        });
    }, [
        employees,
        department,
        employmentType,
        location,
    ]);

    const totalAttendance = filteredEmployees.reduce((sum,e)=>sum+e.attendance,0);

    const averageAttendance =filteredEmployees.length>0
                                      ?
                    Number((totalAttendance/filteredEmployees.length).toFixed(1)):0;


    const highestAttendance=Math.max(...filteredEmployees.map(e=>e.attendance),0)
    const excellentAttendance = filteredEmployees.filter(
        employee => employee.attendance>=95
    ).length;

    const lowAttendance = filteredEmployees.filter(
        employee => employee.attendance < 85
    ).length;

    const attendanceByDepartment = Object.values(
        filteredEmployees.reduce((result, employee) => {

            if (!result[employee.department]) {
                result[employee.department] = {
                    department: employee.department,
                    totalAttendance: 0,
                    employeeCount: 0
                };
            }

            result[employee.department].totalAttendance += employee.attendance;
            result[employee.department].employeeCount++;

            return result;

        }, {} as Record<string, {
            department: string;
            totalAttendance: number;
            employeeCount: number;
        }>)
    ).map(item => ({
        department: item.department,
        attendance: Number(
            (
                item.totalAttendance /
                item.employeeCount
            ).toFixed(1)
        )
    }));

    const getAttendanceStatus = (attendance: number) => {

        if (attendance>=95) return "Excellent";

        if (attendance>=90) return "Good";

        if (attendance>=85) return "Average";

        return "Needs Attention";
    };

    if (loading) {
        return <CommonLoader message="Loading attendance..." />;
    }

        return (
        <div className="space-y-6">

            <div>
                <h1 className="text-3xl font-bold">
                    Attendance
                </h1>

                <p className="text-gray-500">
                    Monitor employee attendance across departments.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                <KPICard
                    title="Average Attendance"
                    value={averageAttendance}
                />

                <KPICard
                    title="Highest Attendance"
                    value={highestAttendance}
                />

                <KPICard
                    title="95%+ Attendance"
                    value={excellentAttendance}
                />

                <KPICard
                    title="Below 85%"
                    value={lowAttendance}
                />

            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">

                <h2 className="mb-6 text-xl font-semibold">
                    Department Attendance
                </h2>
                <div className="space-y-5">
                    {attendanceByDepartment.map(item => (
                        <div key={item.department}>
                            <div className="mb-2 flex justify-between">
                                <span className="font-medium">
                                    {item.department}
                                </span>
                                <span>
                                    {item.attendance}%
                                </span>
                            </div>
                            <ProgressBar
                                value={item.attendance}
                                max={100}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-semibold">
                    Attendance Records
                </h2>
                <Grid
                    data={filteredEmployees}
                    // pageable
                    sortable
                    resizable
                    style={{ height: 500 }}

                >
                    <Column field="employeeCode" title="Employee ID"  />
                    <Column field="name" title="Employee Name"  />
                    <Column field="department" title="Department" />
                    <Column field="attendance" title="Attendance (%)" />
                    <Column title="Status"
                        cells={{
                            data: (props: any) => (
                                <td {...props.tdProps}>
                                    {getAttendanceStatus(
                                        props.dataItem.attendance
                                    )}
                                </td>
                            )
                        }}
                    />
                    <Column
                        field="location"
                        title="Location"
                    />
                </Grid>
            </div>
        </div>
    );
}

export default Attendance;
