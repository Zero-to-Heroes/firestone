namespace HackF5.UnitySpy.HearthstoneLib
{
    using System.Collections.Generic;

    public interface IMercenariesPendingTreasureSelection
    {
        int MercenaryId { get; }

        IReadOnlyList<int> Options { get; }
    }
}
