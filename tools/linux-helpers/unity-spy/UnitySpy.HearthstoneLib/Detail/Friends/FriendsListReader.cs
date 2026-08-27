namespace HackF5.UnitySpy.HearthstoneLib.Detail.Friends
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    internal static class FriendsListReader
    {
        public static bool ReadFriendsListOpen([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            try
            {
                var frame = image["ChatMgr"]?["s_instance"]?["m_friendListFrame"];
                return frame != null;
            } 
            catch (Exception e)
            {
                // Don't log the error to avoid triggering memory reading resets
                //Logger.Log("Exception in ReadFriendsListOpen");
                return false;
            }
        }
    }
}
