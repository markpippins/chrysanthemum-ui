/**
 * Reverse Engineering Engine: TypeScript Source Code -> UML 2.5 Model Elements & Relationships
 */

import { 
  UMLElement, 
  UMLRelationship, 
  UMLAttribute, 
  UMLOperation, 
  UMLEnumLiteral, 
  UMLVisibility,
  UMLParameter
} from '../types/uml';

export interface ReverseEngineeringResult {
  elements: UMLElement[];
  relationships: UMLRelationship[];
  errors: string[];
}

export class TypeScriptReverseEngineer {
  public parseTypeScript(source: string, startingX = 100, startingY = 100): ReverseEngineeringResult {
    const elements: UMLElement[] = [];
    const relationships: UMLRelationship[] = [];
    const errors: string[] = [];

    try {
      // Clean comments for structural parsing while capturing JSDoc
      const blocks = this.extractTopLevelBlocks(source);

      let currentX = startingX;
      let currentY = startingY;
      const colWidth = 320;
      const rowHeight = 280;
      const cols = 3;
      let count = 0;

      for (const block of blocks) {
        const x = startingX + (count % cols) * colWidth;
        const y = startingY + Math.floor(count / cols) * rowHeight;

        if (block.type === 'class') {
          const parsed = this.parseClassBlock(block.header, block.body, block.jsdoc, block.decorators, x, y);
          if (parsed) {
            elements.push(parsed.element);
            relationships.push(...parsed.relationships);
            count++;
          }
        } else if (block.type === 'interface') {
          const parsed = this.parseInterfaceBlock(block.header, block.body, block.jsdoc, block.decorators, x, y);
          if (parsed) {
            elements.push(parsed.element);
            relationships.push(...parsed.relationships);
            count++;
          }
        } else if (block.type === 'enum') {
          const parsed = this.parseEnumBlock(block.header, block.body, block.jsdoc, x, y);
          if (parsed) {
            elements.push(parsed.element);
            count++;
          }
        } else if (block.type === 'type') {
          const parsed = this.parseTypeBlock(block.header, block.body, block.jsdoc, x, y);
          if (parsed) {
            elements.push(parsed.element);
            count++;
          }
        }
      }

      // Link relationships with actual element IDs
      for (const rel of relationships) {
        const sourceEl = elements.find(e => e.name === rel.sourceId);
        const targetEl = elements.find(e => e.name === rel.targetId);
        if (sourceEl) rel.sourceId = sourceEl.id;
        if (targetEl) rel.targetId = targetEl.id;
      }

      // Filter out relationships where target couldn't be resolved
      const validRelationships = relationships.filter(
        r => elements.some(e => e.id === r.sourceId) && elements.some(e => e.id === r.targetId)
      );

      // Infer property-based associations & compositions
      const associationRels = this.inferPropertyAssociations(elements);
      validRelationships.push(...associationRels);

      return {
        elements,
        relationships: validRelationships,
        errors
      };
    } catch (err: any) {
      errors.push(`Parser Error: ${err.message}`);
      return { elements: [], relationships: [], errors };
    }
  }

  private extractTopLevelBlocks(source: string): Array<{
    type: 'class' | 'interface' | 'enum' | 'type';
    header: string;
    body: string;
    jsdoc?: string;
    decorators?: string[];
  }> {
    const blocks: Array<{
      type: 'class' | 'interface' | 'enum' | 'type';
      header: string;
      body: string;
      jsdoc?: string;
      decorators?: string[];
    }> = [];

    // Simple robust tokenizer scanner
    const lines = source.split('\n');
    let currentJSDoc: string[] = [];
    let inJSDoc = false;
    let currentDecorators: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // JSDoc tracking
      if (line.startsWith('/**')) {
        inJSDoc = true;
        currentJSDoc = [line.replace('/**', '').replace('*/', '').trim()];
        if (line.endsWith('*/')) inJSDoc = false;
        continue;
      }
      if (inJSDoc) {
        if (line.endsWith('*/')) {
          inJSDoc = false;
          currentJSDoc.push(line.replace('*/', '').replace(/^\s*\*\s?/, '').trim());
        } else {
          currentJSDoc.push(line.replace(/^\s*\*\s?/, '').trim());
        }
        continue;
      }

      // Decorator tracking
      if (line.startsWith('@') && !line.includes(' ')) {
        currentDecorators.push(line);
        continue;
      }

      // Type Alias match
      const typeMatch = line.match(/^(?:export\s+)?type\s+([A-Za-z0-9_]+)(?:<([^>]+)>)?\s*=\s*(.+);?$/);
      if (typeMatch) {
        blocks.push({
          type: 'type',
          header: line,
          body: typeMatch[3],
          jsdoc: currentJSDoc.filter(Boolean).join('\n'),
          decorators: [...currentDecorators]
        });
        currentJSDoc = [];
        currentDecorators = [];
        continue;
      }

      // Class / Interface / Enum match header
      const classMatch = line.match(/^(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_]+)/);
      const ifaceMatch = line.match(/^(?:export\s+)?interface\s+([A-Za-z0-9_]+)/);
      const enumMatch = line.match(/^(?:export\s+)?enum\s+([A-Za-z0-9_]+)/);

