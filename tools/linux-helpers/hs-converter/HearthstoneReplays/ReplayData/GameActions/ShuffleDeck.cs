#region

using System.Xml.Serialization;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.GameActions
{
	public class ShuffleDeck : GameAction
	{
		[XmlAttribute("playerId")]
		public int PlayerId { get; set; }

		public override bool Equals(object obj)
		{
			var other = obj as ShuffleDeck;
			if(other == null)
				return false;
			return other.PlayerId == PlayerId;
		}
	}
}