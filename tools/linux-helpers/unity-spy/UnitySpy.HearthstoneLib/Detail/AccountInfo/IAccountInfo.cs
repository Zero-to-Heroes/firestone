namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;

    [PublicAPI]
    public interface IAccountInfo
    {
        ulong Hi { get; }

        ulong Lo { get; }
    }
}