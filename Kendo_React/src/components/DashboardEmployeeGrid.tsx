import { Grid, GridColumn as Column } from "@progress/kendo-react-grid";
import type { GridPageChangeEvent } from "@progress/kendo-react-grid";
import CommonLoader from "./CommonLoader";
import type { Employee } from "../types/employee";

interface DashboardEmployeeGridProps {
    data: Employee[];
    total: number;
    skip: number;
    take: number;
    loading: boolean;
    onPageChange: (event: GridPageChangeEvent) => void;
}

const DashboardEmployeeGrid = ({
    data,
    total,
    skip,
    take,
    loading,
    onPageChange,
}: DashboardEmployeeGridProps) => {
    if (loading && data.length === 0) {
        return <CommonLoader message="Loading employees..." />;
    }

    return (
        <Grid
            style={{ height: "420px" }}
            data={{ data, total }}
            dataItemKey="id"
            skip={skip}
            take={take}
            total={total}
            pageable={{ pageSizes: [10, 20, 50] }}
            rowHeight={36}
            resizable={true}
            scrollable="scrollable"
            autoProcessData={false}
            onPageChange={onPageChange}
        >
            <Column field="employeeCode" title="Employee Code" width="150px" />
            <Column field="name" title="Name" width="180px" />
            <Column field="department" title="Department" width="170px" />
            <Column field="employmentType" title="Employment Type" width="170px" />
            <Column field="location" title="Location" width="140px" />
            <Column field="attendance" title="Attendance (%)" width="140px" format="{0:n2}" />
            <Column field="performance" title="Performance" width="140px" format="{0:n2}" />
            <Column field="activeProjects" title="Projects" width="120px" />
        </Grid>
    );
};

export default DashboardEmployeeGrid;
