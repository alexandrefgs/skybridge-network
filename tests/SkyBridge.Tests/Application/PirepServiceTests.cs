using FluentAssertions;
using NSubstitute;
using SkyBridge.Application.DTOs;
using SkyBridge.Application.Interfaces;
using SkyBridge.Application.Services;
using SkyBridge.Domain.Entities;
using SkyBridge.Domain.Enums;
using SkyBridge.Domain.Interfaces;
using SkyBridge.Domain.Services;
using Xunit;

namespace SkyBridge.Tests.Application;

public class PirepServiceTests
{
    private readonly IUnitOfWork _uow;
    private readonly PirepService _service;

    public PirepServiceTests()
    {
        _uow = Substitute.For<IUnitOfWork>();
        _uow.Pilots.Returns(Substitute.For<IPilotRepository>());
        _uow.FlightRoutes.Returns(Substitute.For<IFlightRouteRepository>());
        _uow.Aircrafts.Returns(Substitute.For<IAircraftRepository>());
        _uow.PilotCareers.Returns(Substitute.For<IPilotCareerRepository>());
        _uow.Ranks.Returns(Substitute.For<IRankRepository>());
        _uow.Pireps.Returns(Substitute.For<IPirepRepository>());
        _uow.Airlines.Returns(Substitute.For<IAirlineRepository>());
        _uow.PilotAwards.Returns(Substitute.For<IPilotAwardRepository>());

        var awardService = Substitute.For<IAwardService>();
        awardService.ObterOuCriarPatenteAsync(Arg.Any<int>(), Arg.Any<string>())
            .Returns(callInfo => Task.FromResult(new Award { Id = 1, Nome = callInfo.ArgAt<string>(1) }));

        _service = new PirepService(_uow, new LandingEvaluator(), awardService);
    }

    [Fact]
    public async Task Deve_bloquear_envio_quando_piloto_nao_atinge_rating_minimo_da_rota()
    {
        _uow.Pilots.GetByIdAsync(1).Returns(new Pilot { Id = 1, Rating = 2.0 });
        _uow.FlightRoutes.GetByIdAsync(1).Returns(new FlightRoute { Id = 1, RatingMinimo = 3.5, AirlineId = 1, DistanciaMilhas = 100 });
        _uow.Aircrafts.GetByIdAsync(1).Returns(new Aircraft { Id = 1 });

        var resultado = await _service.EnviarAsync(1, new NovoPirepDto(1, 1, 1, -100));

        resultado.Sucesso.Should().BeFalse();
        resultado.Erro.Should().Contain("Rating insuficiente");
    }

    [Fact]
    public async Task Deve_falhar_quando_piloto_nao_existe()
    {
        _uow.Pilots.GetByIdAsync(1).Returns((Pilot?)null);

        var resultado = await _service.EnviarAsync(1, new NovoPirepDto(1, 1, 1, -100));

        resultado.Sucesso.Should().BeFalse();
    }

    [Fact]
    public async Task Pouso_suave_deve_gerar_pontos_com_bonus_e_status_aprovado()
    {
        _uow.Pilots.GetByIdAsync(1).Returns(new Pilot { Id = 1, Rating = 3.0 });
        _uow.FlightRoutes.GetByIdAsync(1).Returns(new FlightRoute { Id = 1, RatingMinimo = 0, AirlineId = 1, DistanciaMilhas = 1000 });
        _uow.Aircrafts.GetByIdAsync(1).Returns(new Aircraft { Id = 1 });
        _uow.PilotCareers.GetByPilotAndAirlineAsync(1, 1).Returns((PilotCareer?)null);

        var resultado = await _service.EnviarAsync(1, new NovoPirepDto(1, 1, 2, -100));

        resultado.Sucesso.Should().BeTrue();
        resultado.Valor!.Status.Should().Be("Aprovado");
        resultado.Valor.PontosGanhos.Should().Be(1050);
    }

