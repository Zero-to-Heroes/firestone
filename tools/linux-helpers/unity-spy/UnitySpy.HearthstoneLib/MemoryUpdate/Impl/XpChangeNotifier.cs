using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
using HackF5.UnitySpy.HearthstoneLib.Detail.RewardTrack;
using System;
using System.Collections.Generic;
using System.Linq;

namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    public class XpChangeNotifier
    {
        private RewardTrackInfos lastRewardTrackInfos;
        private bool lastHasXpChanges;

        private bool sentExceptionMessage = false;

        internal void HandleXpChange(MindVision mindVision, MemoryUpdateResult result, SceneModeEnum? currentScene)
        {
            if (currentScene != SceneModeEnum.GAMEPLAY)
            {
                return;
            }

            try
            {
                // TODO: maybe use the actual info from XpChange to exclude Xp gains caused by quest completion?
                var hasXpChanges = mindVision.HasXpChanges();
                if (lastRewardTrackInfos == null || (hasXpChanges && !lastHasXpChanges))
                {
                    //Logger.Log($"Got xp changes {lastRewardTrackInfos != null}");
                    var rewardTrackInfos = mindVision.GetRewardTrackInfo();
                    //Logger.Log($"Reward Track Info {rewardTrackInfos?.TrackEntries?.Count}");
                    //Logger.Log($"Previous {lastRewardTrackInfos?.TrackEntries?.Count}");
                    if ((lastRewardTrackInfos?.TrackEntries?.Count ?? 0) > 0 && (rewardTrackInfos?.TrackEntries?.Count ?? 0) > 0)
                    {
                        var xpChanges = BuildXpChanges(rewardTrackInfos, lastRewardTrackInfos);
                        result.HasUpdates = true;
                        result.XpChanges = xpChanges;
                    }
                    lastRewardTrackInfos = rewardTrackInfos;
                }
                lastHasXpChanges = hasXpChanges;
                sentExceptionMessage = false;
            }
            catch (Exception e)
            {
                if (!sentExceptionMessage)
                {
                    Logger.Log("Exception in XpChangeNotifier memory read " + e.Message + " " + e.StackTrace);
                    sentExceptionMessage = true;
                }
            }
        }

        private IReadOnlyList<XpChange> BuildXpChanges(RewardTrackInfos newTracksInfo, RewardTrackInfos previousTracksInfo)
        {
            var changes = new List<XpChange>();

            foreach (var track in newTracksInfo.TrackEntries)
            {
                var trackType = track.TrackType;
                var previousTrack = previousTracksInfo.TrackEntries.FirstOrDefault(t => t.TrackType == trackType);

                var xpGain = track.TotalXp - (previousTrack?.TotalXp ?? 0);
                //Logger.Log($"XP Gain {xpGain}, {track.TotalXp}, {previousTrack?.TotalXp} for {trackType}");
                if (xpGain == 0)
                {
                    continue;
                }

                changes.Add(new XpChange()
                {
                    RewardTrackType = trackType,
                    CurrentLevel = track.Level,
                    CurrentTotalXp = track.TotalXp,
                    CurrentXpInLevel = track.Xp,
                    CurrentXpNeededForLevel = track.XpNeeded,
                    XpBonusPercent = track.XpBonusPercent,
                    XpGained = xpGain,
                });
            }

            return changes;
        }
    }
}