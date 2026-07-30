namespace HackF5.UnitySpy.HearthstoneLib.Detail
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    internal static class Sanity
    {
        public static bool IsRunning([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                return false;
            }

            return image["SceneMgr"]["s_instance"] != null && image["CollectionManager"]["s_instance"] != null;
        }
    }
}
