#region

using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.GameActions
{
	public class TagChange : GameAction
	{
		[XmlAttribute("tag")]
		public int Name { get; set; }

        [XmlAttribute("value")]
        public int Value { get; set; }

        [XmlAttribute("defChange")]
        public string DefChange { get; set; }

		[XmlIgnore]
		public SubSpell SubSpellInEffect { get; set; }

		public override bool Equals(object obj)
		{
			var other = obj as TagChange;
			if(other == null)
				return false;
			return other.Entity == Entity && other.Name == Name && other.Value == Value && other.DefChange == DefChange;
		}
	}
}