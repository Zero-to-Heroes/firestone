namespace HackF5.UnitySpy.HearthstoneLib.Detail.Collection
{
    internal class CollectionCard : ICollectionCard
    {
        public string CardId { get; set; }

        public int Count { get; set; }

        public int PremiumCount { get; set; }

        public int DiamondCount { get; set; }

        public int SignatureCount { get; set; }

        public int MaxCount { get; set; }

        public int TrialCount { get; set; }

        public int TrialPremiumCount { get; set; }

        public int TrialDiamondCount { get; set; }

        public int TrialSignatureCount { get; set; }
    }
}