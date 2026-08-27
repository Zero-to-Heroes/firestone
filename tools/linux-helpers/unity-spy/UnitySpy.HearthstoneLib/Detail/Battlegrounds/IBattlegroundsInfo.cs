namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IBattlegroundsInfo
    {
        int Rating { get; }

        int NewRating { get; }

        IBattlegroundsGame Game { get; }
    }
}