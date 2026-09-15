<div align="center">

# ✈️ SkyBridge Network

**Plataforma de Virtual Airline (VA) multi-companhia**, conectando pilotos de simulador de voo a todas as companhias aéreas do mundo — com rotas e callsigns reais, planos de voo gerados no SimBrief, rastreamento ao vivo no mapa, sistema de pontos por milhas voadas, reputação (rating), patentes por companhia, tours e conquistas.

![.NET](https://img.shields.io/badge/.NET-10-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-13-178600?style=for-the-badge&logo=csharp&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=for-the-badge&logo=angular&logoColor=white)
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

O **SkyBridge Network** é uma Virtual Airline (VA) de escopo mundial: em vez de simular uma única companhia aérea, a plataforma reúne **todas as companhias do mundo** — nacionais, regionais, internacionais, executivas e cargueiras — em um único hub. O piloto escolhe em qual companhia quer voar, reserva um voo (Booking), gera o plano de voo real no **SimBrief**, voa no simulador com telemetria sendo capturada automaticamente, e ao pousar tem o PIREP registrado sem precisar preencher nada manualmente.

Feito para compatibilizar com múltiplos simuladores de voo (**MSFS 2020/2024, X-Plane 11/12 e P3D**), extraindo telemetria de voo real via um app cliente (ACARS) que se conecta à API via FSUIPC.

## 🏗️ Arquitetura

### Backend — Clean Architecture

```
SkyBridge.Api            → controllers, Swagger, validação, autenticação
        ↓
SkyBridge.Application     → casos de uso, DTOs, Result<T>, validadores
        ↓
SkyBridge.Infrastructure  → EF Core, repositórios, banco de dados, clientes externos (SimBrief, clima)
        ↓
SkyBridge.Domain          → entidades e regras de negócio puras
```

- **Repository + Unit of Work**: toda operação de banco passa por repositórios com contrato definido no Domain.
- **Result&lt;T&gt;**: erros de negócio esperados (ex: "rating insuficiente para essa rota") não usam exception — viram resposta `400` de forma previsível.
- **Domain Service isolado**: a regra de pontuação/penalidade de pouso (`LandingEvaluator`) não depende de banco nem de API — testável isoladamente.
- **FluentValidation**: um filtro global valida qualquer DTO automaticamente antes de chegar na regra de negócio.
- **Suíte de testes**: testes unitários (xUnit + NSubstitute) e de integração via `WebApplicationFactory` com SQLite em memória, cobrindo Domain, Application e os fluxos HTTP reais.

### Frontend — Angular (standalone components, zoneless)

Aplicação Angular própria, sem framework de UI de terceiros — componentes standalone, `signal`/`computed` para estado, interceptor HTTP com **renovação automática de token** (refresh transparente em qualquer 401), e mapas interativos com Leaflet.

## ✈️ Funcionalidades

### Booking — reserva de voo em 5 etapas
1. **Aeronave**: escolhe companhia, rota e aeronave da frota (com validação de compatibilidade — a aeronave precisa suportar o tipo de operação da rota)
2. **Perfil**: define o perfil de aeronave usado no SimBrief
3. **Alternados**: até 4 aeroportos alternados, com consulta de METAR/TAF em tempo real (API aviationweather.gov)
4. **Configurar**: gera o plano de voo direto no SimBrief (URL de dispatch pré-preenchida) e confirma o OFP de volta via API pública do SimBrief
5. **Briefing**: resumo completo do voo (Flight Info, Flight Plan Summary, Load Sheet, Route), mapa com origem/destino/alternado plotados, e os controles de Iniciar Voo / Enviar PIREP

Um piloto só pode ter uma reserva ativa por vez, e cada reserva expira automaticamente em 24h se não for concluída.

### Automação por telemetria (sem preenchimento manual de PIREP)
O app cliente **ACARS** lê o simulador via FSUIPC e envia posição, altitude, velocidade, taxa de descida e status "no solo" a cada 5 segundos. O backend usa isso para:
- Detectar decolagem e touchdown automaticamente, capturando a taxa de descida real no pouso — a transição de estado (no ar/no solo) só é confirmada após um período mínimo de leituras consecutivas, evitando falsos positivos por ruído momentâneo de telemetria
- Detectar quando a aeronave para no gate (velocidade ~0 por 30s) e liberar o botão "Enviar PIREP"
- Validar que o piloto está realmente no aeroporto de partida (com telemetria recente) antes de liberar "Iniciar Voo"
- Calcular as horas de voo reais (decolagem → touchdown) para o PIREP, sem input manual

### Continuidade de localização & Jumpseat
O piloto tem uma localização atual rastreada pelo sistema (definida no primeiro login, atualizada a cada PIREP concluído). Criar uma reserva a partir de um aeroporto diferente de onde o piloto está exige um **Jumpseat** — reposicionamento gratuito e instantâneo até o aeroporto de origem da rota escolhida.

### Base de dados real (OpenFlights)
O mundo do SkyBridge é povoado com dados reais importados do dataset público [OpenFlights](https://github.com/jpatokal/openflights): **1.083 companhias aéreas ativas**, **7.692 aeroportos** com coordenadas próprias, **63.758 rotas diretas** (com distância calculada via haversine e tipo de operação classificado automaticamente) e **2.354 aeronaves** distribuídas pela frota histórica de 453 companhias. Todo import é feito via CSV pela tela de Admin, com feedback linha a linha (sucesso/erro) — o mesmo mecanismo funciona tanto para pequenos lotes de teste quanto para os arquivos completos.

### Base de aeroportos própria
Nova entidade `Airport`, populada via o import acima, com ICAO, IATA, nome, cidade, país e coordenadas. Suas coordenadas alimentam o mapa ao vivo (Dashboard) e os pins de origem/destino/alternado do Briefing — a consulta ao METAR deixou de ser a fonte de coordenadas (usada só para dados reais de clima) e virou apenas um fallback para o raro aeroporto ainda não cadastrado na base própria.

### Perfil do piloto
Página de perfil com histórico completo de voos (rota, companhia, aeronave, status, clicável para ver o detalhe completo com mapa da trilha e log de eventos do voo), e conquistas organizadas em três blocos por origem — **Staff** (concedida automaticamente ao virar Admin), **Patentes** (concedida automaticamente a cada promoção de rank em qualquer companhia) e **Tours** (concedida ao completar um Tour).

### Flight Recorder
Cada ponto de telemetria recebido durante um voo em andamento é persistido (não só mantido em memória), incluindo posição, altitude, velocidade, atitude (pitch/bank), flaps, spoilers, trem de pouso, squawk, frequência de rádio ativa e nome da aeronave carregada no simulador. Esses logs alimentam:
- A tela de aprovação de PIREPs no Admin, com mapa da trilha completa do voo e um log de eventos discretos gerado automaticamente a partir dos pontos brutos (decolagem, mudanças de flap/gear, touchdown, cruzeiro, aproximação, pouso)
- A mesma visão, disponível para qualquer piloto ver voos passados — os seus e os de outros pilotos da rede

### Aprovação de PIREPs (Admin)
Tela dedicada (`/admin/pireps`) com todos os PIREPs pendentes de aprovação — pousos fora do padrão operacional ficam retidos até um Admin revisar. Cada PIREP pode ser aberto numa tela de detalhe com o mapa da trilha voada e o log de eventos do voo antes de aprovar ou rejeitar (rejeição exige motivo, exibido depois para o piloto no seu histórico).

### Cancelamento de voo em andamento
Além de excluir uma reserva, o piloto pode cancelar um voo já em `EmVoo` sem precisar excluir o Booking — útil quando o simulador trava ou o ACARS perde conexão no meio do voo. O booking cancelado libera a regra de "1 reserva ativa por vez" sem apagar o histórico de telemetria já registrado.

### Dashboard enriquecido
Painel inicial com resumo enxuto do próprio piloto (rating, pontos, link para o perfil completo), estatísticas agregadas da rede (total de pilotos, voos aprovados, milhas voadas, Tours disponíveis, e PIREPs pendentes para Admins), Tours em destaque com progresso e botão de iniciar, mapa ao vivo e histórico de voos — cada voo agora abre a mesma tela de detalhe completa (mapa da trilha + log de eventos) usada no Perfil e no Admin, tornando os voos da rede públicos para qualquer piloto autenticado ver.

### Módulo de Tours (CRUD completo)
Criação, edição e exclusão de Tours pelo Admin (`/admin/tours`), com etapas dinâmicas que podem cruzar múltiplas companhias, upload real de imagem (foto do Tour e foto de capa) e vínculo opcional com uma Award de conclusão.

### Awards (CRUD completo)
Criação, edição e exclusão de Awards pelo Admin (`/admin/awards`), com upload real de imagem. Awards continuam sendo concedidas automaticamente por Patente e Staff, ou manualmente ao completar um Tour.

### Upload de imagens
Endpoint genérico de upload (`POST /api/Uploads/imagem`, restrito a Admin) salva arquivos em `wwwroot/uploads` e retorna uma URL pública — usado hoje por Tours e Awards.

### Mapa ao vivo
Dashboard com todos os voos ativos da rede em tempo real (posição, ícone por categoria de aeronave — monomotor, bimotor, executivo, regional, narrowbody, widebody), com origem/destino plotados ao clicar em qualquer avião. O Briefing individual mostra a trilha percorrida pela própria aeronave durante o voo.

### Admin — CRUD completo
- Cadastro, edição e exclusão de companhias (com bandeira do país via `flag-icons`, dropdown de país searchável), aeronaves e rotas
- Tabela de rotas por companhia, paginada e com busca
- Importação em massa via CSV para companhias, aeronaves, rotas e aeroportos

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
- **Callsign de voo**: livre (o piloto escolhe o número), mas precisa começar com o prefixo ICAO real da companhia.
- **Tours e Awards**: sequências de voos definidas (podendo cruzar várias companhias), com progresso avançado automaticamente a cada PIREP aprovado. Ao completar todas as etapas, o piloto ganha um bônus de pontos e uma conquista (Award) exibida no seu perfil.
- **Aprovação de PIREP**: pousos muito fortes ficam pendentes até um admin aprovar ou rejeitar (rejeitar desfaz os pontos/rating aplicados no envio).
- **Detecção de decolagem/pouso resiliente a ruído**: em vez de confiar na primeira leitura de telemetria que indica a mudança de estado, o sistema exige que o novo estado (no ar / no solo) se mantenha por um período mínimo de confirmação antes de registrar o evento.

## 🔐 Autenticação

- **JWT** (access token de 30 min) + **refresh token** de 7 dias, com **rotação** (o token antigo é revogado a cada uso — reuso é bloqueado com `401`).
- **Renovação automática no frontend**: um interceptor Angular detecta qualquer `401`, renova o token em segundo plano e repete a requisição original — o piloto nunca precisa relogar manualmente.
- Todo PIREP e ação de piloto usa o **`PilotId` extraído do token**, nunca do corpo da requisição — impossível agir em nome de outro piloto.
- Papéis (Admin/Piloto): ações administrativas (cadastro/edição/exclusão de companhias, aeronaves, rotas, aeroportos, Tours, Awards e upload de imagens) exigem `role=Admin`.

## 🛠️ Tecnologias

**Backend**
- **.NET 10** / C# 13
- **Entity Framework Core 10** + SQL Server (LocalDB em desenvolvimento), com Migrations
- ASP.NET Core Web API, Clean Architecture (4 projetos + suíte de testes)
- **FluentValidation** para validação de entrada
- **JWT Bearer** + BCrypt (hash de senha) + refresh token com rotação
- **xUnit + FluentAssertions + NSubstitute** para testes unitários; `WebApplicationFactory` + SQLite em memória para testes de integração
- Swashbuckle / Swagger UI para documentação e testes da API
- Integrações externas: **SimBrief** (dispatch + fetch de OFP) e **aviationweather.gov** (METAR/TAF)

**Frontend**
- **Angular** (standalone components, zoneless change detection)
- **Leaflet** para mapas interativos (rastreamento ao vivo, rotas, pins de aeroporto)
- **flag-icons** para bandeiras de país
- Tailwind CSS (utilitário, tema escuro customizado)

**ACARS (app cliente de telemetria)**
- Console app em C# usando **FSUIPCClientDLL**, compatível com FSUIPC7 (MSFS 2020/2024). Lê posição, altitude, velocidade, V/S, atitude (pitch/bank), flaps, spoilers, trem de pouso, squawk, frequência de rádio ativa e nome da aeronave, e envia para a API a cada 5 segundos.

**Dados**
- [OpenFlights](https://github.com/jpatokal/openflights) — dataset público usado como base para o seed de companhias, aeroportos, rotas e frotas reais.

## 🚀 Como rodar localmente

### Pré-requisitos
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js](https://nodejs.org/) + Angular CLI
- SQL Server LocalDB (ou uma instância própria de SQL Server)

### Backend

```bash
git clone https://github.com/alexandrefgs/skybridge-network.git
cd skybridge-network
dotnet restore
dotnet build
dotnet run --project src/SkyBridge.Api
```

A API sobe com o Swagger direto na raiz (`http://localhost:5202`). O banco é criado/atualizado automaticamente via Migrations na primeira execução, já com o seed de companhias reais cobrindo os tipos de operação Nacional, Regional, Internacional, Executivo e Cargueiro.

### Frontend

```bash
cd web
npm install
ng serve
```

Acesse em `http://localhost:4200`.

### ACARS (telemetria)

```bash
cd src/SkyBridge.Acars
dotnet run
```

Requer o FSUIPC7 instalado e conectado ao simulador, e login com uma conta de piloto já cadastrada no site.

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
│   │   ├── Repositories/
│   │   ├── ExternalServices/    # clientes SimBrief e aviationweather.gov
│   │   └── Live/                # store em memória dos voos ativos
│   ├── SkyBridge.Api/
│   │   ├── Controllers/
│   │   ├── Filters/
│   │   ├── Middleware/
│   │   └── wwwroot/uploads/     # imagens enviadas (Tours, Awards)
│   └── SkyBridge.Acars/         # app cliente de telemetria (FSUIPC)
├── web/                         # frontend Angular
│   └── src/app/
│       ├── core/                # services, models, interceptors, data
│       ├── features/            # telas (booking, admin, companhias, dashboard...)
│       └── shared/               # componentes compartilhados (header)
├── tests/
│   └── SkyBridge.Tests/
│       ├── Domain/
│       ├── Application/
│       └── Integration/
└── SkyBridge.slnx
```

## 🗺️ Roadmap

- [x] Clean Architecture (Domain/Application/Infrastructure/Api)
- [x] Autenticação JWT com refresh token, rotação e renovação automática no frontend
- [x] Migrations do EF Core
- [x] Aprovação/rejeição de PIREPs pendentes, com tela dedicada no Admin (mapa da trilha + log de eventos do voo)
- [x] Validação de entrada com FluentValidation
- [x] Módulo de Tours e Awards com progresso automático
- [x] Awards automáticas por Patente (a cada promoção de rank) e por Staff (ao virar Admin)
- [x] Papéis de usuário (Admin/Piloto), restringindo ações administrativas
- [x] Frontend Angular completo
- [x] Admin: CRUD de companhias/aeronaves/rotas, com importação em massa via CSV
- [x] Booking: reserva de voo em 5 etapas com integração real ao SimBrief
- [x] App cliente ACARS (MSFS via FSUIPC7), com telemetria estendida (atitude, flaps, spoilers, trem, squawk, frequência de rádio, nome da aeronave)
- [x] Automação de detecção de pouso e envio de PIREP via telemetria
- [x] Flight Recorder — persistência de cada ponto de telemetria do voo (não só em memória)
- [x] Mapa ao vivo com rastreamento de todos os voos da rede
- [x] Continuidade de localização do piloto + Jumpseat
- [x] Cancelamento de voo em andamento (sem precisar excluir a reserva)
- [x] Perfil do piloto com histórico de voos e conquistas por categoria
- [x] Dashboard com estatísticas da rede, resumo do piloto e Tours em destaque
- [x] Tela de criação, edição e exclusão de Tours no Admin
- [x] CRUD completo de Awards no Admin, com upload de imagem
- [x] Upload real de imagem (foto de tour/award) via endpoint próprio
- [x] Detecção de decolagem/pouso exigindo confirmação por tempo mínimo (evita falso positivo por ruído de telemetria)
- [x] Voos da rede públicos para qualquer piloto (mapa da trilha + log completo)
- [x] Base de aeroportos própria (dataset OpenFlights), substituindo a dependência do METAR para coordenadas
- [x] Import em massa de companhias, rotas e aeronaves reais (dataset OpenFlights), escalando além do seed inicial
- [ ] Integração de verdade com VATSIM e IVAO (aguardando confirmação do schema JSON do SimBrief)
- [ ] Preencher campos de Flight Plan Summary / Load Sheet do Briefing com dados reais do SimBrief (aguardando o mesmo schema)
- [ ] Mapa de rotas interativo na tela de Nova Reserva
- [ ] X-Plane (XPUIPC) e P3D (FSUIPC6) no ACARS
- [ ] Cadastro de piloto inativo automaticamente após 90 dias sem voo, com e-mail disparado para o RH
- [ ] Continuidade de localização aplicada também a Tours
- [ ] Curadoria manual da frota importada (marcar aeronaves que a companhia não opera mais como "Retro")
- [ ] Tela de edição/exclusão de aeronaves no Admin (hoje só é possível criar)

## 📄 Licença

Projeto pessoal, desenvolvido para fins de portfólio e aprendizado.