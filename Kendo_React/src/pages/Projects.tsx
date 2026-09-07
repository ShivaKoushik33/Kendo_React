import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { getProjectsSummary, getTopContributors } from "../services/EmployeeService";
import type { ProjectsSummary } from "../services/EmployeeService";
import type { Employee } from "../types/employee";
import KPICard from "../components/KPICard";
import CommonLoader from "../components/CommonLoader";
import ComparisonValue from "../components/ComparisonValue";
import {
    Grid,
    GridColumn as Column,
} from "@progress/kendo-react-grid";
import type { GridPageChangeEvent,GridCustomCellProps } from "@progress/kendo-react-grid";

import {
    Chart,
    ChartSeries,
    ChartSeriesItem,
    ChartCategoryAxis,
    ChartCategoryAxisItem,
    ChartTitle
} from "@progress/kendo-react-charts";

function Projects() {

    const [summary, setSummary] = useState<ProjectsSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(true);

    const [topContributors, setTopContributors] = useState<Employee[]>([]);
    const [totalContributors, setTotalContributors] = useState(0);
    const [page, setPage] = useState({ skip: 0, take: 10 });
    const [contributorsLoading, setContributorsLoading] = useState(true);

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

    // KPI cards + the department chart are computed in SQL (SUM/AVG/GROUP BY) instead of
    // fetching every employee and reducing over them in the browser.
    useEffect(() => {
        const loadSummary = async () => {
            setSummaryLoading(true);
            try {
                const data = await getProjectsSummary(filters);
                setSummary(data);
            } catch (error) {
                console.error("Error loading projects summary:", error);
            } finally {
                setSummaryLoading(false);
            }
        };
        loadSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [department, employmentType, location]);

    // Top contributors are sorted server-side (ORDER BY ActiveProjects DESC) and paginated,
    // instead of sorting the full employee list in the browser on every load.
    useEffect(() => {
        const loadTopContributors = async () => {
            setContributorsLoading(true);
            try {
                const result = await getTopContributors(page.skip, page.take, filters);
                setTopContributors(result.data);
                setTotalContributors(result.total);
            } catch (error) {
                console.error("Error loading top contributors:", error);
            } finally {
                setContributorsLoading(false);
            }
        };
        loadTopContributors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, department, employmentType, location]);

    const handlePageChange = (event: GridPageChangeEvent) => {
        setPage({ skip: event.page.skip, take: event.page.take });
    };

    const projectLoad = summary?.byDepartment ?? [];
const ProjectsComparisonCell = (props: GridCustomCellProps) => {
    const employee = props.dataItem as Employee;

    return (
        <td {...props.tdProps}>
            <ComparisonValue
                value={employee.activeProjects}
                average={summary?.averageProjects ?? 0}
            />
        </td>
    );
};
    if (summaryLoading && !summary) {
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
                    value={summary?.totalProjects ?? 0}
                />
                <KPICard
                    title="Average Projects"
                    value={summary?.averageProjects?.toFixed(0) ?? "0.00"}                />
                <KPICard
                    title="Active Employees"
                    value={summary?.activeEmployees ?? 0}
                />
                <KPICard
                    title="Highest Allocation"
                    value={summary?.highestProjects ?? 0}
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

            {contributorsLoading && topContributors.length === 0 ? (
                <CommonLoader message="Loading top contributors..." />
            ) : (
                <Grid
                    style={{ height: 500 }}
                    data={{ data: topContributors, total: totalContributors }}
                    skip={page.skip}
                    take={page.take}
                    pageable
                    resizable
                    onPageChange={handlePageChange}
                >
                    <Column field="employeeCode" title="Employee ID" />
                    <Column field="name" title="Employee Name" />
                    <Column field="department" title="Department" />
                    <Column field="activeProjects" title="Projects" cells={{data:ProjectsComparisonCell}}/>
                    <Column field="experienceYears" title="Experience" />
                    <Column field="performance" title="Performance"  format="{0.n2}"/>
                </Grid>
            )}
        </div>
    );
}

export default Projects;
