#region

using System;
using System.Xml.Serialization;
using HearthstoneReplays.Enums;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.GameActions
{
	public class Tag
	{
		[XmlAttribute("tag")]
		public int Name { get; set; }

		[XmlAttribute("value")]
		public int Value { get; set; }

		public override string ToString()
        {
			string tagName = Enum.GetName(typeof(GameTag), Name);
			if (tagName == null || tagName.Length == 0)
            {
				tagName = "" + Name;
            }
			return $"{tagName}: {Value}";
        }
	}
}