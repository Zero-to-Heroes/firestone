
namespace HackF5.UnitySpy.HearthstoneLib
{
    using System.Collections.Generic;

    public interface IOpenPacksInfo
    {
        int LastOpenedBoosterId { get; }

        IReadOnlyList<IBoosterStack> UnopenedPacks { get; }

        IPackOpening PackOpening { get; }
    }
}
