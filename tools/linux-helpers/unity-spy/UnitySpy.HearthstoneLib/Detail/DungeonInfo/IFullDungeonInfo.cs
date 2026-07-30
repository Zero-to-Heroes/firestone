namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IFullDungeonInfo
    {
        IDungeonInfo DungeonRun { get; }

        IDungeonInfo MonsterHunt { get; }

        IDungeonInfo RumbleRun { get; }

        IDungeonInfo DalaranHeist { get; }

        IDungeonInfo DalaranHeistHeroic { get; }

        IDungeonInfo TombsOfTerror { get; }

        IDungeonInfo TombsOfTerrorHeroic { get; }
    }
}
