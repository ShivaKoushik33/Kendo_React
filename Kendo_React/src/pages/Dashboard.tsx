import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { isAxiosError } from "axios";
import type { GridPageChangeEvent } from "@progress/kendo-react-grid";
import { Button } from "@progress/kendo-react-buttons";
import { Loader } from "@progress/kendo-react-indicators";
import CommonLoader from "../components/CommonLoader";
import KPICard from "../components/KPICard";
import DashBoardFilters from "../components/DashBoardFilters";
import SavedViewsBar from "../components/SavedViewsBar";
import DashboardEmployeeGrid from "../components/DashboardEmployeeGrid";
import EmailSnapshotDialog from "../components/EmailSnapshotDialog";
import ToastNotification from "../components/ToastNotification";
import { useToast } from "../hooks/useToast";
import {
  getDashboardSummary,
  getEmployeesPaginated,
  type DashboardSummary,
} from "../services/EmployeeService";
import { sendSnapshotEmail } from "../services/MailService";
import { captureElementAsPng } from "../utils/captureElement";
import type { RootState } from "../store/store";
import type { Employee } from "../types/employee";
import { type DashBoardKPI } from "../data/dashBoard";

// The API returns its 400/404 messages as plain strings, so surface those to the
// user and keep the generic text only for network-level failures.
const errorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error) && typeof error.response?.data === "string" && error.response.data) {
    return error.response.data;
  }
  return fallback;
};

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesTotal, setEmployeesTotal] = useState(0);
  const [gridLoading, setGridLoading] = useState(true);
  const [page, setPage] = useState({ skip: 0, take: 10 });

  // Everything inside this element is what ends up in the email.
  const captureRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [sending, setSending] = useState(false);

  const { toasts, showToast, removeToast } = useToast();

  const { department, employmentType, location } = useSelector(
    (state: RootState) => state.filters
  );

  // id 0 means "All", which the API expects as an absent parameter.
  const departmentId = department?.id || undefined;
  const employmentTypeId = employmentType?.id || undefined;
  const locationId = location?.id || undefined;

  // Same id-0 convention: only named filters are worth putting in the subject.
  const activeFilterNames = [department, employmentType, location]
    .filter((option) => option && option.id !== 0)
    .map((option) => option!.name);

  const defaultSubject =
    activeFilterNames.length > 0
      ? `Dashboard - ${activeFilterNames.join(" / ")}`
      : "Dashboard - All Employees";

  const dashboardData: DashBoardKPI[] = [
    {
      id: 1,
      title: "Total Employees",
      value: summary?.totalEmployees ?? 0,
    },
    {
      id: 2,
      title: "Active Employees",
      value: summary?.activeEmployees ?? 0,
    },
    {
      id: 3,
      title: "Average Attendance",
      value: summary?.averageAttendance?.toFixed(2) ?? "0.00",
      suffix: "%",
    },
    {
      id: 4,
      title: "Average Performance",
      value: summary?.averagePerformance?.toFixed(2) ?? "0.00",
    },
  ];

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      try {
        const data = await getDashboardSummary({
          departmentId,
          employmentTypeId,
          locationId,
        });
        setSummary(data);
      } catch (error) {
        console.error("Error loading dashboard summary:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [departmentId, employmentTypeId, locationId]);

  // A filter change invalidates the current page: page 7 is meaningless once the
  // result set drops to 12 rows. Adjusting during render rather than in an effect
  // is deliberate - React restarts the render before any effect runs, so the fetch
  // below never fires once with the new filters and the old page number.
  const filterKey = `${departmentId ?? 0}|${employmentTypeId ?? 0}|${locationId ?? 0}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);

  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    if (page.skip !== 0) setPage({ ...page, skip: 0 });
  }

  useEffect(() => {
    const loadEmployees = async () => {
      setGridLoading(true);
      try {
        const result = await getEmployeesPaginated(page.skip, page.take, {
          departmentId,
          employmentTypeId,
          locationId,
        });
        setEmployees(result.data);
        setEmployeesTotal(result.total);
      } catch (error) {
        console.error("Error loading dashboard employees:", error);
      } finally {
        setGridLoading(false);
      }
    };

    loadEmployees();
  }, [page.skip, page.take, departmentId, employmentTypeId, locationId]);

  const handlePageChange = (event: GridPageChangeEvent) => {
    setPage({ skip: event.page.skip, take: event.page.take });
  };

  // Capture first, then open the dialog - so the user reviews the exact image
  // that will be sent instead of trusting it blind.
  const handleCapture = async () => {
    if (!captureRef.current || capturing) return;

    setCapturing(true);
    try {
      // Let the loader paint before drawDOM occupies the main thread.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      setSnapshot(await captureElementAsPng(captureRef.current));
    } catch (error) {
      console.error("Error capturing dashboard snapshot:", error);
      showToast("Could not capture the dashboard.", "error");
    } finally {
      setCapturing(false);
    }
  };

  const handleSend = async (subject: string, note: string) => {
    if (!snapshot) return;

    setSending(true);
    try {
      const message = await sendSnapshotEmail({
        imageBase64: snapshot,
        subject,
        note,
        fileName: "dashboard.png",
      });
      setSnapshot(null);
      showToast(message, "success");
    } catch (error) {
      console.error("Error sending dashboard snapshot:", error);
      showToast(errorMessage(error, "Could not send the email."), "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <SavedViewsBar showToast={showToast} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Button
          type="button"
          themeColor="primary"
          onClick={handleCapture}
          disabled={capturing || sending}
        >
          {capturing && <Loader size="small" type="infinite-spinner" />}
          {capturing ? " Capturing..." : "Email Snapshot"}
        </Button>
      </div>

      {/* The saved-view toolbar and the button above sit outside this element
          on purpose - they are controls, not part of the report. */}
      <div ref={captureRef}>
        <DashBoardFilters />

        {loading ? (
          <CommonLoader message="Loading dashboard..." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardData.map((kpi) => (
              <KPICard
                key={kpi.id}
                title={kpi.title}
                value={kpi.value}
                suffix={kpi.suffix}
              />
            ))}
          </div>
        )}

        <h2 className="mt-8 mb-3 text-2xl">
          Employees{" "}
          <span className="text-base text-gray-500">
            ({employeesTotal.toLocaleString()})
          </span>
        </h2>

        <DashboardEmployeeGrid
          data={employees}
          total={employeesTotal}
          skip={page.skip}
          take={page.take}
          loading={gridLoading}
          onPageChange={handlePageChange}
        />
      </div>

      {snapshot && (
        <EmailSnapshotDialog
          previewImage={snapshot}
          defaultSubject={defaultSubject}
          busy={sending}
          onSend={handleSend}
          onCancel={() => setSnapshot(null)}
        />
      )}

      <ToastNotification toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default Dashboard;
