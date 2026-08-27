using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.DungeonInfo
{
    class AdventureTreasureInfo : IAdventureTreasureInfo
    {
        public int Id { get; set; }
        public int AdventureId { get; set; }
        public int CardDbfId { get; set; }
        public int HeroId { get; set; }
        public bool Unlocked { get; set; }
    }
}
