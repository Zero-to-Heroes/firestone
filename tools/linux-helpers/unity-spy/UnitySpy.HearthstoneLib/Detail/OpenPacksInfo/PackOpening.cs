namespace HackF5.UnitySpy.HearthstoneLib.Detail.OpenPacksInfo
{
    using System.Collections.Generic;
    using HackF5.UnitySpy.HearthstoneLib;

    internal class PackOpening : IPackOpening
    {
        public int CardsPendingReveal { get; set; }

        public IList<IPackCard> Cards { get; set; }

        public int NumberOfPacks { get; set; }
    }
}
