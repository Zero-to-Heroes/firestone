namespace HackF5.UnitySpy.Crawler
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    public class TypeDefinitionContentViewModel
    {
        private readonly ITypeDefinition definition;

        public TypeDefinitionContentViewModel([NotNull] ITypeDefinition definition)
        {
            this.definition = definition ?? throw new ArgumentNullException(nameof(definition));
            this.StaticFields = this.definition.Fields.Where(f => f.TypeInfo.IsStatic && !f.TypeInfo.IsConstant)
                .Select(f => new StaticFieldViewModel(f))
                .ToArray();
        }

        //public delegate TypeDefinitionContentViewModel Factory(ITypeDefinition definition);

        public IEnumerable<StaticFieldViewModel> StaticFields { get; }
    }
}