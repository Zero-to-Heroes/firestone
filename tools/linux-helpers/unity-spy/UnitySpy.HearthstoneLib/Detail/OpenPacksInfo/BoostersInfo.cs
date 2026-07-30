namespace HackF5.UnitySpy.HearthstoneLib.Detail.OpenPacksInfo
{
    using System.Collections.Generic;
    using HackF5.UnitySpy.HearthstoneLib;
    using System.Linq;

    internal class BoostersInfo : IBoostersInfo
    {
        public IReadOnlyList<IBoosterStack> Boosters { get; set; }


        override
        public bool Equals(object obj)
        {
            if (!(obj is BoostersInfo))
            {
                return false;
            }

            var other = obj as BoostersInfo;
            if (other == null)
            {
                return false;
            }

            if (other.Boosters?.Count != this.Boosters?.Count)
            {
                return false;
            }

            for (int i = 0; i < this.Boosters.Count; i++)
            {
                var thisBooster = this.Boosters[i];
                var otherBooster = other.Boosters[i];
                if (!thisBooster.Equals(otherBooster))
                {
                    return false;
                }
            }

            return true;
        }
    }
}
