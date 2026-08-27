namespace HackF5.UnitySpy.HearthstoneLib.Detail.Deck
{
    using System.Collections.Generic;
    using HackF5.UnitySpy.HearthstoneLib;

    public class Deck : IDeck
    {
        public long DeckId { get; set; }

        public string Id { get; set; }

        public string Name { get; set; }
        public int Losses { get; set; }
        public int Wins { get; set; }
        public GameType GameType { get; set; }

        public IList<string> DeckList { get; set; }

        public int HeroClass { get; set; }

        public string HeroCardId { get; set; }

        public string HeroPowerCardId { get; set; }

        public int FormatType { get; set; }

        public List<DeckSideboard> Sideboards { get; set; }
    }

    public class DeckSideboard
    {
        public string KeyCardId { get; set; }
        public List<string> Cards { get; set; }
    }
}
