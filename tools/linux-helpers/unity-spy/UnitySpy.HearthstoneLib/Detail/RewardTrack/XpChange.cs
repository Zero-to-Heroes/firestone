namespace HackF5.UnitySpy.HearthstoneLib.Detail.RewardTrack
{
    public class XpChange
    {
        public int RewardTrackType { get; set; }
        public int XpGained { get; set; }
        public int XpBonusPercent { get; set; }
        public int CurrentLevel { get; set; }
        public int CurrentTotalXp { get; set; }
        public int CurrentXpInLevel { get; set; }
        public int CurrentXpNeededForLevel { get; set; }

        override
        public bool Equals(object obj)
        {
            if (!(obj is XpChange))
            {
                return false;
            }

            var other = obj as XpChange;
            if (other == null)
            {
                return false;
            }

            return this.RewardTrackType == other.RewardTrackType
                && this.XpGained == other.XpGained
                && this.XpBonusPercent == other.XpBonusPercent
                && this.CurrentLevel == other.CurrentLevel
                && this.CurrentTotalXp == other.CurrentTotalXp
                && this.CurrentXpInLevel == other.CurrentXpInLevel
                && this.CurrentXpNeededForLevel == other.CurrentXpNeededForLevel;
        }
    }
}