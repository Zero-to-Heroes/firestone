// ReSharper disable IdentifierTypo
namespace HackF5.UnitySpy.HearthstoneLib
{
    using System.Collections.Generic;
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IDungeonInfoCollection : IReadOnlyDictionary<DungeonKey, IDungeonInfo>
    {
    }
}
