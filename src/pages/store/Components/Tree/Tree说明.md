# 为什么使用对象而不是数组存储选中节点和展开节点？

## 主要原因

### 1. **查找性能优势** ⚡

**使用对象（O(1) 时间复杂度）：**
```javascript
// 直接通过 key 访问，时间复杂度 O(1)
const isChecked = checkedKeys[node.id] === true;
const isExpanded = expandedKeys[node.id] === true;
```

**如果使用数组（O(n) 时间复杂度）：**
```javascript
// 需要遍历数组查找，时间复杂度 O(n)
const isChecked = checkedKeysArray.includes(node.id);
const isExpanded = expandedKeysArray.includes(node.id);
```

**性能对比：**
- 对象：无论有多少节点，查找都是 O(1) - 瞬间完成
- 数组：节点越多，查找越慢 - O(n) 线性增长

### 2. **更新效率** 🔄

**使用对象：**
```javascript
// 直接设置，O(1) 时间复杂度
newCheckedKeys[node.id] = checked;
newCheckedKeys[childId] = checked; // 批量更新子节点，每个都是 O(1)

// 切换展开状态，O(1)
setExpandedKeys(prev => ({
  ...prev,
  [nodeId]: !prev[nodeId]  // 直接更新，不需要查找
}));
```

**如果使用数组：**
```javascript
// 需要先查找索引，然后更新，O(n) + O(1)
const index = checkedKeysArray.indexOf(node.id);
if (index > -1) {
  checkedKeysArray[index] = node.id; // 或者需要删除/添加
} else {
  checkedKeysArray.push(node.id);
}

// 切换展开状态，需要查找和删除/添加
const expandedIndex = expandedKeysArray.indexOf(nodeId);
if (expandedIndex > -1) {
  expandedKeysArray.splice(expandedIndex, 1); // 删除
} else {
  expandedKeysArray.push(nodeId); // 添加
}
```

### 3. **代码简洁性** ✨

**使用对象：**
```javascript
// 检查节点是否选中 - 一行代码
const isChecked = checkedKeys[node.id] === true;

// 设置节点状态 - 一行代码
newCheckedKeys[node.id] = checked;

// 批量更新子节点 - 简洁明了
allChildrenIds.forEach(childId => {
  newCheckedKeys[childId] = checked; // 直接设置
});
```

**如果使用数组：**
```javascript
// 检查节点是否选中 - 需要 includes 或 find
const isChecked = checkedKeysArray.includes(node.id);

// 设置节点状态 - 需要判断是否存在，然后添加或删除
if (checked) {
  if (!checkedKeysArray.includes(node.id)) {
    checkedKeysArray.push(node.id);
  }
} else {
  const index = checkedKeysArray.indexOf(node.id);
  if (index > -1) {
    checkedKeysArray.splice(index, 1);
  }
}

// 批量更新子节点 - 需要判断每个子节点
allChildrenIds.forEach(childId => {
  if (checked) {
    if (!checkedKeysArray.includes(childId)) {
      checkedKeysArray.push(childId);
    }
  } else {
    const index = checkedKeysArray.indexOf(childId);
    if (index > -1) {
      checkedKeysArray.splice(index, 1);
    }
  }
});
```

### 4. **状态表示更直观** 📊

**对象表示：**
```javascript
// 清晰表示每个节点的状态
checkedKeys = {
  '1': true,      // 节点1已选中
  '1-1': true,    // 节点1-1已选中
  '1-2': false,   // 节点1-2未选中（显式表示）
  '2': true
}
```

**数组表示：**
```javascript
// 只能表示选中的节点，未选中的节点信息丢失
checkedKeys = ['1', '1-1', '2']
// 无法直接知道 '1-2' 的状态，需要检查数组
```

### 5. **React 状态更新优化** ⚛️

**使用对象：**
```javascript
// React 可以更好地进行浅比较
setCheckedKeys(prev => ({
  ...prev,
  [nodeId]: !prev[nodeId]  // 只更新变化的属性
}));
```

**如果使用数组：**
```javascript
// 每次都需要创建新数组，即使只改变一个元素
setCheckedKeys(prev => {
  const newArray = [...prev];
  const index = newArray.indexOf(nodeId);
  if (index > -1) {
    newArray.splice(index, 1);
  } else {
    newArray.push(nodeId);
  }
  return newArray;
});
```

## 实际场景对比

### 场景：选中一个父节点，需要更新 100 个子节点

**使用对象：**
```javascript
// 时间复杂度：O(1) × 100 = O(100) ≈ O(n) 其中 n 是子节点数
allChildrenIds.forEach(childId => {
  newCheckedKeys[childId] = true; // 每个操作都是 O(1)
});
```

**使用数组：**
```javascript
// 时间复杂度：O(n) × 100 = O(100n) 其中 n 是已选中节点数
allChildrenIds.forEach(childId => {
  if (!checkedKeysArray.includes(childId)) { // 每次 includes 都是 O(n)
    checkedKeysArray.push(childId);
  }
});
```

**性能差异：**
- 对象：100 个子节点 = 100 次 O(1) 操作 = 非常快
- 数组：100 个子节点 = 100 次 O(n) 查找 = 随着已选中节点增多而变慢

## 总结

| 特性 | 对象 | 数组 |
|------|------|------|
| 查找性能 | O(1) - 极快 | O(n) - 随数据量增长变慢 |
| 更新效率 | O(1) - 直接设置 | O(n) - 需要查找后更新 |
| 代码简洁性 | ✅ 简洁直观 | ❌ 需要更多判断逻辑 |
| 状态表示 | ✅ 完整（包含选中/未选中） | ❌ 只表示选中状态 |
| 批量操作 | ✅ 高效 | ❌ 需要多次查找 |
| 适用场景 | ✅ 频繁查找和更新 | ✅ 需要保持顺序的场景 |

**结论：** 对于树形组件的选中和展开状态管理，对象是更好的选择，因为：
1. 需要频繁查找节点状态（渲染时）
2. 需要频繁更新节点状态（用户交互时）
3. 性能要求高（树节点可能很多）
4. 不需要保持顺序（选中状态是集合，不是序列）

