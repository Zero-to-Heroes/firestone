using System.Collections.Generic;

namespace HackF5.UnitySpy.HearthstoneLib
{
    public interface IPackOpening
    {
        int CardsPendingReveal { get; }

        IList<IPackCard> Cards { get; }

        int NumberOfPacks { get; }

    }
}
