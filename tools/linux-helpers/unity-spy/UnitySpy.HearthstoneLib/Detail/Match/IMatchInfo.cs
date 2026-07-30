namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IMatchInfo
    {
        int BrawlSeasonId { get; }

        GameFormat FormatType { get; }

        GameType GameType { get; }

        IPlayer LocalPlayer { get; }

        int MissionId { get; }

        int BoardDbId { get; }

        IPlayer OpposingPlayer { get; }

        bool Spectator { get; }
    }
}