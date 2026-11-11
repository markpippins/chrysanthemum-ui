/**
 * UML 2.5 to TypeScript Automated Code Generation Engine
 */

import { 
  UMLProject, 
  UMLElement, 
  UMLRelationship, 
  CodeGenConfig, 
  GeneratedFile,
  UMLVisibility,
  UMLAttribute,
  UMLOperation
} from '../types/uml';

export class TypeScriptCodeGenerator {
  private project: UMLProject;
  private config: CodeGenConfig;

  constructor(project: UMLProject, config?: Partial<CodeGenConfig>) {
    this.project = project;
    this.config = {
      target: 'ES2022',
      moduleSystem: 'ESM',
      useDecorators: true,
      generateGettersSetters: false,
      generateConstructors: true,
      generateJSDoc: true,
      strictNullChecks: true,
      generateIndexBarrel: true,
      filePerClass: true,
      indentSpaces: 2,
      ...project.codeGenConfig,
      ...config
    };
  }

  public generateAll(): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const elements = this.project.elements.filter(e => e.type !== 'note' && e.type !== 'actor' && e.type !== 'usecase');

    if (this.config.filePerClass) {
      // Multi-file generation (one file per element)
      for (const element of elements) {
        const content = this.generateElementFile(element);
        const filename = `${element.name}.ts`;
        files.push({
          filename,
          filepath: `src/${filename}`,
          content,
          description: `${element.type.toUpperCase()}: ${element.name}`,
          elementId: element.id
        });
      }

      // Generate index.ts barrel file
      if (this.config.generateIndexBarrel && elements.length > 0) {
        const barrelContent = this.generateBarrelFile(elements);
        files.push({
          filename: 'index.ts',
          filepath: 'src/index.ts',
          content: barrelContent,
          description: 'Project barrel export entry point'
        });
      }
    } else {
      // Single unified file generation
      const singleFileContent = this.generateSingleFile(elements);
      files.push({
        filename: `${this.project.name.replace(/\s+/g, '') || 'Model'}.ts`,
        filepath: `src/${this.project.name.replace(/\s+/g, '') || 'Model'}.ts`,
        content: singleFileContent,
        description: 'Complete unified TypeScript model definitions'
      });
    }

