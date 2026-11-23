using SkyBridge.Domain.Aircraft;
using Cat = SkyBridge.Domain.Aircraft.AircraftCategoryCode;
using Eng = SkyBridge.Domain.Aircraft.EngineType;

namespace SkyBridge.Infrastructure.Persistence.Seed;

public static class AircraftCatalogSeed
{
    public static IReadOnlyList<AircraftCategory> Categories() =>
    [
        AircraftCategory.Create(Cat.SinglePiston, "Single piston", 0),
        AircraftCategory.Create(Cat.TwinPiston, "Twin piston", 0),
        AircraftCategory.Create(Cat.Turboprop, "Turboprop", 25),
        AircraftCategory.Create(Cat.Regional, "Regional", 75),
        AircraftCategory.Create(Cat.LightJet, "Light jet", 75),
        AircraftCategory.Create(Cat.MidSizeJet, "Mid-size jet", 150),
        AircraftCategory.Create(Cat.LargeBusinessJet, "Large business jet", 300),
        AircraftCategory.Create(Cat.Medium, "Medium (narrow-body)", 300),
        AircraftCategory.Create(Cat.Heavy, "Heavy (wide-body)", 600)
    ];

        public static IReadOnlyList<AircraftTypeData> Types { get; } =
    [
        new("C152", "Cessna", "152", Cat.SinglePiston, Eng.Piston, 1, 415, 107, 14700, 2, 50),
        new("C172", "Cessna", "172 Skyhawk", Cat.SinglePiston, Eng.Piston, 1, 640, 124, 14000, 4, 54),
        new("P28A", "Piper", "PA-28-181 Archer", Cat.SinglePiston, Eng.Piston, 1, 520, 128, 13240, 4, 90),
        new("SR22", "Cirrus", "SR22", Cat.SinglePiston, Eng.Piston, 1, 1000, 183, 17500, 5, 59),
        new("DA40", "Diamond", "DA40 NG", Cat.SinglePiston, Eng.Piston, 1, 720, 150, 16400, 4, 45),

        new("DA62", "Diamond", "DA62", Cat.TwinPiston, Eng.Piston, 2, 1280, 192, 20000, 7, 140),
        new("BE58", "Beechcraft", "Baron 58", Cat.TwinPiston, Eng.Piston, 2, 1480, 200, 20688, 6, 180),
        new("PA34", "Piper", "PA-34 Seneca V", Cat.TwinPiston, Eng.Piston, 2, 830, 190, 25000, 6, 90),

        new("C208", "Cessna", "208B Grand Caravan EX", Cat.Turboprop, Eng.Turboprop, 1, 900, 186, 25000, 13, 1500),
        new("KODI", "Daher", "Kodiak 100", Cat.Turboprop, Eng.Turboprop, 1, 1130, 174, 25000, 10, 1000),
        new("TBM9", "Daher", "TBM 930", Cat.Turboprop, Eng.Turboprop, 1, 1730, 330, 31000, 6, 120),
        new("PC12", "Pilatus", "PC-12 NGX", Cat.Turboprop, Eng.Turboprop, 1, 1800, 290, 30000, 9, 400),
        new("B350", "Beechcraft", "King Air 350i", Cat.Turboprop, Eng.Turboprop, 2, 1800, 312, 35000, 11, 250),

        new("AT76", "ATR", "72-600", Cat.Regional, Eng.Turboprop, 2, 825, 275, 25000, 70, 7500),
        new("DH8D", "De Havilland Canada", "Dash 8-400", Cat.Regional, Eng.Turboprop, 2, 1100, 360, 27000, 78, 8600),
        new("E175", "Embraer", "E175", Cat.Regional, Eng.Jet, 2, 2200, 447, 41000, 76, 3500),
        new("E190", "Embraer", "E190", Cat.Regional, Eng.Jet, 2, 2450, 447, 41000, 100, 4000),
        new("E195", "Embraer", "E195", Cat.Regional, Eng.Jet, 2, 2200, 447, 41000, 120, 4500),
        new("CRJ9", "Bombardier", "CRJ900", Cat.Regional, Eng.Jet, 2, 1550, 447, 41000, 90, 4000),

        new("E50P", "Embraer", "Phenom 100EV", Cat.LightJet, Eng.Jet, 2, 1178, 406, 41000, 6, 140),
        new("E55P", "Embraer", "Phenom 300E", Cat.LightJet, Eng.Jet, 2, 2010, 453, 45000, 9, 300),
        new("HDJT", "Honda", "HondaJet Elite II", Cat.LightJet, Eng.Jet, 2, 1547, 422, 43000, 6, 200),
        new("C25C", "Cessna", "Citation CJ4 Gen2", Cat.LightJet, Eng.Jet, 2, 2165, 451, 45000, 9, 450),

        new("C68A", "Cessna", "Citation Latitude", Cat.MidSizeJet, Eng.Jet, 2, 2700, 446, 45000, 9, 500),
        new("C700", "Cessna", "Citation Longitude", Cat.MidSizeJet, Eng.Jet, 2, 3500, 483, 45000, 12, 500),
        new("CL35", "Bombardier", "Challenger 350", Cat.MidSizeJet, Eng.Jet, 2, 3200, 470, 45000, 10, 500),
        new("LJ75", "Learjet", "75 Liberty", Cat.MidSizeJet, Eng.Jet, 2, 2080, 465, 51000, 9, 230),

        new("GLF6", "Gulfstream", "G650ER", Cat.LargeBusinessJet, Eng.Jet, 2, 7500, 516, 51000, 19, 900),
        new("GL7T", "Bombardier", "Global 7500", Cat.LargeBusinessJet, Eng.Jet, 2, 7700, 516, 51000, 19, 900),
        new("FA7X", "Dassault", "Falcon 7X", Cat.LargeBusinessJet, Eng.Jet, 3, 5950, 488, 51000, 16, 700),

        new("A319", "Airbus", "A319", Cat.Medium, Eng.Jet, 2, 3750, 447, 39800, 140, 3500),
        new("A320", "Airbus", "A320", Cat.Medium, Eng.Jet, 2, 3300, 447, 39800, 180, 4000),
        new("A20N", "Airbus", "A320neo", Cat.Medium, Eng.Jet, 2, 3500, 450, 39800, 180, 4000),
        new("A21N", "Airbus", "A321neo", Cat.Medium, Eng.Jet, 2, 3500, 450, 39800, 220, 5000),
        new("B737", "Boeing", "737-700", Cat.Medium, Eng.Jet, 2, 3000, 453, 41000, 149, 3500),
        new("B738", "Boeing", "737-800", Cat.Medium, Eng.Jet, 2, 2935, 453, 41000, 189, 4500),
        new("B38M", "Boeing", "737 MAX 8", Cat.Medium, Eng.Jet, 2, 3550, 453, 41000, 189, 4500),
        new("B739", "Boeing", "737-900ER", Cat.Medium, Eng.Jet, 2, 2950, 453, 41000, 220, 5000),

        new("A332", "Airbus", "A330-200", Cat.Heavy, Eng.Jet, 2, 7250, 470, 41450, 247, 20000),
        new("A339", "Airbus", "A330-900neo", Cat.Heavy, Eng.Jet, 2, 7200, 470, 41450, 287, 20000),
        new("A359", "Airbus", "A350-900", Cat.Heavy, Eng.Jet, 2, 8100, 488, 43100, 315, 20000),
        new("A388", "Airbus", "A380-800", Cat.Heavy, Eng.Jet, 4, 8000, 488, 43000, 525, 25000),
        new("B772", "Boeing", "777-200ER", Cat.Heavy, Eng.Jet, 2, 7065, 490, 43100, 313, 20000),
        new("B77W", "Boeing", "777-300ER", Cat.Heavy, Eng.Jet, 2, 7370, 490, 43100, 396, 25000),
        new("B788", "Boeing", "787-8", Cat.Heavy, Eng.Jet, 2, 7355, 488, 43000, 248, 18000),
        new("B789", "Boeing", "787-9", Cat.Heavy, Eng.Jet, 2, 7565, 488, 43000, 296, 20000),
        new("B748", "Boeing", "747-8 Intercontinental", Cat.Heavy, Eng.Jet, 4, 7730, 495, 43100, 410, 25000)
    ];
}