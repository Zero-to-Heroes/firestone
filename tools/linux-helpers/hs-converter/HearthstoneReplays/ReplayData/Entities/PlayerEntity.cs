#region

using System.Xml.Serialization;
using Newtonsoft.Json;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.Entities
{
	public class PlayerEntity : BaseEntity
	{
		[XmlAttribute("accountHi")]
		public string AccountHi { get; set; }

		[XmlAttribute("accountLo")]
		public string AccountLo { get; set; }

		[XmlAttribute("playerID")]
		public int PlayerId { get; set; }

        [XmlAttribute("name")]
        public string Name { get; set; }

        public string InitialName { get; set; }

        [XmlAttribute("rank")]
		public string Rank { get; set; }

		[XmlAttribute("legendRank")]
		public string LegendRank { get; set; }

		[XmlAttribute("cardback")]
		public string Cardback { get; set; }

        [XmlAttribute("isMainPlayer")]
        public bool IsMainPlayer { get; set; }

        public override string ToString()
		{
			return JsonConvert.SerializeObject(this);
			//return "PlayerEntity: " + PlayerId + ", " + Name;
		}
	}
}