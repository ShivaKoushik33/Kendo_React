using Backend.Models;
using ClosedXML.Excel;
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

    var cols = new EmployeeColumns(reader);

    while (reader.Read())
    {
        employees.Add(cols.Read(reader));
    }
    return employees;
}

public byte[] ExportEmployeesToExcel(int? departmentId = null, int? employmentTypeId = null, int? locationId = null, int? offset = null, int? size = null)
{
    var employees = GetEmployeesForExport(departmentId, employmentTypeId, locationId, offset, size);

    using var workbook = new XLWorkbook();
    var worksheet = workbook.Worksheets.Add("Employees");
    var headers = new[] { "Employee Code", "Name", "Department", "Employment Type", "Location", "Attendance (%)", "Performance", "Projects", "Experience (Years)", "Salary", "Joining Year", "Status" };

    for (var column = 0; column < headers.Length; column++)
    {
        worksheet.Cell(1, column + 1).Value = headers[column];
    }

    for (var row = 0; row < employees.Count; row++)
    {
        var employee = employees[row];
        var values = new object?[] { employee.EmployeeCode, employee.Name, employee.Department, employee.EmploymentType, employee.Location, employee.Attendance, employee.Performance, employee.ActiveProjects, employee.ExperienceYears, employee.Salary, employee.JoiningYear, employee.IsActive ? "Active" : "Inactive" };
        for (var column = 0; column < values.Length; column++)
        {
            worksheet.Cell(row + 2, column + 1).Value = XLCellValue.FromObject(values[column]);
        }
    }

    worksheet.Row(1).Style.Font.Bold = true;
    worksheet.SheetView.FreezeRows(1);
    worksheet.Columns().AdjustToContents();

    using var stream = new MemoryStream();
    workbook.SaveAs(stream);
    return stream.ToArray();
}

