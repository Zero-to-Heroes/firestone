#region

using System.Collections.Generic;
using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData
{
	[XmlRoot("HSReplay")]
	public class HearthstoneReplay
	{
		[XmlAttribute("build")]
		public string Build { get; set; }

		[XmlAttribute("version")]
		public string Version { get; set; }

		[XmlElement("Game")]
		public List<Game> Games { get; set; }
	}
}