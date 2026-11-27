FROM node:22-alpine AS web
WORKDIR /web
COPY skybridge-web/package.json skybridge-web/package-lock.json ./
RUN npm ci
COPY skybridge-web/ ./
RUN npx ng build --configuration production

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api
WORKDIR /src
COPY SkyBridge.slnx ./
COPY src/SkyBridge.Domain/SkyBridge.Domain.csproj src/SkyBridge.Domain/
COPY src/SkyBridge.Application/SkyBridge.Application.csproj src/SkyBridge.Application/
COPY src/SkyBridge.Infrastructure/SkyBridge.Infrastructure.csproj src/SkyBridge.Infrastructure/
COPY src/SkyBridge.Api/SkyBridge.Api.csproj src/SkyBridge.Api/
RUN dotnet restore src/SkyBridge.Api/SkyBridge.Api.csproj
COPY src/ src/
RUN dotnet publish src/SkyBridge.Api/SkyBridge.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=api /app ./
COPY --from=web /web/dist/skybridge-web/browser ./wwwroot
RUN mkdir /keys && chown $APP_UID /keys
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "SkyBridge.Api.dll"]