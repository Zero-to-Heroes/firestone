
namespace HackF5.UnitySpy.HearthstoneLib
{
    using System.Collections.Generic;

    public interface IBoostersInfo
    {
        IReadOnlyList<IBoosterStack> Boosters { get; }
    }
}
