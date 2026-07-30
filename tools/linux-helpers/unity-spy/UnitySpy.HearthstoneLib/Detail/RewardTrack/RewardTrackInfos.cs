using System.Collections.Generic;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.RewardTrack
{
    public class RewardTrackInfos
    {
        public IReadOnlyList<RewardTrackInfo> TrackEntries { get; set; }
    }

    public class RewardTrackInfo { 
        public int TrackType { get; set; }
        public int Season { get; set; }
        public int Level { get; set; }
        public int TotalXp { get; set; }
        public int Xp { get; set; }
        public int XpNeeded { get; set; }
        public int XpBonusPercent { get; set; }

    }
}
