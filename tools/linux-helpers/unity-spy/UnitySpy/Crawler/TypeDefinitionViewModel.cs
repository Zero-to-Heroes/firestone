namespace HackF5.UnitySpy.Crawler
{
    using System;
    using System.Collections;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using JetBrains.Annotations;

    public class TypeDefinitionViewModel
    {
        //private const string TrailSeparator = "-->";

        //private readonly CommandCollection commands;

        private readonly ITypeDefinition definition;

        //private readonly ListContentViewModel.Factory listContentFactory;

        //private readonly ManagedObjectInstanceContentViewModel.Factory managedObjectContentFactory;

        //private readonly TypeDefinitionContentViewModel.Factory typeDefinitionContentFactory;

        private object content;

        //private string path;

        public TypeDefinitionViewModel(
            //[NotNull] CommandCollection commands,
            [NotNull] ITypeDefinition definition)
        {
            //this.commands = commands ?? throw new ArgumentNullException(nameof(commands));
            this.definition = definition ?? throw new ArgumentNullException(nameof(definition));
            //this.typeDefinitionContentFactory = typeDefinitionContentFactory
            //    ?? throw new ArgumentNullException(nameof(typeDefinitionContentFactory));

            //this.managedObjectContentFactory = managedObjectContentFactory
            //    ?? throw new ArgumentNullException(nameof(managedObjectContentFactory));

            //this.listContentFactory = listContentFactory ?? throw new ArgumentNullException(nameof(listContentFactory));

            var model = new TypeDefinitionContentViewModel(this.definition);
            //model.AppendToTrail += this.ModelOnAppendToTrail;
            this.content = model;
        }

        public delegate TypeDefinitionViewModel Factory(ITypeDefinition definition);

        public object Content
        {
            get => this.content;
            set => this.content = value;
        }

        public string FullName => this.definition.FullName;

        public bool HasStaticFields => this.definition.Fields.Any(f => f.TypeInfo.IsStatic && !f.TypeInfo.IsConstant);
    }
}