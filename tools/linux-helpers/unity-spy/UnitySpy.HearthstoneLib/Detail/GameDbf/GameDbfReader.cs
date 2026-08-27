namespace HackF5.UnitySpy.HearthstoneLib.Detail.GameDbf
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    internal static class GameDbfReader
    {

        public static bool IsBootstrapped([NotNull] HearthstoneImage image)
        {
            return image?["GameDbf"]?["Card"] != null;
        }

        public static IList<RaceTag> ReadRaceTags([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var records = image["GameDbf"]["CardRace"]["m_records"];
            var size = records["_size"];
            // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
            var items = size > 0 ? records["_items"] : null;
            IList<RaceTag> result = new List<RaceTag>();
            for (var i = 0; i < size; i++)
            {
                var item = items[i];
                result.Add(new RaceTag()
                {
                    Id = item["m_ID"],
                    RaceTagId = item["m_isRaceTagId"],
                });
            }
            return result;
        }

        public static AdventureData FindAdventureData([NotNull] HearthstoneImage image, int adventureId, int modeId)
        {
            var records = image["GameDbf"]["AdventureData"]["m_records"];
            var size = records["_size"];
            // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
            var items = size > 0 ? records["_items"] : null;
            AdventureData result = null;
            for (var i = 0; i < size; i++)
            {
                var item = items[i];
                if (item["m_adventureId"] == adventureId && item["m_modeId"] == modeId)
                {
                    return new AdventureData()
                    {
                        GameSaveDataClientKeyId = item["m_gameSaveDataClientKeyId"],
                        GameSaveDataServerKeyId = item["m_gameSaveDataServerKeyId"],
                    };
                }
            }
            return null;
        }
    }
}
