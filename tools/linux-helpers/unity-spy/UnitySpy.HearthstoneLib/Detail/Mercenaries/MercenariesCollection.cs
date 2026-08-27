using System.Collections.Generic;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.Mercenaries
{
    internal class MercenariesCollection : IMercenariesCollection
    {
        public IReadOnlyList<IMercenary> Mercenaries { get; set; }

        public IReadOnlyList<IMercenariesTeam> Teams { get; set; }

        public IReadOnlyList<IMercenariesVisitor> Visitors { get; set; }
    }

    internal class MercenariesTeam : IMercenariesTeam
    {
        public long Id { get; set; }

        public string Name { get; set; }

        public IReadOnlyList<IMercenary> Mercenaries { get; set; }
    }

    internal class MercenariesVisitor : IMercenariesVisitor
    {
        public int VisitorId { get; set; }

        public int ProceduralMercenaryId { get; set; }
        
        public int ProceduralBountyId { get; set; }

        public int TaskId { get; set; }

        public int TaskChainProgress { get; set; }

        public int TaskProgress { get; set; }

        public int Status { get; set; }

        public IReadOnlyList<int> AdditionalMercenaryIds { get; set; }


        override public bool Equals(object obj)
        {
            if (!(obj is MercenariesVisitor))
            {
                return false;
            }

            var other = obj as MercenariesVisitor;
            if (other == null)
            {
                return false;
            }

            return this.VisitorId == other.VisitorId
                && this.TaskId == other.TaskId
                && this.TaskChainProgress == other.TaskChainProgress
                && this.TaskProgress == other.TaskProgress
                && this.Status == other.Status;
        }
    }
}