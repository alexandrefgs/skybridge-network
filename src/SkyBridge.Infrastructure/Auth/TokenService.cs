using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;

namespace SkyBridge.Infrastructure.Auth;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    public TokenService(IConfiguration configuration) => _configuration = configuration;

    public (string Token, DateTime ExpiraEm) GerarAccessToken(Pilot pilot)
    {
        var chave = _configuration["Jwt:ChaveSecreta"]
            ?? throw new InvalidOperationException("Jwt:ChaveSecreta não configurada.");

        var credenciais = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chave)),
            SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, pilot.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, pilot.Email),
            new Claim("callsign", pilot.Callsign),
            new Claim(ClaimTypes.Role, pilot.Role.ToString())
        };

        var expiraEm = DateTime.UtcNow.AddMinutes(30);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Emissor"],
            audience: _configuration["Jwt:Audiencia"],
            claims: claims,
            expires: expiraEm,
            signingCredentials: credenciais);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiraEm);
    }
}