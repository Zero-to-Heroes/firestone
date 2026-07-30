namespace HackF5.UnitySpy.HearthstoneLib.Detail.PlayerProfile
{
    using System.Collections.Generic;
    using HackF5.UnitySpy.HearthstoneLib.GameData;
    using JetBrains.Annotations;

    internal static class PlayerProfileInfoReader
    {
        public static PlayerProfileInfo ReadPlayerProfileInfo([NotNull] HearthstoneImage image)
        {
            var records = ReadPlayerRecords(image);
            var playerClasses = ReadPlayerClasses(image);

            return new PlayerProfileInfo()
            {
                PlayerRecords = records,
                PlayerClasses = playerClasses,
            };
        }

        private static List<PlayerClass> ReadPlayerClasses([NotNull] HearthstoneImage image)
        {
            var result = new List<PlayerClass>();
            var netObject = image.GetNetCacheService("NetCacheHeroLevels");
            if (netObject == null)
            {
                return result;
            }

            var levels = netObject["<Levels>k__BackingField"];
            if (levels == null)
            {
                return result;
            }

            var levelsSize = levels["_size"];
            if (levelsSize == null || levelsSize == 0)
            {
                return result;
            }

            var levelsItems = levels["_items"];
            for (var i = 0; i < levelsSize; i++)
            {
                var levelItem = levelsItems[i];
                int tagClass = levelItem["<Class>k__BackingField"];
                int classLevel = levelItem["<CurrentLevel>k__BackingField"]?["<Level>k__BackingField"];

                result.Add(new PlayerClass()
                {
                    TagClass = tagClass,
                    Level = classLevel,
                });
            }

            return result;
        }

        private static List<PlayerRecord> ReadPlayerRecords([NotNull] HearthstoneImage image)
        {
            var result = new List<PlayerRecord>();
            var playerRecordsService = image.GetNetCacheService("NetCachePlayerRecords");
            if (playerRecordsService == null)
            {
                return new List<PlayerRecord>();
            }

            var playerRecords = playerRecordsService["<Records>k__BackingField"];
            if (playerRecords == null)
            {
                return new List<PlayerRecord>();
            }

            var size = playerRecords["_size"];
            var items = playerRecords["_items"];
            for (var i = 0; i < size; i++)
            {
                var item = items[i];
                result.Add(new PlayerRecord()
                {
                    Data = item["<Data>k__BackingField"],
                    Losses = item["<Losses>k__BackingField"],
                    RecordType = item["<RecordType>k__BackingField"],
                    Ties = item["<Ties>k__BackingField"],
                    Wins = item["<Wins>k__BackingField"],
                });
            }
            return result;
        }
    }
}
