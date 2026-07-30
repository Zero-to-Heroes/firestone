using System.Collections.Generic;
using System.Xml.Serialization;
using HearthstoneReplays.Parser.ReplayData.Meta;

namespace HearthstoneReplays.Parser.ReplayData.GameActions
{
	public class ChosenEntities : GameData
	{
		[XmlAttribute("entity")]
		public int Entity { get; set; }

		[XmlAttribute("playerID")]
		public int PlayerId { get; set; }

		[XmlAttribute("count")]
		public int Count { get; set; }
		
		[XmlElement("Choice", typeof(Choice))]
		public List<Choice> Choices;
	}
}