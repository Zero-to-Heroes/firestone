namespace HackF5.UnitySpy.Crawler
{
    using System;
    using System.Collections;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Reflection;
    using JetBrains.Annotations;
    using TypeCode = HackF5.UnitySpy.Detail.TypeCode;

    [UsedImplicitly]
    public class StaticFieldViewModel
    {
        private readonly IFieldDefinition field;

        public StaticFieldViewModel([NotNull] IFieldDefinition field)
        {
            this.field = field ?? throw new ArgumentNullException(nameof(field));
        }

        //public delegate StaticFieldViewModel Factory(IFieldDefinition field);

        public string Name => this.field.Name;

        public string TypeName
        {
            get
            {
                if (this.field.TypeInfo.TryGetTypeDefinition(out var typeDefinition))
                {
                    return typeDefinition.FullName;
                }

                var typeName = this.field.TypeInfo.TypeCode.ToString();
                var member = typeof(TypeCode).GetMember(typeName).FirstOrDefault();
                return member?.GetCustomAttribute<DescriptionAttribute>()?.Description ?? typeName;
            }
        }

        public object Value
        {
            get
            {
                try
                {
                    return this.field.DeclaringType.GetStaticValue<object>(this.Name);
                }
                catch (Exception ex)
                {
                    return $"ERROR: {ex.Message}";
                }
            }
        }
    }
}