#region

using System.Text.RegularExpressions;

#endregion

namespace HearthstoneReplays.Parser
{
	public class Regexes
	{
		private const string Entity = @"(GameEntity|UNKNOWN HUMAN PLAYER|\[.+\]|\d+|.+)";

        public static readonly Regex EntityWithNameAndId = new Regex(@"\[entityName=(.+) id=(\d+) .*\]", RegexOptions.Compiled);
        public static readonly Regex PowerlogLineRegex = new Regex(@"^D ([\d:.]+) ([^(]+)\(\) - (.+)$", RegexOptions.Compiled);
		//public static readonly Regex OutputlogLineRegex = new Regex(@"\[Power\] ()([^(]+)\(\) - (.+)$", RegexOptions.Compiled);
		public static readonly Regex EntityRegex = new Regex(@"\[.*\s*id=(\d+)\s*.*\]", RegexOptions.Compiled);

        public static readonly Regex ResetStartMatchRegex =
            new Regex(string.Format(@"BLOCK_START BlockType=GAME_RESET Entity={0}", Entity), RegexOptions.Compiled);


        //public static readonly Regex ChoicesChoiceRegex_OLD =
        //          new Regex(@"id=(\d+) PlayerId=(\d+) ChoiceType=(\w+) CountMin=(\d+) CountMax=(\d+)$");
        public static readonly Regex ChoicesChoiceRegex =
			new Regex(string.Format(@"id=(\d+) Player={0} TaskList=(\d+)? ChoiceType=(\w+) CountMin=(\d+) CountMax=(\d+)$", Entity), RegexOptions.Compiled);
		public static readonly Regex ChoicesSourceRegex = new Regex(string.Format(@"Source={0}$", Entity), RegexOptions.Compiled);
		public static readonly Regex ChoicesEntitiesRegex = new Regex(@"Entities\[(\d+)\]=(\[.+\])$", RegexOptions.Compiled);
		public static readonly Regex ChoicesWaitingForInput = new Regex(@"id=(\d+) BEGIN$", RegexOptions.Compiled);

		public static readonly Regex GameEntityRegex = new Regex(@"GameEntity EntityID=(\d+)", RegexOptions.Compiled);
		public static readonly Regex ActionCreategamePlayerRegex =
			new Regex(@"Player EntityID=(\d+) PlayerID=(\d+) GameAccountId=\[hi=(\d+) lo=(\d+)\]$", RegexOptions.Compiled);
		//public static readonly Regex ActionStartRegex_8_4 =
		//	new Regex(string.Format(@"BLOCK_START (?:SubType|BlockType)=(\w+) Entity={0} EffectCardId=(.*) EffectIndex=(-1|\d+) Target={0}$", Entity), RegexOptions.Compiled);
		//public static readonly Regex ActionStartRegex_Short =
		//	new Regex(string.Format(@"BLOCK_START (?:SubType|BlockType)=(\w+) Entity={0} EffectCardId=(.*) EffectIndex=(-1|\d+) Target={0} SubOption={0}$", Entity), RegexOptions.Compiled);
		public static readonly Regex ActionStartRegex =
			new Regex(string.Format(@"BLOCK_START (?:SubType|BlockType)=(\w+) Entity={0} EffectCardId=(.*) EffectIndex=(-1|\d+) Target={0} SubOption=(-1|\d+)(?: TriggerKeyword=(.*))?$", Entity), RegexOptions.Compiled);

        public static readonly Regex PlayerNameAssignment = new Regex(@"PlayerID=(\d+), PlayerName=(.+)", RegexOptions.Compiled);

		public static readonly Regex BuildNumber = new Regex(@"BuildNumber=(\d+)", RegexOptions.Compiled);
		public static readonly Regex GameType = new Regex(@"GameType=(\w+)", RegexOptions.Compiled);
		public static readonly Regex FormatType = new Regex(@"FormatType=(\w+)", RegexOptions.Compiled);
		public static readonly Regex ScenarioID = new Regex(@"ScenarioID=(\d+)", RegexOptions.Compiled);

