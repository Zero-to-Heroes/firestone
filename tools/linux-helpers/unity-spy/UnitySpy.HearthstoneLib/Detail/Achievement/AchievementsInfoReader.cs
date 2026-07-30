namespace HackF5.UnitySpy.HearthstoneLib.Detail.Achievement
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using HackF5.UnitySpy.Crawler;
    using JetBrains.Annotations;

    internal static class AchievementsInfoReader
    {
        public static int? ReadNumberOfCompletedAchievements([NotNull] HearthstoneImage image)
        {
            var manager = image.GetService("Hearthstone.Progression.AchievementManager");
            return manager?["m_completedAchievements"]?["m_list"]?["_size"];
        }



        public static IList<AchievementCategory> ReadAchievementCategories([NotNull] HearthstoneImage image)
        {
            var manager = image.GetService("Hearthstone.Progression.AchievementManager");
            // Walk the chain once instead of three times: every segment is a live memory read.
            var list = manager?["m_categories"]?["_value"]?["m_Categories"]?["m_list"];
            if (list == null)
            {
                return null;
            }
            var size = list["_size"];
            var items = list["_items"];
            var result = new List<AchievementCategory>();
            for (int i = 0; i < size; i++)
            {
                var item = items[i];
                if (item == null)
                {
                    continue;
                }

                var stats = item["m_Stats"];

                result.Add(new AchievementCategory()
                {
                    Id = item["m_ID"],
                    Name = item["m_Name"],
                    Icon = item["m_Icon"],
                    Stats = new AchievementCategoryStats()
                    {
                        AvailablePoints = stats?["m_AvailablePoints"],
                        Points = stats?["m_Points"],
                        TotalAchievements = stats?["m_TotalAchievements"],
                        CompletedAchievements = stats?["m_CompletedAchievements"],
                        Unclaimed = stats?["m_Unclaimed"],
                    },
                });
            }

            return result;
        }

        public static IAchievementsInfo ReadAchievementsInfo([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var manager = image.GetService("Hearthstone.Progression.AchievementManager");
            if (manager == null || manager["m_playerState"] == null || manager["m_playerState"]["m_playerState"] == null)
            {
                return null;
            }

            var playerState = manager["m_playerState"]["m_playerState"];
            var count = playerState["count"];
            var values = playerState["valueSlots"];

            var achievements = new List<IAchievementInfo>();
            for (int i = 0; i < count; i++)
            {
                var info = values[i];
                var achievementInfo = new AchievementInfo()
                {
                    AchievementId = info["_AchievementId"],
                    Progress = info["_Progress"],
                    Status = info["_Status"],
                };
                achievements.Add(achievementInfo);
            }

            return new AchievementsInfo()
            {
                Achievements = achievements,
            };
        }

        public static List<AchievementDbf> ReadAchievementsDbf([NotNull] HearthstoneImage image)
        {
            var manager = image["GameDbf"]["Achievement"];
            if (manager == null)
            {
                return null;
            }

            var records = manager["m_records"];
            var size = records["_size"];
            var items = records["_items"];

            var achievements = new List<AchievementDbf>();
            for (int i = 0; i < size; i++)
            {
                var info = items[i];
                var achievementInfo = new AchievementDbf()
                {
                    AchievementId = info["m_ID"],
                    RewardTrackXp = info["m_rewardTrackXp"],
                };
                achievements.Add(achievementInfo);
            }

            return achievements;
        }

        public static IAchievementsInfo ReadInGameAchievementsProgressInfo([NotNull] HearthstoneImage image, int[] achievementIds)
        {
            var manager = image.GetService("Hearthstone.Progression.AchievementManager");
            if (manager == null || manager["m_achievementInGameProgress"] == null)
            {
                return null;
            }

            if (achievementIds == null || achievementIds.Length == 0)
            {
                return null;
            }

            var progressInfo = manager["m_achievementInGameProgress"];
            var count = progressInfo["_count"];
            var entries = progressInfo["_entries"]; 

            var achievements = new List<IAchievementInfo>();
            for (int i = 0; i < count; i++)
            {
                var entry = entries[i];
                var achievementId = entry["key"]; 
                if (Array.Exists(achievementIds, id => id == achievementId))
                {
                    var progress = entry["value"];
                    var achievementInfo = new AchievementInfo()
                    {
                        AchievementId = achievementId,
                        Progress = progress,
                        Index = i,
                    };
                    achievements.Add(achievementInfo);
                }
                if (achievements.Count == achievementIds.Length)
                {
                    break;
                }
            }

            return new AchievementsInfo()
            {
                Achievements = achievements,
            };
        }

        public static IAchievementsInfo ReadInGameAchievementsProgressInfoByIndex([NotNull] HearthstoneImage image, int[] indexes)
        {
            var manager = image.GetService("Hearthstone.Progression.AchievementManager");
            if (manager == null || manager["m_achievementInGameProgress"] == null)
            {
                return null;
            }

            if (indexes == null || indexes.Length == 0)
            {
                return null;
            }

            var progressInfo = manager["m_achievementInGameProgress"];
            var entries = progressInfo["_entries"];
            if (entries == null)
            {
                return null;
            }

            var achievements = new List<IAchievementInfo>();
            for (int i = 0; i < indexes.Length; i++)
            {
                try
                {
                    var index = indexes[i];
                    var entry = entries[index];
                    var achievementId = entry["key"];
                    var progress = entry["value"];
                    var achievementInfo = new AchievementInfo()
                    {
                        AchievementId = achievementId,
                        Progress = progress,
                        Index = index,
                    };
                    achievements.Add(achievementInfo);
                }
                catch (Exception ex)
                {
                    Logger.Log($"Could not get achievement info: {ex.Message}");
                }
            }

            return new AchievementsInfo()
            {
                Achievements = achievements,
            };
        }

        public static bool IsDisplayingAchievementToast([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var manager = image.GetService("Hearthstone.Progression.AchievementManager");
            //var debugState = manager["m_playerState"];
            //debugState.TypeDefinition
            if (manager == null || manager["m_achievementToast"] == null)
            {
                return false;
            }

            var toast = manager["m_achievementToast"];
            if (toast != null)
            {
                //processing = true;
                //TypeDefinitionContentViewModel model = new TypeDefinitionContentViewModel(manager.TypeDefinition);
                //List<string> dump = new List<string>();
                //var addresses = new List<uint>();
                //model.DumpMemory("", dump, addresses, manager);
                return true;
            }

            return false;
        }
    }
}