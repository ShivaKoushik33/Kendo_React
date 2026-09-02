using Backend.Models;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Memory;

namespace Backend.Repositories;

public class FilterRepository
{
    private const string FiltersCacheKey = "DashboardFilters";
    private static readonly TimeSpan FiltersCacheDuration = TimeSpan.FromMinutes(10);

    private readonly IConfiguration _configuration;
    private readonly ILogger<FilterRepository> _logger;
    private readonly IMemoryCache _cache;

    public FilterRepository(IConfiguration configuration, ILogger<FilterRepository> logger, IMemoryCache cache)
    {
        _configuration=configuration;
        _logger=logger;
        _cache=cache;
    }
    private SqlConnection GetConnection()
    {
        return new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
    }

    // Departments/Locations/EmploymentTypes/Skills change rarely (admin-only edits), so every
    // page load hitting 4 sequential queries for them is wasted work. Cache the result for a
    // short window instead - worst case a newly added lookup value takes up to 10 minutes to
    // show up everywhere, which is an acceptable trade for this data.
    public DashboardFilters GetFilters()
    {
        if (_cache.TryGetValue(FiltersCacheKey, out DashboardFilters? cached) && cached != null)
        {
            return cached;
        }

        DashboardFilters filters=new();
        using SqlConnection con=GetConnection();
        con.Open();
        filters.Departments=GetDepartments(con);
        filters.Locations=GetLocations(con);
        filters.EmploymentTypes=GetEmploymentTypes(con);
        filters.Skills=GetSkills(con);

        _logger.LogInformation(
            "Loaded {DepartmentCount} departments, {LocationCount} locations, {EmploymentTypeCount} employment types, {SkillCount} skills",
            filters.Departments.Count,
            filters.Locations.Count,
            filters.EmploymentTypes.Count,
            filters.Skills.Count);

        _cache.Set(FiltersCacheKey, filters, FiltersCacheDuration);

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