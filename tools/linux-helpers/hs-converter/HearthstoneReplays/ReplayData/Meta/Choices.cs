#region

using System.Collections.Generic;
using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.Meta
{
	[XmlRoot("Choices")]
	public class Choices : GameData
	{
		[XmlAttribute("id")]
		public int Id { get; set; }

		[XmlAttribute("max")]
		public int Max { get; set; }

		[XmlAttribute("min")]
		public int Min { get; set; }

		[XmlAttribute("playerID")]
		public int PlayerId { get; set; }

		[XmlAttribute("source")]
		public int Source { get; set; }

		[XmlAttribute("taskList")]
		public int TaskList { get; set; }

		[XmlAttribute("type")]
		public int Type { get; set; }

		[XmlElement("Choice", typeof(Choice))]
		public List<Choice> ChoiceList { get; set; }
	}
}