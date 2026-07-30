namespace HackF5.UnitySpy.HearthstoneLib.Detail.OpenPacksInfo
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using HackF5.UnitySpy.HearthstoneLib;

    public class PackInfo : IPackInfo
    {
        public int BoosterId { get; set; }

        public IList<ICardInfo> Cards { get; set; }

        override
        public bool Equals(object obj)
        {
            if (!(obj is PackInfo))
            {
                return false;
            }

            var other = obj as PackInfo;
            if (other == null)
            {
                return false;
            }

            return this.BoosterId == other.BoosterId
                && this.Cards.Count == other.Cards.Count
                && AreCardsEquals(this.Cards, other.Cards);
        }

        private bool AreCardsEquals(IList<ICardInfo> cards1, IList<ICardInfo> cards2)
        {
            for (int i = 0; i < cards1.Count; i++)
            {
                if (!cards1[i].Equals(cards2[i]))
                {
                    return false;
                }
            }
            return true;
        }
    }

    internal class CardInfo : ICardInfo
    {
        public string CardId { get; set; }

        public int Premium { get; set; }

        public int TotalCount { get; set; }

        public bool IsNew { get; set; }

        public long CurrencyAmount { get; set; }

        public int MercenaryArtVariationId { get; set; }

        public int MercenaryArtVariationPremium { get; set; }

        public int MercenaryId { get; set; } = -1;

        override
        public bool Equals(object obj)
        {
            if (!(obj is CardInfo))
            {
                return false;
            }

            var other = obj as CardInfo;
            if (other == null)
            {
                return false;
            }

            return this.CardId == other.CardId
                && this.Premium == other.Premium
                && this.TotalCount == other.TotalCount
                && this.CurrencyAmount == other.CurrencyAmount
                && this.MercenaryArtVariationId == other.MercenaryArtVariationId
                && this.MercenaryArtVariationPremium == other.MercenaryArtVariationPremium
                && this.MercenaryId == other.MercenaryId;
        }
    }
}