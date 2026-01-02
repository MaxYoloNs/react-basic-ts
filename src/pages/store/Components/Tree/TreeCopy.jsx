import React, {useCallback, useState} from 'react';

const Tree = ({
  data = [],
  onCheckedChange
}) => {
  const [expendObj, setExpendObj] = useState({})
  const [checkedObj, setCheckedObj] = useState({})

  const onChangeExpend = (id) => {
    setExpendObj(prev => ({ ...prev, [id]: !prev[id]}))
  }

  const getAllChildren = useCallback((node) => {
    let ids = []
    for(let item of node) {
      if(item.children) {
        const childs = getAllChildren(item.children);
        if(childs) {
          ids = ids.concat(childs)
        }
      }
      ids.push(item.id)
    }
    return ids;
  }, [])

  // 从根节点向下寻找当前子节点所在父节点
  const getCurParent = useCallback((curId, data, parentId = null) => {
    for(let item of data) {
      if(item.id === curId) {
        return parentId;
      }
      if(item.children) {
        const getChild = getCurParent(curId, item.children, item.id);
        if(getChild) return getChild;
      }
    }
    return null;
  }, [])

  const onCheckedObjChange = (node, checked) => {
    // 选中当前节点，所有子节点，当前所在父节点
    let curCheckedObj = {...checkedObj, [node.id]: checked};
    // 获取所有子节点
    if(node.children) {
      const childrens = getAllChildren(node.children)
      if(childrens && childrens.length > 0) {
        childrens.forEach(item => curCheckedObj[item] = checked)
      }
    }
    // 获取当前父节点
    const parent = getCurParent(node.id, data)
    if(parent) curCheckedObj[parent] = checked

    if(onCheckedChange) {
      onCheckedChange(curCheckedObj)
    }
    setCheckedObj(curCheckedObj)
  }

  const renderNode = (node, level = 0) => {

    return (
      <div style={{ marginLeft: level * 20}}>
        <div>
          {/* 展开折叠 */}
          {
            node.children && <span onClick={() => onChangeExpend(node.id)}>{expendObj[node.id] ? '▼' : '▶'}</span>
          }
          {/* 多选 */}
          <input type='checkbox' checked={checkedObj[node.id]} onChange={(e) => onCheckedObjChange(node, e.target.checked)}></input>
          <span>{node.label}</span>
        </div>
        {node.children && expendObj[node.id] && node.children.map(item => renderNode(item, level + 1))}
      </div>
    )
  }

  return (
    <div>
      {data && data.length > 0 && data.map(item => renderNode(item))}
    </div>
  )
}

export default Tree;