		public static readonly Regex ActionMetadataRegex = new Regex(string.Format(@"META_DATA - Meta=(\w+) Data={0} (?:Info|InfoCount)=(\d+)", Entity), RegexOptions.Compiled);
		public static readonly Regex ActionMetaDataInfoRegex = new Regex(string.Format(@"Info\[(\d+)\] = {0}", Entity), RegexOptions.Compiled);

		public static readonly Regex ActionChangeEntityRegex = new Regex(string.Format(@"CHANGE_ENTITY - Updating Entity={0} CardID=(\w+)$", Entity), RegexOptions.Compiled);
		public static readonly Regex ActionShowEntityRegex = new Regex(string.Format(@"SHOW_ENTITY - Updating Entity={0} CardID=(\w+)$", Entity), RegexOptions.Compiled);
		public static readonly Regex ActionHideEntityRegex = new Regex(string.Format(@"HIDE_ENTITY - Entity={0} tag=(\w+) value=(\w+)", Entity), RegexOptions.Compiled);
		public static readonly Regex ActionFullEntityUpdatingRegex = new Regex(string.Format(@"FULL_ENTITY - Updating {0} CardID=(\w+)?$", Entity), RegexOptions.Compiled);
		public static readonly Regex ActionFullEntityCreatingRegex = new Regex(@"FULL_ENTITY - Creating ID=(\d+) CardID=(\w+)?$", RegexOptions.Compiled);
		public static readonly Regex SubSpellStartRegex = new Regex(@"SUB_SPELL_START - SpellPrefabGUID=(.+):.* Source=(\d+).*$", RegexOptions.Compiled);
		public static readonly Regex SubSpellEndRegex = new Regex(@"SUB_SPELL_END.*$", RegexOptions.Compiled);
		public static readonly Regex SubSpellSourceRegex = new Regex(string.Format(@"Source = {0}$", Entity), RegexOptions.Compiled);
		public static readonly Regex SubSpellTargetsRegex = new Regex(string.Format(@"Targets\[\d+\] = {0}$", Entity), RegexOptions.Compiled);

		public static readonly Regex ActionTagChangeRegex = new Regex(string.Format(@"TAG_CHANGE Entity={0} tag=(\w+) value=(\w+)( DEF CHANGE)?", Entity), RegexOptions.Compiled);
		public static readonly Regex ActionTagRegex = new Regex(@"tag=(\w+) value=(\w+)", RegexOptions.Compiled);

		public static readonly Regex ActionShuffleDeckRegex = new Regex(string.Format(@"SHUFFLE_DECK PlayerID=(\d+)"), RegexOptions.Compiled);

		public static readonly Regex EntitiesChosenRegex = new Regex(string.Format(@"id=(\d+) Player={0} EntitiesCount=(\d+)$", Entity), RegexOptions.Compiled);
		public static readonly Regex EntitiesChosenEntitiesRegex = new Regex(string.Format(@"Entities\[(\d+)\]={0}$", Entity), RegexOptions.Compiled);
		
		public static readonly Regex OptionsEntityRegex = new Regex(@"id=(\d+)$");
		public static readonly Regex OptionsOptionRegex = new Regex(string.Format(@"option (\d+) type=(\w+) mainEntity={0}? error=(.*) errorParam=(.*)$", Entity), RegexOptions.Compiled);
		public static readonly Regex OptionsSuboptionRegex = new Regex(string.Format(@"(subOption|target) (\d+) entity={0}? error=(.*) errorParam=(.*)$", Entity), RegexOptions.Compiled);

		public static readonly Regex SendChoicesChoicetypeRegex = new Regex(@"id=(\d+) ChoiceType=(.+)$", RegexOptions.Compiled);
		public static readonly Regex SendChoicesEntitiesRegex = new Regex(@"m_chosenEntities\[(\d+)\]=(\[.+\])$", RegexOptions.Compiled);

		public static readonly Regex SendOptionRegex =
			new Regex(@"selectedOption=(\d+) selectedSubOption=(-1|\d+) selectedTarget=(\d+) selectedPosition=(\d+)", RegexOptions.Compiled);
	}
}