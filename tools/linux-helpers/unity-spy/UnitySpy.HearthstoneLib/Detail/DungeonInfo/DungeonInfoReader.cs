namespace HackF5.UnitySpy.HearthstoneLib.Detail.DungeonInfo
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using HackF5.UnitySpy.HearthstoneLib.Detail.Achievement;
    using HackF5.UnitySpy.HearthstoneLib.Detail.Deck;
    using JetBrains.Annotations;

    internal static class DungeonInfoReader
    {
        public static IDungeonInfoCollection ReadCollection([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var savesMap = image["GameSaveDataManager"]?["s_instance"]?["m_gameSaveDataMapByKey"];
            if (savesMap == null)
            {
                return null;
            }

            var dictionary = new Dictionary<DungeonKey, IDungeonInfo>();
            foreach (DungeonKey key in Enum.GetValues(typeof(DungeonKey)))
            {
                dictionary.Add(
                    key,
                    DungeonInfoReader.BuildDungeonInfo(image, key, savesMap));
            }

            return new DungeonInfoCollection(dictionary);
        }

        public static IDungeonInfo BuildDungeonInfo(HearthstoneImage image, DungeonKey key, dynamic savesMap, bool isDuels = false)
        {
            var index = DungeonInfoReader.GetKeyIndex(savesMap, (int)key);
            if (index == -1)
            {
                return null;
            }

            var dungeonMap = savesMap["valueSlots"][index];

            // Hoist the key/value slot arrays once: every ExtractValue/ExtractValues call below used to
            // re-materialize both arrays from process memory (~14 times per dungeon key). Failures are
            // tolerated the same way ExtractValue tolerated them (each read returns -1 / empty below).
            dynamic dungeonKeys = null;
            dynamic dungeonValues = null;
            try
            {
                dungeonKeys = dungeonMap["keySlots"];
                dungeonValues = dungeonMap["valueSlots"];
            }
            catch (Exception e)
            {
                Logger.Log($"Exception while reading dungeon map slots. key: ${key}, exception: $^{e.Message}");
            }

            var deckDbfId = DungeonInfoReader.ExtractDeckDbfId(image, dungeonKeys, dungeonValues, key);
            //var dungeonHistory = DungeonInfoReader.BuildDungeonHistory(image, dungeonMap);

            var dungeonInfo = new DungeonInfo
            {
                Key = key,
                DeckCards = DungeonInfoReader.ExtractValues(dungeonKeys, dungeonValues, (int)DungeonFieldKey.DeckList),
                LootOptionBundles = new List<DungeonOptionBundle>
                {
                    BuildOptionBundle(DungeonInfoReader.ExtractValues(dungeonKeys, dungeonValues, (int)DungeonFieldKey.LootOption1)),
                    BuildOptionBundle(DungeonInfoReader.ExtractValues(dungeonKeys, dungeonValues, (int)DungeonFieldKey.LootOption2)),
                    BuildOptionBundle(DungeonInfoReader.ExtractValues(dungeonKeys, dungeonValues, (int)DungeonFieldKey.LootOption3)),
                },
                ChosenLoot = DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, (int)DungeonFieldKey.ChosenLoot),
                TreasureOption = DungeonInfoReader.ExtractValues(dungeonKeys, dungeonValues, (int)DungeonFieldKey.TreasureOption),
                ChosenTreasure = DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, (int)DungeonFieldKey.ChosenTreasure),
                SelectedDeck = deckDbfId,
                StartingTreasure = DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, (int)DungeonFieldKey.DUNGEON_CRAWL_PLAYER_SELECTED_LOADOUT_TREASURE_ID),
                HeroCardId = DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, 
                    isDuels ? (int)DungeonFieldKey.DUNGEON_CRAWL_PLAYER_SELECTED_HERO_CARD_DB_ID  : (int)DungeonFieldKey.DUNGEON_CRAWL_HERO_CARD_DB_ID),
                StartingHeroPower = DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, 
                    isDuels ? (int)DungeonFieldKey.DUNGEON_CRAWL_PLAYER_SELECTED_HERO_POWER : (int)DungeonFieldKey.StartingHeroPower),
                PlayerClass = DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, 
                    isDuels ? (int)DungeonFieldKey.DUNGEON_CRAWL_PLAYER_SELECTED_HERO_CLASS : (int)DungeonFieldKey.PlayerClass),
                ScenarioId = DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, (int)DungeonFieldKey.ScenarioId),
                RunActive = DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, (int)DungeonFieldKey.RunActive),
                RunRetired = DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, (int)DungeonFieldKey.DUNGEON_CRAWL_IS_RUN_RETIRED),
                //Wins = ,
                //Losses =,
            };
            // Happens when going back to a session after the elements have been chosen?
            if (isDuels && dungeonInfo.StartingHeroPower == 0)
            {
                dungeonInfo.StartingHeroPower = DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, (int)DungeonFieldKey.StartingHeroPower);
            }
            if (isDuels && dungeonInfo.HeroCardId == 0)
            {
                dungeonInfo.HeroCardId = DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, (int)DungeonFieldKey.DUNGEON_CRAWL_HERO_CARD_DB_ID);
            }

            dungeonInfo.DeckList = DungeonInfoReader.BuildRealDeckList(image, dungeonInfo);
            return dungeonInfo;
        }

        public static IAdventuresInfo ReadAdventuresInfo(HearthstoneImage image)
        {
            var guestHeroes = DungeonInfoReader.ReadAdventureGuestHeroes(image);
            var heroPowersInfo = DungeonInfoReader.ReadTreasureInfo(image, image["GameDbf"]["AdventureHeroPower"]);
            var treasuresInfo = DungeonInfoReader.ReadTreasureInfo(image, image["GameDbf"]["AdventureLoadoutTreasures"]);
            return new AdventuresInfo()
            {
                GuestHeroesInfo = guestHeroes,
                HeroPowersInfo = heroPowersInfo,
                LoadoutTreasuresInfo = treasuresInfo,
            };
        }

        private static IReadOnlyList<IGuestHero> ReadAdventureGuestHeroes(HearthstoneImage image)
        {
            var result = new List<IGuestHero>();
            var heroes = image["GameDbf"]["GuestHero"]["m_records"];
            var count = heroes["_size"];
            var items = heroes["_items"];
            for (var i = 0; i < count; i++)
            {
                var hero = items[i];
                result.Add(new GuestHero()
                {
                    Id = hero["m_ID"],
                    CardDbfId = hero["m_cardId"],
                });
            }
            return result;
        }

        private static IReadOnlyList<IAdventureTreasureInfo> ReadTreasureInfo(HearthstoneImage image, dynamic root)
        {
            var result = new List<IAdventureTreasureInfo>();
            var achievementsInfo = AchievementsInfoReader.ReadAchievementsInfo(image);
            var treasures = root["m_records"];
            var count = treasures["_size"];
            var items = treasures["_items"];
            for (var i = 0; i < count; i++)
            {
                var treasure = items[i];
                var unlockAchievementId = treasure["m_unlockAchievementId"];
                var achievement = unlockAchievementId == 0 ? null : achievementsInfo?.Achievements.Where(ach => ach.AchievementId == unlockAchievementId).FirstOrDefault();
                var complete = unlockAchievementId == 0 || (achievement != null && achievement.Status >= 2 && achievement.Status <= 4);
                result.Add(new AdventureTreasureInfo()
                {
                    Id = treasure["m_ID"],
                    AdventureId = treasure["m_adventureId"],
                    CardDbfId = treasure["m_cardId"],
                    HeroId = treasure["m_guestHeroId"],
                    Unlocked = complete,
                });
            }
            return result;
        }

        private static int ExtractDeckDbfId(HearthstoneImage image, dynamic dungeonKeys, dynamic dungeonValues, DungeonKey key)
        {
            switch (key)
            {
                case DungeonKey.BookOfHeroes:
                    return DungeonInfoReader.ExtractDeckDbfIdForBoH(image, dungeonKeys, dungeonValues);
                default:
                    return DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, (int)DungeonFieldKey.SelectedDeck);
            }
        }

        private static int ExtractDeckDbfIdForBoH(HearthstoneImage image, dynamic dungeonKeys, dynamic dungeonValues)
        {
            // Find the story opponent
            int storyEnemyDbfId = DungeonInfoReader.ExtractValue(dungeonKeys, dungeonValues, (int)DungeonFieldKey.StoryEnemy);
            var storyCard = DungeonInfoReader.GetCardDbf(image, storyEnemyDbfId);
            if (storyCard == null)
            {
                return -1;
            }

            var storyCardId = storyCard["m_noteMiniGuid"];
            var dbf = image["GameDbf"];
            var starterDecks = dbf["Deck"]["m_records"]["_items"];
            for (var i = 0; i < starterDecks.Length; i++)
            {
                if (starterDecks[i] != null)
                {
                    var deckNoteName = starterDecks[i]["m_noteName"];
                    if (deckNoteName == storyCardId)
                    {
                        return starterDecks[i]["m_ID"];
                    }
                }
            }
            return -1;
        }

        private static DungeonOptionBundle BuildOptionBundle(IReadOnlyList<int> values)
        {
            if (values == null || values.Count == 0)
            {
                return null;
            }

            return new DungeonOptionBundle
            {
                BundleId = values[0],
                Elements = values.Skip(1).ToArray(),
            };
        }

        private static IReadOnlyList<int> BuildRealDeckList(HearthstoneImage image, IDungeonInfo runFromMemory)
        {
            // The current run is in progress, which means the value held in the DeckCards
            // field is the aggregation of the cards picked in the previous steps
            // TODO: how to handle card changed / removed by Bob?
            var deckList = runFromMemory.RunActive == 1
                ? BuildRealDeckListForActiveRun(runFromMemory)
                : BuildRealDeckListForNewRun(image, runFromMemory);

            // Some cards can be set to 0, when they are removed by Bob for instance
            return deckList.Where(id => id > 0).ToArray();
        }

        private static List<int> BuildRealDeckListForNewRun(HearthstoneImage image, IDungeonInfo runFromMemory)
        {
            var deckList = new List<int>();
            var isValidRun = runFromMemory.SelectedDeck > 0 && IsValidRun(image);
            if (isValidRun)
            {
                deckList.Add(runFromMemory.StartingTreasure);
                deckList.AddRange(ActiveDeckReader.GetTemplateDeck(image, runFromMemory.SelectedDeck));
            }
            return deckList;
        }

        private static bool IsValidRun(HearthstoneImage image)
        {
            return image != null
                && image["GameDbf"] != null
                && image["GameDbf"]["Deck"] != null
                && image["GameDbf"]["Deck"]["m_records"] != null
                && image["GameDbf"]["Deck"]["m_records"]["_items"] != null;
        }

        private static List<int> BuildRealDeckListForActiveRun(IDungeonInfo runFromMemory)
        {
            var deckList = runFromMemory.DeckCards.ToList();
            if (runFromMemory.ChosenLoot > 0)
            {
                // index is 1-based
                var chosenBundle = runFromMemory.LootOptionBundles[runFromMemory.ChosenLoot - 1];

                // First card is the name of the bundle
                for (var i = 0; i < chosenBundle.Elements.Count; i++)
                {
                    deckList.Add(chosenBundle.Elements[i]);
                }
            }

            if (runFromMemory.ChosenTreasure > 0)
            {
                deckList.Add(runFromMemory.TreasureOption[runFromMemory.ChosenTreasure - 1]);
            }
            return deckList;
        }

        public static int ExtractValue(dynamic dungeonMap, int key)
        {
            return ExtractValue(dungeonMap?["keySlots"], dungeonMap?["valueSlots"], key);
        }

        public static int ExtractValue(dynamic dungeonKeys, dynamic dungeonValues, int key)
        {
            int keyIndex = -1;
            try
            {
                // It looks like the "Only part of a ReadProcessMemory or WriteProcessMemory request was completed" happens 
                // pretty often around this spot, and isn't fixed by a MindVision reset.
                // So just ignoring the issue for now
                keyIndex = DungeonInfoReader.FindKeyIndex(dungeonKeys, key);
                if (keyIndex == -1)
                {
                    return -1;
                }

                var value = dungeonValues[keyIndex]["_IntValue"];
                var size = value["_size"];
                var items = value["_items"];

                return size > 0 ? (int)items[0] : -1;
            }
            catch (Exception e)
            {
                Logger.Log($"Exception while trying to read dungeon info. key: ${key}, keyIndex: ${keyIndex}, exception: $^{e.Message}");
                return -1;
            }
        }

        public static IReadOnlyList<int> ExtractValues(dynamic dungeonKeys, dynamic dungeonValues, int key)
        {
            var result = new List<int>();
            int keyIndex = -1;
            try
            {
                // It looks like the "Only part of a ReadProcessMemory or WriteProcessMemory request was completed" happens 
                // pretty often around this spot, and isn't fixed by a MindVision reset.
                // So just ignoring the issue for now
                keyIndex = DungeonInfoReader.FindKeyIndex(dungeonKeys, key);
                if (keyIndex == -1)
                {
                    return result;
                }

                var value = dungeonValues[keyIndex]["_IntValue"];
                var size = value["_size"];
                if (size == null || size == 0)
                {
                    return result;
                }

                var items = value["_items"];
                for (var i = 0; i < size; i++)
                {
                    var item = (int)items[i];
                    result.Add(item);
                }

                return result;
            }
            catch (Exception e)
            {
                Logger.Log($"Exception while trying to read dungeon info values. key: ${key}, keyIndex: ${keyIndex}, exception: $^{e.Message}");
                Logger.Log(e.StackTrace);
                return result;
            }
        }

        private static dynamic GetCardDbf(HearthstoneImage image, int cardId)
        {
            var cards = image["GameDbf"]["Card"]["m_records"]["_items"];
            for (var i = 0; i < cards.Length; i++)
            {
                if (cards[i]["m_ID"] == cardId)
                {
                    return cards[i];
                }
            }

            return null;
        }

        public static int GetKeyIndex(dynamic map, int key)
        {
            return FindKeyIndex(map["keySlots"], key);
        }

        private static int FindKeyIndex(dynamic keys, int key)
        {
            if (keys == null)
            {
                return -1;
            }

            for (var i = 0; i < keys.Length; i++)
            {
                if (keys[i] == key)
                {
                    return i;
                }
            }

            return -1;
        }
    }
}
