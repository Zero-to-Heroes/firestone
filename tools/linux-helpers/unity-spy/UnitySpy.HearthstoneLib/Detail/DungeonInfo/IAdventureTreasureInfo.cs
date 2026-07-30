namespace HackF5.UnitySpy.HearthstoneLib
{
    using System.Collections.Generic;
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IAdventureTreasureInfo
    {
        int Id { get; }
        int AdventureId { get; }
        int CardDbfId { get; }
        int HeroId { get; }
        bool Unlocked { get; }
    }
}
