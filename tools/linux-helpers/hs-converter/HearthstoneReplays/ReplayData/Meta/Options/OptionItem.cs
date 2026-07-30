#region

using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.Meta.Options
{
	[XmlInclude(typeof(SubOption))]
	[XmlInclude(typeof(Target))]
	public abstract class OptionItem : GameData
	{
		[XmlAttribute("index")]
		public int Index { get; set; }

		[XmlAttribute("entity")]
		public int Entity { get; set; }
	}
}