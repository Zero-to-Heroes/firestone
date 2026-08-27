namespace HackF5.UnitySpy.HearthstoneLib.Detail.RewardTrack
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    internal static class RewardTrackInfoReader
    {
        public static RewardTrackInfos ReadRewardTrack([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var service = image.GetService("Hearthstone.Progression.RewardTrackManager");
            if (service == null)
            {
                return null;
            }

            var entries = service["m_rewardTrackEntries"];
            var count = entries["_count"];
            // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
            var entryItems = count > 0 ? entries["_entries"] : null;
            var trackInfos = new List<RewardTrackInfo>();
            for (var i = 0; i < count; i++)
            {
                var trackModel = entryItems[i]?["value"]?["<TrackDataModel>k__BackingField"];
                if (trackModel == null)
                {
                    continue;
                }
                trackInfos.Add(new RewardTrackInfo
                {
                    TrackType = trackModel["m_RewardTrackType"],
                    Season = trackModel["m_Season"],
                    Level = trackModel["m_Level"],
                    TotalXp = trackModel["m_TotalXp"],
                    Xp = trackModel["m_Xp"],
                    XpNeeded = trackModel["m_XpNeeded"],
                    XpBonusPercent = trackModel["m_XpBonusPercent"],
                });
            }


            return new RewardTrackInfos
            {
                TrackEntries = trackInfos,
            };
        }

        public static bool HasXpChanges([NotNull] HearthstoneImage image)
        {
            var result = new List<XpChange>();
            var service = image.GetService("Hearthstone.Progression.RewardXpNotificationManager");
            if (service == null)
            {
                return false;
            }

            dynamic xpChanges = service["m_xpChanges"];
            if (xpChanges == null)
            {
                return false;
            }

            var size = xpChanges["_size"];
            if (size == 0)
            {
                return false;
            }

            return true;
        }
    }
}
