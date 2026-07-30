namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;
    using System.Collections.Generic;

    [PublicAPI]
    public interface IMercenariesCollection
    {
        IReadOnlyList<IMercenary> Mercenaries { get; }

        IReadOnlyList<IMercenariesTeam> Teams { get; }

        IReadOnlyList<IMercenariesVisitor> Visitors { get; }
    }

    [PublicAPI]
    public interface IMercenariesTeam
    {
        long Id { get; }

        string Name{ get; }

        IReadOnlyList<IMercenary> Mercenaries { get; }
    }

    [PublicAPI]
    public interface IMercenariesVisitor
    {
        int VisitorId { get; }

        int ProceduralMercenaryId { get; }

        int ProceduralBountyId { get; }

        int TaskId { get; }

        int TaskChainProgress { get; }

        int TaskProgress { get; }

        int Status { get; }
        IReadOnlyList<int> AdditionalMercenaryIds { get; }
    }
}