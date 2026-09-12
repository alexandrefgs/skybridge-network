using SkyBridge.Domain.Entities;

namespace SkyBridge.Domain.Interfaces;

public interface ITokenService
{
    (string Token, DateTime ExpiraEm) GerarAccessToken(Pilot pilot);
}