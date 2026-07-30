#region

using System.ComponentModel;
using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.Meta.Options
{
	public class SendOption : GameData
	{
		[XmlAttribute("option")]
		public int OptionIndex { get; set; }

		[XmlAttribute("position")]
		public int Position { get; set; }

		[XmlAttribute("suboption"), DefaultValue(-1)]
		public int SubOption { get; set; }

		[XmlAttribute("target")]
		public int Target { get; set; }
	}
}