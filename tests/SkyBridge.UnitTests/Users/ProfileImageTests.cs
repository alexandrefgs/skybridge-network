using System.Text;
using SkyBridge.Domain.Users;

namespace SkyBridge.UnitTests.Users;

public class ProfileImageTests
{
    [Fact]
    public void DetectContentType_RecognizesPng()
    {
        byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00];

        Assert.Equal("image/png", ProfileImage.DetectContentType(png));
    }

    [Fact]
    public void DetectContentType_RecognizesJpeg()
    {
        byte[] jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10];

        Assert.Equal("image/jpeg", ProfileImage.DetectContentType(jpeg));
    }

    [Fact]
    public void DetectContentType_RecognizesWebp()
    {
        var webp = Encoding.ASCII.GetBytes("RIFF\0\0\0\0WEBPVP8 ");

        Assert.Equal("image/webp", ProfileImage.DetectContentType(webp));
    }

    [Theory]
    [InlineData("GIF89a")]
    [InlineData("<svg xmlns=\"http://www.w3.org/2000/svg\"/>")]
    [InlineData("RIFF\0\0\0\0WAVE")]
    [InlineData("")]
    public void DetectContentType_RejectsOtherFiles(string content)
    {
        Assert.Null(ProfileImage.DetectContentType(Encoding.ASCII.GetBytes(content)));
    }
}