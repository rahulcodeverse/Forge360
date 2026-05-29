/**
 * @typedef {{ approverType: 'direct_manager' | 'skip_manager' | 'hr' | 'specific_role' | 'specific_user'; slaHours: number; escalateTo?: string; canDelegate: boolean; approverId?: string; roleCode?: string }} WorkflowLevel
 * @typedef {{ moduleType: string; levels: WorkflowLevel[]; parallelLevels?: boolean; autoApproveRules?: Array<{ condition: string }> }} WorkflowConfig
 */

/**
 * @param {{ config: WorkflowConfig; requester: { id: string; managerId?: string; skipManagerId?: string }; hrUserId: string }} input
 */
export function routeApproval(input) {
  if (input.config.levels.length === 0) {
    return { status: 'approved', currentLevel: 0, approverId: null, history: [] };
  }

  const firstLevel = input.config.levels[0];
  if (firstLevel === undefined) {
    throw new Error('Workflow level missing');
  }
  const first = resolveApprover(firstLevel, input);
  return {
    status: 'pending',
    currentLevel: 1,
    approverId: first,
    history: [],
  };
}

/**
 * @param {{ request: { status: string; currentLevel: number; history: unknown[] }; config: WorkflowConfig; actorId: string; decision: 'approved' | 'rejected'; comment?: string; requester: { id: string; managerId?: string; skipManagerId?: string }; hrUserId: string }} input
 */
export function decideApproval(input) {
  const history = [
    ...input.request.history,
    {
      level: input.request.currentLevel,
      actorId: input.actorId,
      decision: input.decision,
      comment: input.comment ?? '',
      decidedAt: new Date().toISOString(),
    },
  ];

  if (input.decision === 'rejected') {
    return { status: 'rejected', currentLevel: input.request.currentLevel, approverId: null, history };
  }

  const nextLevelIndex = input.request.currentLevel;
  if (nextLevelIndex >= input.config.levels.length) {
    return { status: 'approved', currentLevel: input.request.currentLevel, approverId: null, history };
  }
  const nextLevel = input.config.levels[nextLevelIndex];
  if (nextLevel === undefined) {
    throw new Error('Workflow level missing');
  }

  return {
    status: 'pending',
    currentLevel: input.request.currentLevel + 1,
    approverId: resolveApprover(nextLevel, input),
    history,
  };
}

/**
 * @param {WorkflowLevel} level
 * @param {{ requester: { id: string; managerId?: string; skipManagerId?: string }; hrUserId: string }} context
 */
function resolveApprover(level, context) {
  if (level.approverType === 'direct_manager') return context.requester.managerId ?? context.hrUserId;
  if (level.approverType === 'skip_manager') return context.requester.skipManagerId ?? context.hrUserId;
  if (level.approverType === 'hr') return context.hrUserId;
  if (level.approverType === 'specific_user') return level.approverId ?? context.hrUserId;
  return level.roleCode ?? 'role:hr_admin';
}
