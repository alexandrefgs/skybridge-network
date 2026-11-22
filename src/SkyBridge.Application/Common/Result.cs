namespace SkyBridge.Application.Common;

public enum ResultStatus
{
    Ok,
    NotFound,
    Invalid,
    Conflict
}

public sealed record Result<T>(ResultStatus Status, T? Value, Dictionary<string, string[]> Errors)
{
    public bool Succeeded => Status == ResultStatus.Ok;

    public static Result<T> Ok(T value) => new(ResultStatus.Ok, value, []);

    public static Result<T> NotFound() => new(ResultStatus.NotFound, default, []);

    public static Result<T> Invalid(string field, string message) => new(ResultStatus.Invalid, default, new() { [field] = [message] });

    public static Result<T> Conflict(string field, string message) => new(ResultStatus.Conflict, default, new() { [field] = [message] });
}