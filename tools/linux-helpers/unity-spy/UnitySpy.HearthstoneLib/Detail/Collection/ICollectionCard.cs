namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;

    [PublicAPI]
    public interface ICollectionCard
    {
        string CardId { get; }

        int Count { get; }

        int PremiumCount { get; }

        int DiamondCount { get; }

        int SignatureCount { get; }

        int MaxCount { get; }
    }
}