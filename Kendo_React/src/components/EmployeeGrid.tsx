import { Grid, GridColumn as Column } from "@progress/kendo-react-grid";
import type { GridCustomCellProps, GridPageChangeEvent, GridSelectionChangeEvent } from "@progress/kendo-react-grid";
import { Button } from "@progress/kendo-react-buttons";
import type { Employee } from "../types/employee";
import CommonLoader from "./CommonLoader";
import {
    ExcelExport,
    ExcelExportColumn
} from "@progress/kendo-react-excel-export";
import { Loader } from "@progress/kendo-react-indicators";
import { useRef, useState } from "react";
import { Input } from "@progress/kendo-react-inputs";

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
    onBackendExport: () => Promise<void>;
    search: string;
    onSearchChange: (value: string) => void;
    virtualized?: boolean;
}

const EmployeeGrid = ({ data, total, skip, take, loading, selectedEmployeeId, onEmployeeSelect, onAdd, onEdit, onDelete, onPageChange, onBackendExport, search, onSearchChange, virtualized = false }: EmployeeGridProps) => {
    const excelExportRef = useRef<ExcelExport>(null);
    const [exporting, setExporting] = useState<"current" | null>(null);

    const downloadExcel = async (exportData: Employee[]) => {
        const dataUrl = await excelExportRef.current?.toDataURL(exportData);
        if (!dataUrl) throw new Error("Excel export did not produce a file");

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "Employees.xlsx";
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const exportCurrent = async () => {
        if (exporting) return;
        setExporting("current");
        try {
            // Let the loader paint before Kendo builds the workbook.
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            await downloadExcel(virtualized ? visibleData : data);
        } catch (error) {
            console.error("Error exporting current employees:", error);
        } finally {
            setExporting(null);
        }       
    };
    const normalizedSearch = search.trim().toLowerCase();
    const filteredData = normalizedSearch
        ? data.filter((employee) => [
            employee.employeeCode,
            employee.name,
            employee.department,
            employee.employmentType,
            employee.location,
        ].some((value) => value.toLowerCase().includes(normalizedSearch)))
        : data;
    const visibleData = filteredData;
    const handleSelectionChange = (e: GridSelectionChangeEvent) => {
        const selectedKey = Object.keys(e.select).find((key) => e.select[key]);
        if (!selectedKey) return;
        const employee = visibleData.find((item) => String(item.id) === selectedKey);
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

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
                <Input
                    value={search}
                    onChange={(event) => onSearchChange(String(event.value ?? ""))}
                    placeholder="Search employees..."
                    style={{ width: 260 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="button" themeColor="primary" onClick={onAdd} disabled={!!exporting}>
                    Add Employee
                </Button>
                <Button
                    type="button"
                    themeColor="secondary"
                    onClick={exportCurrent}
                    disabled={!!exporting}
                    style={{ marginLeft: 8 }}
                >
                    {exporting === "current" && <Loader size="small" type="infinite-spinner" />}
                    {exporting === "current" ? " Preparing Excel..." : "Export Excel"}
                </Button>
                <Button
                    type="button"
                    themeColor="info"
                    onClick={onBackendExport}
                    disabled={!!exporting}
                    style={{ marginLeft: 8 }}
                >
                    Export Excel (Server)
                </Button>
                </div>
            </div>


            {loading && data.length === 0 ? (
                <CommonLoader message="Loading employees..." />
            ) : (
                <>
                    <ExcelExport
                        ref={excelExportRef}
                        fileName="Employees.xlsx"
                    >
                        <ExcelExportColumn field="employeeCode" title="Employee Code" />
                        <ExcelExportColumn field="name" title="Name" />
                        <ExcelExportColumn field="department" title="Department" />
                        <ExcelExportColumn field="employmentType" title="Employment Type" />
                        <ExcelExportColumn field="location" title="Location" />
                        <ExcelExportColumn field="attendance" title="Attendance (%)" />
                        <ExcelExportColumn field="performance" title="Performance" />
                        <ExcelExportColumn field="activeProjects" title="Projects" />
                        <ExcelExportColumn field="isActive" title="Status" />
                    </ExcelExport>
                    <Grid
                        className="employee-grid"
                        style={{ height: "475px" }}
                        data={virtualized ? filteredData : { data: filteredData, total }}
                        dataItemKey="id"
                        skip={skip}
                        take={take}
                        pageable={!virtualized}
                        rowHeight={36}
                        resizable={true}
                        sortable={true}
                        scrollable={virtualized ? "virtual" : "scrollable"}
                        autoProcessData={false}
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
                        <Column field="attendance" title="Attendance (%)" width="140px" format="{0:n2}"/>
                        <Column field="performance" title="Performance" width="140px"  format="{0:n2}"/>
                        <Column field="activeProjects" title="Projects" width="120px" />
                        <Column field="isActive" title="Status" width="120px" />
                        <Column title="Actions" cells={{ data: CommandCell }} width="160px" />
                    </Grid>
                </>
            )}
        </div>
    );
};

export default EmployeeGrid;
