using HackF5.UnitySpy.HearthstoneLib.Detail.ArenaInfo;
using System.Collections.Generic;
using System.Linq;

namespace HackF5.UnitySpy.HearthstoneLib
{
    public class ArenaCardPick
    {
        public GameType GameType { get; set; }
        public string RunId { get; set; }
        public int PickNumber { get; set; }
        public string CardId {  get; set; }
        public List<ArenaCardOption> Options { get; set; }
        public string HeroCardId {  get; set; }

        public override string ToString()
        {
            return $"RunId: {RunId}, PickNumber: {PickNumber}, Options: {string.Join(", ", Options.Select(o => o.CardId).ToList())}, CardId: {CardId}";
        }
    }

    public class ArenaCardOption
    {
        public string CardId { get; set; }
        public List<string> PackageCardIds {  get; set; }

        public override bool Equals(object obj)
        {
            var other = obj as ArenaCardOption;
            if (other == null)
                return false;

            if (CardId != other.CardId)
                return false;

            if (PackageCardIds == null && other.PackageCardIds == null)
                return true;

            if (PackageCardIds == null || other.PackageCardIds == null)
                return false;

            if (PackageCardIds.Count != other.PackageCardIds.Count)
                return false;

            for (int i = 0; i < PackageCardIds.Count; i++)
            {
                if (PackageCardIds[i] != other.PackageCardIds[i])
                    return false;
            }

            return true;
        }
    }
}
