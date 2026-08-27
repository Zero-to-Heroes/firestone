namespace HackF5.UnitySpy.HearthstoneLib.Detail.DungeonInfo
{
    using System.Collections.Generic;

    internal class DungeonInfo : IDungeonInfo
    {
        public DungeonKey Key { get; set; }
        public IReadOnlyList<int> DeckCards { get; set; }
        public IReadOnlyList<int> DeckList { get; set; }
        public IReadOnlyList<IDungeonOptionBundle> LootOptionBundles { get; set; }
        public int ChosenLoot { get; set; }
        public IReadOnlyList<int> TreasureOption { get; set; }
        public int ChosenTreasure { get; set; }
        public int RunActive { get; set; }
        public int RunRetired { get; set; }
        //public int Wins { get; set; }
        //public int Losses { get; set; }
        public int SelectedDeck { get; set; }
        public int StartingTreasure { get; set; }
        public int StartingHeroPower { get; set; }
        public int HeroCardId { get; set; }
        public int PlayerClass { get; set; }
        public int ScenarioId { get; set; }
    }
}
