namespace HackF5.UnitySpy.HearthstoneLib.Detail.OpenPacksInfo
{
    using System.Collections.Generic;
    using HackF5.UnitySpy.HearthstoneLib;

    internal class BoosterStack : IBoosterStack
    {
        public int BoosterId { get; set; }

        public int Count { get; set; }

        public int EverGrantedCount { get; set; }

        override
        public bool Equals(object obj)
        {
            if (!(obj is BoosterStack))
            {
                return false;
            }

            var other = obj as BoosterStack;
            if (other == null)
            {
                return false;
            }

            return this.BoosterId == other.BoosterId
                && this.Count == other.Count
                && this.EverGrantedCount == other.EverGrantedCount;
        }
    }
}
