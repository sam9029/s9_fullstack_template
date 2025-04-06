/**
 * 递归函数：提取符合条件的节点
 * @param {*} data 原始数据--父子层级的那种
 * @param {*} selectedKeys 所有选中的值
 * @returns
 */
export function extractSelectedNodes(data, selectedKeys) {
  if (!data.length) return [];
  
  function extractNodes(nodes) {
    return nodes
      .filter((node) => selectedKeys.includes(node.id)) // 过滤出选中的节点
      .map((node) => {
        // 如果节点有 children，递归处理子节点
        if (node.children) {
          const children = extractNodes(node.children);
          return { ...node, children: children.length > 0 ? children : undefined };
        }
        return node;
      });
  }

  return extractNodes(data);
}
