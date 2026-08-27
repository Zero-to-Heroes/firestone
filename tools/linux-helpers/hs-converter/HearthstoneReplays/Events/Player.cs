#region

using System.Xml.Serialization;
using Newtonsoft.Json;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.Entities
{
	public class Player
	{
		public int Id { get; set; }

		public string AccountHi { get; set; }

		public string AccountLo { get; set; }
		
		public int PlayerId { get; set; }
		
		public string Name { get; set; }
		
		public string Rank { get; set; }
		
		public string LegendRank { get; set; }

		public string CardID { get; set; }

        public bool IsMainPlayer { get; set; }

		public override string ToString()
		{
			return JsonConvert.SerializeObject(this);
			//return "PlayerEntity: " + PlayerId + ", " + Name;
		}

		public static Player from(PlayerEntity entity)
		{
			Player player = new Player();
			player.Id = entity.Id;
			player.AccountHi = entity.AccountHi;
			player.AccountLo = entity.AccountLo;
			player.PlayerId = entity.PlayerId;
			player.Name = entity.Name;
			player.Rank = entity.Rank;
			player.LegendRank = entity.LegendRank;
            player.IsMainPlayer = entity.IsMainPlayer;
			return player;
		}
	}
}