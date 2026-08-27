#region

using System.Collections.Generic;
using System.ComponentModel;
using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.Meta
{
	public class MetaData : GameData
	{
		[XmlAttribute("data")]
		public int Data { get; set; }

		[XmlAttribute("entity")]
		public int Entity { get; set; }

		[XmlAttribute("info")]
		public int Info { get; set; }

		[XmlAttribute("meta")]
		public int Meta { get; set; }

		[XmlElement("Info", typeof(Info))]
		public List<Info> MetaInfo { get; set; }
	}
}