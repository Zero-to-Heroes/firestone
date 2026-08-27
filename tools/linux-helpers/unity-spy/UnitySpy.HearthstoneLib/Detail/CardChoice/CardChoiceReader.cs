namespace HackF5.UnitySpy.HearthstoneLib.Detail.CardChoice
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    internal static class CardChoiceReader
    {
        public static bool IsChoicesHidden([NotNull] HearthstoneImage image)
        {
            // Default to false if we can't access the info
            bool? value = null;
            return ((value = image["ChoiceCardMgr"]?["s_instance"]?["m_friendlyChoicesShown"]) == null) ? false : !value.Value;
        }
    }
}
