namespace HackF5.UnitySpy.HearthstoneLib.Detail.GameState
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    internal static class GameStateReader
    {
        public static string ReadGameUniqueId([NotNull] HearthstoneImage image)
        {
            return image["GameState"]?["s_instance"]?["m_gameEntity"]?["<Uuid>k__BackingField"];
        }
    }
}
