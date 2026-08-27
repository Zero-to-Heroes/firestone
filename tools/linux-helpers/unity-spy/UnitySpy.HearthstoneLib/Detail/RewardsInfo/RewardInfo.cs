using HackF5.UnitySpy.HearthstoneLib.Detail.ArenaInfo;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.RewardsInfo
{
    public class RewardInfo : IRewardInfo
    {
        public int Type { get; set;  }
        public long Amount { get; set; }
        public int BoosterId { get; set; }
        public bool IsCrowdsFavor { get; set; }

        public override bool Equals(object obj)
        {
            return obj is RewardInfo info &&
                   Type == info.Type &&
                   Amount == info.Amount &&
                   BoosterId == info.BoosterId &&
                   IsCrowdsFavor == info.IsCrowdsFavor;
        }

        public override int GetHashCode()
        {
            int hashCode = -2049393372;
            hashCode = hashCode * -1521134295 + Type.GetHashCode();
            hashCode = hashCode * -1521134295 + Amount.GetHashCode();
            hashCode = hashCode * -1521134295 + BoosterId.GetHashCode();
            return hashCode;
        }
    }
}
