namespace HackF5.UnitySpy.HearthstoneLib.Detail.DungeonInfo
{
    internal class FullDungeonInfo : IFullDungeonInfo
    {
        public IDungeonInfo DungeonRun { get; set; }

        public IDungeonInfo MonsterHunt { get; set; }

        public IDungeonInfo RumbleRun { get; set; }

        public IDungeonInfo DalaranHeist { get; set; }

        public IDungeonInfo DalaranHeistHeroic { get; set; }

        public IDungeonInfo TombsOfTerror { get; set; }

        public IDungeonInfo TombsOfTerrorHeroic { get; set; }
    }
}
