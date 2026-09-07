import { useRef } from "react";
import {
    ExcelExport,
    ExcelExportColumn
} from "@progress/kendo-react-excel-export";
import type { Employee } from "../../types/employee";

interface EmployeeExportProps {
    data: Employee[];
}

const EmployeeExport = ({ data }: EmployeeExportProps) => {
    const excelExportRef = useRef<ExcelExport>(null);

    const exportExcel = () => {
        excelExportRef.current?.save(data);
    };

    return (
        <>
            <button onClick={exportExcel}>
                Export Excel
            </button>

            <ExcelExport
                ref={excelExportRef}
                fileName="Employees.xlsx"
            >
                <ExcelExportColumn
                    field="employeeCode"
                    title="Employee Code"
                />
                <ExcelExportColumn
                    field="name"
                    title="Name"
                />
                <ExcelExportColumn
                    field="department"
                    title="Department"
                />
                <ExcelExportColumn
                    field="employmentType"
                    title="Employment Type"
                />
                <ExcelExportColumn
                    field="location"
                    title="Location"
                />
                <ExcelExportColumn
                    field="attendance"
                    title="Attendance (%)"
                />
                <ExcelExportColumn
                    field="performance"
                    title="Performance"
                />
                <ExcelExportColumn
                    field="activeProjects"
                    title="Projects"
                />
                <ExcelExportColumn
                    field="isActive"
                    title="Status"
                />
            </ExcelExport>
        </>
    );
};

export default EmployeeExport;