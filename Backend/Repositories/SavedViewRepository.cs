using System.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.Data.SqlClient;

namespace Backend.Repositories;

public class SavedViewRepository
{
    private const string SelectColumns =
        "Id, Name, DepartmentId, EmploymentTypeId, LocationId, IsDefault, CreatedAt, UpdatedAt";

    private readonly IConfiguration _configuration;
    private readonly ILogger<SavedViewRepository> _logger;

    public SavedViewRepository(IConfiguration configuration, ILogger<SavedViewRepository> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    private SqlConnection GetConnection()
    {
        return new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
    }

    public List<SavedView> GetSavedViews(int userId)
    {
        List<SavedView> views = new();

        using SqlConnection con = GetConnection();
        con.Open();

        string query = $@"
            SELECT {SelectColumns}
            FROM dbo.SavedViews
            WHERE UserId = @UserId
            ORDER BY Name";

        using SqlCommand cmd = new(query, con);
        cmd.Parameters.AddWithValue("@UserId", userId);

        using SqlDataReader reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            views.Add(MapSavedView(reader));
        }

        return views;
    }

    public SavedView? GetDefaultView(int userId)
    {
        using SqlConnection con = GetConnection();
        con.Open();

        string query = $@"
            SELECT {SelectColumns}
            FROM dbo.SavedViews
            WHERE UserId = @UserId AND IsDefault = 1";

        using SqlCommand cmd = new(query, con);
        cmd.Parameters.AddWithValue("@UserId", userId);

        using SqlDataReader reader = cmd.ExecuteReader();
        return reader.Read() ? MapSavedView(reader) : null;
    }

    // Mirrors the duplicate-email check in AuthController: ask first, so the caller can
    // return a clean 409 instead of letting UX_SavedViews_User_Name blow up as a 500.
    public bool NameExists(int userId, string name, Guid? excludeId = null)
    {
        using SqlConnection con = GetConnection();
        con.Open();

        string query = @"
            SELECT COUNT(*)
            FROM dbo.SavedViews
            WHERE UserId = @UserId
              AND Name = @Name
              AND (@ExcludeId IS NULL OR Id <> @ExcludeId)";

        using SqlCommand cmd = new(query, con);
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Name", name);
        cmd.Parameters.Add("@ExcludeId", SqlDbType.UniqueIdentifier).Value =
            (object?)excludeId ?? DBNull.Value;

        return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
    }

    public SavedView Create(int userId, SavedViewDto dto)
    {
        using SqlConnection con = GetConnection();
        con.Open();
        using SqlTransaction transaction = con.BeginTransaction();

        if (dto.IsDefault)
        {
            ClearDefault(con, transaction, userId);
        }

        string query = @"
            INSERT INTO dbo.SavedViews
                (UserId, Name, DepartmentId, EmploymentTypeId, LocationId, IsDefault)
            OUTPUT inserted.Id, inserted.Name, inserted.DepartmentId, inserted.EmploymentTypeId,
                   inserted.LocationId, inserted.IsDefault, inserted.CreatedAt, inserted.UpdatedAt
            VALUES
                (@UserId, @Name, @DepartmentId, @EmploymentTypeId, @LocationId, @IsDefault)";

        using SqlCommand cmd = new(query, con, transaction);
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Name", dto.Name.Trim());
        AddNullableInt(cmd, "@DepartmentId", dto.DepartmentId);
        AddNullableInt(cmd, "@EmploymentTypeId", dto.EmploymentTypeId);
        AddNullableInt(cmd, "@LocationId", dto.LocationId);
        cmd.Parameters.AddWithValue("@IsDefault", dto.IsDefault);

        SavedView created;
        using (SqlDataReader reader = cmd.ExecuteReader())
        {
            reader.Read();
            created = MapSavedView(reader);
        }

        transaction.Commit();

        _logger.LogInformation(
            "Created saved view {ViewId} '{ViewName}' for user {UserId}",
            created.Id, created.Name, userId);

        return created;
    }

