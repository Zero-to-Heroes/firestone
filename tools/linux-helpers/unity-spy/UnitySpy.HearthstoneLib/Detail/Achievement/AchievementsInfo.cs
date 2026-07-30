namespace HackF5.UnitySpy.HearthstoneLib.Detail.Achievement
{
    using System.Collections.Generic;
    
    public class AchievementsInfo : IAchievementsInfo
    {
        public IReadOnlyList<IAchievementInfo> Achievements { get; set; }
    }

    public class AchievementCategory
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Icon { get; set; }
        public AchievementCategoryStats Stats { get; set; }
    }

    public class AchievementCategoryStats
    {
        public int AvailablePoints { get; set; }
        public int Points { get; set; }
        public int CompletedAchievements { get; set; }
        public int TotalAchievements { get; set; }
        public int Unclaimed { get; set; }

    }
}