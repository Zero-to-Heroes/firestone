using System.Collections.Generic;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.Mercenaries
{
    internal class MercenariesMap : IMercenariesMap
    {
        public uint BountyId { get; set; }

        public long MapId { get; set; }

        public int MapType { get; set; }

        public long Seed { get; set; }

        public long PlayerTeamId { get; set; }

        public string PlayerTeamName { get; set; }

        public IReadOnlyList<int> PlayerTeamMercIds { get; set; }

        public IReadOnlyList<int> DeadMercIds { get; set; }

        public IReadOnlyList<IMercenary> PlayerTeam { get; set; }

        public uint CurrentStep { get; set; }

        public uint MaxStep { get; set; }

        public uint TurnsTaken { get; set; }
    }
}