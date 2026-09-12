<div align="center">

# ✈️ SkyBridge Network

**Plataforma de Virtual Airline (VA) multi-companhia**, conectando pilotos de simulador de voo a todas as companhias aéreas do mundo — com rotas e callsigns reais, sistema de pontos por milhas voadas, reputação (rating), patentes por companhia e tours.

![.NET](https://img.shields.io/badge/.NET-10-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-13-178600?style=for-the-badge&logo=csharp&logoColor=white)
![EF Core](https://img.shields.io/badge/EF_Core-10-68A063?style=for-the-badge&logo=nuget&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL_Server-LocalDB-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-Clean-8A2BE2?style=for-the-badge)
![Swagger](https://img.shields.io/badge/API_Docs-Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-F2C94C?style=for-the-badge)

</div>

---

## 📋 Sobre o projeto

O **SkyBridge Network** é uma Virtual Airline (VA) de escopo mundial: em vez de simular uma única companhia aérea, a plataforma reúne **todas as companhias do mundo** — nacionais, regionais, internacionais, executivas e cargueiras — em um único hub. O piloto escolhe em qual companhia quer voar, com rotas e callsigns reais, e evolui dentro dela através de um sistema de patentes.

Feito para compatibilizar com múltiplos simuladores de voo (**MSFS 2020/2024, X-Plane 11/12 e P3D**), extraindo telemetria de voo real via um app cliente (ACARS) que se conecta à API.

## 🏗️ Arquitetura

O backend segue **Clean Architecture**, com dependências apontando sempre para dentro — o Domain não conhece nem banco de dados, nem HTTP:

```
SkyBridge.Api            → controllers, Swagger, middleware
        ↓
SkyBridge.Application     → casos de uso, DTOs, Result<T>
        ↓
SkyBridge.Infrastructure  → EF Core, repositórios, banco de dados
        ↓
SkyBridge.Domain          → entidades e regras de negócio puras
```

- **Repository + Unit of Work**: toda operação de banco passa por repositórios com contrato definido no Domain.
- **Result&lt;T&gt;**: erros de negócio esperados (ex: "rating insuficiente para essa rota") não usam exception — viram resposta `400` de forma previsível.
- **Domain Service isolado**: a regra de pontuação/penalidade de pouso (`LandingEvaluator`) não depende de banco nem de API — testável isoladamente.

## ✈️ Regras de negócio principais

- **Pontos por milha voada**, com **penalidade por qualidade de pouso** (calculada pela taxa de descida no touchdown, em fpm):

  | Pouso | Efeito nos pontos | Impacto no rating |
  |---|---|---|
  | Suave | +5% bônus | +0.02 ⭐ |
  | Moderado | −10% | sem impacto |
  | Forte | −30% | −0.10 ⭐ |
  | Muito forte (hard landing) | zera os pontos do voo | −0.30 ⭐, PIREP fica pendente de aprovação manual |

- **Rating (0 a 5 estrelas)**: reputação do piloto, atualizada a cada voo. Rotas mais complexas exigem um rating mínimo.
- **Patentes por companhia**: cada companhia define sua própria hierarquia (ex: *FO Nacional → Comandante Nacional → FO Internacional → Comandante Internacional*), com progressão automática ao atingir horas voadas + rating mínimos.
- **Tours**: sequências de voos definidas, podendo cruzar várias companhias.

## 🛠️ Tecnologias

- **.NET 10** / C# 13
- **Entity Framework Core 10** + SQL Server (LocalDB em desenvolvimento)
- ASP.NET Core Web API, Clean Architecture (4 projetos)
- Swashbuckle / Swagger UI para documentação e testes da API
- *(planejado)* Autenticação JWT
- *(planejado)* App cliente (ACARS) em C# usando **FSUIPCClientDLL**, compatível com FSUIPC7 (MSFS), FSUIPC6 (P3D) e XPUIPC (X-Plane)

## 🚀 Como rodar localmente

### Pré-requisitos
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- SQL Server LocalDB (ou uma instância própria de SQL Server)

### Passos

```bash
git clone https://github.com/alexandrefgs/skybridge-network.git
cd skybridge-network
dotnet restore
dotnet build
dotnet run --project src/SkyBridge.Api
```

A API sobe com o Swagger direto na raiz (`http://localhost:5202`). O banco é criado automaticamente na primeira execução, já com o seed de **8 companhias reais** (LATAM, GOL, Azul, Delta, Lufthansa, Emirates, FedEx e NetJets), cobrindo os 5 tipos de operação: Nacional, Regional, Internacional, Executivo e Cargueiro.

## 📁 Estrutura de pastas

```
skybridge-network/
├── src/
│   ├── SkyBridge.Domain/
│   │   ├── Entities/
│   │   ├── Enums/
│   │   ├── Interfaces/
│   │   └── Services/
│   ├── SkyBridge.Application/
│   │   ├── DTOs/
│   │   ├── Interfaces/
│   │   ├── Services/
│   │   └── Common/
│   ├── SkyBridge.Infrastructure/
│   │   ├── Data/
│   │   └── Repositories/
│   └── SkyBridge.Api/
│       ├── Controllers/
│       └── Middleware/
└── SkyBridge.slnx
```

## 🗺️ Roadmap

- [ ] Autenticação JWT (login de piloto)
- [ ] Migrations do EF Core (substituindo `EnsureCreated`, hoje usado só em desenvolvimento)
- [ ] Endpoints de Tour e painel de aprovação de PIREPs pendentes
- [ ] App cliente ACARS (MSFS via FSUIPC7 → X-Plane via XPUIPC → P3D via FSUIPC6)
- [ ] Import em massa de companhias/rotas reais (dataset OpenFlights), escalando além das 8 companhias iniciais
- [ ] App Windows com seleção de voo, sem precisar abrir o site
- [ ] Front-end (Angular)

## 📄 Licença

Projeto pessoal, desenvolvido para fins de portfólio e aprendizado.
