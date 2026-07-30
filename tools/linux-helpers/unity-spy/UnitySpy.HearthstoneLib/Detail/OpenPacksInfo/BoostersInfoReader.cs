namespace HackF5.UnitySpy.HearthstoneLib.Detail.OpenPacksInfo
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using HackF5.UnitySpy.HearthstoneLib;
    using JetBrains.Annotations;

    internal static class BoostersInfoReader
    {
        public static IBoostersInfo ReadBoostersInfo([NotNull] HearthstoneImage image)
        {
            var boosterServices = image.GetNetCacheService("NetCacheBoosters");
            if (boosterServices == null || boosterServices["<BoosterStacks>k__BackingField"] == null)
            {
                return null;
            }

            var boosters = new List<IBoosterStack>();
            var itemCount = boosterServices["<BoosterStacks>k__BackingField"]["_size"];
            var items = boosterServices["<BoosterStacks>k__BackingField"]["_items"];
            for (int i = 0; i < itemCount; i++)
            {
                var booster = items[i];
                boosters.Add(new BoosterStack()
                {
                    BoosterId = booster["<Id>k__BackingField"],
                    Count = booster["<Count>k__BackingField"],
                    EverGrantedCount = booster["<EverGrantedCount>k__BackingField"],
                });
            }

            boosters.Sort((a, b) => a.BoosterId - b.BoosterId);
            return new BoostersInfo()
            {
                Boosters = boosters,
            };
        }
        public static int ReadBoostersCount([NotNull] HearthstoneImage image)
        {
            // Should be pretty quick, since we don't iterate over a lot of items?
            var info = ReadBoostersInfo(image);
            if (info == null)
            {
                return 0;
            }
            return info.Boosters.Select(b => b.EverGrantedCount).Sum();
        }
    }
}
