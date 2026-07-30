namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IDustInfoCard
    {
        string CardId { get; }

        int Premium { get; }

        int BaseBuyValue { get; }

        int BaseSellValue { get; }
        
        int OverrideEvent { get; }

        int BuyValueOverride { get; }

        int SellValueOverride { get; }
    }
}