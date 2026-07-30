namespace HackF5.UnitySpy.HearthstoneLib.Detail.Collection
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    internal static class CollectionCoinReader
    {
        public static IReadOnlyList<ICollectionCoin> ReadCollection([NotNull] HearthstoneImage image)
        {
            var collectionCoins = new List<CollectionCoin>();

            var coinsField = image.GetNetCacheService("NetCacheCoins", retryWithoutCacheIfNotFound: true)?["<Coins>k__BackingField"];
            if (coinsField == null)
            {
                return collectionCoins;
            }

            var coinDbf = image["GameDbf"]?["CosmeticCoin"]?["m_records"];
            if (coinDbf == null)
            {
                return collectionCoins;
            }

            var _size = coinDbf["_size"];
            var _items = coinDbf["_items"];
            var coinDic = new Dictionary<int, int>();
            for (int i = 0; i < _size; i++)
            {
                var coin = _items[i];
                coinDic.Add(coin["m_ID"], coin["m_cardId"]);
            }

            var slots = coinsField["_slots"];
            if (slots == null)
            {
                return collectionCoins;
            }

            for (var i = 0; i < slots.Length; i++)
            {
                var coin = slots[i];
                var coinId = coin["value"];
                if (coinId != 0)
                {
                    collectionCoins.Add(new CollectionCoin()
                    {
                        CoinId = coinDic[coinId],
                    });
                }
            }


            return collectionCoins;
        }

        public static int ReadCollectionSize([NotNull] HearthstoneImage image)
        {
            return image.GetNetCacheService("NetCacheCoins", retryWithoutCacheIfNotFound: true)?["<Coins>k__BackingField"]?["_count"] ?? 0;
        }
    }
}