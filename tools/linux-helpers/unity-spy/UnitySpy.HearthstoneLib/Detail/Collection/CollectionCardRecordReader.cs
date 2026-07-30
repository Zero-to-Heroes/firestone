namespace HackF5.UnitySpy.HearthstoneLib.Detail.Collection
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    internal static class CollectionCardRecordReader
    {
        // Not super useful, it just gives you for each card how many are yet to be seen in the collection
        // (probably about the "new" flag)
        public static dynamic ReadCollectionCardRecords([NotNull] HearthstoneImage image)
        {
            if (image == null)
            {
                throw new ArgumentNullException(nameof(image));
            }

            var service = image.GetNetCacheService("NetCacheCollection")?["<Stacks>k__BackingField"];
            var size = service["_size"];
            var items = service["_items"];
            var result = new List<dynamic>();
            for (int i = 0; i < size; i++)
            {
                var stack = items[i];
                var count = stack["<Count>k__BackingField"];
                var numSeen = stack["<NumSeen>k__BackingField"];
                var cardId = stack["<Def>k__BackingField"]["<Name>k__BackingField"];
                var premium = stack["<Def>k__BackingField"]["<Premium>k__BackingField"];
                result.Add(new
                {
                    CardId = cardId,
                    Premium = premium,
                    Count = count,
                    NumSeen = numSeen,
                });
            }

            result.Sort((dynamic a, dynamic b) => b.NumSeen - a.NumSeen);
            return result;
        }
    }
}