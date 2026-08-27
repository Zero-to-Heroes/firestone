namespace HackF5.UnitySpy.HearthstoneLib
{
    using System.Collections.Generic;
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IAdventuresInfo
    {
        IReadOnlyList<IGuestHero> GuestHeroesInfo { get; }
        IReadOnlyList<IAdventureTreasureInfo> HeroPowersInfo { get; }
        IReadOnlyList<IAdventureTreasureInfo> LoadoutTreasuresInfo { get; }
    }
}
