import React, { useState, useMemo } from 'react';

/**
 * 单列排序表格组件
 * @param {Array} data - 表格数据列表
 * @param {Array} columns - 列配置数组，格式: [{ key: '字段名', title: '列标题', sortable: true/false }]
 */
const SortTable = ({ 
  data = [], 
  columns = [] 
}) => {
  // 排序状态：只存储当前排序的字段信息 { field: 'name', order: 'asc' } 或 null
  const [sortConfig, setSortConfig] = useState(null);

  // 处理列头点击，切换排序状态
  // 点击当前列时，其他列的排序按钮恢复为不排序状态（只允许单列排序）
  const handleSort = (field) => {
    setSortConfig(prevConfig => {
      // 如果当前字段已经在排序
      if (prevConfig && prevConfig.field === field) {
        // 切换排序状态：升序 -> 降序 -> 取消排序
        if (prevConfig.order === 'asc') {
          return { field, order: 'desc' };
        } else if (prevConfig.order === 'desc') {
          return null; // 取消排序
        }
      }
      // 点击新列，清除之前的排序，设置新列为升序
      return { field, order: 'asc' };
    });
  };

  // 获取字段的当前排序状态
  const getSortOrder = (field) => {
    if (sortConfig && sortConfig.field === field) {
      return sortConfig.order;
    }
    return null;
  };

  // 获取排序指示器图标
  const getSortIcon = (field) => {
    const order = getSortOrder(field);
    if (order === 'asc') return ' ↑';
    if (order === 'desc') return ' ↓';
    return ' ↕';
  };

  // 使用 useMemo 和 sort 方法对数据进行单列排序
  const sortedData = useMemo(() => {
    if (!sortConfig) {
      return data;
    }

    // 创建数据副本，避免修改原数组
    const sorted = [...data];
    const { field, order } = sortConfig;

    // 单列排序
    sorted.sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

        //   null和 undefined
        if(aValue === null && bValue === null) return 0;
        if(aValue === null) return order === 'asc' ? -1 : 1;
        if(bValue === null) return order === 'asc' ? 1 : -1;
        //   比较值
        let comparison = 0;
        if(typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
        } else {
            // 字符串比较
            comparison = String(aValue).localeCompare(String(bValue));
        }

        return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortConfig]);

  return (
    <div style={{ padding: '20px' }}>
      <table 
        style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          border: '1px solid #ddd'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => column.sortable !== false && handleSort(column.key)}
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  border: '1px solid #ddd',
                  cursor: column.sortable !== false ? 'pointer' : 'default',
                  userSelect: 'none',
                  backgroundColor: column.sortable !== false ? '#e8e8e8' : '#f5f5f5'
                }}
                onMouseEnter={(e) => {
                  if (column.sortable !== false) {
                    e.target.style.backgroundColor = '#d0d0d0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (column.sortable !== false) {
                    e.target.style.backgroundColor = '#e8e8e8';
                  }
                }}
              >
                {column.title || column.key}
                {column.sortable !== false && getSortIcon(column.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr 
              key={row.id || index}
              style={{
                backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'
              }}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd'
                  }}
                >
                  {column.render 
                    ? column.render(row[column.key], row, index)
                    : row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* 显示当前排序状态（可选，用于调试） */}
      {sortConfig && (
        <div style={{ marginTop: '10px', color: '#666', fontSize: '12px' }}>
          当前排序: {sortConfig.field} ({sortConfig.order === 'asc' ? '升序' : '降序'})
        </div>
      )}
    </div>
  );
};

export default SortTable;