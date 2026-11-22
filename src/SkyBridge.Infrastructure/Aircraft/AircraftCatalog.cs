using Microsoft.EntityFrameworkCore;
using SkyBridge.Application.Aircraft;
using SkyBridge.Application.Common;
using SkyBridge.Domain.Aircraft;
using SkyBridge.Infrastructure.Persistence;

namespace SkyBridge.Infrastructure.Aircraft;

internal sealed class AircraftCatalog(SkyBridgeDbContext db) : IAircraftCatalog
{
    private const int MaxPageSize = 100;
    public async Task<IReadOnlyList<AircraftCategoryResponse>> GetCategoriesAsync(CancellationToken cancellationToken)
    {
        var categories = await db.AircraftCategories.AsNoTracking().OrderBy(c => c.Code).ToListAsync(cancellationToken);
        return categories.Select(AircraftCategoryResponse.From).ToList();
    }

    public async Task<Result<AircraftCategoryResponse>> UpdateCategoryAsync(AircraftCategoryCode code, UpdateAircraftCategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await db.AircraftCategories.FirstOrDefaultAsync(c => c.Code == code, cancellationToken);
        if (category is null)
            return Result<AircraftCategoryResponse>.NotFound();

        category.Update(request.Name, request.RequiredHours);
        await db.SaveChangesAsync(cancellationToken);
        return Result<AircraftCategoryResponse>.Ok(AircraftCategoryResponse.From(category));
    }

    public async Task<PagedResult<AircraftTypeResponse>> GetTypesAsync(AircraftTypeSearch search, CancellationToken cancellationToken)
    {
        var page = Math.Max(search.Page, 1);
        var pageSize = Math.Clamp(search.PageSize, 1, MaxPageSize);
        var query = db.AircraftTypes.AsNoTracking();

        if (search.Category is not null)
            query = query.Where(t => t.Category == search.Category.Value);

        if (!string.IsNullOrWhiteSpace(search.Query))
        {
            var term = search.Query.Trim();
            query = query.Where(t => t.IcaoCode.Contains(term) || t.Manufacturer.Contains(term) || t.Model.Contains(term));
        }

        var total = await query.CountAsync(cancellationToken);

        var types = await query
            .OrderBy(t => t.Category)
            .ThenBy(t => t.Manufacturer)
            .ThenBy(t => t.Model)
            .ThenBy(t => t.IcaoCode)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<AircraftTypeResponse>(types.Select(AircraftTypeResponse.From).ToList(), page, pageSize, total);
    }

    public async Task<AircraftTypeResponse?> GetTypeAsync(string icaoCode, CancellationToken cancellationToken)
    {
        var code = Normalize(icaoCode);
        var type = await db.AircraftTypes.AsNoTracking().FirstOrDefaultAsync(t => t.IcaoCode == code, cancellationToken);
        return type is null ? null : AircraftTypeResponse.From(type);
    }

    public async Task<Result<AircraftTypeResponse>> CreateTypeAsync(AircraftTypeRequest request, CancellationToken cancellationToken)
    {
        var code = Normalize(request.IcaoCode);
        if (await db.AircraftTypes.AnyAsync(t => t.IcaoCode == code, cancellationToken))
            return Result<AircraftTypeResponse>.Conflict(nameof(request.IcaoCode), $"Aircraft type '{code}' already exists.");

        var type = AircraftType.Create(request.ToData());
        db.AircraftTypes.Add(type);
        await db.SaveChangesAsync(cancellationToken);
        return Result<AircraftTypeResponse>.Ok(AircraftTypeResponse.From(type));
    }

    public async Task<Result<AircraftTypeResponse>> UpdateTypeAsync(string icaoCode, AircraftTypeRequest request, CancellationToken cancellationToken)
    {
        var current = Normalize(icaoCode);
        var type = await db.AircraftTypes.FirstOrDefaultAsync(t => t.IcaoCode == current, cancellationToken);
        if (type is null)
            return Result<AircraftTypeResponse>.NotFound();

        var code = Normalize(request.IcaoCode);
        if (code != type.IcaoCode && await db.AircraftTypes.AnyAsync(t => t.IcaoCode == code, cancellationToken))
            return Result<AircraftTypeResponse>.Conflict(nameof(request.IcaoCode), $"Aircraft type '{code}' already exists.");

        type.Update(request.ToData());
        await db.SaveChangesAsync(cancellationToken);
        return Result<AircraftTypeResponse>.Ok(AircraftTypeResponse.From(type));
    }

    public async Task<Result<bool>> DeleteTypeAsync(string icaoCode, CancellationToken cancellationToken)
    {
        var code = Normalize(icaoCode);
        var type = await db.AircraftTypes.FirstOrDefaultAsync(t => t.IcaoCode == code, cancellationToken);
        if (type is null)
            return Result<bool>.NotFound();

        db.AircraftTypes.Remove(type);
        await db.SaveChangesAsync(cancellationToken);
        return Result<bool>.Ok(true);
    }

    private static string Normalize(string icaoCode) => icaoCode.Trim().ToUpperInvariant();
}