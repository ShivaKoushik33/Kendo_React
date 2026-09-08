import { useCallback, useEffect, useState } from 'react'
import type { GridPageChangeEvent, GridSortChangeEvent } from '@progress/kendo-react-grid'
import type { SortDescriptor } from '@progress/kendo-data-query'
import EmployeeGrid from '../components/EmployeeGrid'
import EmployeeForm from '../components/EmployeeForm'
import ConfirmDialog from '../components/ConfirmDialog'
import ToastNotification from '../components/ToastNotification'
import EmployeeCard from '../components/EmployeeAnalytics/EmployeeCard'
import EmployeeBarChart from '../components/EmployeeAnalytics/EmployeeBarChart'
import EmployeeLineChart from '../components/EmployeeAnalytics/EmployeeLineChart'
import { downloadEmployeesExcelFromBackend, downloadPaginatedEmployeesExcelFromBackend, getEmployees, getEmployeesPaginated, deleteEmployee, type EmployeeSort } from '../services/EmployeeService'
import { useToast } from '../hooks/useToast'
import type { Employee } from '../types/employee'

interface EmployeesProps {
  virtualized?: boolean;
}

const Employees = ({ virtualized = false }: EmployeesProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  // The Grid changes skip while scrolling. Keep a reasonably sized window so a fast scroll
  // does not result in a request for every few rows.
  const [page, setPage] = useState({ skip: 0, take: virtualized ? 50 : 10 });
  const [loading, setLoading] = useState(true);
  const [serverExporting, setServerExporting] = useState(false);
  const [sort, setSort] = useState<SortDescriptor[]>([]);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toasts, showToast, removeToast } = useToast();


  const toEmployeeSort = (descriptors: SortDescriptor[]): EmployeeSort | undefined => {
    const descriptor = descriptors[0];
    return descriptor?.field && descriptor.dir
      ? { field: descriptor.field, dir: descriptor.dir }
      : undefined;
  };

  const loadEmployees = useCallback(async (nextPage: { skip: number; take: number }, nextSort: SortDescriptor[] = []) => {
    setLoading(true);
    try {
      if (virtualized) {
        const result = await getEmployees();
        setEmployees(result);
        setTotalEmployees(result.length);
      } else {
        const result = await getEmployeesPaginated(nextPage.skip, nextPage.take, undefined, toEmployeeSort(nextSort));
        setEmployees(result.data);
        setTotalEmployees(result.total);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  }, [virtualized]);


  // Depend on skip/take rather than on `page` itself. The object identity changes whenever
  // anything calls setPage, even with identical values, and that would refetch for no reason.
  useEffect(() => {
    if (!virtualized) loadEmployees({ skip: page.skip, take: page.take }, sort);
  }, [loadEmployees, page.skip, page.take, sort, virtualized]);

  useEffect(() => {
    if (virtualized) loadEmployees({ skip: 0, take: page.take });
  }, [loadEmployees, page.take, virtualized]);

  const handlePageChange = (event?: GridPageChangeEvent) => {
    if (!event) return;

    const nextPage = { skip: event.page.skip, take: event.page.take };
    setPage(nextPage);
  };

  const handleSortChange = (event: GridSortChangeEvent) => {
    setSort(event.sort);
    if (!virtualized) {
      setPage((current) => ({ ...current, skip: 0 }));
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Typing should send the user back to the first page, but only when they are not already
    // on it. Returning the same object lets React bail out of the update instead of
    // re-rendering - a fresh { ...current, skip: 0 } on every keystroke is what was firing a
    // paginated request per character.
    setPage((current) => (current.skip === 0 ? current : { ...current, skip: 0 }));
  };

  const handleBackendExport = async () => {
    if (serverExporting) return;
    setServerExporting(true);
    try {
      const currentSort = toEmployeeSort(sort);
      const blob = virtualized
        ? await downloadEmployeesExcelFromBackend(undefined, currentSort)
        : await downloadPaginatedEmployeesExcelFromBackend(page.skip, page.take, currentSort);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Employees.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting employees from server:", error);
    } finally {
      setServerExporting(false);
    }
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormOpen(true);
  };

  const handleDeleteRequest = (employee: Employee) => {
    setDeleteTarget(employee);
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      if (selectedEmployee?.id === deleteTarget.id) {
        setSelectedEmployee(null);
      }
      showToast(`Employee "${deleteTarget.name}" deleted successfully.`, "success");
      setDeleteTarget(null);
      await loadEmployees(page);
    } catch (error) {
      console.error("Error deleting employee:", error);
      showToast("Unable to delete employee. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSaved = () => {
    setFormOpen(false);
    setEditingEmployee(null);
    loadEmployees(page);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingEmployee(null);
  };

  return (
    <div>
      <EmployeeGrid
        data={employees}
        total={totalEmployees}
        skip={page.skip}
        take={page.take}
        loading={loading}
        selectedEmployeeId={selectedEmployee?.id ?? null}
        onEmployeeSelect={setSelectedEmployee}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onPageChange={handlePageChange}
        virtualized={virtualized}
        onBackendExport={handleBackendExport}
        serverExporting={serverExporting}
        sort={sort}
        onSortChange={handleSortChange}
        search={search}
        onSearchChange={handleSearchChange}
      />
      <div className="employee-analytics">
        <EmployeeCard employee={selectedEmployee} />
        <EmployeeBarChart employee={selectedEmployee} />
      </div>

      <div className="employee-line-chart">
        <EmployeeLineChart employee={selectedEmployee} />
      </div>

      {formOpen && (
        <EmployeeForm
          employee={editingEmployee}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
          notify={showToast}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Employee"
          message={`Are you sure you want to delete employee "${deleteTarget.name}"?`}
          confirmText="Yes, Delete"
          cancelText="No"
          busy={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      <ToastNotification toasts={toasts} onClose={removeToast} />
    </div>
  )
}

export default Employees
