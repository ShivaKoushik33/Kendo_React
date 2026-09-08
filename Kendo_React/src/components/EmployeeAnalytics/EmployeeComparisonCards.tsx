import { Card, CardBody, CardTitle } from "@progress/kendo-react-layout";
import type { Employee } from "../../types/employee";
import ComparisonValue from "../ComparisonValue";

type EmployeeComparisonCardsProps = {
    employee: Employee | null;
    averages: {
        attendance: number;
        performance: number;
        projects: number;
    } | null;
};

function EmployeeComparisonCards({ employee, averages }: EmployeeComparisonCardsProps) {
    if (!employee || !averages) return null;

    const metrics = [
        { title: "Attendance", value: employee.attendance, average: averages.attendance },
        { title: "Performance", value: employee.performance, average: averages.performance },
        { title: "Projects", value: employee.activeProjects, average: averages.projects }
    ];

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3" style={{ marginTop: 20 }}>
            {metrics.map((metric) => (
                <Card key={metric.title}>
                    <CardBody>
                        <CardTitle>{metric.title}</CardTitle>
                        <div style={{ fontSize: 22, marginTop: 8 }}>
                            <ComparisonValue
                                value={metric.value}
                                average={metric.average}
                            />
                        </div>
                        <small>Compared with overall average</small>
                    </CardBody>
                </Card>
            ))}
        </div>
    );
}

export default EmployeeComparisonCards;
