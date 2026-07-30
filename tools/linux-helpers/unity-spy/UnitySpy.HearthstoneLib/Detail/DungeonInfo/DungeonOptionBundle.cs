using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.DungeonInfo
{
    class DungeonOptionBundle : IDungeonOptionBundle
    {
        public int BundleId { get; set; }

        public IReadOnlyList<int> Elements { get; set; }
    }
}
