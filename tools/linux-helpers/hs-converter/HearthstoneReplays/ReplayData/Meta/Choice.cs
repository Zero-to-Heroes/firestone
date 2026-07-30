#region

using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.Meta
{
	[XmlRoot("Choice")]
	public class Choice : GameData
	{
		[XmlAttribute("entity")]
		public int Entity { get; set; }

		[XmlAttribute("index")]
		public int Index { get; set; }
	}
}