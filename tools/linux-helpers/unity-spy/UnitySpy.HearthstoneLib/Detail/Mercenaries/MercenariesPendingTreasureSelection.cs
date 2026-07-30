using System.Collections.Generic;
using System.Linq;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.Mercenaries
{
    internal class MercenariesPendingTreasureSelection : IMercenariesPendingTreasureSelection
    {
        public int MercenaryId { get; set; }

        public IReadOnlyList<int> Options { get; set; }

        public override bool Equals(object obj)
        {
            return obj is MercenariesPendingTreasureSelection other
                && this.MercenaryId == other.MercenaryId
                && this.Options.Count == other.Options.Count
                && this.Options.All(other.Options.Contains);
        }
    }
}