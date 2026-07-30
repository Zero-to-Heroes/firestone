namespace HackF5.UnitySpy.HearthstoneLib.Detail.Match
{
    internal class Player : IPlayer
    {
        public string Name { get; set; }

        public int Id { get; set; }

        public IRank Standard { get; set; }
        public IRank Wild { get; set; }
        public IRank Classic { get; set; }
        public IRank Twist { get; set; }

        //public int StandardRank { get; set; }

        //public int StandardLegendRank { get; set; }

        //public int StandardStars { get; set; }

        //public int WildRank { get; set; }

        //public int WildLegendRank { get; set; }

        //public int WildStars { get; set; }

        public int CardBackId { get; set; }

        public IAccount Account { get; set; }

        public IBattleTag BattleTag { get; set; }
    }
}
