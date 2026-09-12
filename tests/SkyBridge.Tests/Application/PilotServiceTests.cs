using FluentAssertions;
using NSubstitute;
using SkyBridge.Application.Services;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Interfaces;
using Xunit;

namespace SkyBridge.Tests.Application;

public class PilotServiceTests
{
    private readonly IUnitOfWork _uow;
    private readonly PilotService _service;

    public PilotServiceTests()
    {
        _uow = Substitute.For<IUnitOfWork>();
        _uow.Pilots.Returns(Substitute.For<IPilotRepository>());
        _uow.Airlines.Returns(Substitute.For<IAirlineRepository>());
        _uow.PilotCareers.Returns(Substitute.For<IPilotCareerRepository>());
        _uow.Ranks.Returns(Substitute.For<IRankRepository>());

        _service = new PilotService(_uow);
    }

    [Fact]
    public async Task IniciarCarreiraAsync_deve_falhar_se_piloto_ou_companhia_nao_existem()
    {
        _uow.Pilots.GetByIdAsync(1).Returns((Pilot?)null);

        var resultado = await _service.IniciarCarreiraAsync(1, 1);

        resultado.Sucesso.Should().BeFalse();
    }

    [Fact]
    public async Task IniciarCarreiraAsync_deve_falhar_se_ja_existe_carreira_na_companhia()
    {
        _uow.Pilots.GetByIdAsync(1).Returns(new Pilot { Id = 1 });
        _uow.Airlines.GetByIdAsync(1).Returns(new Airline { Id = 1 });
        _uow.PilotCareers.GetByPilotAndAirlineAsync(1, 1).Returns(new PilotCareer());

        var resultado = await _service.IniciarCarreiraAsync(1, 1);

        resultado.Sucesso.Should().BeFalse();
    }

    [Fact]
    public async Task IniciarCarreiraAsync_deve_falhar_se_companhia_nao_tem_ranks_cadastrados()
    {
        _uow.Pilots.GetByIdAsync(1).Returns(new Pilot { Id = 1 });
        _uow.Airlines.GetByIdAsync(1).Returns(new Airline { Id = 1 });
        _uow.PilotCareers.GetByPilotAndAirlineAsync(1, 1).Returns((PilotCareer?)null);
        _uow.Ranks.GetRankInicialDaCompanhiaAsync(1).Returns((Rank?)null);

        var resultado = await _service.IniciarCarreiraAsync(1, 1);

        resultado.Sucesso.Should().BeFalse();
    }

    [Fact]
    public async Task IniciarCarreiraAsync_deve_ter_sucesso_com_rank_inicial_disponivel()
    {
        _uow.Pilots.GetByIdAsync(1).Returns(new Pilot { Id = 1 });
        _uow.Airlines.GetByIdAsync(1).Returns(new Airline { Id = 1 });
        _uow.PilotCareers.GetByPilotAndAirlineAsync(1, 1).Returns((PilotCareer?)null);
        _uow.Ranks.GetRankInicialDaCompanhiaAsync(1).Returns(new Rank { Id = 1, Nome = "FO Nacional" });

        var resultado = await _service.IniciarCarreiraAsync(1, 1);

        resultado.Sucesso.Should().BeTrue();
        resultado.Valor.Should().Contain("FO Nacional");
    }

    [Fact]
    public async Task ExcluirAsync_deve_falhar_se_piloto_nao_existe()
    {
        _uow.Pilots.GetByIdAsync(1).Returns((Pilot?)null);

        var resultado = await _service.ExcluirAsync(1);

        resultado.Sucesso.Should().BeFalse();
    }

    [Fact]
    public async Task ExcluirAsync_deve_ter_sucesso_e_mencionar_o_callsign()
    {
        _uow.Pilots.GetByIdAsync(1).Returns(new Pilot { Id = 1, Callsign = "SKB1001" });

        var resultado = await _service.ExcluirAsync(1);

        resultado.Sucesso.Should().BeTrue();
        resultado.Valor.Should().Contain("SKB1001");
    }
}