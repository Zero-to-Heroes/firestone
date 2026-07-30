namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IBattleTag
    {
        string Name { get; }

        int Number { get; }
    }
}