      if (classMatch || ifaceMatch || enumMatch) {
        const blockType = classMatch ? 'class' : ifaceMatch ? 'interface' : 'enum';
        let header = line;
        
        // Find matching brace body
        let bodyLines: string[] = [];
        let braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        
        while (braceCount === 0 && i + 1 < lines.length && !lines[i + 1].includes('{')) {
          i++;
          header += ' ' + lines[i].trim();
        }

        if (braceCount === 0 && i + 1 < lines.length && lines[i + 1].includes('{')) {
          i++;
          header += ' ' + lines[i].trim();
          braceCount += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
        }

        while (braceCount > 0 && i + 1 < lines.length) {
          i++;
          const bodyLine = lines[i];
          braceCount += (bodyLine.match(/\{/g) || []).length - (bodyLine.match(/\}/g) || []).length;
          if (braceCount > 0) {
            bodyLines.push(bodyLine);
          }
        }

        blocks.push({
          type: blockType,
          header,
          body: bodyLines.join('\n'),
          jsdoc: currentJSDoc.filter(Boolean).join('\n'),
          decorators: [...currentDecorators]
        });

        currentJSDoc = [];
        currentDecorators = [];
      }
    }

    return blocks;
  }

  private parseClassBlock(
    header: string, 
    body: string, 
    jsdoc?: string, 
    decorators?: string[],
    x = 100, 
    y = 100
  ): { element: UMLElement; relationships: UMLRelationship[] } | null {
    const headerMatch = header.match(
      /^(?:export\s+)?(abstract\s+)?class\s+([A-Za-z0-9_]+)(?:<([^>]+)>)?(?:\s+extends\s+([A-Za-z0-9_]+))?(?:\s+implements\s+([^{]+))?/
    );
    if (!headerMatch) return null;

    const isAbstract = Boolean(headerMatch[1]);
    const className = headerMatch[2];
    const typeParams = headerMatch[3];
    const extendsName = headerMatch[4];
    const implementsStr = headerMatch[5];

    const elementId = `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const relationships: UMLRelationship[] = [];

    // Generalization
    if (extendsName) {
      relationships.push({
        id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
        type: 'generalization',
        sourceId: className, // temporary name placeholder, resolved later
        targetId: extendsName.trim(),
        docComment: 'extends'
      });
    }

    // Realization
    if (implementsStr) {
      const ifaces = implementsStr.split(',').map(s => s.trim().replace(/\{.*/, ''));
      for (const iface of ifaces) {
        if (iface) {
          relationships.push({
            id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
            type: 'realization',
            sourceId: className,
            targetId: iface,
            docComment: 'implements'
          });
        }
      }
    }

    const { attributes, operations } = this.parseClassBody(body);

    const element: UMLElement = {
      id: elementId,
      name: className,
      type: 'class',
      stereotype: isAbstract ? 'abstract' : undefined,
      isAbstract,
      typeParameters: typeParams,
      attributes,
      operations,
      docComment: jsdoc,
      decorators,
      x,
      y,
      width: 240,
      height: 180 + attributes.length * 20 + operations.length * 20
    };

    return { element, relationships };
  }

  private parseInterfaceBlock(
    header: string, 
    body: string, 
    jsdoc?: string, 
    decorators?: string[],
    x = 100, 
    y = 100
  ): { element: UMLElement; relationships: UMLRelationship[] } | null {
    const headerMatch = header.match(
      /^(?:export\s+)?interface\s+([A-Za-z0-9_]+)(?:<([^>]+)>)?(?:\s+extends\s+([^{]+))?/
    );
    if (!headerMatch) return null;

    const ifaceName = headerMatch[1];
    const typeParams = headerMatch[2];
    const extendsStr = headerMatch[3];

    const elementId = `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const relationships: UMLRelationship[] = [];

    if (extendsStr) {
      const parents = extendsStr.split(',').map(s => s.trim().replace(/\{.*/, ''));
      for (const p of parents) {
        if (p) {
          relationships.push({
            id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
            type: 'generalization',
            sourceId: ifaceName,
            targetId: p
          });
        }
      }
    }

    const { attributes, operations } = this.parseInterfaceBody(body);

    const element: UMLElement = {
      id: elementId,
      name: ifaceName,
      type: 'interface',
      stereotype: 'interface',
      typeParameters: typeParams,
      attributes,
      operations,
      docComment: jsdoc,
      decorators,
      x,
      y,
      width: 240,
      height: 160 + attributes.length * 20 + operations.length * 20
    };

    return { element, relationships };
  }

  private parseEnumBlock(
    header: string, 
    body: string, 
    jsdoc?: string, 
    x = 100, 
    y = 100
  ): { element: UMLElement } | null {
    const headerMatch = header.match(/^(?:export\s+)?enum\s+([A-Za-z0-9_]+)/);
    if (!headerMatch) return null;

    const enumName = headerMatch[1];
    const elementId = `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const enumLiterals: UMLEnumLiteral[] = [];

    const lines = body.split('\n');
    for (const line of lines) {
      const clean = line.trim().replace(/,$/, '');
      if (!clean || clean.startsWith('//') || clean.startsWith('/*')) continue;
      
      const litMatch = clean.match(/^([A-Za-z0-9_]+)(?:\s*=\s*(.+))?$/);
      if (litMatch) {
        let val: string | number | undefined = litMatch[2]?.trim();
        if (val) {
          val = val.replace(/^["']|["']$/g, '');
        }
        enumLiterals.push({
          id: `lit_${Math.random().toString(36).substr(2, 7)}`,
          name: litMatch[1],
          value: val
        });
      }
    }

    const element: UMLElement = {
      id: elementId,
      name: enumName,
      type: 'enum',
      stereotype: 'enum',
      attributes: [],
      operations: [],
      enumLiterals,
      docComment: jsdoc,
      x,
      y,
      width: 220,
      height: 140 + enumLiterals.length * 22
    };

    return { element };
  }

  private parseTypeBlock(
    header: string, 
    body: string, 
    jsdoc?: string, 
    x = 100, 
    y = 100
  ): { element: UMLElement } | null {
    const headerMatch = header.match(/^(?:export\s+)?type\s+([A-Za-z0-9_]+)(?:<([^>]+)>)?\s*=\s*(.+);?$/);
    if (!headerMatch) return null;

    const typeName = headerMatch[1];
    const typeParams = headerMatch[2];
    const typeDef = headerMatch[3] || body;

    const elementId = `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const element: UMLElement = {
      id: elementId,
      name: typeName,
      type: 'typeAlias',
      stereotype: 'type',
      typeParameters: typeParams,
      typeDefinition: typeDef.replace(/;$/, '').trim(),
      attributes: [],
      operations: [],
      docComment: jsdoc,
      x,
      y,
      width: 220,
      height: 120
    };

    return { element };
  }

  private parseClassBody(body: string): { attributes: UMLAttribute[]; operations: UMLOperation[] } {
    const attributes: UMLAttribute[] = [];
    const operations: UMLOperation[] = [];

    const lines = body.split('\n');
    let currentDecorators: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

      if (line.startsWith('@')) {
        currentDecorators.push(line);
        continue;
      }

      // Ignore constructor body
      if (line.startsWith('constructor')) {
        // Skip constructor
        continue;
      }

      // Check if Method / Operation
      const methodMatch = line.match(
        /^(public|private|protected)?\s*(static\s+)?(abstract\s+)?(async\s+)?([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*:\s*([^;{]+)/
      );
      if (methodMatch) {
        const vis = (methodMatch[1] as UMLVisibility) || 'public';
        const isStatic = Boolean(methodMatch[2]);
        const isAbstract = Boolean(methodMatch[3]);
        const isAsync = Boolean(methodMatch[4]);
        const name = methodMatch[5];
        const rawParams = methodMatch[6];
        const returnType = methodMatch[7].trim();

        const parameters = this.parseParameters(rawParams);

        operations.push({
          id: `op_${Math.random().toString(36).substr(2, 7)}`,
          name,
          returnType,
          parameters,
          visibility: vis,
          isStatic,
          isAbstract,
          isAsync,
          decorators: [...currentDecorators]
        });
        currentDecorators = [];
        continue;
      }

      // Check if Attribute / Property
      const attrMatch = line.match(
        /^(public|private|protected)?\s*(static\s+)?(readonly\s+)?([A-Za-z0-9_]+)(\?)?:\s*([^=;]+)(?:\s*=\s*([^;]+))?;?/
      );
      if (attrMatch) {
        const vis = (attrMatch[1] as UMLVisibility) || 'public';
        const isStatic = Boolean(attrMatch[2]);
        const isReadonly = Boolean(attrMatch[3]);
        const name = attrMatch[4];
        const isOptional = Boolean(attrMatch[5]);
        const type = attrMatch[6].trim();
        const defaultValue = attrMatch[7]?.trim();

        attributes.push({
          id: `attr_${Math.random().toString(36).substr(2, 7)}`,
          name,
          type,
          visibility: vis,
          isStatic,
          isReadonly,
          isOptional,
          defaultValue,
          decorators: [...currentDecorators]
        });
        currentDecorators = [];
        continue;
      }
    }

    return { attributes, operations };
  }

  private parseInterfaceBody(body: string): { attributes: UMLAttribute[]; operations: UMLOperation[] } {
    const attributes: UMLAttribute[] = [];
    const operations: UMLOperation[] = [];

    const lines = body.split('\n');
    for (const line of lines) {
      const clean = line.trim().replace(/;$/, '');
      if (!clean || clean.startsWith('//') || clean.startsWith('/*')) continue;

      // Method signature
      const methodMatch = clean.match(/^([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*:\s*(.+)$/);
      if (methodMatch) {
        const name = methodMatch[1];
        const rawParams = methodMatch[2];
        const returnType = methodMatch[3].trim();
        const parameters = this.parseParameters(rawParams);

        operations.push({
          id: `op_${Math.random().toString(36).substr(2, 7)}`,
          name,
          returnType,
          parameters,
          visibility: 'public'
        });
        continue;
      }

      // Property signature
      const propMatch = clean.match(/^(readonly\s+)?([A-Za-z0-9_]+)(\?)?:\s*(.+)$/);
      if (propMatch) {
        const isReadonly = Boolean(propMatch[1]);
        const name = propMatch[2];
        const isOptional = Boolean(propMatch[3]);
        const type = propMatch[4].trim();

        attributes.push({
          id: `attr_${Math.random().toString(36).substr(2, 7)}`,
          name,
          type,
          visibility: 'public',
          isReadonly,
          isOptional
        });
        continue;
      }
    }

    return { attributes, operations };
  }

  private parseParameters(paramStr: string): UMLParameter[] {
    if (!paramStr || !paramStr.trim()) return [];
    const params: UMLParameter[] = [];
    
    // Split by commas not inside generic brackets
    const parts = this.splitParameters(paramStr);
    for (const part of parts) {
      const m = part.trim().match(/^([A-Za-z0-9_]+)(\?)?:\s*([^=]+)(?:\s*=\s*(.+))?$/);
      if (m) {
        params.push({
          id: `p_${Math.random().toString(36).substr(2, 6)}`,
          name: m[1],
          isOptional: Boolean(m[2]),
          type: m[3].trim(),
          defaultValue: m[4]?.trim()
        });
      } else {
        params.push({
          id: `p_${Math.random().toString(36).substr(2, 6)}`,
          name: part.trim(),
          type: 'any'
        });
      }
    }
    return params;
  }

  private splitParameters(str: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '<' || char === '(' || char === '{' || char === '[') depth++;
      if (char === '>' || char === ')' || char === '}' || char === ']') depth--;
      
      if (char === ',' && depth === 0) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) result.push(current);
    return result;
  }

  private inferPropertyAssociations(elements: UMLElement[]): UMLRelationship[] {
    const relationships: UMLRelationship[] = [];
    const nameMap = new Map(elements.map(e => [e.name, e]));

    for (const source of elements) {
      for (const attr of source.attributes) {
        let baseType = attr.type.replace(/[\[\]\<\>\?\s]/g, '');
        if (baseType.includes('|')) baseType = baseType.split('|')[0].trim();

        const target = nameMap.get(baseType);
        if (target && target.id !== source.id) {
          const isArray = attr.type.includes('[]') || attr.type.includes('Array<');
          const isComposition = attr.visibility === 'private';
          
          relationships.push({
            id: `rel_assoc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: isComposition ? 'composition' : 'association',
            sourceId: source.id,
            targetId: target.id,
            targetRole: attr.name,
            targetMultiplicity: isArray ? '*' : (attr.isOptional ? '0..1' : '1'),
            docComment: `field: ${attr.name}`
          });
        }
      }
    }

    return relationships;
  }
}