    [Fact]
    public async Task Pouso_muito_forte_deve_zerar_pontos_e_ficar_pendente()
    {
        _uow.Pilots.GetByIdAsync(1).Returns(new Pilot { Id = 1, Rating = 3.0 });
        _uow.FlightRoutes.GetByIdAsync(1).Returns(new FlightRoute { Id = 1, RatingMinimo = 0, AirlineId = 1, DistanciaMilhas = 1000 });
        _uow.Aircrafts.GetByIdAsync(1).Returns(new Aircraft { Id = 1 });

        var resultado = await _service.EnviarAsync(1, new NovoPirepDto(1, 1, 2, -1200));

        resultado.Valor!.Status.Should().Be("PendenteAprovacao");
        resultado.Valor.PontosGanhos.Should().Be(0);
    }

    [Fact]
    public async Task Deve_promover_patente_quando_atinge_horas_e_rating_minimos()
    {
        var rankAtual = new Rank { Id = 1, Nivel = 1 };
        var carreira = new PilotCareer { PilotId = 1, AirlineId = 1, HorasVoadas = 95, RankAtual = rankAtual, RankAtualId = 1 };
        var proximoRank = new Rank { Id = 2, Nivel = 2, Nome = "Comandante Nacional" };

        _uow.Pilots.GetByIdAsync(1).Returns(new Pilot { Id = 1, Rating = 4.0 });
        _uow.FlightRoutes.GetByIdAsync(1).Returns(new FlightRoute { Id = 1, RatingMinimo = 0, AirlineId = 1, DistanciaMilhas = 100 });
        _uow.Aircrafts.GetByIdAsync(1).Returns(new Aircraft { Id = 1 });
        _uow.PilotCareers.GetByPilotAndAirlineAsync(1, 1).Returns(carreira);
        _uow.Ranks.GetProximoRankElegivelAsync(1, 1, Arg.Any<double>(), Arg.Any<double>()).Returns(proximoRank);

        var resultado = await _service.EnviarAsync(1, new NovoPirepDto(1, 1, 10, -100));

        resultado.Valor!.NovaPatente.Should().Be("Comandante Nacional");
        carreira.RankAtualId.Should().Be(2);
    }

    [Fact]
    public async Task AprovarAsync_deve_falhar_se_pirep_nao_existe()
    {
        _uow.Pireps.GetByIdAsync(1).Returns((Pirep?)null);

        var resultado = await _service.AprovarAsync(1);

        resultado.Sucesso.Should().BeFalse();
    }

    [Fact]
    public async Task AprovarAsync_deve_falhar_se_pirep_ja_foi_avaliado()
    {
        _uow.Pireps.GetByIdAsync(1).Returns(new Pirep { Id = 1, Status = PirepStatus.Aprovado });

        var resultado = await _service.AprovarAsync(1);

        resultado.Sucesso.Should().BeFalse();
    }

    [Fact]
    public async Task AprovarAsync_deve_mudar_status_para_aprovado()
    {
        var pirep = new Pirep { Id = 1, Status = PirepStatus.PendenteAprovacao };
        _uow.Pireps.GetByIdAsync(1).Returns(pirep);

        var resultado = await _service.AprovarAsync(1);

        resultado.Sucesso.Should().BeTrue();
        pirep.Status.Should().Be(PirepStatus.Aprovado);
    }

    [Fact]
    public async Task RejeitarAsync_deve_desfazer_pontos_e_rating_do_piloto()
    {
        var pilot = new Pilot { Id = 1, Rating = 2.70, PontosTotais = 100 };
        var pirep = new Pirep { Id = 1, PilotId = 1, Status = PirepStatus.PendenteAprovacao, PontosGanhos = 0, ImpactoNoRating = -0.30 };

        _uow.Pireps.GetByIdAsync(1).Returns(pirep);
        _uow.Pilots.GetByIdAsync(1).Returns(pilot);

        var resultado = await _service.RejeitarAsync(1, "Pouso incompatível");

        resultado.Sucesso.Should().BeTrue();
        pirep.Status.Should().Be(PirepStatus.Rejeitado);
        pirep.Observacoes.Should().Be("Pouso incompatível");
        pilot.Rating.Should().Be(3.0);
    }

    [Fact]
    public async Task RejeitarAsync_deve_falhar_se_pirep_ja_foi_avaliado()
    {
        _uow.Pireps.GetByIdAsync(1).Returns(new Pirep { Id = 1, Status = PirepStatus.Rejeitado });

        var resultado = await _service.RejeitarAsync(1, "motivo");

        resultado.Sucesso.Should().BeFalse();
    }
}