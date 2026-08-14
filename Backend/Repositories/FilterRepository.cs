using Backend.Models;
using Microsoft.Data.SqlClient;

namespace Backend.Repositories;
 
public class FilterRepository
{
    private readonly IConfiguration _configuration;
    public FilterRepository(IConfiguration configuration)
    {
        _configuration=configuration;
    }
    private SqlConnection GetConnection()
    {
        return new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
    }
    public DashboardFilters GetFilters()
    {
        DashboardFilters filters=new();
        using SqlConnection con=GetConnection();
        con.Open();
        filters.Departments=GetDepartments(con);
        filters.Locations=GetLocations(con);
        filters.EmploymentTypes=GetEmploymentTypes(con);
        filters.Skills=GetSkills(con);

        return filters;
    }
   private List<FilterOption> GetDepartments(SqlConnection con)
    {
        List<FilterOption> departments = new();
        string query = "SELECT Id, Name FROM Departments";
        using SqlCommand cmd = new(query, con);
        using SqlDataReader reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            departments.Add(new FilterOption
            {
                Id = Convert.ToInt32(reader["Id"]),
                Name = reader["Name"].ToString()!
            });
        }
        return departments;
    }

    private List<FilterOption> GetLocations(SqlConnection con)
    {
        List<FilterOption> locations=new();
        string query="Select Id,Name From Locations";
        using SqlCommand cmd=new (query,con);
         using SqlDataReader reader = cmd.ExecuteReader();

        while (reader.Read())
        {
            locations.Add(new FilterOption
            {
                Id = Convert.ToInt32(reader["Id"]),
                Name = reader["Name"].ToString()!
            });
        }

        return locations;

    }

    private List<FilterOption> GetEmploymentTypes(SqlConnection con)
    {
        List<FilterOption> employmentTypes = new();

        string query = "SELECT Id, Name FROM EmploymentTypes";

        using SqlCommand cmd = new(query, con);

        using SqlDataReader reader = cmd.ExecuteReader();

        while (reader.Read())
        {
            employmentTypes.Add(new FilterOption
            {
                Id = Convert.ToInt32(reader["Id"]),
                Name = reader["Name"].ToString()!
            });
        }

        return employmentTypes;
    }

       private List<FilterOption> GetSkills(SqlConnection con)
    {
        List<FilterOption> skills = new();

        string query = "SELECT Id, Name FROM Skills";

        using SqlCommand cmd = new(query, con);

        using SqlDataReader reader = cmd.ExecuteReader();

        while (reader.Read())
        {
            skills.Add(new FilterOption
            {
                Id = Convert.ToInt32(reader["Id"]),
                Name = reader["Name"].ToString()!
            });
        }
        return skills;
    }
}