    return files;
  }

  public generateElementCode(element: UMLElement): string {
    switch (element.type) {
      case 'class':
        return this.generateClass(element);
      case 'interface':
        return this.generateInterface(element);
      case 'enum':
        return this.generateEnum(element);
      case 'typeAlias':
        return this.generateTypeAlias(element);
      default:
        return `// UML Element: ${element.name} (${element.type})\n`;
    }
  }

  private generateElementFile(element: UMLElement): string {
    const indent = ' '.repeat(this.config.indentSpaces);
    const imports = this.resolveImports(element);
    const code = this.generateElementCode(element);

    let header = `/**\n * Automated Code Generation from Rational Rose UML 2.5\n * Element: ${element.name} (${element.type})\n * Generated at: ${new Date().toISOString()}\n */\n\n`;

    if (imports.length > 0) {
      header += imports.join('\n') + '\n\n';
    }

    return header + code;
  }

  private resolveImports(element: UMLElement): string[] {
    const imports: string[] = [];
    const neededTypes = new Set<string>();

    // 1. Generalization (extends)
    const extendsRel = this.project.relationships.find(
      r => r.sourceId === element.id && r.type === 'generalization'
    );
    if (extendsRel) {
      const parent = this.project.elements.find(e => e.id === extendsRel.targetId);
      if (parent && parent.name !== element.name) {
        neededTypes.add(parent.name);
      }
    }

    // 2. Realization (implements)
    const implementsRels = this.project.relationships.filter(
      r => r.sourceId === element.id && r.type === 'realization'
    );
    for (const rel of implementsRels) {
      const iface = this.project.elements.find(e => e.id === rel.targetId);
      if (iface && iface.name !== element.name) {
        neededTypes.add(iface.name);
      }
    }

    // 3. Associations, Aggregations, Compositions & Dependencies
    const rels = this.project.relationships.filter(
      r => (r.sourceId === element.id || r.targetId === element.id) &&
           (r.type === 'association' || r.type === 'directed_association' || 
            r.type === 'aggregation' || r.type === 'composition' || r.type === 'dependency')
    );
    for (const rel of rels) {
      const otherId = rel.sourceId === element.id ? rel.targetId : rel.sourceId;
      const other = this.project.elements.find(e => e.id === otherId);
      if (other && other.name !== element.name) {
        neededTypes.add(other.name);
      }
    }

    // 4. Attribute types & Method parameter/return types
    for (const attr of element.attributes) {
      const baseType = this.extractBaseType(attr.type);
      if (this.isKnownModelType(baseType) && baseType !== element.name) {
        neededTypes.add(baseType);
      }
    }

    for (const op of element.operations) {
      const returnBase = this.extractBaseType(op.returnType);
      if (this.isKnownModelType(returnBase) && returnBase !== element.name) {
        neededTypes.add(returnBase);
      }
      for (const param of op.parameters) {
        const paramBase = this.extractBaseType(param.type);
        if (this.isKnownModelType(paramBase) && paramBase !== element.name) {
          neededTypes.add(paramBase);
        }
      }
    }

    // Format imports
    for (const typeName of Array.from(neededTypes).sort()) {
      if (this.config.moduleSystem === 'ESM') {
        imports.push(`import { ${typeName} } from './${typeName}';`);
      } else {
        imports.push(`const { ${typeName} } = require('./${typeName}');`);
      }
    }

    return imports;
  }

  private isKnownModelType(typeStr: string): boolean {
    return this.project.elements.some(e => e.name === typeStr);
  }

  private extractBaseType(typeStr: string): string {
    if (!typeStr) return 'any';
    let clean = typeStr.replace(/[\[\]\<\>\?\s]/g, '');
    if (clean.includes('|')) {
      clean = clean.split('|')[0].trim();
    }
    return clean;
  }

  private generateClass(element: UMLElement): string {
    const indent = ' '.repeat(this.config.indentSpaces);
    const lines: string[] = [];

    // JSDoc
    if (this.config.generateJSDoc && element.docComment) {
      lines.push(this.formatJSDoc(element.docComment));
    }

    // Decorators
    if (this.config.useDecorators && element.decorators && element.decorators.length > 0) {
      for (const dec of element.decorators) {
        lines.push(dec.startsWith('@') ? dec : `@${dec}`);
      }
    }

    // Class Signature
    let classDecl = 'export ';
    if (element.isAbstract || element.stereotype === 'abstract') {
      classDecl += 'abstract ';
    }
    classDecl += `class ${element.name}`;

    if (element.typeParameters) {
      classDecl += `<${element.typeParameters}>`;
    }

    // Extends
    const extendsRel = this.project.relationships.find(
      r => r.sourceId === element.id && r.type === 'generalization'
    );
    if (extendsRel) {
      const parent = this.project.elements.find(e => e.id === extendsRel.targetId);
      if (parent) {
        classDecl += ` extends ${parent.name}`;
      }
    }

    // Implements
    const implementsRels = this.project.relationships.filter(
      r => r.sourceId === element.id && r.type === 'realization'
    );
    if (implementsRels.length > 0) {
      const ifaceNames = implementsRels
        .map(r => this.project.elements.find(e => e.id === r.targetId)?.name)
        .filter(Boolean);
      if (ifaceNames.length > 0) {
        classDecl += ` implements ${ifaceNames.join(', ')}`;
      }
    }

    classDecl += ' {';
    lines.push(classDecl);

    // Relationship-injected properties (Associations, Aggregations, Compositions)
    const relProperties = this.deriveRelationshipProperties(element);
    
    // Attributes
    const allAttributes = [...element.attributes];
    
    // Check for attributes and rel properties
    if (allAttributes.length > 0 || relProperties.length > 0) {
      for (const attr of allAttributes) {
        if (this.config.generateJSDoc && attr.docComment) {
          lines.push(this.formatJSDoc(attr.docComment, indent));
        }
        if (this.config.useDecorators && attr.decorators) {
          for (const dec of attr.decorators) {
            lines.push(`${indent}${dec.startsWith('@') ? dec : `@${dec}`}`);
          }
        }
        lines.push(this.formatAttribute(attr, indent));
      }

      for (const relProp of relProperties) {
        lines.push(`${indent}${relProp}`);
      }
      lines.push('');
    }

    // Constructor
    if (this.config.generateConstructors) {
      const constructorCode = this.generateConstructor(element, extendsRel !== undefined);
      if (constructorCode) {
        lines.push(constructorCode);
        lines.push('');
      }
    }

    // Getters & Setters
    if (this.config.generateGettersSetters) {
      for (const attr of allAttributes) {
        if (attr.visibility !== 'public') {
          lines.push(this.generateGetterSetter(attr, indent));
          lines.push('');
        }
      }
    }

    // Operations / Methods
    for (let i = 0; i < element.operations.length; i++) {
      const op = element.operations[i];
      if (this.config.generateJSDoc) {
        lines.push(this.formatMethodJSDoc(op, indent));
      }
      if (this.config.useDecorators && op.decorators) {
        for (const dec of op.decorators) {
          lines.push(`${indent}${dec.startsWith('@') ? dec : `@${dec}`}`);
        }
      }
      lines.push(this.formatOperation(op, indent));
      if (i < element.operations.length - 1) {
        lines.push('');
      }
    }

    // Composition helper methods (e.g. addItem, removeItem)
    const compHelpers = this.generateCompositionHelpers(element, indent);
    if (compHelpers) {
      lines.push('');
      lines.push(compHelpers);
    }

    lines.push('}');
    return lines.join('\n');
  }

  private deriveRelationshipProperties(element: UMLElement): string[] {
    const props: string[] = [];
    const rels = this.project.relationships.filter(
      r => r.sourceId === element.id && 
          (r.type === 'composition' || r.type === 'aggregation' || r.type === 'directed_association' || r.type === 'association')
    );

    for (const rel of rels) {
      const target = this.project.elements.find(e => e.id === rel.targetId);
      if (!target) continue;

      const isMultiple = rel.targetMultiplicity === '*' || rel.targetMultiplicity === '1..*' || (rel.targetMultiplicity && rel.targetMultiplicity.includes('..*'));
      const propName = rel.targetRole || (isMultiple ? `${this.lowercaseFirst(target.name)}List` : this.lowercaseFirst(target.name));
      const isOptional = rel.targetMultiplicity === '0..1' || !rel.targetMultiplicity;
      
      // Avoid duplicate if already explicitly defined in attributes
      if (element.attributes.some(a => a.name === propName)) continue;

      if (isMultiple) {
        props.push(`private ${propName}: ${target.name}[] = [];`);
      } else if (isOptional) {
        props.push(`public ${propName}?: ${target.name};`);
      } else {
        props.push(`public ${propName}!: ${target.name};`);
      }
    }

    return props;
  }

  private generateCompositionHelpers(element: UMLElement, indent: string): string {
    const helpers: string[] = [];
    const rels = this.project.relationships.filter(
      r => r.sourceId === element.id && (r.type === 'composition' || r.type === 'aggregation')
    );

    for (const rel of rels) {
      const target = this.project.elements.find(e => e.id === rel.targetId);
      if (!target) continue;

      const isMultiple = rel.targetMultiplicity === '*' || rel.targetMultiplicity === '1..*';
      if (!isMultiple) continue;

      const targetName = target.name;
      const propName = rel.targetRole || `${this.lowercaseFirst(targetName)}List`;
      const singleParam = this.lowercaseFirst(targetName);

      helpers.push(`${indent}public add${targetName}(${singleParam}: ${targetName}): void {`);
      helpers.push(`${indent}  this.${propName}.push(${singleParam});`);
      helpers.push(`${indent}}`);
      helpers.push(``);
      helpers.push(`${indent}public remove${targetName}(${singleParam}: ${targetName}): void {`);
      helpers.push(`${indent}  const index = this.${propName}.indexOf(${singleParam});`);
      helpers.push(`${indent}  if (index !== -1) {`);
      helpers.push(`${indent}    this.${propName}.splice(index, 1);`);
      helpers.push(`${indent}  }`);
      helpers.push(`${indent}}`);
      helpers.push(``);
      helpers.push(`${indent}public get${targetName}List(): readonly ${targetName}[] {`);
      helpers.push(`${indent}  return this.${propName};`);
      helpers.push(`${indent}}`);
    }

    return helpers.join('\n');
  }

  private generateInterface(element: UMLElement): string {
    const indent = ' '.repeat(this.config.indentSpaces);
    const lines: string[] = [];

    if (this.config.generateJSDoc && element.docComment) {
      lines.push(this.formatJSDoc(element.docComment));
    }

    let ifaceDecl = `export interface ${element.name}`;
    if (element.typeParameters) {
      ifaceDecl += `<${element.typeParameters}>`;
    }

    // Extends other interfaces
    const extendsRels = this.project.relationships.filter(
      r => r.sourceId === element.id && (r.type === 'generalization' || r.type === 'realization')
    );
    if (extendsRels.length > 0) {
      const parents = extendsRels
        .map(r => this.project.elements.find(e => e.id === r.targetId)?.name)
        .filter(Boolean);
      if (parents.length > 0) {
        ifaceDecl += ` extends ${parents.join(', ')}`;
      }
    }

    ifaceDecl += ' {';
    lines.push(ifaceDecl);

    // Properties
    for (const attr of element.attributes) {
      if (this.config.generateJSDoc && attr.docComment) {
        lines.push(this.formatJSDoc(attr.docComment, indent));
      }
      const opt = attr.isOptional ? '?' : '';
      const readonly = attr.isReadonly ? 'readonly ' : '';
      lines.push(`${indent}${readonly}${attr.name}${opt}: ${attr.type || 'any'};`);
    }

    // Method Signatures
    for (const op of element.operations) {
      if (this.config.generateJSDoc && op.docComment) {
        lines.push(this.formatMethodJSDoc(op, indent));
      }
      const params = op.parameters.map(p => {
        const opt = p.isOptional ? '?' : '';
        return `${p.name}${opt}: ${p.type || 'any'}`;
      }).join(', ');
      lines.push(`${indent}${op.name}(${params}): ${op.returnType || 'void'};`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  private generateEnum(element: UMLElement): string {
    const indent = ' '.repeat(this.config.indentSpaces);
    const lines: string[] = [];

    if (this.config.generateJSDoc && element.docComment) {
      lines.push(this.formatJSDoc(element.docComment));
    }

    lines.push(`export enum ${element.name} {`);
    const literals = element.enumLiterals || [];
    for (let i = 0; i < literals.length; i++) {
      const lit = literals[i];
      if (this.config.generateJSDoc && lit.docComment) {
        lines.push(this.formatJSDoc(lit.docComment, indent));
      }
      let valStr = '';
      if (lit.value !== undefined) {
        valStr = typeof lit.value === 'string' ? ` = "${lit.value}"` : ` = ${lit.value}`;
      }
      const comma = i < literals.length - 1 ? ',' : '';
      lines.push(`${indent}${lit.name}${valStr}${comma}`);
    }
    lines.push('}');
    return lines.join('\n');
  }

  private generateTypeAlias(element: UMLElement): string {
    const lines: string[] = [];
    if (this.config.generateJSDoc && element.docComment) {
      lines.push(this.formatJSDoc(element.docComment));
    }
    const typeParams = element.typeParameters ? `<${element.typeParameters}>` : '';
    const def = element.typeDefinition || 'any';
    lines.push(`export type ${element.name}${typeParams} = ${def};`);
    return lines.join('\n');
  }

  private formatAttribute(attr: UMLAttribute, indent: string): string {
    let line = `${indent}`;
    const vis = this.mapVisibility(attr.visibility);
    if (vis) line += `${vis} `;
    if (attr.isStatic) line += 'static ';
    if (attr.isReadonly) line += 'readonly ';
    
    line += attr.name;
    if (attr.isOptional) line += '?';
    line += `: ${attr.type || 'any'}`;

    if (attr.defaultValue) {
      line += ` = ${attr.defaultValue}`;
    }
    line += ';';
    return line;
  }

  private formatOperation(op: UMLOperation, indent: string): string {
    let line = `${indent}`;
    const vis = this.mapVisibility(op.visibility);
    if (vis) line += `${vis} `;
    if (op.isStatic) line += 'static ';
    if (op.isAbstract) line += 'abstract ';
    if (op.isAsync) line += 'async ';

    line += op.name;
    const params = op.parameters.map(p => {
      let paramStr = p.name;
      if (p.isOptional) paramStr += '?';
      paramStr += `: ${p.type || 'any'}`;
      if (p.defaultValue) paramStr += ` = ${p.defaultValue}`;
      return paramStr;
    }).join(', ');

    line += `(${params}): ${op.returnType || 'void'}`;

    if (op.isAbstract) {
      line += ';';
      return line;
    }

    line += ' {\n';
    line += `${indent}  // TODO: Implement ${op.name}\n`;
    
    // Sensible return values
    const retType = (op.returnType || 'void').trim();
    if (retType === 'void') {
      // no return
    } else if (retType === 'boolean') {
      line += `${indent}  return false;\n`;
    } else if (retType === 'number') {
      line += `${indent}  return 0;\n`;
    } else if (retType === 'string') {
      line += `${indent}  return "";\n`;
    } else if (retType.endsWith('[]') || retType.startsWith('Array<')) {
      line += `${indent}  return [];\n`;
    } else if (retType === 'Promise<void>') {
      // no return
    } else if (retType.startsWith('Promise<')) {
      line += `${indent}  return Promise.resolve({} as any);\n`;
    } else {
      line += `${indent}  return {} as ${retType};\n`;
    }

    line += `${indent}}`;
    return line;
  }

  private generateConstructor(element: UMLElement, hasParent: boolean): string {
    const indent = ' '.repeat(this.config.indentSpaces);
    const requiredAttrs = element.attributes.filter(a => !a.isStatic && !a.defaultValue && !a.isOptional && a.visibility !== 'private');
    
    let line = `${indent}constructor(`;
    const params = requiredAttrs.map(a => `${a.name}: ${a.type || 'any'}`).join(', ');
    line += params;
    line += ') {\n';
    
    if (hasParent) {
      line += `${indent}  super();\n`;
    }

    for (const attr of requiredAttrs) {
      line += `${indent}  this.${attr.name} = ${attr.name};\n`;
    }

    line += `${indent}}`;
    return line;
  }

  private generateGetterSetter(attr: UMLAttribute, indent: string): string {
    const lines: string[] = [];
    const capitalized = this.capitalizeFirst(attr.name);
    
    // Getter
    lines.push(`${indent}public get ${attr.name}(): ${attr.type || 'any'} {`);
    lines.push(`${indent}  return this.${attr.name};`);
    lines.push(`${indent}}`);

    // Setter (if not readonly)
    if (!attr.isReadonly) {
      lines.push(``);
      lines.push(`${indent}public set ${attr.name}(value: ${attr.type || 'any'}) {`);
      lines.push(`${indent}  this.${attr.name} = value;`);
      lines.push(`${indent}}`);
    }

    return lines.join('\n');
  }

  private generateBarrelFile(elements: UMLElement[]): string {
    const lines: string[] = [
      '/**',
      ' * Rational Rose TypeScript Model Barrel Exports',
      ' * Automatic index exports for all domain classes, interfaces, and types',
      ' */',
      ''
    ];

    for (const el of elements) {
      lines.push(`export * from './${el.name}';`);
    }

    return lines.join('\n');
  }

  private generateSingleFile(elements: UMLElement[]): string {
    const lines: string[] = [
      '/**',
      ` * Rational Rose UML 2.5 Model: ${this.project.name}`,
      ` * Generated: ${new Date().toISOString()}`,
      ' */',
      ''
    ];

    // Order: Enums & TypeAliases first, then Interfaces, then Abstract Classes, then Concrete Classes
    const enums = elements.filter(e => e.type === 'enum');
    const types = elements.filter(e => e.type === 'typeAlias');
    const ifaces = elements.filter(e => e.type === 'interface');
    const classes = elements.filter(e => e.type === 'class');

    for (const el of [...enums, ...types, ...ifaces, ...classes]) {
      lines.push(this.generateElementCode(el));
      lines.push('');
    }

    return lines.join('\n');
  }

  private mapVisibility(vis: UMLVisibility): string {
    switch (vis) {
      case 'public': return 'public';
      case 'private': return 'private';
      case 'protected': return 'protected';
      case 'package': return ''; // in TS default or namespace
      default: return 'public';
    }
  }

  private formatJSDoc(comment: string, indent: string = ''): string {
    const lines = comment.split('\n');
    if (lines.length === 1) {
      return `${indent}/** ${comment} */`;
    }
    const formatted = lines.map(l => `${indent} * ${l}`).join('\n');
    return `${indent}/**\n${formatted}\n${indent} */`;
  }

  private formatMethodJSDoc(op: UMLOperation, indent: string): string {
    const docLines: string[] = [];
    docLines.push(`${indent}/**`);
    if (op.docComment) {
      docLines.push(`${indent} * ${op.docComment}`);
    } else {
      docLines.push(`${indent} * Operation: ${op.name}`);
    }

    for (const param of op.parameters) {
      const desc = param.docComment ? ` - ${param.docComment}` : '';
      docLines.push(`${indent} * @param ${param.name} {${param.type || 'any'}}${desc}`);
    }

    if (op.returnType && op.returnType !== 'void') {
      docLines.push(`${indent} * @returns {${op.returnType}}`);
    }

    docLines.push(`${indent} */`);
    return docLines.join('\n');
  }

  private capitalizeFirst(str: string): string {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }

  private lowercaseFirst(str: string): string {
    return str ? str.charAt(0).toLowerCase() + str.slice(1) : '';
  }
}
