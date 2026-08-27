namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IPlayer
    {
        string Name { get; }

        int Id { get; }

        IRank Standard { get; }
        IRank Wild{ get; }
        IRank Classic{ get; }
        IRank Twist{ get; }

        int CardBackId { get; }

        IAccount Account { get; }

        IBattleTag BattleTag { get; }
    }
}