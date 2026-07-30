namespace HackF5.UnitySpy.HearthstoneLib.Detail.Collection
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    internal static class CollectionBattlegroundsHeroSkinsReader
    {
        public static IReadOnlyList<int> ReadBattlegroundsHeroSkins([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var collectionCards = new List<int>();
            var heroSkinIdToCardDbfId = new Dictionary<int, int>();
            var mappingObj = image["CollectionManager"]?["s_instance"]?["m_BattlegroundsHeroSkinIdToHeroSkinCardId"];
            if (mappingObj == null)
            {
                return collectionCards;
            }

            var mappingCount = mappingObj["count"];
            // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
            var mappingKeys = mappingCount > 0 ? mappingObj["keySlots"] : null;
            var mappingValues = mappingCount > 0 ? mappingObj["valueSlots"] : null;
            for (var i = 0; i < mappingCount; i++)
            {
                var skinId = mappingKeys[i]["m_value"];
                var cardDbfId = mappingValues[i];
                heroSkinIdToCardDbfId.Add(skinId, cardDbfId);
            }

            var skinService = image.GetNetCacheService("NetCacheBattlegroundsHeroSkins")?["<OwnedBattlegroundsSkins>k__BackingField"];
            if (skinService == null)
            {
                return collectionCards;
            }
            var skinCount = skinService["_count"];
            var ownedSkinIds = new List<int>();
            try
            {
                // Not sure when this happens, but we don't want to break the whole memory reading just for that
                // Hoisted out of the loop: each indexer access re-reads the whole array from process memory.
                var skinSlots = skinCount > 0 ? skinService["_slots"] : null;
                for (var i = 0; i < skinCount; i++)
                {
                    var skinId = skinSlots[i]["value"]?["m_value"];
                    ownedSkinIds.Add(skinId);
                }
            }
            catch (Exception e)
            {
                Logger.Log("Exception while getting BG hero skins info");
            }

            foreach (var ownedSkinId in ownedSkinIds)
            {
                collectionCards.Add(heroSkinIdToCardDbfId[ownedSkinId]);
            }


            return collectionCards;
        }

        public static int ReadCollectionSize([NotNull] HearthstoneImage image)
        {
            return image.GetNetCacheService("NetCacheBattlegroundsHeroSkins")?["<OwnedBattlegroundsSkins>k__BackingField"]?["_count"] ?? 0;
        }
    }
}