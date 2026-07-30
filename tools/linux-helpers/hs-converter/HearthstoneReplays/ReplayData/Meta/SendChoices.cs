#region

using System.Collections.Generic;
using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.Meta
{
	public class SendChoices : GameData
	{
		[XmlElement("Choice", typeof(Choice))]
		public List<Choice> Choices;

		[XmlAttribute("entity")]
		public int Entity { get; set; }

		[XmlAttribute("type")]
		public int Type { get; set; }
	}
}