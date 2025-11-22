import { supabase } from '../lib/supabase';
import { WorkflowStep, WorkflowStepDependency, DependencyValidationResult } from '../types';

export class DependencyService {
  static async getStepDependencies(stepId: string): Promise<WorkflowStepDependency[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_step_dependencies')
        .select('*')
        .eq('step_id', stepId)
        .eq('is_active', true);

      if (error) throw error;

      return (data || []).map((dep: any) => ({
        id: dep.id,
        stepId: dep.step_id,
        dependsOnStepId: dep.depends_on_step_id,
        createdBy: dep.created_by,
        createdAt: new Date(dep.created_at),
        isActive: dep.is_active,
      }));
    } catch (error) {
      console.error('Error fetching step dependencies:', error);
      throw error;
    }
  }

  static async createDependencies(
    stepId: string,
    dependsOnStepIds: string[],
    userId: string
  ): Promise<void> {
    try {
      if (!dependsOnStepIds || dependsOnStepIds.length === 0) {
        return;
      }

      await this.validateNoCycles(stepId, dependsOnStepIds);

      const dependencies = dependsOnStepIds.map(dependsOnId => ({
        step_id: stepId,
        depends_on_step_id: dependsOnId,
        created_by: userId,
        is_active: true,
      }));

      const { error } = await supabase
        .from('workflow_step_dependencies')
        .insert(dependencies);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating dependencies:', error);
      throw error;
    }
  }

  static async lockStepDependencies(stepId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_steps')
        .update({ is_dependency_locked: true })
        .eq('id', stepId);

      if (error) throw error;
    } catch (error) {
      console.error('Error locking step dependencies:', error);
      throw error;
    }
  }

  static async validateStepCompletion(
    step: WorkflowStep,
    allSteps: WorkflowStep[]
  ): Promise<DependencyValidationResult> {
    try {
      if (step.is_parallel !== false) {
        return {
          canComplete: true,
          incompleteDependencies: [],
          dependencyMode: step.dependency_mode || 'all',
        };
      }

      const dependencies = await this.getStepDependencies(step.id);

      if (dependencies.length === 0) {
        return {
          canComplete: true,
          incompleteDependencies: [],
          dependencyMode: step.dependency_mode || 'all',
        };
      }

      const dependencyStepIds = dependencies.map(d => d.dependsOnStepId);
      const dependentSteps = allSteps.filter(s => dependencyStepIds.includes(s.id));

      const completedDependencies = dependentSteps.filter(
        s => s.status === 'COMPLETED' || s.status === 'CLOSED'
      );

      const incompleteDependencies = dependentSteps.filter(
        s => s.status !== 'COMPLETED' && s.status !== 'CLOSED'
      );

      const dependencyMode = step.dependency_mode || 'all';

      let canComplete = false;
      let message = '';

      if (dependencyMode === 'all') {
        canComplete = incompleteDependencies.length === 0;
        if (!canComplete) {
          message = `All ${dependentSteps.length} dependencies must be completed. ${incompleteDependencies.length} remaining.`;
        }
      } else {
        canComplete = completedDependencies.length > 0;
        if (!canComplete) {
          message = `At least one of ${dependentSteps.length} dependencies must be completed.`;
        }
      }

      return {
        canComplete,
        incompleteDependencies,
        message,
        dependencyMode,
      };
    } catch (error) {
      console.error('Error validating step completion:', error);
      return {
        canComplete: false,
        incompleteDependencies: [],
        message: 'Error validating dependencies',
        dependencyMode: step.dependency_mode || 'all',
      };
    }
  }

  static async validateNoCycles(
    stepId: string,
    dependsOnStepIds: string[]
  ): Promise<void> {
    try {
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const hasCycle = async (currentStepId: string): Promise<boolean> => {
        if (recursionStack.has(currentStepId)) {
          return true;
        }

        if (visited.has(currentStepId)) {
          return false;
        }

        visited.add(currentStepId);
        recursionStack.add(currentStepId);

        const dependencies = await this.getStepDependencies(currentStepId);

        for (const dep of dependencies) {
          if (await hasCycle(dep.dependsOnStepId)) {
            return true;
          }
        }

        recursionStack.delete(currentStepId);
        return false;
      };

      for (const dependsOnId of dependsOnStepIds) {
        if (dependsOnId === stepId) {
          throw new Error('A step cannot depend on itself');
        }

        if (await hasCycle(dependsOnId)) {
          throw new Error('Adding this dependency would create a circular dependency');
        }
      }

      const tempDependencies = dependsOnStepIds.map(depId => ({
        stepId,
        dependsOnStepId: depId,
      }));

      recursionStack.clear();
      visited.clear();

      if (await hasCycle(stepId)) {
        throw new Error('Adding these dependencies would create a circular dependency');
      }
    } catch (error) {
      console.error('Error validating cycles:', error);
      throw error;
    }
  }

  static async getDependentSteps(stepId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_step_dependencies')
        .select('step_id')
        .eq('depends_on_step_id', stepId)
        .eq('is_active', true);

      if (error) throw error;

      return (data || []).map((dep: any) => dep.step_id);
    } catch (error) {
      console.error('Error getting dependent steps:', error);
      throw error;
    }
  }

  static async getStepsWithDependencies(
    ticketId: string,
    steps: WorkflowStep[]
  ): Promise<WorkflowStep[]> {
    try {
      const stepsWithDeps = await Promise.all(
        steps.map(async (step) => {
          const dependencies = await this.getStepDependencies(step.id);
          return {
            ...step,
            dependencySteps: dependencies,
          };
        })
      );

      return stepsWithDeps;
    } catch (error) {
      console.error('Error getting steps with dependencies:', error);
      return steps;
    }
  }

  static getAvailableDependencySteps(
    currentStep: WorkflowStep | null,
    allSteps: WorkflowStep[]
  ): WorkflowStep[] {
    if (!currentStep) {
      return allSteps.filter(s =>
        (s.level_2 === 0 && s.level_3 === 0)
      );
    }

    return allSteps.filter(step => {
      if (step.id === currentStep.id) return false;

      if (step.parentStepId === currentStep.id) return false;

      if (currentStep.parentStepId && step.id === currentStep.parentStepId) return false;

      const isDescendant = this.isDescendantOf(step, currentStep, allSteps);
      if (isDescendant) return false;

      if (currentStep.level_1 && step.level_1) {
        if (currentStep.level_2 === 0 && currentStep.level_3 === 0) {
          return step.level_2 === 0 && step.level_3 === 0 && step.level_1 < currentStep.level_1;
        } else if (currentStep.level_2 > 0 && currentStep.level_3 === 0) {
          return (
            (step.level_2 === 0 && step.level_3 === 0) ||
            (step.level_1 === currentStep.level_1 && step.level_2 > 0 && step.level_3 === 0 && step.level_2 < currentStep.level_2)
          );
        } else if (currentStep.level_3 > 0) {
          return (
            (step.level_2 === 0 && step.level_3 === 0) ||
            (step.level_1 === currentStep.level_1 && step.level_2 > 0 && step.level_3 === 0) ||
            (step.level_1 === currentStep.level_1 &&
             step.level_2 === currentStep.level_2 &&
             step.level_3 > 0 &&
             step.level_3 < currentStep.level_3)
          );
        }
      }

      return true;
    });
  }

  private static isDescendantOf(
    step: WorkflowStep,
    potentialAncestor: WorkflowStep,
    allSteps: WorkflowStep[]
  ): boolean {
    let current: WorkflowStep | undefined = step;

    while (current && current.parentStepId) {
      if (current.parentStepId === potentialAncestor.id) {
        return true;
      }
      current = allSteps.find(s => s.id === current!.parentStepId);
    }

    return false;
  }

  static formatDependencyStatus(
    step: WorkflowStep,
    dependentSteps: WorkflowStep[]
  ): string {
    if (step.is_parallel !== false || !dependentSteps || dependentSteps.length === 0) {
      return '';
    }

    const completed = dependentSteps.filter(
      s => s.status === 'COMPLETED' || s.status === 'CLOSED'
    ).length;

    const mode = step.dependency_mode || 'all';

    if (mode === 'all') {
      return `${completed}/${dependentSteps.length} dependencies completed`;
    } else {
      return completed > 0
        ? `${completed}/${dependentSteps.length} dependencies completed (any one required)`
        : `0/${dependentSteps.length} dependencies completed (any one required)`;
    }
  }
}
