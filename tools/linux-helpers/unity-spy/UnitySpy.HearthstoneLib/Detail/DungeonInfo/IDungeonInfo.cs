namespace HackF5.UnitySpy.HearthstoneLib
{
    using System.Collections.Generic;
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IDungeonInfo
    {
        DungeonKey Key { get; }

        IReadOnlyList<int> DeckCards { get; }

        IReadOnlyList<int> DeckList { get; }

        IReadOnlyList<IDungeonOptionBundle> LootOptionBundles { get; }

        int ChosenLoot { get; }

        IReadOnlyList<int> TreasureOption { get; }

        int ChosenTreasure { get; }

        int RunActive { get; }

        int SelectedDeck { get; }

        int HeroCardId { get; }
        
        int StartingTreasure { get; }

        int StartingHeroPower { get; }

        int PlayerClass { get; }

        int ScenarioId { get; }
    }
}
