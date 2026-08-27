namespace HackF5.UnitySpy.HearthstoneLib.Detail.Match
{
    internal class MatchInfo : IMatchInfo
    {
        public int BrawlSeasonId { get; set; }

        public GameFormat FormatType { get; set; }

        public GameType GameType { get; set; }

        public IPlayer LocalPlayer { get; set; }

        public int MissionId { get; set; }
        
        public int BoardDbId { get; set; }

        public IPlayer OpposingPlayer { get; set; }

        public bool Spectator { get; set; }
    }
}