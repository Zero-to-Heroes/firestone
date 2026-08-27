#region

using HearthstoneReplays.Enums;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.GameActions
{
	public class ChangeEntity : GameData

	{
		[XmlAttribute("cardID")]
		public string CardId { get; set; }

		[XmlAttribute("entity")]
		public int Entity { get; set; }

		[XmlElement("Tag", typeof(Tag))]
		public List<Tag> Tags { get; set; }

		public int GetTag(GameTag tag, int defaultValue = -1)
		{
			var match = Tags.FirstOrDefault(t => t.Name == (int)tag);
			return match == null ? defaultValue : match.Value;
		}
	}
}