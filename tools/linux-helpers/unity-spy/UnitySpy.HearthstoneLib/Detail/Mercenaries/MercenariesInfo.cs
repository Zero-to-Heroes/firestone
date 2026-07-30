namespace HackF5.UnitySpy.HearthstoneLib.Detail.Mercenaries
{
    internal class MercenariesInfo : IMercenariesInfo
    {
        public int PvpRating { get; set; } = -1;

        public IMercenariesMap Map { get; set; }
    }
}