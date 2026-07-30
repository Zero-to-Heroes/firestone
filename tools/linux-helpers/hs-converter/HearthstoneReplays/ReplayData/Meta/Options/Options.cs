#region

using System.Collections.Generic;
using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.Meta.Options
{
	public class Options : GameData
	{
		[XmlAttribute("id")]
		public int Id { get; set; }

		[XmlElement("Option")]
		public List<Option> OptionList { get; set; }
	}
}