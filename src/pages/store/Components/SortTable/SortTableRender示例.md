# column.render 的作用和使用示例

## 作用说明

`column.render` 是一个**自定义渲染函数**，用于自定义表格单元格的显示内容。它提供了比直接显示原始数据更灵活的展示方式。

### 函数签名

```javascript
column.render = (cellValue, row, index) => ReactNode
```

**参数说明：**
- `cellValue`: 当前单元格的值（即 `row[column.key]`）
- `row`: 整行数据对象
- `index`: 当前行的索引

## 使用场景

### 1. **格式化显示**

```javascript
const columns = [
  {
    key: 'score',
    title: '分数',
    sortable: true,
    render: (value) => {
      // 格式化分数显示，添加颜色
      if (value >= 90) {
        return <span style={{ color: 'green', fontWeight: 'bold' }}>{value}分</span>;
      } else if (value >= 80) {
        return <span style={{ color: 'orange' }}>{value}分</span>;
      } else {
        return <span style={{ color: 'red' }}>{value}分</span>;
      }
    }
  }
];
```

### 2. **显示图标或标签**

```javascript
const columns = [
  {
    key: 'department',
    title: '部门',
    sortable: true,
    render: (value) => {
      const icons = {
        '技术部': '💻',
        '产品部': '📱',
        '设计部': '🎨'
      };
      return (
        <span>
          {icons[value] || '📋'} {value}
        </span>
      );
    }
  }
];
```

### 3. **使用整行数据进行计算**

```javascript
const columns = [
  {
    key: 'age',
    title: '年龄',
    sortable: true,
    render: (value, row) => {
      // 使用整行数据计算显示内容
      const birthYear = new Date().getFullYear() - value;
      return (
        <span>
          {value}岁 (生于{birthYear}年)
        </span>
      );
    }
  }
];
```

### 4. **添加操作按钮**

```javascript
const columns = [
  {
    key: 'name',
    title: '姓名',
    sortable: true,
    render: (value, row, index) => {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{value}</span>
          <button 
            onClick={() => console.log('编辑', row)}
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            编辑
          </button>
          <button 
            onClick={() => console.log('删除', row)}
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            删除
          </button>
        </div>
      );
    }
  }
];
```

### 5. **条件渲染**

```javascript
const columns = [
  {
    key: 'status',
    title: '状态',
    sortable: true,
    render: (value) => {
      if (value === 'active') {
        return <span style={{ color: 'green' }}>✓ 活跃</span>;
      } else if (value === 'inactive') {
        return <span style={{ color: 'gray' }}>○ 非活跃</span>;
      } else {
        return <span style={{ color: 'red' }}>✗ 禁用</span>;
      }
    }
  }
];
```

### 6. **显示进度条或评分**

```javascript
const columns = [
  {
    key: 'score',
    title: '分数',
    sortable: true,
    render: (value) => {
      const percentage = (value / 100) * 100;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '100px', 
            height: '8px', 
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: percentage >= 90 ? 'green' : percentage >= 80 ? 'orange' : 'red',
              transition: 'width 0.3s'
            }} />
          </div>
          <span>{value}分</span>
        </div>
      );
    }
  }
];
```

## 完整示例

```javascript
const columns = [
  {
    key: 'name',
    title: '姓名',
    sortable: true,
    // 不使用 render，直接显示 row.name
  },
  {
    key: 'age',
    title: '年龄',
    sortable: true,
    render: (value, row) => {
      // 使用 render 自定义显示
      return <span style={{ color: value > 30 ? 'red' : 'black' }}>{value}岁</span>;
    }
  },
  {
    key: 'score',
    title: '分数',
    sortable: true,
    render: (value) => {
      // 格式化显示
      return <strong>{value}分</strong>;
    }
  },
  {
    key: 'department',
    title: '部门',
    sortable: true,
    render: (value, row, index) => {
      // 使用所有参数
      return (
        <div>
          <span>{value}</span>
          <small style={{ color: '#999', marginLeft: '8px' }}>
            (第{index + 1}行)
          </small>
        </div>
      );
    }
  }
];
```

## 总结

`column.render` 的作用：
1. ✅ **自定义单元格显示**：不局限于显示原始数据
2. ✅ **格式化数据**：添加样式、图标、标签等
3. ✅ **使用整行数据**：可以基于其他字段进行计算
4. ✅ **添加交互元素**：按钮、链接等
5. ✅ **条件渲染**：根据数据值显示不同内容

**不使用 render**：直接显示 `row[column.key]`  
**使用 render**：完全自定义显示内容

