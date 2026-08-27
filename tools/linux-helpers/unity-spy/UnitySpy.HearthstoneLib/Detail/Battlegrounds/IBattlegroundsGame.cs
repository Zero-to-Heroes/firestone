namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;
    using System.Collections.Generic;

    [PublicAPI]
    public interface IBattlegroundsGame
    {
        IReadOnlyList<IBattlegroundsPlayer> Players { get; }

        IReadOnlyList<int> AvailableRaces { get;  }
    }
}