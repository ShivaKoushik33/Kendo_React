namespace Backend.Models;

public class PagedEmployees
{
    public List<Employee> Items { get; set; } = new();

    public int Total { get; set; }
}
