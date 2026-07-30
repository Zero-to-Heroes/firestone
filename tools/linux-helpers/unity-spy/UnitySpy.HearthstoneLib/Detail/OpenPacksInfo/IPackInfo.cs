using System.Collections.Generic;

namespace HackF5.UnitySpy.HearthstoneLib
{
    public interface IPackInfo
    {
        int BoosterId { get; }

        IList<ICardInfo> Cards { get; set; }
    }

    public interface ICardInfo
    {
        string CardId { get; }

        int Premium { get; }

        bool IsNew { get; }

        int TotalCount { get; }

        long CurrencyAmount { get; }

        int MercenaryArtVariationId { get; }

        int MercenaryArtVariationPremium { get; }

        int MercenaryId { get; }
    }
}