    public bool Update(int userId, Guid id, SavedViewDto dto)
    {
        using SqlConnection con = GetConnection();
        con.Open();
        using SqlTransaction transaction = con.BeginTransaction();

        if (dto.IsDefault)
        {
            ClearDefault(con, transaction, userId, exceptId: id);
        }

        string query = @"
            UPDATE dbo.SavedViews
            SET Name = @Name,
                DepartmentId = @DepartmentId,
                EmploymentTypeId = @EmploymentTypeId,
                LocationId = @LocationId,
                IsDefault = @IsDefault,
                UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @Id AND UserId = @UserId";

        using SqlCommand cmd = new(query, con, transaction);
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Name", dto.Name.Trim());
        AddNullableInt(cmd, "@DepartmentId", dto.DepartmentId);
        AddNullableInt(cmd, "@EmploymentTypeId", dto.EmploymentTypeId);
        AddNullableInt(cmd, "@LocationId", dto.LocationId);
        cmd.Parameters.AddWithValue("@IsDefault", dto.IsDefault);

        int rows = cmd.ExecuteNonQuery();

        if (rows == 0)
        {
            // The id was not this user's. ClearDefault may already have run, so undo it.
            transaction.Rollback();
            _logger.LogWarning("Saved view {ViewId} not found for user {UserId} on update", id, userId);
            return false;
        }

        transaction.Commit();
        _logger.LogInformation("Updated saved view {ViewId} for user {UserId}", id, userId);
        return true;
    }

    public bool SetDefault(int userId, Guid id)
    {
        using SqlConnection con = GetConnection();
        con.Open();
        using SqlTransaction transaction = con.BeginTransaction();

        ClearDefault(con, transaction, userId, exceptId: id);

        string query = @"
            UPDATE dbo.SavedViews
            SET IsDefault = 1, UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @Id AND UserId = @UserId";

        using SqlCommand cmd = new(query, con, transaction);
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@UserId", userId);

        int rows = cmd.ExecuteNonQuery();

        if (rows == 0)
        {
            transaction.Rollback();
            _logger.LogWarning("Saved view {ViewId} not found for user {UserId} on set-default", id, userId);
            return false;
        }

        transaction.Commit();
        _logger.LogInformation("Saved view {ViewId} set as default for user {UserId}", id, userId);
        return true;
    }

    public bool Delete(int userId, Guid id)
    {
        using SqlConnection con = GetConnection();
        con.Open();

        string query = "DELETE FROM dbo.SavedViews WHERE Id = @Id AND UserId = @UserId";

        using SqlCommand cmd = new(query, con);
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@UserId", userId);

        int rows = cmd.ExecuteNonQuery();

        if (rows == 0)
        {
            _logger.LogWarning("Saved view {ViewId} not found for user {UserId} on delete", id, userId);
            return false;
        }

        _logger.LogInformation("Deleted saved view {ViewId} for user {UserId}", id, userId);
        return true;
    }

    private static void ClearDefault(
        SqlConnection con, SqlTransaction transaction, int userId, Guid? exceptId = null)
    {
        string query = @"
            UPDATE dbo.SavedViews
            SET IsDefault = 0, UpdatedAt = SYSUTCDATETIME()
            WHERE UserId = @UserId
              AND IsDefault = 1
              AND (@ExceptId IS NULL OR Id <> @ExceptId)";

        using SqlCommand cmd = new(query, con, transaction);
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.Add("@ExceptId", SqlDbType.UniqueIdentifier).Value =
            (object?)exceptId ?? DBNull.Value;

        cmd.ExecuteNonQuery();
    }

    private static void AddNullableInt(SqlCommand cmd, string name, int? value)
    {
        cmd.Parameters.Add(name, SqlDbType.Int).Value = (object?)value ?? DBNull.Value;
    }

    private static SavedView MapSavedView(SqlDataReader reader)
    {
        return new SavedView
        {
            Id = (Guid)reader["Id"],
            Name = reader["Name"].ToString()!,
            DepartmentId = GetNullableInt(reader, "DepartmentId"),
            EmploymentTypeId = GetNullableInt(reader, "EmploymentTypeId"),
            LocationId = GetNullableInt(reader, "LocationId"),
            IsDefault = Convert.ToBoolean(reader["IsDefault"]),
            CreatedAt = Convert.ToDateTime(reader["CreatedAt"]),
            UpdatedAt = Convert.ToDateTime(reader["UpdatedAt"])
        };
    }

    private static int? GetNullableInt(SqlDataReader reader, string column)
    {
        object value = reader[column];
        return value == DBNull.Value ? null : Convert.ToInt32(value);
    }
}
