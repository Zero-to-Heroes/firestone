namespace HackF5.UnitySpy.HearthstoneLib.Detail.Collection
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using HackF5.UnitySpy;
    using JetBrains.Annotations;

    internal static class CollectionCardReader
    {
        public static IReadOnlyList<ICollectionCard> ReadCollection([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                Logger.Log("No image");
                throw new ArgumentNullException(nameof(image));
            }

            var collectionCards = new Dictionary<string, CollectionCard>();
            var collectibleCards = image["CollectionManager"]?["s_instance"]?["m_collectibleCards"];

            if (collectibleCards == null)
            {
                Logger.Log("no collectible cards in ReadCollection");
                Logger.Log($"CollectionManager is null? {image["CollectionManager"] == null}");
                Logger.Log($"s_instance is null? {image["CollectionManager"]?["s_instance"] == null}");
                return collectionCards.Values.ToArray();
            }

            // Hot loop: read each card's fields through the strongly typed accessor instead of the dynamic
            // indexer, and resolve the array element once per iteration rather than four times. This avoids the
            // DLR call-site overhead on the per-card field reads.
            var items = (object[])collectibleCards["_items"];
            int size = collectibleCards["_size"];
            if (items == null)
            {
                Logger.Log("items are null in ReadCollection");
                return collectionCards.Values.ToArray();
            }

            for (var index = 0; index < size; index++)
            {
                if (!(items[index] is IManagedObjectInstance item))
                {
                    continue;
                }

                var entityDef = item.GetValue<IManagedObjectInstance>("m_EntityDef");
                string cardId = entityDef?.GetValue<string>("m_cardIdInternal");
                if (string.IsNullOrEmpty(cardId))
                {
                    continue;
                }

                int count = item.GetValue<int>("<OwnedCount>k__BackingField");
                int trialCount = item.GetValue<int>("<TrialCount>k__BackingField");
                int premium = item.GetValue<int>("m_PremiumType");
                if (!collectionCards.TryGetValue(cardId, out var card))
                {
                    card = new CollectionCard { CardId = cardId };
                    collectionCards.Add(cardId, card);
                }
                if (premium == 1)
                {
                    card.PremiumCount = count;
                    card.TrialPremiumCount = trialCount;
                }
                else if (premium == 2)
                {
                    card.DiamondCount = count;
                    card.TrialDiamondCount = trialCount;
                }
                else if (premium == 3)
                {
                    card.SignatureCount = count;
                    card.TrialSignatureCount = trialCount;
                }
                else if (premium == 4)
                {
                    card.MaxCount = count;
                }
                else
                {
                    // So that if other "premium" types are introduced, we don't override the base value
                    card.Count += count;
                    card.TrialCount = trialCount;
                }
            }

            if (collectionCards.Count == 0)
            {
                Logger.Log("no collectible cards found in ReadCollection");
            }
            return collectionCards.Values.ToArray();
        }

        public static int ReadCollectionSize([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var netCacheService = image.GetNetCacheService("NetCacheCollection");
            if (netCacheService == null)
            {
                Logger.Log("Could not find netCacheService NetCacheCollection");
            }
            return netCacheService?["TotalCardsOwned"] ?? 0;
        }

        public static bool IsCollectionInit([NotNull] HearthstoneImage image)
        {
            try
            {
                var collectibleCards = image["CollectionManager"]["s_instance"]["m_collectibleCards"];
                int size = collectibleCards["_size"];
                return size > 0;
            }
            catch (Exception e)
            {
                return false;
            }
        }

        private static readonly object cardIdCacheLock = new object();
        private static Dictionary<string, int> cardIdToDbfId = new Dictionary<string, int>();
        private static Dictionary<int, string> dbfIdToCardId = new Dictionary<int, string>();

        public static void InvalidateCardIdCache()
        {
            lock (cardIdCacheLock)
            {
                cardIdToDbfId = new Dictionary<string, int>();
                dbfIdToCardId = new Dictionary<int, string>();
            }
        }

        public static int TranslateCardIdToDbfId(HearthstoneImage image, string cardId)
        {
            EnsureCardIdCache(image);
            cardIdToDbfId.TryGetValue(cardId, out int dbfId);
            return dbfId;            
        }

        public static string TranslateDbfIdToCardId(HearthstoneImage image, int dbfId)
        {
            EnsureCardIdCache(image);
            dbfIdToCardId.TryGetValue(dbfId, out string cardId);
            return cardId;            
        }

        private static void EnsureCardIdCache(HearthstoneImage image)
        {
            if (cardIdToDbfId.Count > 0)
            {
                return;
            }

            lock (cardIdCacheLock)
            {
                if (cardIdToDbfId.Count > 0)
                {
                    return;
                }

                var newCardIdToDbfId = new Dictionary<string, int>();
                var newDbfIdToCardId = new Dictionary<int, string>();
                var cardStruct = image["GameDbf"]["Card"]["m_records"];
                var size = cardStruct["_size"];
                var items = cardStruct["_items"];
                for (var i = 0; i < size; i++)
                {
                    var card = items[i];
                    var miniGuid = card["m_noteMiniGuid"];
                    var mId = card["m_ID"];
                    newCardIdToDbfId[miniGuid] = mId;
                    newDbfIdToCardId[mId] = miniGuid;
                }

                cardIdToDbfId = newCardIdToDbfId;
                dbfIdToCardId = newDbfIdToCardId;
            }
        }

        public static IReadOnlyList<IDustInfoCard> ReadDustInfoCards([NotNull] HearthstoneImage image)
        {
            //Logger.Log("Getting collection");
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var service = image.GetNetCacheService("NetCacheCardValues")?["<Values>k__BackingField"];
            if (service == null)
            {
                return new List<IDustInfoCard>();
            }

            var count = service["_count"];
            if (count == 0)
            {
                return new List<IDustInfoCard>();
            }

            var entries = (object[])service["_entries"];
            var result = new List<IDustInfoCard>();
            for (int i = 0; i < count; i++)
            {
                // Strongly typed field reads (as in ReadCollection above): resolve the entry once and skip
                // the DLR dispatch of the dynamic indexer in this hot loop.
                if (!(entries[i] is IManagedObjectInstance entry))
                {
                    continue;
                }

                var key = entry.GetValue<IManagedObjectInstance>("key");
                var value = entry.GetValue<IManagedObjectInstance>("value");
                if (key == null || value == null)
                {
                    continue;
                }

                result.Add(new DustInfoCard()
                {
                    CardId = key.GetValue<string>("<Name>k__BackingField"),
                    Premium = key.GetValue<int>("<Premium>k__BackingField"),
                    BaseBuyValue = value.GetValue<int>("<BaseBuyValue>k__BackingField"),
                    BaseSellValue = value.GetValue<int>("<BaseSellValue>k__BackingField"),
                    OverrideEvent = value.GetValue<int>("<OverrideEvent>k__BackingField"),
                    BuyValueOverride = value.GetValue<int>("<BuyValueOverride>k__BackingField"),
                    SellValueOverride = value.GetValue<int>("<SellValueOverride>k__BackingField"),
                });
            }

            return result;
        }
    }
}