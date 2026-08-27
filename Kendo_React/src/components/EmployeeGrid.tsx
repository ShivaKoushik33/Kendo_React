import { Grid, GridColumn as Column } from "@progress/kendo-react-grid";
import type { GridCustomCellProps, GridPageChangeEvent, GridSelectionChangeEvent } from "@progress/kendo-react-grid";
import { Button } from "@progress/kendo-react-buttons";
import type { Employee } from "../types/employee";
import CommonLoader from "./CommonLoader";

interface EmployeeGridProps {
    
    data: Employee[];
    total: number;
    skip: number;
    take: number;
    loading: boolean;
    selectedEmployeeId: number | null;
    onEmployeeSelect: (employee: Employee) => void;
    onAdd: () => void;
    onEdit: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
    onPageChange: (event: GridPageChangeEvent) => void;
}

const EmployeeGrid = ({ data, total, skip, take, loading, selectedEmployeeId, onEmployeeSelect, onAdd, onEdit, onDelete, onPageChange }: EmployeeGridProps) => {

    const handleSelectionChange = (e: GridSelectionChangeEvent) => {
        const selectedKey = Object.keys(e.select).find((key) => e.select[key]);
        if (!selectedKey) return;
        const employee = data.find((item) => String(item.id) === selectedKey);
        if (employee) onEmployeeSelect(employee);
    };

    const CommandCell = (props: GridCustomCellProps) => {
        const employee = props.dataItem as Employee;
        return (
            <td {...props.tdProps} onClick={(e) => e.stopPropagation()}>
                <Button
                    type="button"
                    size="small"
                    onClick={() => onEdit(employee)}
                    style={{ marginRight: 8 }}
                >
                    Edit
                </Button>
                <Button
                    type="button"
                    size="small"
                    themeColor="error"
                    onClick={() => onDelete(employee)}
                >
                    Delete
                </Button>
            </td>
        );
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <Button type="button" themeColor="primary" onClick={onAdd}>
                    Add Employee
                </Button>
            </div>

            {loading ? (
                <CommonLoader message="Loading employees..." />
            ) : (
                <Grid
                    className="employee-grid"
                    style={{ height: "475px" }}
                    data={{ data, total }}
                    dataItemKey="id"
                    skip={skip}
                    take={take}
                    pageable={true}
                    resizable={true}
                    scrollable="scrollable"
                    selectable={{ enabled: true, mode: "single", cell: false, drag: false }}
                    select={{ [String(selectedEmployeeId ?? "")]: true }}
                    onSelectionChange={handleSelectionChange}
                    onPageChange={onPageChange}
                >
                    <Column field="employeeCode" title="Employee Code" width="150px" />
                    <Column field="name" title="Name" width="180px" />
                    <Column field="department" title="Department" width="170px" />
                    <Column field="employmentType" title="Employment Type" width="170px" />
                    <Column field="location" title="Location" width="140px" />
                    <Column field="attendance" title="Attendance (%)" width="140px" />
                    <Column field="performance" title="Performance" width="140px" />
                    <Column field="activeProjects" title="Projects" width="120px" />
                    <Column field="isActive" title="Status" width="120px" />
                    <Column title="Actions" cells={{ data: CommandCell }} width="160px" />
                </Grid>
            )}
        </div>
    );
};

export default EmployeeGrid;
