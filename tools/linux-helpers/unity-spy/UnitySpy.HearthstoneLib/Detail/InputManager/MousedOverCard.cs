namespace HackF5.UnitySpy.HearthstoneLib.Detail.InputManager
{
    using System.Collections.Generic;
    using HackF5.UnitySpy.HearthstoneLib;
    using System.Linq;

    public class MousedOverCard
    {
        public string CardId;
        public int? Zone;
        public int? Side;
        public int? EntityId;
        public int? PlayerId;

        override public bool Equals(object obj)
        {
            if (!(obj is MousedOverCard))
            {
                return false;
            }

            var other = obj as MousedOverCard;
            if (other == null)
            {
                return false;
            }

            return this.CardId == other.CardId
                && this.Zone == other.Zone
                && this.Side == other.Side;
        }

        public override int GetHashCode()
        {
            return base.GetHashCode();
        }
    }
}
