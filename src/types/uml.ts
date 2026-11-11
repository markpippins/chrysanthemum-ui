/**
 * UML 2.5 Metamodel Types for TypeScript Modeling & Code Generation
 */

export type UMLVisibility = 'public' | 'private' | 'protected' | 'package';

export type UMLStereotype = 
  | 'interface'
  | 'abstract'
  | 'entity'
  | 'service'
  | 'controller'
  | 'repository'
  | 'dto'
  | 'decorator'
  | 'enum'
  | 'type'
  | 'utility'
  | 'component'
  | 'actor'
  | 'usecase'
  | string;

export interface UMLParameter {
  id: string;
  name: string;
  type: string;
  isOptional?: boolean;
  defaultValue?: string;
  docComment?: string;
}

export interface UMLAttribute {
  id: string;
  name: string;
  type: string;
  visibility: UMLVisibility;
  defaultValue?: string;
  isReadonly?: boolean;
  isStatic?: boolean;
  isOptional?: boolean;
  decorators?: string[];
  docComment?: string;
}

export interface UMLOperation {
  id: string;
  name: string;
  returnType: string;
  parameters: UMLParameter[];
  visibility: UMLVisibility;
  isAbstract?: boolean;
  isStatic?: boolean;
  isAsync?: boolean;
  decorators?: string[];
  docComment?: string;
}

export interface UMLEnumLiteral {
  id: string;
  name: string;
  value?: string | number;
  docComment?: string;
}

export type UMLElementType = 
  | 'class'
  | 'interface'
  | 'enum'
  | 'typeAlias'
  | 'package'
  | 'actor'
  | 'usecase'
  | 'note';

export interface UMLElement {
  id: string;
  name: string;
  type: UMLElementType;
  stereotype?: UMLStereotype;
  isAbstract?: boolean;
  typeParameters?: string; // e.g. "T extends Entity, K = string"
  attributes: UMLAttribute[];
  operations: UMLOperation[];
  enumLiterals?: UMLEnumLiteral[];
  typeDefinition?: string; // for type aliases, e.g. "string | number"
  docComment?: string;
  decorators?: string[];
  packageId?: string;
  
  // Visual layout properties on diagram canvas
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed?: boolean;
  colorTheme?: string;
}

export type UMLRelationshipType = 
  | 'generalization' // extends
  | 'realization'    // implements
  | 'association'    // normal link
  | 'directed_association' // unidirection arrow
  | 'aggregation'    // shared aggregation (white diamond)
  | 'composition'    // composite aggregation (black diamond)
  | 'dependency'     // dashed arrow <<use>>
  | 'include'        // Use case <<include>>
  | 'extend';        // Use case <<extend>>

export interface UMLWaypoint {
  x: number;
  y: number;
}

export interface UMLRelationship {
  id: string;
  type: UMLRelationshipType;
  sourceId: string;
  targetId: string;
  name?: string;
  stereotype?: string;
  sourceMultiplicity?: string; // e.g., "1", "0..1", "*", "1..*"
  targetMultiplicity?: string;
  sourceRole?: string;
  targetRole?: string;
  navigableTarget?: boolean;
  navigableSource?: boolean;
  docComment?: string;
  waypoints?: UMLWaypoint[];
}

export type UMLDiagramType = 
  | 'class_diagram'
  | 'use_case_diagram'
  | 'component_diagram'
  | 'package_diagram';

export interface UMLDiagram {
  id: string;
  name: string;
  type: UMLDiagramType;
  description?: string;
  elementIds: string[];
  relationshipIds: string[];
  zoom: number;
  panX: number;
  panY: number;
}

export interface UMLPackage {
  id: string;
  name: string;
  description?: string;
  parentPackageId?: string;
}

export interface CodeGenConfig {
  target: 'ES2022' | 'ESNext' | 'ES2015';
  moduleSystem: 'ESM' | 'CommonJS';
  useDecorators: boolean;
  generateGettersSetters: boolean;
  generateConstructors: boolean;
  generateJSDoc: boolean;
  strictNullChecks: boolean;
  generateIndexBarrel: boolean;
  filePerClass: boolean;
  indentSpaces: number;
}

export interface UMLProject {
  id: string;
  name: string;
  description: string;
  version: string;
  packages: UMLPackage[];
  elements: UMLElement[];
  relationships: UMLRelationship[];
  diagrams: UMLDiagram[];
  activeDiagramId: string;
  codeGenConfig: CodeGenConfig;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedFile {
  filename: string;
  filepath: string;
  content: string;
  description?: string;
  elementId?: string;
}

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  elementId?: string;
  relationshipId?: string;
  fixAction?: () => void;
  fixLabel?: string;
}
