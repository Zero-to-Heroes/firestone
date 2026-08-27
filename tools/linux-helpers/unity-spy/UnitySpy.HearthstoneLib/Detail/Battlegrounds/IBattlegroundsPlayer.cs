namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;
    using System.Collections.Generic;

    [PublicAPI]
    public interface IBattlegroundsPlayer
    {
        int Id { get; }
        
        int EntityId { get; }

        string CardId { get; }

        string Name { get; }

        int MaxHealth { get; }
        
        int Damage { get; }

        int LeaderboardPosition { get; }

        int TriplesCount { get; }

        int TechLevel { get; }

        int WinStreak { get; }

        int BoardCompositionRace { get; }

        int BoardCompositionCount { get; }

        IReadOnlyList<IBgsBattleHistory> Battles { get; }

    }


    [PublicAPI]
    public interface IBgsBattleHistory
    {
        string OwnerCardId { get; }

        string OpponentCardId { get; }

        int Damage { get; }

        bool IsDefeated { get; }
    }
}