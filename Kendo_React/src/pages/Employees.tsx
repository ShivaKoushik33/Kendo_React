import { useCallback, useEffect, useState } from 'react'
import type { GridPageChangeEvent } from '@progress/kendo-react-grid'
import EmployeeGrid from '../components/EmployeeGrid'
import EmployeeForm from '../components/EmployeeForm'
import ConfirmDialog from '../components/ConfirmDialog'
import ToastNotification from '../components/ToastNotification'
import EmployeeCard from '../components/EmployeeAnalytics/EmployeeCard'
import EmployeeBarChart from '../components/EmployeeAnalytics/EmployeeBarChart'
import EmployeeLineChart from '../components/EmployeeAnalytics/EmployeeLineChart'
import { getEmployeesPaginated, deleteEmployee } from '../services/EmployeeService'
import { useToast } from '../hooks/useToast'
import type { Employee } from '../types/employee'

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [page, setPage] = useState({ skip: 0, take: 10 });
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const loadEmployees = useCallback(async (nextPage: { skip: number; take: number }) => {
    setLoading(true);
    try {
      const result = await getEmployeesPaginated(nextPage.skip / nextPage.take + 1, nextPage.take);
      setEmployees(result.data);
      setTotalEmployees(result.total);
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees(page);
  }, [loadEmployees, page]);

  const handlePageChange = (event: GridPageChangeEvent) => {
    const nextPage = { skip: event.page.skip, take: event.page.take };
    setPage(nextPage);
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
