import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { Input, NumericTextBox, Checkbox } from "@progress/kendo-react-inputs";
import { DropDownList } from "@progress/kendo-react-dropdowns";
import { Button } from "@progress/kendo-react-buttons";
import type { AppDispatch, RootState } from "../store/store";
import { fetchFilterOptions } from "../filters/filterSlice";
import { addEmployee, updateEmployee } from "../services/EmployeeService";
import type { Employee, EmployeeInput } from "../types/employee";
import type { FilterOption } from "../types/filters";
import type { ToastType } from "../hooks/useToast";



interface EmployeeFormProps {
    employee: Employee | null;
    onClose: () => void;
    onSaved: () => void;
    notify: (text: string, type: ToastType) => void;
}

const emptyForm: EmployeeInput = {
    employeeCode: "",
    name: "",
    department: "",
    employmentType: "",
    location: "",
    attendance: 0,
    performance: 0,
    activeProjects: 0,
    experienceYears: 0,
    salary: 0,
    joiningYear: new Date().getFullYear(),
    isActive: true,
    departmentId: 0,
    employmentTypeId: 0,
    locationId: 0,
};

function EmployeeForm({ employee, onClose, onSaved, notify }: EmployeeFormProps) {
    const dispatch = useDispatch<AppDispatch>();
    const departments = useSelector((state: RootState) => state.filters.departments).filter(d => d.id !== 0);
    const locations = useSelector((state: RootState) => state.filters.locations).filter(l => l.id !== 0);
    const employmentTypes = useSelector((state: RootState) => state.filters.employmentTypes).filter(t => t.id !== 0);

    const [form, setForm] = useState<EmployeeInput>(employee ?? emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchFilterOptions());
    }, [dispatch]);

    const selectedDepartment = departments.find(d => d.id === form.departmentId) ?? null;
    const selectedLocation = locations.find(l => l.id === form.locationId) ?? null;
    const selectedEmploymentType = employmentTypes.find(t => t.id === form.employmentTypeId) ?? null;

    const updateField = <K extends keyof EmployeeInput>(field: K, value: EmployeeInput[K]) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!form.employeeCode.trim() || !form.name.trim()) {
            setError("Employee code and name are required.");
            notify("Employee code and name are required.", "error");
            return;
        }
        if (!form.departmentId || !form.locationId || !form.employmentTypeId) {
            setError("Department, location and employment type are required.");
            notify("Department, location and employment type are required.", "error");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            if (employee) {
                await updateEmployee(employee.id, form);
                notify(`Employee "${form.name}" updated successfully.`, "success");
            } else {
                await addEmployee(form);
                notify(`Employee "${form.name}" added successfully.`, "success");
            }
            onSaved();
        } catch (err) {
            console.error("Error saving employee:", err);
            setError("Unable to save employee. Please try again.");
            notify("Unable to save employee. Please try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog title={employee ? "Edit Employee" : "Add Employee"} onClose={onClose} width={500}>
            <div className="space-y-4">
                {error && <div style={{ color: "#d32f2f" }}>{error}</div>}

                <div>
                    <p className="mb-1 text-sm font-medium">Employee Code</p>
                    <Input
                        className="w-full"
                        value={form.employeeCode}
                        onChange={(e) => updateField("employeeCode", String(e.value ?? ""))}
                    />
                </div>

                <div>
                    <p className="mb-1 text-sm font-medium">Name</p>
                    <Input
                        className="w-full"
                        value={form.name}
                        onChange={(e) => updateField("name", String(e.value ?? ""))}
                    />
                </div>

                <div>
                    <p className="mb-1 text-sm font-medium">Department</p>
                    <DropDownList
                        className="w-full"
                        data={departments}
                        value={selectedDepartment}
                        dataItemKey="id"
                        textField="name"
                        onChange={(e) => {
                            const option = e.value as FilterOption;
                            updateField("departmentId", option.id);
                            updateField("department", option.name);
                        }}
                    />
                </div>

                <div>
                    <p className="mb-1 text-sm font-medium">Employment Type</p>
                    <DropDownList
                        className="w-full"
                        data={employmentTypes}
                        value={selectedEmploymentType}
                        dataItemKey="id"
                        textField="name"
                        onChange={(e) => {
                            const option = e.value as FilterOption;
                            updateField("employmentTypeId", option.id);
                            updateField("employmentType", option.name);
                        }}
                    />
                </div>

                <div>
                    <p className="mb-1 text-sm font-medium">Location</p>
                    <DropDownList
                        className="w-full"
                        data={locations}
                        value={selectedLocation}
                        dataItemKey="id"
                        textField="name"
                        onChange={(e) => {
                            const option = e.value as FilterOption;
                            updateField("locationId", option.id);
                            updateField("location", option.name);
                        }}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="mb-1 text-sm font-medium">Attendance (%)</p>
                        <NumericTextBox
                            className="w-full"
                            value={form.attendance}
                            min={0}
                            max={100}
                            onChange={(e) => updateField("attendance", e.value ?? 0)}
                        />
                    </div>
                    <div>
                        <p className="mb-1 text-sm font-medium">Performance</p>
                        <NumericTextBox
                            className="w-full"
                            value={form.performance}
                            min={0}
                            max={5}
                            step={0.1}
                            onChange={(e) => updateField("performance", e.value ?? 0)}
                        />
                    </div>
                    <div>
                        <p className="mb-1 text-sm font-medium">Active Projects</p>
                        <NumericTextBox
                            className="w-full"
                            value={form.activeProjects}
                            min={0}
                            onChange={(e) => updateField("activeProjects", e.value ?? 0)}
                        />
                    </div>
                    <div>
                        <p className="mb-1 text-sm font-medium">Experience (Years)</p>
                        <NumericTextBox
                            className="w-full"
                            value={form.experienceYears}
                            min={0}
                            onChange={(e) => updateField("experienceYears", e.value ?? 0)}
                        />
                    </div>
                    <div>
                        <p className="mb-1 text-sm font-medium">Salary</p>
                        <NumericTextBox
                            className="w-full"
                            value={form.salary}
                            min={0}
                            format="n0"
                            onChange={(e) => updateField("salary", e.value ?? 0)}
                        />
                    </div>
                    <div>
                        <p className="mb-1 text-sm font-medium">Joining Year</p>
                        <NumericTextBox
                            className="w-full"
                            value={form.joiningYear}
                            format={{ useGrouping: false, maximumFractionDigits: 0 }}
                            onChange={(e) => updateField("joiningYear", e.value ?? new Date().getFullYear())}
                        />
                    </div>
                </div>

                <div>
                    <Checkbox
                        label="Active"
                        checked={form.isActive}
                        onChange={(e) => updateField("isActive", Boolean(e.value))}
                    />
                </div>
            </div>

            <DialogActionsBar>
                <Button type="button" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button type="button" themeColor="primary" onClick={handleSubmit} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                </Button>
            </DialogActionsBar>
        </Dialog>
    );
}

export default EmployeeForm;
