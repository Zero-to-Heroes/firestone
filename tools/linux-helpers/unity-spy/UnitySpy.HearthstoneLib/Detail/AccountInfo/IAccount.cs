namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IAccount
    {
        ulong Hi { get; set; }

        ulong Lo { get; set; }
    }
}