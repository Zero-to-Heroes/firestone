namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IRank
    {
        int LeagueId { get; }

        int RankValue { get; }

        int LegendRank { get; }

        int StarLevel { get; }

        int SeasonId { get; }
    }
}