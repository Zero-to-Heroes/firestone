namespace HackF5.UnitySpy.HearthstoneLib.Detail.Quests
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    internal static class QuestsReader
    {
        public static QuestsLog ReadQuests([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var service = image.GetService("Hearthstone.Progression.QuestManager");
            if (service == null)
            {
                return null;
            }

            var questState = service["m_questState"];
            var count = questState["_count"];
            // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
            var entries = questState["_entries"];

            var quests = new List<QuestInfo>();
            for (var i = 0; i < count; i++)
            {
                // Strongly typed field reads: skips the DLR dispatch of the dynamic indexer in this hot loop.
                if (!(entries[i] is IManagedObjectInstance entry))
                {
                    continue;
                }

                // _entries can contain free/removed slots (whose value is null) within [0, _count), so skip them.
                var questModel = entry.GetValue<IManagedObjectInstance>("value");
                if (questModel == null)
                {
                    continue;
                }

                quests.Add(new QuestInfo()
                {
                    Id = questModel.GetValue<int>("_QuestId"),
                    Progress = questModel.GetValue<int>("_Progress"),
                    Status = questModel.GetValue<int>("_Status"),
                });
            }


            return new QuestsLog()
            {
                Quests = quests,
            };
        }

        // From decompiled Achievements.cs
        private static bool CanShowInQuestLog(ClientFlags m_clientFlags, AchieveType m_type)
        {
            if ((m_clientFlags & ClientFlags.SHOW_IN_QUEST_LOG) != 0)
            {
                return true;
            }
            switch (m_type)
            {
                case AchieveType.STARTER:
                case AchieveType.DAILY:
                case AchieveType.NORMAL_QUEST:
                    return true;
                default:
                    return false;
            }
        }

        // Achieve.cs
        private enum AchieveType
        {
            INVALID,
            STARTER,
            HERO,
            GOLDHERO,
            DAILY,
            DAILY_REPEATABLE,
            HIDDEN,
            INTERNAL_ACTIVE,
            INTERNAL_INACTIVE,
            LOGIN_ACTIVATED,
            NORMAL_QUEST,
            LOGIN_AND_CHAIN_ACTIVATED,
            PREMIUMHERO
        }
        private enum ClientFlags
        {
            NONE = 0x0,
            IS_LEGENDARY = 0x1,
            SHOW_IN_QUEST_LOG = 0x2,
            IS_AFFECTED_BY_FRIEND_WEEK = 0x4,
            IS_AFFECTED_BY_DOUBLE_GOLD = 0x8
        }
    }
}
