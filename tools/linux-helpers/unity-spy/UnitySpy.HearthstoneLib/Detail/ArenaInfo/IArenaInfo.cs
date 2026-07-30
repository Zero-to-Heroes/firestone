using HackF5.UnitySpy.HearthstoneLib.Detail.ArenaInfo;
using System.Collections.Generic;

namespace HackF5.UnitySpy.HearthstoneLib
{
    public interface IArenaInfo
    {
        int Wins { get; }

        int Losses { get; }

        string HeroCardId { get; }

        IDeck Deck { get; }

        IReadOnlyList<IRewardInfo> Rewards { get; }
    }
}
