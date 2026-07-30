namespace HackF5.UnitySpy.HearthstoneLib.Detail.Collection
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    internal static class CollectionCardBackReader
    {
        public static int ReadCollectionSize([NotNull] HearthstoneImage image)
        {
            return image.GetNetCacheService("NetCacheCardBacks", retryWithoutCacheIfNotFound: true)?["<CardBacks>k__BackingField"]?["_count"] ?? 0;
        }

        public static IReadOnlyList<ICollectionCardBack> ReadCollection([NotNull] HearthstoneImage image)
        {
            //Logger.Log("Getting card backs");
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var collectionCardBacks = new List<CollectionCardBack>();
            var cardBacksField = image.GetNetCacheService("NetCacheCardBacks", retryWithoutCacheIfNotFound: true)?["<CardBacks>k__BackingField"];
            if (cardBacksField == null)
            {
                return collectionCardBacks;
            }

            var slots = cardBacksField["_slots"];
            if (slots == null)
            {
                return collectionCardBacks;
            }

            // The backing field is a HashSet<int>. Its _slots array is sized larger than the
            // number of stored values, and the trailing unused slots are zero-initialized
            // (value == 0). Iterating the whole array would therefore yield spurious id==0
            // entries. Enumerate only the used region (0 .. _lastIndex - 1) and skip removed
            // slots (hashCode < 0), matching HashSet<T>'s own enumeration semantics.
            int lastIndex;
            try
            {
                lastIndex = cardBacksField["_lastIndex"];
            }
            catch (Exception)
            {
                lastIndex = slots.Length;
            }

            for (var i = 0; i < lastIndex; i++)
            {
                var cardBack = slots[i];
                if (cardBack["hashCode"] < 0)
                {
                    continue;
                }

                var cardBackId = cardBack["value"];
                //Logger.Log("Card back id " + cardBackId);
                collectionCardBacks.Add(new CollectionCardBack()
                {
                    CardBackId = cardBackId,
                });
            }

            return collectionCardBacks;
        }
    }
}