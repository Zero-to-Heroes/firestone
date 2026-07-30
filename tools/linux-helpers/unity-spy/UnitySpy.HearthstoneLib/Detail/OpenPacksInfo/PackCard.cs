namespace HackF5.UnitySpy.HearthstoneLib.Detail.OpenPacksInfo
{
    using System.Collections.Generic;
    using HackF5.UnitySpy.HearthstoneLib;

    internal class PackCard : IPackCard
    {
        public string CardId { get; set; }

        public bool IsNew { get; set; }

        public int Premium { get; set; }

        public bool Revealed { get; set; }

        public long CurrencyAmount{ get; set; }

        public int MercenaryArtVariationId { get; set; }

        public int MercenaryArtVariationPremium { get; set; }

        public int MercenaryId { get; set; } = -1;
    }
}
