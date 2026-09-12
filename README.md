<div align="center">

# ✈️ SkyBridge Network

**Plataforma de Virtual Airline (VA) multi-companhia**, conectando pilotos de simulador de voo a todas as companhias aéreas do mundo — com rotas e callsigns reais, sistema de pontos por milhas voadas, reputação (rating), patentes por companhia, tours e conquistas.

![.NET](https://img.shields.io/badge/.NET-10-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-13-178600?style=for-the-badge&logo=csharp&logoColor=white)
![EF Core](https://img.shields.io/badge/EF_Core-10-68A063?style=for-the-badge&logo=nuget&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL_Server-LocalDB-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-Clean-8A2BE2?style=for-the-badge)
![Auth](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Validation](https://img.shields.io/badge/Validation-FluentValidation-EF4444?style=for-the-badge)
![Swagger](https://img.shields.io/badge/API_Docs-Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
![Tests](https://img.shields.io/badge/Tests-66_passing-2ea44f?style=for-the-badge&logo=xunit&logoColor=white)
![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-F2C94C?style=for-the-badge)

</div>

---

## 📋 Sobre o projeto

O **SkyBridge Network** é uma Virtual Airline (VA) de escopo mundial: em vez de simular uma única companhia aérea, a plataforma reúne **todas as companhias do mundo** — nacionais, regionais, internacionais, executivas e cargueiras — em um único hub. O piloto escolhe em qual companhia quer voar, com rotas e callsigns reais, e evolui dentro dela através de um sistema de patentes.

Feito para compatibilizar com múltiplos simuladores de voo (**MSFS 2020/2024, X-Plane 11/12 e P3D**), extraindo telemetria de voo real via um app cliente (ACARS) que se conecta à API.

## 🏗️ Arquitetura

O backend segue **Clean Architecture**, com dependências apontando sempre para dentro — o Domain não conhece nem banco de dados, nem HTTP:

```
SkyBridge.Api            → controllers, Swagger, validação, autenticação
        ↓
SkyBridge.Application     → casos de uso, DTOs, Result<T>, validadores
        ↓
SkyBridge.Infrastructure  → EF Core, repositórios, banco de dados
        ↓
SkyBridge.Domain          → entidades e regras de negócio puras
```

- **Repository + Unit of Work**: toda operação de banco passa por repositórios com contrato definido no Domain.
- **Result&lt;T&gt;**: erros de negócio esperados (ex: "rating insuficiente para essa rota") não usam exception — viram resposta `400` de forma previsível.
- **Domain Service isolado**: a regra de pontuação/penalidade de pouso (`LandingEvaluator`) não depende de banco nem de API — testável isoladamente.
- **FluentValidation**: um filtro global valida qualquer DTO automaticamente antes de chegar na regra de negócio.
- **Suíte de testes**: 66 testes (unitários com xUnit + NSubstitute, e de integração via `WebApplicationFactory` com SQLite em memória), cobrindo Domain, Application e os fluxos HTTP reais.

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
- **Callsign sequencial**: gerado automaticamente no cadastro (`SKB1001`, `SKB1002`...), reaproveitando números liberados por pilotos excluídos.
- **Tours e Awards**: sequências de voos definidas (podendo cruzar várias companhias), com progresso avançado automaticamente a cada PIREP aprovado. Ao completar todas as etapas, o piloto ganha um bônus de pontos e uma conquista (Award) exibida no seu perfil.
- **Aprovação de PIREP**: pousos muito fortes ficam pendentes até um admin aprovar ou rejeitar (rejeitar desfaz os pontos/rating aplicados no envio).

## 🔐 Autenticação

- **JWT** (access token de 30 min) + **refresh token** de 7 dias, com **rotação** (o token antigo é revogado a cada uso — reuso é bloqueado com `401`).
- Todo PIREP e ação de piloto usa o **`PilotId` extraído do token**, nunca do corpo da requisição — impossível agir em nome de outro piloto.
- Endpoints de consulta (companhias, rotas, ranking de pilotos, tours) são públicos; ações (enviar PIREP, iniciar carreira/tour, excluir a própria conta) exigem login.

## 🛠️ Tecnologias

- **.NET 10** / C# 13
- **Entity Framework Core 10** + SQL Server (LocalDB em desenvolvimento), com Migrations
- ASP.NET Core Web API, Clean Architecture (4 projetos + suíte de testes)
- **FluentValidation** para validação de entrada
- **JWT Bearer** + BCrypt (hash de senha) + refresh token com rotação
- **xUnit + FluentAssertions + NSubstitute** para testes unitários; `WebApplicationFactory` + SQLite em memória para testes de integração
- Swashbuckle / Swagger UI para documentação e testes da API
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

A API sobe com o Swagger direto na raiz (`http://localhost:5202`). O banco é criado/atualizado automaticamente via Migrations na primeira execução, já com o seed de **8 companhias reais** (LATAM, GOL, Azul, Delta, Lufthansa, Emirates, FedEx e NetJets), cobrindo os 5 tipos de operação: Nacional, Regional, Internacional, Executivo e Cargueiro.

### Rodando os testes

```bash
dotnet test
```

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
│   │   ├── Validators/
│   │   └── Common/
│   ├── SkyBridge.Infrastructure/
│   │   ├── Data/
│   │   └── Repositories/
│   ├── SkyBridge.Api/
│   │   ├── Controllers/
│   │   ├── Filters/
│   │   └── Middleware/
│   └── SkyBridge.Acars/          # protótipo do app de telemetria (FSUIPC)
├── tests/
│   └── SkyBridge.Tests/
│       ├── Domain/
│       ├── Application/
│       └── Integration/
└── SkyBridge.slnx
```

## 🗺️ Roadmap

- [x] Clean Architecture (Domain/Application/Infrastructure/Api)
- [x] Autenticação JWT com refresh token e rotação
- [x] Migrations do EF Core
- [x] Aprovação/rejeição de PIREPs pendentes
- [x] Validação de entrada com FluentValidation
- [x] Módulo de Tours e Awards com progresso automático
- [ ] Papéis de usuário (Admin/Piloto), restringindo ações administrativas
- [ ] App cliente ACARS (MSFS via FSUIPC7 → X-Plane via XPUIPC → P3D via FSUIPC6)
- [ ] Upload real de imagem (foto de tour/award), não só URL
- [ ] Cadastro de piloto inativo automaticamente após 90 dias sem voo, com e-mail disparado para o RH
- [ ] Import em massa de companhias/rotas reais (dataset OpenFlights), escalando além das 8 companhias iniciais
- [ ] App Windows com seleção de voo, sem precisar abrir o site
- [ ] Front-end (Angular)

## 📄 Licença

Projeto pessoal, desenvolvido para fins de portfólio e aprendizado.