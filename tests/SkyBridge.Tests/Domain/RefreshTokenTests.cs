using FluentAssertions;
using SkyBridge.Domain.Entities;
using Xunit;

namespace SkyBridge.Tests.Domain;

public class RefreshTokenTests
{
    [Fact]
    public void Token_novo_e_dentro_da_validade_deve_estar_ativo()
    {
        var token = new RefreshToken { ExpiraEm = DateTime.UtcNow.AddDays(1) };

        token.EstaAtivo.Should().BeTrue();
    }

    [Fact]
    public void Token_expirado_nao_deve_estar_ativo()
    {
        var token = new RefreshToken { ExpiraEm = DateTime.UtcNow.AddMinutes(-1) };

        token.EstaAtivo.Should().BeFalse();
    }

    [Fact]
    public void Token_revogado_nao_deve_estar_ativo_mesmo_dentro_da_validade()
    {
        var token = new RefreshToken { ExpiraEm = DateTime.UtcNow.AddDays(1) };

        token.Revogar();

        token.EstaAtivo.Should().BeFalse();
    }

    [Fact]
    public void Revogar_deve_preencher_a_data_de_revogacao()
    {
        var token = new RefreshToken();

        token.Revogar();

        token.RevogadoEm.Should().NotBeNull();
    }
}