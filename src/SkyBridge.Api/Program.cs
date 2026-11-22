using SkyBridge.Api.OpenApi;
using SkyBridge.Infrastructure;
using SkyBridge.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi(options => options.AddDocumentTransformer<BearerSecuritySchemeTransformer>());
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    await DatabaseInitializer.InitializeAsync(app.Services);
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "SkyBridge API");
        options.EnablePersistAuthorization();
    });
    app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();