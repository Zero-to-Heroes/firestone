namespace HackF5.UnitySpy.HearthstoneLib
{
    using JetBrains.Annotations;
    using System.Collections.Generic;

    [PublicAPI]
    public interface IMercenariesMap
    {
        uint BountyId { get; }

        long MapId { get; }

        long Seed { get; }

        long PlayerTeamId { get; }

        string PlayerTeamName { get; }

        IReadOnlyList<int> PlayerTeamMercIds { get; }

        IReadOnlyList<int> DeadMercIds { get; }

        IReadOnlyList<IMercenary> PlayerTeam { get; }

        uint CurrentStep { get; }

        uint MaxStep { get; }

        uint TurnsTaken { get; }
    }
}