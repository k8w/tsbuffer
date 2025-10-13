// 定义接口
interface LeafNode {
  id: string
  value: boolean
}

interface BranchNode {
  id: string
  children: string[] // Node IDs
}

// 类型守卫，用于判断节点类型
function isLeafNode(node: BranchNode | LeafNode): node is LeafNode {
  return (node as LeafNode).value !== undefined
}

interface Tree {
  nodes: (BranchNode | LeafNode)[]
  rootId: string
}

/**
 * 评估树结构，判断是否存在值为 false 的叶子节点。
 * @param tree 树形数据结构
 * @returns 'Yes' 如果所有可达叶子节点值为 true 或没有叶子节点，否则返回 'No'
 */
export function evaluateTree(tree: Tree): "Yes" | "No" {
  // 1. 数据预处理：将节点数组转换为 Map，方便通过 ID 快速查找。
  //    这是重要的性能优化，避免在递归中反复遍历数组。
  const nodeMap = new Map<string, BranchNode | LeafNode>()
  for (const node of tree.nodes) {
    nodeMap.set(node.id, node)
  }

  // 2. 访问记录：创建一个 Set 来存储已经访问过的节点 ID，用于检测和避免循环。
  const visited = new Set<string>()

  /**
   * 深度优先搜索 (DFS) 的递归辅助函数。
   * @param nodeId 当前要访问的节点 ID
   * @returns `true` 表示从该节点出发的所有路径都“安全”（没有找到 false 的叶子），
   *          `false` 表示在该节点的子孙中找到了一个值为 false 的叶子。
   */
  function dfs(nodeId: string): boolean {
    // 3. 循环引用处理：如果当前节点已经被访问过，说明遇到了循环或已经探索过的共享路径。
    //    为了避免无限递归，我们直接返回 true，表示这条路径是“安全”的，
    //    因为它没有引入新的、值为 false 的叶子。
    if (visited.has(nodeId)) {
      return true
    }

    // 将当前节点标记为已访问。
    visited.add(nodeId)

    const node = nodeMap.get(nodeId)

    // 如果节点 ID 不存在于 Map 中（悬空引用），则认为此路径安全。
    if (!node) {
      return true
    }

    // 4. 判断节点类型并处理
    if (isLeafNode(node)) {
      // Base Case 1: 到达叶子节点。此路径的结果就是叶子节点的值。
      return node.value
    } else {
      // Recursive Step: 这是一个分支节点，需要遍历其所有子节点。
      for (const childId of node.children) {
        // 递归调用 DFS 探索子节点。
        const childResult = dfs(childId)

        // 5. 提前终止：如果任何一个子节点的探索结果为 false，
        //    说明已经找到了一个值为 false 的叶子，无需再检查其他子节点。
        //    立即返回 false，将“失败”信号向上传递。
        if (!childResult) {
          return false
        }
      }

      // 如果所有子节点都成功返回 true，说明这个分支是“安全”的。
      return true
    }
  }

  // 从根节点开始启动 DFS 遍历。
  const result = dfs(tree.rootId)

  // 根据最终的布尔结果返回 'Yes' 或 'No'。
  return result ? "Yes" : "No"
}

// --- 测试用例 ---

// 测试用例 1: 应该返回 No
const tree_N: Tree = {
  nodes: [
    { id: "A", children: ["B1", "B2"] },
    { id: "B1", children: ["A"] }, // 循环引用
    { id: "B2", value: false }, // 值为 false 的叶子
  ],
  rootId: "A",
}

// 测试用例 2: 应该返回 Yes
const tree_Y: Tree = {
  nodes: [
    { id: "A", children: ["B1", "B2"] },
    { id: "B1", children: ["A"] }, // 循环引用
    { id: "B2", value: true }, // 值为 true 的叶子
  ],
  rootId: "A",
}

// 测试用例 3: 应该返回 Yes (没有叶子节点)
const tree_Y_2: Tree = {
  nodes: [
    { id: "A", children: ["B1", "B2"] },
    { id: "B1", children: ["B2"] },
    { id: "B2", children: ["B1"] }, // B1 和 B2 之间循环
  ],
  rootId: "A",
}

const tree_N_2: Tree = {
  nodes: [
    { id: "A", children: ["B", "C"] },
    { id: "B", children: ["A"] },
    { id: "C", value: false }, // B1 和 B2 之间循环
  ],
  rootId: "A",
}

console.log(`测试 tree_N: 预期 No, 实际 ${evaluateTree(tree_N)}`)
console.log(`测试 tree_Y: 预期 Yes, 实际 ${evaluateTree(tree_Y)}`)
console.log(`测试 tree_Y_2: 预期 Yes, 实际 ${evaluateTree(tree_Y_2)}`)
console.log(`测试 tree_N_2: 预期 No, 实际 ${evaluateTree(tree_N_2)}`)

/*
输出结果:
测试 tree_N: 预期 No, 实际 No
测试 tree_Y: 预期 Yes, 实际 Yes
测试 tree_Y_2: 预期 Yes, 实际 Yes
*/
