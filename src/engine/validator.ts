/**
 * Rational Rose UML 2.5 Semantic Validator & Model Verification Engine
 */

import { UMLProject, UMLElement, UMLRelationship, ValidationIssue } from '../types/uml';

export class UMLModelValidator {
  public static validate(project: UMLProject): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const elementMap = new Map<string, UMLElement>(project.elements.map(e => [e.id, e]));

    // 1. Check for broken/dangling relationships
    for (const rel of project.relationships) {
      const source = elementMap.get(rel.sourceId);
      const target = elementMap.get(rel.targetId);

      if (!source) {
        issues.push({
          id: `val_rel_source_${rel.id}`,
          severity: 'error',
          message: `Relationship (${rel.type}) references non-existent source ID "${rel.sourceId}".`,
          relationshipId: rel.id
        });
      }

      if (!target) {
        issues.push({
          id: `val_rel_target_${rel.id}`,
          severity: 'error',
          message: `Relationship (${rel.type}) references non-existent target ID "${rel.targetId}".`,
          relationshipId: rel.id
        });
      }

      // Check self-inheritance
      if (source && target && source.id === target.id && rel.type === 'generalization') {
        issues.push({
          id: `val_self_inherit_${rel.id}`,
          severity: 'error',
          message: `Element "${source.name}" cannot extend itself.`,
          elementId: source.id,
          relationshipId: rel.id
        });
      }

      // Interface extending class violation
      if (source && target && source.type === 'interface' && target.type === 'class' && rel.type === 'generalization') {
        issues.push({
          id: `val_iface_extend_class_${rel.id}`,
          severity: 'error',
          message: `Interface "${source.name}" cannot extend concrete class "${target.name}". Interfaces can only extend other interfaces.`,
          elementId: source.id,
          relationshipId: rel.id
        });
      }

      // Class implementing class violation (should be realization to interface)
      if (source && target && source.type === 'class' && target.type === 'class' && rel.type === 'realization') {
        issues.push({
          id: `val_class_realize_class_${rel.id}`,
          severity: 'warning',
          message: `Class "${source.name}" implements class "${target.name}". Usually classes implement interfaces or extend classes.`,
          elementId: source.id,
          relationshipId: rel.id
        });
      }
    }

    // 2. Check for Circular Inheritance
    const inheritanceGraph = new Map<string, string[]>();
    for (const rel of project.relationships) {
      if (rel.type === 'generalization') {
        const parents = inheritanceGraph.get(rel.sourceId) || [];
        parents.push(rel.targetId);
        inheritanceGraph.set(rel.sourceId, parents);
      }
    }

    for (const el of project.elements) {
      if (this.hasCycle(el.id, inheritanceGraph, new Set(), new Set())) {
        issues.push({
          id: `val_cycle_${el.id}`,
          severity: 'error',
          message: `Circular generalization inheritance cycle detected involving "${el.name}".`,
          elementId: el.id
        });
      }
    }

    // 3. Per-Element semantic checks
    const nameCounts = new Map<string, number>();
    for (const el of project.elements) {
      nameCounts.set(el.name, (nameCounts.get(el.name) || 0) + 1);

      // Duplicate attributes
      const attrNames = new Set<string>();
      for (const attr of el.attributes) {
        if (attrNames.has(attr.name)) {
          issues.push({
            id: `val_dup_attr_${el.id}_${attr.name}`,
            severity: 'error',
            message: `Element "${el.name}" has duplicate attribute "${attr.name}".`,
            elementId: el.id
          });
        }
        attrNames.add(attr.name);
      }

      // Duplicate operations with same signature
      const opSignatures = new Set<string>();
      for (const op of el.operations) {
        const sig = `${op.name}(${op.parameters.map(p => p.type).join(',')})`;
        if (opSignatures.has(sig)) {
          issues.push({
            id: `val_dup_op_${el.id}_${op.name}`,
            severity: 'warning',
            message: `Element "${el.name}" has duplicate operation overload signature "${sig}".`,
            elementId: el.id
          });
        }
        opSignatures.add(sig);
      }

      // Concrete class with abstract operations
      if (el.type === 'class' && !el.isAbstract) {
        const abstractOps = el.operations.filter(op => op.isAbstract);
        if (abstractOps.length > 0) {
          issues.push({
            id: `val_non_abstract_class_with_abstract_op_${el.id}`,
            severity: 'error',
            message: `Class "${el.name}" contains abstract operations (${abstractOps.map(o => o.name).join(', ')}) but is not declared as abstract.`,
            elementId: el.id
          });
        }
      }

      // Check Interface realization completeness
      if (el.type === 'class') {
        const implementsRels = project.relationships.filter(
          r => r.sourceId === el.id && r.type === 'realization'
        );
        for (const rel of implementsRels) {
          const iface = elementMap.get(rel.targetId);
          if (iface && iface.type === 'interface') {
            for (const ifaceOp of iface.operations) {
              const implemented = el.operations.some(op => op.name === ifaceOp.name);
              if (!implemented && !el.isAbstract) {
                issues.push({
                  id: `val_missing_impl_${el.id}_${iface.name}_${ifaceOp.name}`,
                  severity: 'warning',
                  message: `Class "${el.name}" does not implement operation "${ifaceOp.name}()" required by interface "${iface.name}".`,
                  elementId: el.id
                });
              }
            }
          }
        }
      }
    }

    // Duplicate element names across project
    for (const [name, count] of nameCounts.entries()) {
      if (count > 1) {
        issues.push({
          id: `val_dup_elem_name_${name}`,
          severity: 'error',
          message: `Multiple elements declared with the name "${name}". Identifiers must be unique across the package namespace.`
        });
      }
    }

    return issues;
  }

  private static hasCycle(
    nodeId: string, 
    graph: Map<string, string[]>, 
    visited: Set<string>, 
    recStack: Set<string>
  ): boolean {
    if (recStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (this.hasCycle(neighbor, graph, visited, recStack)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }
}
