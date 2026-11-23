using SkyBridge.Domain.Airports;
using SkyBridge.Domain.Freelance;

namespace SkyBridge.UnitTests.Freelance;

public class FreelanceJobTests
{
    private static readonly DateTime Now = new(2026, 11, 23, 12, 0, 0, DateTimeKind.Utc);

    private static readonly Airport Florianopolis = Airport.Create(new AirportData("SBFL", "SBFL", "FLN", "Hercílio Luz International Airport",
        AirportType.Large, -27.670279, -48.552502, 16, "BR", "BR-SC", "Florianópolis", true));

    private static readonly Airport Guarulhos = Airport.Create(new AirportData("SBGR", "SBGR", "GRU", "Guarulhos International Airport",
        AirportType.Large, -23.431944, -46.467778, 2461, "BR", "BR-SP", "São Paulo", true));

    private static readonly Airport SantosDumont = Airport.Create(new AirportData("SBRJ", "SBRJ", "SDU", "Santos Dumont Airport",
        AirportType.Large, -22.910461, -43.163133, 11, "BR", "BR-RJ", "Rio de Janeiro", true));

    private static FreelanceJobDetails Medevac() =>
        new(FreelanceJobKind.Medevac, "Hospital Santa Catarina", "A patient needs urgent transfer to a burn unit in São Paulo.", 4500, Now.AddDays(1));

    private static FreelanceLegPlan Leg(Airport origin, Airport destination, int passengers = 2, params string[] names) =>
        new(origin, destination, passengers, names, 150, [DangerousGood.Create("Medical oxygen", DangerousGoodClass.Gases, 20, "UN1072")]);

    [Fact]
    public void Create_KeepsTheBriefingAndTheLeg()
    {
        var job = FreelanceJob.Create(Medevac(), [Leg(Florianopolis, Guarulhos, 2, "Maria Souza")], [1, 2], Now);

        var leg = Assert.Single(job.Legs);
        Assert.Equal(("Hospital Santa Catarina", 1), (job.Client, leg.Sequence));
        Assert.Equal(new[] { "Maria Souza" }, leg.PassengerNames);
        Assert.Equal("UN1072", Assert.Single(leg.DangerousGoods).UnNumber);
        Assert.InRange(job.DistanceNm, 270, 290);
        Assert.Equal(2, job.Aircraft.Count);
    }

    [Fact]
    public void Create_ChainsLegs_AndAddsUpTheDistance()
    {
        var job = FreelanceJob.Create(Medevac() with { Kind = FreelanceJobKind.Executive },
            [Leg(Florianopolis, Guarulhos), Leg(Guarulhos, SantosDumont), Leg(SantosDumont, Florianopolis)], [1], Now);

        Assert.Equal(new[] { 1, 2, 3 }, job.Legs.Select(l => l.Sequence));
        Assert.Equal(job.Legs.Sum(l => l.DistanceNm), job.DistanceNm);
        Assert.InRange(job.DistanceNm, 800, 900);
    }

    [Fact]
    public void Create_RejectsLegsThatAreNotChained()
    {
        var exception = Assert.Throws<ArgumentException>(() =>
            FreelanceJob.Create(Medevac(), [Leg(Florianopolis, Guarulhos), Leg(SantosDumont, Florianopolis)], [1], Now));

        Assert.StartsWith("Leg 2 must depart from where leg 1 lands", exception.Message);
    }

    [Fact]
    public void Create_RejectsNoLegsOrTooManyLegs()
    {
        var tooMany = Enumerable.Range(0, 9).Select(i => i % 2 == 0 ? Leg(Florianopolis, Guarulhos) : Leg(Guarulhos, Florianopolis)).ToList();

        Assert.Throws<ArgumentException>(() => FreelanceJob.Create(Medevac(), [], [1], Now));
        Assert.Throws<ArgumentException>(() => FreelanceJob.Create(Medevac(), tooMany, [1], Now));
    }

    [Fact]
    public void Create_RejectsTheSameAirport()
    {
        Assert.Throws<ArgumentException>(() => FreelanceJob.Create(Medevac(), [Leg(Florianopolis, Florianopolis)], [1], Now));
    }

    [Fact]
    public void Create_AllowsTheSameAirport_ForSkydiving()
    {
        var job = FreelanceJob.Create(Medevac() with { Kind = FreelanceJobKind.Skydiving }, [Leg(Florianopolis, Florianopolis)], [1], Now);

        Assert.Equal(0, job.DistanceNm);
    }

    [Fact]
    public void Create_RejectsAJobThatAlreadyExpired()
    {
        Assert.Throws<ArgumentException>(() => FreelanceJob.Create(Medevac() with { ExpiresAtUtc = Now }, [Leg(Florianopolis, Guarulhos)], [1], Now));
    }

    [Fact]
    public void Create_NeedsAtLeastOneAircraft()
    {
        Assert.Throws<ArgumentException>(() => FreelanceJob.Create(Medevac(), [Leg(Florianopolis, Guarulhos)], [], Now));
    }

    [Fact]
    public void Create_RejectsMoreNamesThanPassengers()
    {
        Assert.Throws<ArgumentException>(() =>
            FreelanceJob.Create(Medevac(), [Leg(Florianopolis, Guarulhos, 1, "Maria Souza", "João Souza")], [1], Now));
    }

    [Fact]
    public void Create_IgnoresBlankNamesAndTrimsText()
    {
        var details = Medevac() with { Client = "  ", Briefing = "  Short hop.  " };

        var job = FreelanceJob.Create(details, [Leg(Florianopolis, Guarulhos, 2, " Maria Souza ", " ")], [1], Now);

        Assert.Null(job.Client);
        Assert.Equal("Short hop.", job.Briefing);
        Assert.Equal(new[] { "Maria Souza" }, job.Legs[0].PassengerNames);
    }

    [Fact]
    public void Update_ReplacesTheLegsAndTheAircraft()
    {
        var job = FreelanceJob.Create(Medevac(), [Leg(Florianopolis, Guarulhos)], [1, 2], Now);

        job.Update(Medevac() with { Reward = 5000 }, [Leg(Guarulhos, SantosDumont), Leg(SantosDumont, Guarulhos)], [2, 3], Now);

        Assert.Equal(2, job.Legs.Count);
        Assert.Equal(new[] { 2, 3 }, job.Aircraft.Select(a => a.AircraftTypeId).Order());
        Assert.Equal(5000, job.Reward);
    }

    [Fact]
    public void IsExpired_ComparesWithTheExpiry()
    {
        var job = FreelanceJob.Create(Medevac(), [Leg(Florianopolis, Guarulhos)], [1], Now);

        Assert.False(job.IsExpired(Now.AddHours(23)));
        Assert.True(job.IsExpired(Now.AddDays(1)));
    }
}