using System.Security.Claims;

namespace SkyBridge.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal) =>
        Guid.Parse(principal.FindFirst("sub")?.Value ?? throw new InvalidOperationException("Token has no 'sub' claim."));
}