import React, { useState, useMemo } from 'react';

const SortTable = ({
  tableData = [],
  columns = []
}) => {
  // {filed: xxx, sort: 'asc'}
  const [sortConfig, setConfig] = useState({});

  const onChangeSort = (key) => {
    setConfig(prev => ({
      filed: key,
      sort: prev.filed ? 
      (prev.sort === 'asc' ? 'desc' : prev.sort === 'desc' ? '' : 'asc')
      : 'asc'
    }))
  }

  const getSortData = useMemo(() => {
    let newData = [...tableData]
    const { filed, sort } = sortConfig;
    newData.sort((a, b) => {
      const aVal = a[filed];
      const bVal = b[filed];
      let comparision = 0;
      if(aVal === null && bVal === null) return 0;
      if(aVal !== null && bVal === null) return sort === 'asc' ? 1 : -1;
      if(aVal === null && bVal !== null) return sort === 'asc' ? -1 : 1;
      if(typeof aVal === 'number' && typeof bVal === 'number') {
        comparision = aVal - bVal;
      }
      comparision = String(aVal).localeCompare(String(bVal));
      return sort === 'asc' ? comparision : sort === 'desc' ? -comparision : 0;
    })
    return newData;
  }, [tableData, sortConfig])

  return (
    <table>
      <thead>
        <tr>
          {
            columns.map(item => <td key={item.key}>
              {item.title}
              {/* 排序 */}
              {
                item.sortable && (
                  <span onClick={() => onChangeSort(item.key)}>
                    {sortConfig.filed === item.key ? 
                    (sortConfig.sort === 'asc' ? '↑' : sortConfig.sort === 'desc' ? '↓' : '↕') : '↕'}
                  </span>
                )
              }
            </td>)
          }
        </tr>
      </thead>
      <tbody>
        {
          getSortData.map((row, index) => (
            <tr key={row.id}>
              {
                columns.map(column => <td key={column.key}>{column.render ? column.render(row[column.key], row, index) : row[column.key]}</td>)
              }
            </tr>
          ))
        }
      </tbody>
    </table>
  )
}

export default SortTable;