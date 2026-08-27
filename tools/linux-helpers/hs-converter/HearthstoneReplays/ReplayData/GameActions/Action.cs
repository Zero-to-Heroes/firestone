#region

using System.Collections.Generic;
using System.ComponentModel;
using System.Xml.Serialization;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Parser.ReplayData.Meta.Options;

#endregion

namespace HearthstoneReplays.Parser.ReplayData.GameActions
{
	public class Action : GameAction
	{
		[XmlAttribute("index"), DefaultValue(-1)]
		public int Index { get; set; }

		[XmlAttribute("effectIndex"), DefaultValue(-1)]
		public int EffectIndex { get; set; }

		[XmlAttribute("target"), DefaultValue(0)]
		public int Target { get; set; }

		[XmlAttribute("type")]
		public int Type { get; set; }

		[XmlAttribute("subOption")] 
		public int SubOption { get; set; }

		[XmlAttribute("triggerKeyword")]
		public int TriggerKeyword { get; set; }

		[XmlElement("Block", typeof(Action))]
		[XmlElement("Choices", typeof(Choices))]
		[XmlElement("FullEntity", typeof(FullEntity))]
		[XmlElement("ChangeEntity", typeof(ChangeEntity))]
		[XmlElement("ShowEntity", typeof(ShowEntity))]
		[XmlElement("HideEntity", typeof(HideEntity))]
		[XmlElement("GameEntity", typeof(GameEntity))]
		[XmlElement("Options", typeof(Options))]
		[XmlElement("Player", typeof(PlayerEntity))]
		[XmlElement("SendChoices", typeof(SendChoices))]
		[XmlElement("SendOption", typeof(SendOption))]
		[XmlElement("TagChange", typeof(TagChange))]
		[XmlElement("MetaData", typeof(MetaData))]
		[XmlElement("ChosenEntities", typeof(ChosenEntities))]
		[XmlElement("ShuffleDeck", typeof(ShuffleDeck))]
		public List<GameData> Data { get; set; }

		[XmlIgnore]
		public List<SubSpell> SubSpells { get; set; } = new List<SubSpell>();

		[XmlIgnore]
		public string DebugCreationLine { get; set; }

		// Introduced to track plague actions + Helya interactions, as it was starting to get really messy
        [XmlIgnore]
        public bool Processed { get; set; }

        public readonly object listLock = new object();
        public void AddData(GameData data)
        {
            lock (listLock)
            {
                Data.Add(data);
            }
        }


        public List<GameData> GetDataRecursive()
		{
			var result = new List<GameData>();
			foreach (var data in Data)
            {
				result.Add(data);
				if (data.GetType() == typeof(Action))
                {
					result.AddRange((data as Action).GetDataRecursive());
                }
            }
			return result;
		}
	}
}