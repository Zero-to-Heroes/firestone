namespace HackF5.UnitySpy.HearthstoneLib.Detail.Collection
{
    internal class DustInfoCard : IDustInfoCard
    {
        public string CardId { get; set; }

        public int Premium { get; set; }

        public int BaseBuyValue { get; set; }

        public int BaseSellValue { get; set; }

        public int OverrideEvent { get; set; }

        public int BuyValueOverride { get; set; }

        public int SellValueOverride { get; set; }
    }
}