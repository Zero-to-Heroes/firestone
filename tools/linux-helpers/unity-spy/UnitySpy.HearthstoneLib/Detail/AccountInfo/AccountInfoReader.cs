namespace HackF5.UnitySpy.HearthstoneLib.Detail.AccountInfo
{
    using System;
    using System.Collections.Generic;
    using HackF5.UnitySpy.HearthstoneLib;
    using JetBrains.Annotations;

    internal static class AccountInfoReader
    {
        public static AccountInfo ReadAccountInfo([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var service = image["BnetPresenceMgr"]?["s_instance"];
            var account = service?["m_myGameAccountId"]?["<EntityId>k__BackingField"];
            if (account == null)
            {
                return null;
            }
            var battleTagObj = service["m_myPlayer"]?["m_account"]?["m_battleTag"];
            var playerName = battleTagObj?["m_name"];
            var playerNumber = battleTagObj?["m_number"];
            return new AccountInfo { 
                Hi = account["high_"], 
                Lo = account["low_"],
                BattleTag = playerName + "#" + playerNumber,
            };
        }
        
        public static BnetRegion? ReadCurrentRegion([NotNull] HearthstoneImage image)
        {
            var service = image.GetService("Network");
            var networkState = service?["m_state"];
            if (networkState == null)
            {
                return null;
            }

            var region = networkState["<CachedRegion>k__BackingField"];
            if (region == null || region <= 0)
            {
                return null;
            }
            return (BnetRegion)region;
        }
    }
}
