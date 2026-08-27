import type { Employee } from "../../types/employee";

import {
    Card,
    CardBody
} from "@progress/kendo-react-layout";

import {
    Chart,
    ChartTitle,
    ChartLegend,
    ChartSeries,
    ChartSeriesItem,
    ChartCategoryAxis,
    ChartCategoryAxisItem,
    ChartValueAxis,
    ChartValueAxisItem
} from "@progress/kendo-react-charts";

interface EmployeeLineChartProps {
    employee: Employee | null;
}

export default function EmployeeLineChart({
    employee
}: EmployeeLineChartProps) {

    if (!employee) {
        return (
            <Card style={{ width: "100%", minHeight: 340,marginTop: 20 }}>
                 <CardBody
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              fontSize: "18px",
                              color: "#777"
                            }}
                          >
                    Select an employee to view score profile.
                </CardBody>
            </Card>
        );
    }

    const chartData = [
        {
            metric: "Attendance",
            value: Math.min(Math.max(employee.attendance, 0), 100)
        },
        {
            metric: "Performance",
            value: Math.min(Math.max(employee.performance * 20, 0), 100)
        },
        {
            metric: "Projects",
            value: Math.min(Math.max(employee.activeProjects * 20, 0), 100)
        },
        {
            metric: "Experience",
            value: Math.min(employee.experienceYears * 10, 100)
        }
    ];

    return (
        <Card style={{ marginTop: 20 }}>
            <CardBody>
                <Chart>
                    <ChartTitle text="Employee Score Profile" />

                    <ChartLegend visible={true}/>

                    <ChartCategoryAxis>
                        <ChartCategoryAxisItem
                            categories={chartData.map(item => item.metric)}
                        />
                    </ChartCategoryAxis>

                    <ChartValueAxis>
                        <ChartValueAxisItem
                            min={0}
                            max={100}
                        />
                    </ChartValueAxis>

                    <ChartSeries>
                        <ChartSeriesItem
                            type="line"
                            data={chartData.map(item => item.value)}
                            markers={{ visible: true }}
                            style="smooth"
                            tooltip={{visible:true}}
                        />
                    </ChartSeries>
                </Chart>
            </CardBody>
        </Card>
    );
}
