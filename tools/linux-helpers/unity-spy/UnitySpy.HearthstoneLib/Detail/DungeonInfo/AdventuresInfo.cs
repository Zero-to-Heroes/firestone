using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.DungeonInfo
{
    class AdventuresInfo : IAdventuresInfo
    {
        public IReadOnlyList<IGuestHero> GuestHeroesInfo { get; set; }
        public IReadOnlyList<IAdventureTreasureInfo> HeroPowersInfo { get; set; }
        public IReadOnlyList<IAdventureTreasureInfo> LoadoutTreasuresInfo { get; set; }

    }
}
