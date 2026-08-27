#region

using System.Collections.Generic;
using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.Meta.Options
{
	public class SubOption : OptionItem
	{
		[XmlElement("Target", typeof(Target))]
		public List<Target> Targets { get; set; }
	}
}