using Backend.Models;
using Microsoft.Data.SqlClient;

namespace Backend.Repositories;

public class EmployeeRepository
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmployeeRepository> _logger;

    public EmployeeRepository(ILogger<EmployeeRepository> logger ,IConfiguration configuration)
    {
        _configuration = configuration;
        _logger = logger;
    }

    private SqlConnection GetConnection()
    {
        return new SqlConnection(
            _configuration.GetConnectionString("DefaultConnection"));
    }



   public List<Employee> GetEmployees()
{
    List<Employee> employees = new();

    using SqlConnection con = GetConnection();

    con.Open();

    string query = @"
    SELECT
        e.Id,
        e.EmployeeCode,
        e.Name,
        d.Name AS Department,
        et.Name AS EmploymentType,
        l.Name AS Location,
        e.Attendance,
        e.Performance,
        e.ActiveProjects,
        e.ExperienceYears,
        e.Salary,
        e.JoiningYear,
        e.IsActive,
        e.DepartmentId,
        e.EmploymentTypeId,
        e.LocationId
    FROM Employees e
    INNER JOIN Departments d
        ON e.DepartmentId = d.Id
    INNER JOIN Locations l
        ON e.LocationId = l.Id
    INNER JOIN EmploymentTypes et
        ON e.EmploymentTypeId = et.Id";

_logger.LogInformation("Query executed :{Query}",query);
    using SqlCommand cmd = new(query, con);

    using SqlDataReader reader = cmd.ExecuteReader();

    while (reader.Read())
    {
        employees.Add(new Employee
        {
            Id = Convert.ToInt32(reader["Id"]),
            EmployeeCode = reader["EmployeeCode"].ToString()!,
            Name = reader["Name"].ToString()!,
            Department = reader["Department"].ToString()!,
            EmploymentType = reader["EmploymentType"].ToString()!,
            Location = reader["Location"].ToString()!,
            Attendance = Convert.ToInt32(reader["Attendance"]),
            Performance = Convert.ToDecimal(reader["Performance"]),
            ActiveProjects = Convert.ToInt32(reader["ActiveProjects"]),
            ExperienceYears = Convert.ToInt32(reader["ExperienceYears"]),
            Salary = Convert.ToDecimal(reader["Salary"]),
            JoiningYear = Convert.ToInt32(reader["JoiningYear"]),
            IsActive = Convert.ToBoolean(reader["IsActive"]),
            DepartmentId = Convert.ToInt32(reader["DepartmentId"]),
            EmploymentTypeId = Convert.ToInt32(reader["EmploymentTypeId"]),
            LocationId = Convert.ToInt32(reader["LocationId"])
        });
    }
    return employees;
}



public Employee? GetEmployeeById(int id)
{
    using SqlConnection con = GetConnection();

    con.Open();

    string query = @"
    SELECT
        e.Id,
        e.EmployeeCode,
        e.Name,
        d.Name AS Department,
        et.Name AS EmploymentType,
        l.Name AS Location,
        e.Attendance,
        e.Performance,
        e.ActiveProjects,
        e.ExperienceYears,
        e.Salary,
        e.JoiningYear,
        e.IsActive,
        e.DepartmentId,
        e.EmploymentTypeId,
        e.LocationId
    FROM Employees e
    INNER JOIN Departments d
        ON e.DepartmentId = d.Id
    INNER JOIN Locations l
        ON e.LocationId = l.Id
    INNER JOIN EmploymentTypes et
        ON e.EmploymentTypeId = et.Id
    WHERE e.Id = @Id";
_logger.LogInformation("Query executed :{Query}",query);
    using SqlCommand cmd = new(query, con);

    cmd.Parameters.AddWithValue("@Id", id);

    using SqlDataReader reader = cmd.ExecuteReader();

    if (reader.Read())
    {
        return new Employee
        {
            Id = Convert.ToInt32(reader["Id"]),
            EmployeeCode = reader["EmployeeCode"].ToString()!,
            Name = reader["Name"].ToString()!,
            Department = reader["Department"].ToString()!,
            EmploymentType = reader["EmploymentType"].ToString()!,
            Location = reader["Location"].ToString()!,
            Attendance = Convert.ToInt32(reader["Attendance"]),
            Performance = Convert.ToDecimal(reader["Performance"]),
            ActiveProjects = Convert.ToInt32(reader["ActiveProjects"]),
            ExperienceYears = Convert.ToInt32(reader["ExperienceYears"]),
            Salary = Convert.ToDecimal(reader["Salary"]),
            JoiningYear = Convert.ToInt32(reader["JoiningYear"]),
            IsActive = Convert.ToBoolean(reader["IsActive"]),
            DepartmentId = Convert.ToInt32(reader["DepartmentId"]),
            EmploymentTypeId = Convert.ToInt32(reader["EmploymentTypeId"]),
            LocationId = Convert.ToInt32(reader["LocationId"])
        };
    }

    return null;
}


