export type ResGetOrderDetail = Omit<{ approval: any } | { approval: any }, "approval"> & {
  approval?: ApprovalFlow
}

/** 完整的审批流实例 */
export interface ApprovalFlow {
  /** 审批流程树（任务已嵌套在各节点中） */
  flowTree: ApprovalFlowNode
}

/** 审批流节点（递归结构） */
export interface ApprovalFlowNode {
  children?: ApprovalFlowNode[]
  tasks?: ApprovalFlowTask[]
}

/** 审批流任务（最小的审批单元） */
export interface ApprovalFlowTask {
  completedTime?: Date
}
