import type { Employee } from '../../types/employee'

import {
  Chart,
  ChartTitle,
  ChartSeries,
  ChartSeriesItem,
  ChartCategoryAxis,
  ChartCategoryAxisTitle,
  ChartCategoryAxisItem,
  ChartLegend
} from '@progress/kendo-react-charts';

interface EmployeeBarChartProps {
  employee: Employee | null;
}
import {
  Card,
  CardBody,
} from "@progress/kendo-react-layout";


function EmployeeBarChart({ employee }: EmployeeBarChartProps) {
  const chartData = [
    {
      metric: "Attendance",
      value: employee?.attendance,
      maxValue: 100
    },
    {
      metric: "Performance",
      value: employee?.performance,
      maxValue: 5
    },
    {
      metric: "Projects",
      value: employee?.activeProjects,
      maxValue: 10
    },
    {
      metric: "Experience",
      value: employee?.experienceYears,
      maxValue: 20
    }
  ]

  if (!employee) {
    return ( <Card style={{ width: "100%", minHeight: 340,marginTop: 20 }}>
       <CardBody
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "18px",
                    color: "#777"
                  }}
                >
        Select an Employee to Display the BarChart
      </CardBody>

    </Card>)
  }



  return (
    <Card style={{ marginTop: 20 }}>
      <CardBody>
        <Chart>
          <ChartTitle text="Employee Analytics" />
          <ChartLegend position="top" orientation="horizontal" />
          <ChartCategoryAxis>
            <ChartCategoryAxisItem categories={chartData.map(e => e.metric)}>
              <ChartCategoryAxisTitle text="Attributes" />
            </ChartCategoryAxisItem>
          </ChartCategoryAxis>
          <ChartSeries>
            <ChartSeriesItem
              type="bar"
              name='Current'
              gap={2}
              spacing={0.25}
              data={chartData.map(e => e.value)}
              tooltip={{ visible: true }}
              // color='#000000'
            />
            <ChartSeriesItem
              type="bar"
              gap={2}
              name='Maximum'
              spacing={0.25}
              data={chartData.map(e => e.maxValue)}
              tooltip={{ visible: true }}
            />
          </ChartSeries>

        </Chart>
      </CardBody>
    </Card>
  );




}

export default EmployeeBarChart