import React, { useState, useCallback } from 'react';

/**
 * 树形组件
 * @param {Array} data - 树形数据，格式: [{ id, label, children: [...] }]
 * @param {Function} onCheckChange - 选择变化回调函数 (checkedKeys) => {}
 */
const Tree = ({ 
  data = [], 
  onCheckChange 
}) => {
  // 存储每个节点的展开/折叠状态 { nodeId: true/false }
  const [expandedKeys, setExpandedKeys] = useState({});
  // 存储每个节点的选中状态 { nodeId: true/false }
  const [checkedKeys, setCheckedKeys] = useState({});

  // 获取节点的所有子节点ID（递归）
  const getAllChildrenIds = useCallback((node) => {
    if (!node.children || node.children.length === 0) {
      return [];
    }
    let ids = [];
    node.children.forEach(child => {
      ids.push(child.id);
      ids = ids.concat(getAllChildrenIds(child));
    });
    return ids;
  }, []);

  // 获取节点的所有父节点ID（需要从根节点查找）
  const getAllParentIds = useCallback((nodeId, treeData, parentIds = []) => {
    for (const node of treeData) {
      if (node.id === nodeId) {
        return parentIds;
      }
      if (node.children) {
        const found = getAllParentIds(nodeId, node.children, [...parentIds, node.id]);
        if (found !== null) {
          return found;
        }
      }
    }
    return null;
  }, []);

  // 检查节点的子节点是否全部选中
  const areAllChildrenChecked = useCallback((node) => {
    if (!node.children || node.children.length === 0) {
      return true;
    }
    return node.children.every(child => {
      const isChecked = checkedKeys[child.id] === true;
      const allChildrenChecked = areAllChildrenChecked(child);
      return isChecked && allChildrenChecked;
    });
  }, [checkedKeys]);

  // 检查节点的子节点是否有部分选中
  const areSomeChildrenChecked = useCallback((node) => {
    if (!node.children || node.children.length === 0) {
      return false;
    }
    return node.children.some(child => {
      const isChecked = checkedKeys[child.id] === true;
      const someChildrenChecked = areSomeChildrenChecked(child);
      return isChecked || someChildrenChecked;
    });
  }, [checkedKeys]);

  // 检查节点的所有子节点是否全部选中（基于给定的 checkedKeys）
  const checkAllChildrenChecked = useCallback((node, keys) => {
    if (!node.children || node.children.length === 0) {
      return true;
    }
    return node.children.every(child => {
      const isChecked = keys[child.id] === true;
      const allChildrenChecked = checkAllChildrenChecked(child, keys);
      return isChecked && allChildrenChecked;
    });
  }, []);

  // 处理节点选择
  const handleCheck = useCallback((node, checked) => {
    const newCheckedKeys = { ...checkedKeys };
    const allChildrenIds = getAllChildrenIds(node);
    
    // 设置当前节点状态
    newCheckedKeys[node.id] = checked;
    
    // 设置所有子节点状态（子节点全选）
    allChildrenIds.forEach(childId => {
      newCheckedKeys[childId] = checked;
    });
    
    // 更新父节点状态（父节点反选）- 基于新的 checkedKeys
    const parentIds = getAllParentIds(node.id, data);
    if (parentIds) {
      parentIds.reverse().forEach(parentId => {
        // 找到父节点
        const findNode = (nodes, targetId) => {
          for (const n of nodes) {
            if (n.id === targetId) return n;
            if (n.children) {
              const found = findNode(n.children, targetId);
              if (found) return found;
            }
          }
          return null;
        };
        const parentNode = findNode(data, parentId);
        if (parentNode) {
          // 使用新的 checkedKeys 来检查所有子节点是否都被选中
          const allChecked = checkAllChildrenChecked(parentNode, newCheckedKeys);
          newCheckedKeys[parentId] = allChecked;
        }
      });
    }
    
    setCheckedKeys(newCheckedKeys);
    
    // 触发回调
    if (onCheckChange) {
      const checkedKeyList = Object.keys(newCheckedKeys).filter(key => newCheckedKeys[key] === true);
      onCheckChange(checkedKeyList);
    }
  }, [checkedKeys, getAllChildrenIds, getAllParentIds, data, checkAllChildrenChecked, onCheckChange]);

  // 处理展开/折叠
  const handleExpand = useCallback((nodeId) => {
    setExpandedKeys(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  }, []);

  // 获取节点的半选状态
  const getIndeterminate = useCallback((node) => {
    if (!node.children || node.children.length === 0) {
      return false;
    }
    const someChecked = areSomeChildrenChecked(node);
    const allChecked = areAllChildrenChecked(node);
    return someChecked && !allChecked;
  }, [areSomeChildrenChecked, areAllChildrenChecked]);

  // 渲染树节点
  const renderTreeNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedKeys[node.id] === true;
    const isChecked = checkedKeys[node.id] === true;
    const isIndeterminate = getIndeterminate(node);

    return (
      <div key={node.id} style={{ marginLeft: `${level * 20}px` }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            padding: '8px 4px',
            cursor: 'pointer',
            userSelect: 'none',
            backgroundColor: level % 2 === 0 ? '#fff' : '#f9f9f9'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e8f4f8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = level % 2 === 0 ? '#fff' : '#f9f9f9';
          }}
        >
          {/* 展开/折叠图标 */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                handleExpand(node.id);
              }
            }}
            style={{
              display: 'inline-block',
              width: '20px',
              textAlign: 'center',
              marginRight: '4px',
              cursor: hasChildren ? 'pointer' : 'default',
              color: hasChildren ? '#333' : 'transparent'
            }}
          >
            {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
          </span>

          {/* 复选框 */}
          <input
            type="checkbox"
            checked={isChecked || false}
            ref={(input) => {
              if (input) {
                // input半选中状态
                input.indeterminate = isIndeterminate;
              }
            }}
            onChange={(e) => {
              e.stopPropagation();
              handleCheck(node, e.target.checked);
            }}
            style={{
              marginRight: '8px',
              cursor: 'pointer'
            }}
          />

          {/* 节点标签 */}
          <span
            onClick={() => {
              if (hasChildren) {
                handleExpand(node.id);
              }
            }}
            style={{
              flex: 1,
              cursor: hasChildren ? 'pointer' : 'default'
            }}
          >
            {node.label || node.title || node.name || node.id}
          </span>
        </div>

        {/* 子节点 */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ 
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#fff',
      maxWidth: '600px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>树形组件</h3>
      <div style={{ 
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        padding: '8px',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        {data.map(node => renderTreeNode(node, 0))}
      </div>
      
      {/* 显示当前选中的节点 */}
      {Object.keys(checkedKeys).filter(key => checkedKeys[key] === true).length > 0 && (
        <div style={{ 
          marginTop: '16px', 
          padding: '8px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          已选中: {Object.keys(checkedKeys).filter(key => checkedKeys[key] === true).join(', ')}
        </div>
      )}
    </div>
  );
};

export default Tree;

