import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Grid, GridColumn as Column } from "@progress/kendo-react-grid";
import type { GridPageChangeEvent,GridCustomCellProps } from "@progress/kendo-react-grid";
import { ProgressBar } from "@progress/kendo-react-progressbars";
import ComparisonValue from "../components/ComparisonValue";
import KPICard from "../components/KPICard";
import CommonLoader from "../components/CommonLoader";
import { getAttendanceSummary, getEmployeesPaginated } from "../services/EmployeeService";
import type { AttendanceSummary } from "../services/EmployeeService";
import type { Employee } from "../types/employee";
import type { RootState } from "../store/store";

// Carries a precomputed `status` so the grid can bind it as a plain field.
type AttendanceRecord = Employee & { status: string };

function Attendance() {

    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(true);

    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [page, setPage] = useState({ skip: 0, take: 10 });
    const [recordsLoading, setRecordsLoading] = useState(true);

    const {
        department,
        employmentType,
        location,
    } = useSelector((state: RootState) => state.filters);

    const filters = {
        departmentId: department?.id || undefined,
        employmentTypeId: employmentType?.id || undefined,
        locationId: location?.id || undefined,
    };

    // KPI cards + department breakdown are computed in SQL (AVG/MAX/GROUP BY) instead of
    // fetching every employee and reducing over them in the browser.
    useEffect(() => {
        const loadSummary = async () => {
            setSummaryLoading(true);
            try {
                const data = await getAttendanceSummary(filters);
                setSummary(data);
            } catch (error) {
                console.error("Error loading attendance summary:", error);
            } finally {
                setSummaryLoading(false);
            }
        };
        loadSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [department, employmentType, location]);

    // The records grid is server-paginated, same as the Employees page, instead of rendering
    // every filtered row into the DOM at once.
    useEffect(() => {
        const loadRecords = async () => {
            setRecordsLoading(true);
            try {
                const result = await getEmployeesPaginated(page.skip, page.take, filters);
                setRecords(result.data.map((emp) => ({ ...emp, status: getAttendanceStatus(emp.attendance) })));
                setTotalRecords(result.total);
            } catch (error) {
                console.error("Error loading attendance records:", error);
            } finally {
                setRecordsLoading(false);
            }
        };
        loadRecords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, department, employmentType, location]);

    const handlePageChange = (event: GridPageChangeEvent) => {
        setPage({ skip: event.page.skip, take: event.page.take });
    };

    const getAttendanceStatus = (attendance: number) => {

        if (attendance>=95) return "Excellent";

        if (attendance>=90) return "Good";

        if (attendance>=85) return "Average";

        return "Needs Attention";
    };
const AttendanceComparisonCell = (props: GridCustomCellProps) => {
    const employee = props.dataItem as Employee;

    return (
        <td {...props.tdProps}>
            <ComparisonValue
                value={employee.attendance}
                average={summary?.averageAttendance ?? 0}
            />
        </td>
    );
};
    if (summaryLoading && !summary) {
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
                    value={summary?.averageAttendance?.toFixed(2) ?? "0.00"}
                />

                <KPICard
                    title="Highest Attendance"
                    value={summary?.highestAttendance ?.toFixed(2) ?? "0.00"}
                />

                <KPICard
                    title="95%+ Attendance"
                    value={summary?.excellentCount ?? 0}
                />

                <KPICard
                    title="Below 85%"
                    value={summary?.lowCount ?? 0}
                />

            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">

                <h2 className="mb-6 text-xl font-semibold">
                    Department Attendance
                </h2>
                <div className="space-y-5">
                    {(summary?.byDepartment ?? []).map(item => (
                        <div key={item.department}>
                            <div className="mb-2 flex justify-between">
                                <span className="font-medium">
                                    {item.department}
                                </span>
                                <span>
                                    {item.attendance?.toFixed(2)}%
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
                {recordsLoading && records.length === 0 ? (
                    <CommonLoader message="Loading records..." />
                ) : (
                    <Grid
                        data={{ data: records, total: totalRecords }}
                        skip={page.skip}
                        take={page.take}
                        pageable
                        resizable
                        style={{ height: 500 }}
                        onPageChange={handlePageChange}
                    >
                        <Column field="employeeCode" title="Employee ID"  />
                        <Column field="name" title="Employee Name"  />
                        <Column field="department" title="Department" />
                        <Column field="attendance" title="Attendance (%)" cells={{data:AttendanceComparisonCell}} />
                        <Column field="status" title="Status" />
                        <Column
                            field="location"
                            title="Location"
                        />
                    </Grid>
                )}
            </div>
        </div>
    );
}

export default Attendance;
