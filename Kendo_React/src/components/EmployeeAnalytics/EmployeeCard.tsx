import {
  Card,
  CardHeader,
  CardBody,
} from "@progress/kendo-react-layout";
import type { Employee } from '../../types/employee';
import { Avatar } from '@progress/kendo-react-layout';
import { Chip } from "@progress/kendo-react-buttons";

interface EmployeeCardProps {
  employee: Employee | null
}

function EmployeeCard({ employee }: EmployeeCardProps) {
      if(!employee){
        return (
        <Card style={{ width: "100%", minHeight: 340 ,marginTop:20}}>
          <CardBody
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "18px",
              color: "#777"
            }} 
          >
            Select an employee to view details
          </CardBody>
        </Card>)
      }
      return (
        <Card style={{ width: "100%" }}>
            <CardHeader
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                }}
            >
                <Avatar rounded="full" style={{color:""}}>
                    {"Img"}
                </Avatar>

                <div>
                    <h3 style={{ margin: 0 }}>{employee.name}</h3>
                    <p style={{ margin: "4px 0", color: "#666" }}>
                        {employee.department}
                    </p>
                </div>
            </CardHeader>

            <CardBody>
                <div className="row">
                    <strong>Employee ID</strong>
                    <span>{employee.employeeCode}</span>
                </div>

                <div className="row">
                    <strong>Employment</strong>
                    <span>{employee.employmentType}</span>
                </div>

                <div className="row">
                    <strong>Location</strong>
                    <span>{employee.location}</span>
                </div>

                <div className="row">
                    <strong>Experience</strong>
                    <span>{employee.experienceYears} Years</span>
                </div>

                <div className="row">
                    <strong>Joining Year</strong>
                    <span>{employee.joiningYear}</span>
                </div>

                <div className="row">
                    <strong>Salary</strong>
                    <span>
                        ₹{employee.salary.toLocaleString("en-IN")}
                    </span>
                </div>

                <div className="row">
                    <strong>Status</strong>
                    <Chip themeColor={employee.isActive ? "success" : "error"}>
                        {employee.isActive ? "Active" : "Inactive"}
                    </Chip>
                </div>
            </CardBody>
        </Card>
    );
}
export default EmployeeCard