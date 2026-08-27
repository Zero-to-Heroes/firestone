namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IMercenariesInfo
    {
        int PvpRating { get; }

        IMercenariesMap Map { get; }
    }
}