private List<Employee> GetEmployeesForExport(int? departmentId, int? employmentTypeId, int? locationId, int? offset, int? size)
{
    using SqlConnection con = GetConnection();
    con.Open();

    string query = @"
        SELECT e.Id, e.EmployeeCode, e.Name, d.Name AS Department, et.Name AS EmploymentType,
               l.Name AS Location, e.Attendance, e.Performance, e.ActiveProjects,
               e.ExperienceYears, e.Salary, e.JoiningYear, e.IsActive,
               e.DepartmentId, e.EmploymentTypeId, e.LocationId
        FROM Employees e
        INNER JOIN Departments d ON e.DepartmentId = d.Id
        INNER JOIN Locations l ON e.LocationId = l.Id
        INNER JOIN EmploymentTypes et ON e.EmploymentTypeId = et.Id
        WHERE (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
          AND (@EmploymentTypeId IS NULL OR e.EmploymentTypeId = @EmploymentTypeId)
          AND (@LocationId IS NULL OR e.LocationId = @LocationId)
        ORDER BY e.Id" + (offset.HasValue && size.HasValue ? " OFFSET @Offset ROWS FETCH NEXT @Size ROWS ONLY" : "");

    using SqlCommand cmd = new(query, con);
    AddOptionalFilterParams(cmd, departmentId, employmentTypeId, locationId);
    if (offset.HasValue && size.HasValue)
    {
        cmd.Parameters.AddWithValue("@Offset", offset.Value);
        cmd.Parameters.AddWithValue("@Size", size.Value);
    }
    using SqlDataReader reader = cmd.ExecuteReader();
    var columns = new EmployeeColumns(reader);
    var employees = new List<Employee>();
    while (reader.Read()) employees.Add(columns.Read(reader));
    return employees;
}



// Filters are optional (Attendance/Projects pages pass them; the plain Employees grid doesn't).
//
// NOTE: total is deliberately fetched via a *separate* COUNT(*) query on the same connection,
// not COUNT(*) OVER() bolted onto the SELECT. Tried that first to cut the round-trip in half -
// measured it on this DB and it was a disaster: SQL Server can't push OFFSET/FETCH's row limit
// past a window function, so it has to materialize and count the ENTIRE joined+filtered result
// set into a worktable before it can hand back one page. On this table that turned a ~400
// logical-read query into a ~290,000 logical-read query, i.e. slower than before the "fix".
// Two small queries beats one query doing 700x the I/O.
public PagedEmployees GetEmployeesPaginated(int offset, int size, int? departmentId = null, int? employmentTypeId = null, int? locationId = null)
    {
        using SqlConnection con = GetConnection();
        con.Open();

        var result = new PagedEmployees();

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
    WHERE (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
      AND (@EmploymentTypeId IS NULL OR e.EmploymentTypeId = @EmploymentTypeId)
      AND (@LocationId IS NULL OR e.LocationId = @LocationId)
        order by e.Id
        OFFSET @offset rows
        FETCH NEXT  @size rows only
        ";

_logger.LogInformation("Query Executed {query}",query);
        using (SqlCommand cmd = new(query, con))
        {
            AddOptionalFilterParams(cmd, departmentId, employmentTypeId, locationId);
            cmd.Parameters.AddWithValue("@offset", offset);
            cmd.Parameters.AddWithValue("@size", size);

            using SqlDataReader reader = cmd.ExecuteReader();
            var cols = new EmployeeColumns(reader);

            while (reader.Read())
            {
                result.Items.Add(cols.Read(reader));
            }
        }

        result.Total = CountEmployees(con, departmentId, employmentTypeId, locationId);

        return result;
    }

public int GetEmployeeCount(int? departmentId = null, int? employmentTypeId = null, int? locationId = null)
{
    using SqlConnection con = GetConnection();
    con.Open();
    return CountEmployees(con, departmentId, employmentTypeId, locationId);
}

private static int CountEmployees(SqlConnection con, int? departmentId, int? employmentTypeId, int? locationId)
{
    const string query = @"
        SELECT COUNT(*) FROM Employees e
        INNER JOIN Departments d ON e.DepartmentId = d.Id
        INNER JOIN Locations l ON e.LocationId = l.Id
        WHERE (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
          AND (@EmploymentTypeId IS NULL OR e.EmploymentTypeId = @EmploymentTypeId)
          AND (@LocationId IS NULL OR e.LocationId = @LocationId)";
            
    using SqlCommand cmd = new(query, con);
    AddOptionalFilterParams(cmd, departmentId, employmentTypeId, locationId);
    return Convert.ToInt32(cmd.ExecuteScalar());
}

public DashboardSummary GetDashboardSummary(int? departmentId, int? employmentTypeId, int? locationId)
{
    using SqlConnection con = GetConnection();
    con.Open();

    const string query = @"
        SELECT
            COUNT(*) AS TotalEmployees,
            COALESCE(SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END), 0) AS ActiveEmployees,
            COALESCE(AVG(CAST(Attendance AS DECIMAL(10, 2))), 0) AS AverageAttendance,
            COALESCE(AVG(CAST(Performance AS DECIMAL(10, 2))), 0) AS AveragePerformance
        FROM Employees
        WHERE (@DepartmentId IS NULL OR DepartmentId = @DepartmentId)
          AND (@EmploymentTypeId IS NULL OR EmploymentTypeId = @EmploymentTypeId)
          AND (@LocationId IS NULL OR LocationId = @LocationId)";

    _logger.LogInformation(
        "Executing dashboard summary query. Filters: DepartmentId={DepartmentId}, EmploymentTypeId={EmploymentTypeId}, LocationId={LocationId}. Query: {Query}",
        departmentId?.ToString() ?? "ALL",
        employmentTypeId?.ToString() ?? "ALL",
        locationId?.ToString() ?? "ALL",
        query);

    using SqlCommand cmd = new(query, con);
    cmd.Parameters.Add("@DepartmentId", System.Data.SqlDbType.Int).Value = departmentId ?? (object)DBNull.Value;
    cmd.Parameters.Add("@EmploymentTypeId", System.Data.SqlDbType.Int).Value = employmentTypeId ?? (object)DBNull.Value;
    cmd.Parameters.Add("@LocationId", System.Data.SqlDbType.Int).Value = locationId ?? (object)DBNull.Value;

    using SqlDataReader reader = cmd.ExecuteReader();
    reader.Read();

    var summary = new DashboardSummary
    {
        TotalEmployees = Convert.ToInt32(reader["TotalEmployees"]),
        ActiveEmployees = Convert.ToInt32(reader["ActiveEmployees"]),
        AverageAttendance = Math.Round(Convert.ToDecimal(reader["AverageAttendance"]), 1),
        AveragePerformance = Math.Round(Convert.ToDecimal(reader["AveragePerformance"]), 1)
    };

    _logger.LogInformation(
        "Dashboard summary query executed. Filters: DepartmentId={DepartmentId}, EmploymentTypeId={EmploymentTypeId}, LocationId={LocationId}. Result: TotalEmployees={TotalEmployees}, ActiveEmployees={ActiveEmployees}",
        departmentId?.ToString() ?? "ALL",
        employmentTypeId?.ToString() ?? "ALL",
        locationId?.ToString() ?? "ALL",
        summary.TotalEmployees,
        summary.ActiveEmployees);

    return summary;
}

// Computes the Attendance page's KPI numbers and per-department averages in SQL instead of
// pulling every employee to the browser and reducing over them there.
public AttendanceSummary GetAttendanceSummary(int? departmentId, int? employmentTypeId, int? locationId)
{
    using SqlConnection con = GetConnection();
    con.Open();

    const string query = @"
        SELECT
            COALESCE(AVG(CAST(e.Attendance AS DECIMAL(10, 2))), 0) AS AverageAttendance,
            COALESCE(MAX(e.Attendance), 0) AS HighestAttendance,
            COALESCE(SUM(CASE WHEN e.Attendance >= 95 THEN 1 ELSE 0 END), 0) AS ExcellentCount,
            COALESCE(SUM(CASE WHEN e.Attendance < 85 THEN 1 ELSE 0 END), 0) AS LowCount
        FROM Employees e
        WHERE (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
          AND (@EmploymentTypeId IS NULL OR e.EmploymentTypeId = @EmploymentTypeId)
          AND (@LocationId IS NULL OR e.LocationId = @LocationId);

        SELECT
            d.Name AS Department,
            COALESCE(AVG(CAST(e.Attendance AS DECIMAL(10, 2))), 0) AS Attendance
        FROM Employees e
        INNER JOIN Departments d ON e.DepartmentId = d.Id
        WHERE (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
          AND (@EmploymentTypeId IS NULL OR e.EmploymentTypeId = @EmploymentTypeId)
          AND (@LocationId IS NULL OR e.LocationId = @LocationId)
        GROUP BY d.Name";

    _logger.LogInformation("Query executed :{Query}", query);

    using SqlCommand cmd = new(query, con);
    AddOptionalFilterParams(cmd, departmentId, employmentTypeId, locationId);

    using SqlDataReader reader = cmd.ExecuteReader();
    reader.Read();

    var summary = new AttendanceSummary
    {
        AverageAttendance = Math.Round(Convert.ToDecimal(reader["AverageAttendance"]), 1),
        HighestAttendance = Convert.ToInt32(reader["HighestAttendance"]),
        ExcellentCount = Convert.ToInt32(reader["ExcellentCount"]),
        LowCount = Convert.ToInt32(reader["LowCount"])
    };

    reader.NextResult();
    while (reader.Read())
    {
        summary.ByDepartment.Add(new DepartmentAttendance
        {
            Department = reader["Department"].ToString()!,
            Attendance = Math.Round(Convert.ToDecimal(reader["Attendance"]), 1)
        });
    }

    return summary;
}

// Same idea for the Projects page: KPI numbers + department project load computed in SQL.
public ProjectsSummary GetProjectsSummary(int? departmentId, int? employmentTypeId, int? locationId)
{
    using SqlConnection con = GetConnection();
    con.Open();

    const string query = @"
        SELECT
            COALESCE(SUM(e.ActiveProjects), 0) AS TotalProjects,
            COALESCE(AVG(CAST(e.ActiveProjects AS DECIMAL(10, 2))), 0) AS AverageProjects,
            COALESCE(SUM(CASE WHEN e.IsActive = 1 THEN 1 ELSE 0 END), 0) AS ActiveEmployees,
            COALESCE(MAX(e.ActiveProjects), 0) AS HighestProjects
        FROM Employees e
        WHERE (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
          AND (@EmploymentTypeId IS NULL OR e.EmploymentTypeId = @EmploymentTypeId)
          AND (@LocationId IS NULL OR e.LocationId = @LocationId);

        SELECT
            d.Name AS Department,
            COALESCE(SUM(e.ActiveProjects), 0) AS Projects
        FROM Employees e
        INNER JOIN Departments d ON e.DepartmentId = d.Id
        WHERE (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
          AND (@EmploymentTypeId IS NULL OR e.EmploymentTypeId = @EmploymentTypeId)
          AND (@LocationId IS NULL OR e.LocationId = @LocationId)
        GROUP BY d.Name";

    _logger.LogInformation("Query executed :{Query}", query);

    using SqlCommand cmd = new(query, con);
    AddOptionalFilterParams(cmd, departmentId, employmentTypeId, locationId);

    using SqlDataReader reader = cmd.ExecuteReader();
    reader.Read();

    var summary = new ProjectsSummary
    {
        TotalProjects = Convert.ToInt32(reader["TotalProjects"]),
        AverageProjects = Math.Round(Convert.ToDecimal(reader["AverageProjects"]), 1),
        ActiveEmployees = Convert.ToInt32(reader["ActiveEmployees"]),
        HighestProjects = Convert.ToInt32(reader["HighestProjects"])
    };

    reader.NextResult();
    while (reader.Read())
    {
        summary.ByDepartment.Add(new DepartmentProjectLoad
        {
            Department = reader["Department"].ToString()!,
            Projects = Convert.ToInt32(reader["Projects"])
        });
    }

    return summary;
}

// Paginated "top contributors" list for the Projects page, ordered by ActiveProjects server-side
// instead of sorting the full 100k-row array in the browser. Id is a tiebreaker so paging stays
// stable when multiple employees share the same ActiveProjects value.
public PagedEmployees GetTopContributors(int offset, int size, int? departmentId = null, int? employmentTypeId = null, int? locationId = null)
{
    using SqlConnection con = GetConnection();
    con.Open();

    var result = new PagedEmployees();

    const string query = @"
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
    INNER JOIN Departments d ON e.DepartmentId = d.Id
    INNER JOIN Locations l ON e.LocationId = l.Id
    INNER JOIN EmploymentTypes et ON e.EmploymentTypeId = et.Id
    WHERE (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
      AND (@EmploymentTypeId IS NULL OR e.EmploymentTypeId = @EmploymentTypeId)
      AND (@LocationId IS NULL OR e.LocationId = @LocationId)
    ORDER BY e.ActiveProjects DESC, e.Id
    OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY";

    _logger.LogInformation("Query executed :{Query}", query);

    using (SqlCommand cmd = new(query, con))
    {
        AddOptionalFilterParams(cmd, departmentId, employmentTypeId, locationId);
        cmd.Parameters.AddWithValue("@offset", offset);
        cmd.Parameters.AddWithValue("@size", size);

        using SqlDataReader reader = cmd.ExecuteReader();
        var cols = new EmployeeColumns(reader);

        while (reader.Read())
        {
            result.Items.Add(cols.Read(reader));
        }
    }

    result.Total = CountEmployees(con, departmentId, employmentTypeId, locationId);

    return result;
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
        return new EmployeeColumns(reader).Read(reader);
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

private static void AddOptionalFilterParams(SqlCommand cmd, int? departmentId, int? employmentTypeId, int? locationId)
{
    cmd.Parameters.Add("@DepartmentId", System.Data.SqlDbType.Int).Value = departmentId ?? (object)DBNull.Value;
    cmd.Parameters.Add("@EmploymentTypeId", System.Data.SqlDbType.Int).Value = employmentTypeId ?? (object)DBNull.Value;
    cmd.Parameters.Add("@LocationId", System.Data.SqlDbType.Int).Value = locationId ?? (object)DBNull.Value;
}

// Resolves each column name to its ordinal once per query (via reader.GetOrdinal) instead of
// every reader["ColumnName"] doing a name lookup per column per row - that adds up at 100k rows.
// Values are still read through Convert.ToXxx(reader.GetValue(...)) rather than typed
// GetInt32/GetDecimal accessors: some columns are narrower in SQL than in the C# model (e.g.
// Salary is `int` in the database but `decimal` here), and the typed accessors throw on that
// mismatch where Convert.ToXxx tolerates it.
private sealed class EmployeeColumns
{
    private readonly int _id, _employeeCode, _name, _department, _employmentType, _location,
        _attendance, _performance, _activeProjects, _experienceYears, _salary, _joiningYear,
        _isActive, _departmentId, _employmentTypeId, _locationId;

    public EmployeeColumns(SqlDataReader reader)
    {
        _id = reader.GetOrdinal("Id");
        _employeeCode = reader.GetOrdinal("EmployeeCode");
        _name = reader.GetOrdinal("Name");
        _department = reader.GetOrdinal("Department");
        _employmentType = reader.GetOrdinal("EmploymentType");
        _location = reader.GetOrdinal("Location");
        _attendance = reader.GetOrdinal("Attendance");
        _performance = reader.GetOrdinal("Performance");
        _activeProjects = reader.GetOrdinal("ActiveProjects");
        _experienceYears = reader.GetOrdinal("ExperienceYears");
        _salary = reader.GetOrdinal("Salary");
        _joiningYear = reader.GetOrdinal("JoiningYear");
        _isActive = reader.GetOrdinal("IsActive");
        _departmentId = reader.GetOrdinal("DepartmentId");
        _employmentTypeId = reader.GetOrdinal("EmploymentTypeId");
        _locationId = reader.GetOrdinal("LocationId");
    }

    public Employee Read(SqlDataReader reader) => new()
    {
        Id = Convert.ToInt32(reader.GetValue(_id)),
        EmployeeCode = reader.GetValue(_employeeCode).ToString()!,
        Name = reader.GetValue(_name).ToString()!,
        Department = reader.GetValue(_department).ToString()!,
        EmploymentType = reader.GetValue(_employmentType).ToString()!,
        Location = reader.GetValue(_location).ToString()!,
        Attendance = Convert.ToInt32(reader.GetValue(_attendance)),
        Performance = Convert.ToDecimal(reader.GetValue(_performance)),
        ActiveProjects = Convert.ToInt32(reader.GetValue(_activeProjects)),
        ExperienceYears = Convert.ToInt32(reader.GetValue(_experienceYears)),
        Salary = Convert.ToDecimal(reader.GetValue(_salary)),
        JoiningYear = Convert.ToInt32(reader.GetValue(_joiningYear)),
        IsActive = Convert.ToBoolean(reader.GetValue(_isActive)),
        DepartmentId = Convert.ToInt32(reader.GetValue(_departmentId)),
        EmploymentTypeId = Convert.ToInt32(reader.GetValue(_employmentTypeId)),
        LocationId = Convert.ToInt32(reader.GetValue(_locationId))
    };
}

}
