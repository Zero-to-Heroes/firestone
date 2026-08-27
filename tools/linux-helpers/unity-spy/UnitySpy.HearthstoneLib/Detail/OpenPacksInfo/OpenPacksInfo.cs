namespace HackF5.UnitySpy.HearthstoneLib.Detail.OpenPacksInfo
{
    using System.Collections.Generic;
    using HackF5.UnitySpy.HearthstoneLib;

    internal class OpenPacksInfo : IOpenPacksInfo
    {
        public int LastOpenedBoosterId { get; set; }

        public IReadOnlyList<IBoosterStack> UnopenedPacks { get; set; }

        public IPackOpening PackOpening { get; set; }
    }
}