public bool AddEmployee(Employee employee)
{
    using SqlConnection con = GetConnection();

    con.Open();

    string query = @"
    INSERT INTO Employees
    (
        EmployeeCode,
        Name,
        DepartmentId,
        EmploymentTypeId,
        LocationId,
        Attendance,
        Performance,
        ActiveProjects,
        ExperienceYears,
        Salary,
        JoiningYear,
        IsActive
    )
    VALUES
    (
        @EmployeeCode,
        @Name,
        @DepartmentId,
        @EmploymentTypeId,
        @LocationId,
        @Attendance,
        @Performance,
        @ActiveProjects,
        @ExperienceYears,
        @Salary,
        @JoiningYear,
        @IsActive
    )";
_logger.LogInformation("Query executed :{Query}",query);
    using SqlCommand cmd = new(query, con);

    cmd.Parameters.AddWithValue("@EmployeeCode", employee.EmployeeCode);
    cmd.Parameters.AddWithValue("@Name", employee.Name);
    cmd.Parameters.AddWithValue("@DepartmentId", employee.DepartmentId);
    cmd.Parameters.AddWithValue("@EmploymentTypeId", employee.EmploymentTypeId);
    cmd.Parameters.AddWithValue("@LocationId", employee.LocationId);
    cmd.Parameters.AddWithValue("@Attendance", employee.Attendance);
    cmd.Parameters.AddWithValue("@Performance", employee.Performance);
    cmd.Parameters.AddWithValue("@ActiveProjects", employee.ActiveProjects);
    cmd.Parameters.AddWithValue("@ExperienceYears", employee.ExperienceYears);
    cmd.Parameters.AddWithValue("@Salary", employee.Salary);
    cmd.Parameters.AddWithValue("@JoiningYear", employee.JoiningYear);
    cmd.Parameters.AddWithValue("@IsActive", employee.IsActive);

    int rows = cmd.ExecuteNonQuery();

    return rows > 0;
}


public bool UpdateEmployee(Employee employee)
{
    using SqlConnection con = GetConnection();

    con.Open();

    string query = @"
    UPDATE Employees
    SET
        EmployeeCode = @EmployeeCode,
        Name = @Name,
        DepartmentId = @DepartmentId,
        EmploymentTypeId = @EmploymentTypeId,
        LocationId = @LocationId,
        Attendance = @Attendance,
        Performance = @Performance,
        ActiveProjects = @ActiveProjects,
        ExperienceYears = @ExperienceYears,
        Salary = @Salary,
        JoiningYear = @JoiningYear,
        IsActive = @IsActive
    WHERE Id = @Id";
_logger.LogInformation("Query executed :{Query}",query);
    using SqlCommand cmd = new(query, con);

    cmd.Parameters.AddWithValue("@Id", employee.Id);
    cmd.Parameters.AddWithValue("@EmployeeCode", employee.EmployeeCode);
    cmd.Parameters.AddWithValue("@Name", employee.Name);
    cmd.Parameters.AddWithValue("@DepartmentId", employee.DepartmentId);
    cmd.Parameters.AddWithValue("@EmploymentTypeId", employee.EmploymentTypeId);
    cmd.Parameters.AddWithValue("@LocationId", employee.LocationId);
    cmd.Parameters.AddWithValue("@Attendance", employee.Attendance);
    cmd.Parameters.AddWithValue("@Performance", employee.Performance);
    cmd.Parameters.AddWithValue("@ActiveProjects", employee.ActiveProjects);
    cmd.Parameters.AddWithValue("@ExperienceYears", employee.ExperienceYears);
    cmd.Parameters.AddWithValue("@Salary", employee.Salary);
    cmd.Parameters.AddWithValue("@JoiningYear", employee.JoiningYear);
    cmd.Parameters.AddWithValue("@IsActive", employee.IsActive);
    return cmd.ExecuteNonQuery() > 0;
}

public bool DeleteEmployee(int id)
{
    using SqlConnection con = GetConnection();

    con.Open();

    string query = "DELETE FROM Employees WHERE Id = @Id";
_logger.LogInformation("Query executed :{Query}",query);
    using SqlCommand cmd = new(query, con);

    cmd.Parameters.AddWithValue("@Id", id);

    return cmd.ExecuteNonQuery() > 0;
}



}