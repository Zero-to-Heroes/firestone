namespace HackF5.UnitySpy.HearthstoneLib.Detail.DungeonInfo
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using HackF5.UnitySpy.HearthstoneLib.Detail.Achievement;
    using HackF5.UnitySpy.HearthstoneLib.Detail.Deck;
    using HackF5.UnitySpy.HearthstoneLib.GameData;
    using JetBrains.Annotations;

    internal static class DungeonInfoHistoryReader
    {
        // GameSaveDataManager
        public struct AdventureDungeonCrawlClassProgressSubkeys
        {
            public GameSaveKeySubkeyId bossWins;

            public GameSaveKeySubkeyId runWins;
        }

        private static Dictionary<TAG_CLASS, AdventureDungeonCrawlClassProgressSubkeys> AdventureDungeonCrawlClassToSubkeyMapping;

        private static Dictionary<long, GameSaveKeySubkeyId> AdventureDungeonCrawlHeroToSubkeyMapping;

        //public static DungeonHistory BuildDungeonHistory(HearthstoneImage image, dynamic dungeonMap)
        //{
        //    if (AdventureDungeonCrawlClassToSubkeyMapping.Count == 0)
        //    {
        //        BuildAdventureDungeonCrawlClassToSubkeyMapping();
        //    }
        //    if (AdventureDungeonCrawlHeroToSubkeyMapping.Count == 0)
        //    {
        //        BuildAdventureDungeonCrawlHeroToSubkeyMapping();
        //    }

        //}

        //private static void BuildAdventureDungeonCrawlHeroToSubkeyMapping()
        //{
        //    throw new NotImplementedException();
        //}

        //private static void BuildAdventureDungeonCrawlClassToSubkeyMapping()
        //{
        //    Dictionary<TAG_CLASS, AdventureDungeonCrawlClassProgressSubkeys> map = new Dictionary<TAG_CLASS, AdventureDungeonCrawlClassProgressSubkeys>();
        //    AdventureDungeonCrawlClassProgressSubkeys value = new AdventureDungeonCrawlClassProgressSubkeys
        //    {
        //        bossWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_PALADIN_BOSS_WINS,
        //        runWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_PALADIN_RUN_WINS
        //    };
        //    map.Add(TAG_CLASS.PALADIN, value);
        //    value = new AdventureDungeonCrawlClassProgressSubkeys
        //    {
        //        bossWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_HUNTER_BOSS_WINS,
        //        runWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_HUNTER_RUN_WINS
        //    };
        //    map.Add(TAG_CLASS.HUNTER, value);
        //    value = new AdventureDungeonCrawlClassProgressSubkeys
        //    {
        //        bossWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_MAGE_BOSS_WINS,
        //        runWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_MAGE_RUN_WINS
        //    };
        //    map.Add(TAG_CLASS.MAGE, value);
        //    value = new AdventureDungeonCrawlClassProgressSubkeys
        //    {
        //        bossWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_SHAMAN_BOSS_WINS,
        //        runWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_SHAMAN_RUN_WINS
        //    };
        //    map.Add(TAG_CLASS.SHAMAN, value);
        //    value = new AdventureDungeonCrawlClassProgressSubkeys
        //    {
        //        bossWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_WARRIOR_BOSS_WINS,
        //        runWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_WARRIOR_RUN_WINS
        //    };
        //    map.Add(TAG_CLASS.WARRIOR, value);
        //    value = new AdventureDungeonCrawlClassProgressSubkeys
        //    {
        //        bossWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_ROGUE_BOSS_WINS,
        //        runWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_ROGUE_RUN_WINS
        //    };
        //    map.Add(TAG_CLASS.ROGUE, value);
        //    value = new AdventureDungeonCrawlClassProgressSubkeys
        //    {
        //        bossWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_WARLOCK_BOSS_WINS,
        //        runWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_WARLOCK_RUN_WINS
        //    };
        //    map.Add(TAG_CLASS.WARLOCK, value);
        //    value = new AdventureDungeonCrawlClassProgressSubkeys
        //    {
        //        bossWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_PRIEST_BOSS_WINS,
        //        runWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_PRIEST_RUN_WINS
        //    };
        //    map.Add(TAG_CLASS.PRIEST, value);
        //    value = new AdventureDungeonCrawlClassProgressSubkeys
        //    {
        //        bossWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_DRUID_BOSS_WINS,
        //        runWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_DRUID_RUN_WINS
        //    };
        //    map.Add(TAG_CLASS.DRUID, value);
        //    value = new AdventureDungeonCrawlClassProgressSubkeys
        //    {
        //        bossWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_DEMON_HUNTER_BOSS_WINS,
        //        runWins = GameSaveKeySubkeyId.DUNGEON_CRAWL_DEMON_HUNTER_RUN_WINS
        //    };
        //    map.Add(TAG_CLASS.DEMONHUNTER, value);
        //    AdventureDungeonCrawlClassToSubkeyMapping = map;
        //}
    }
}
