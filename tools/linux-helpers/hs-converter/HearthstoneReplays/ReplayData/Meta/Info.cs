#region

using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.Meta
{
	public class Info : GameData
	{
		[XmlAttribute("index")]
		public int Index { get; set; }

		[XmlAttribute("id")]
		public int Id { get; set; }

		[XmlAttribute("entity")]
		public int Entity { get; set; }
	}
}