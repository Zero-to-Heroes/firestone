namespace HackF5.UnitySpy.HearthstoneLib
{
    using System.Collections.Generic;
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IGuestHero
    {
        int Id { get; set; }
        int CardDbfId { get; set; }
    }
}
