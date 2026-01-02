import React, { useState, useRef, useMemo, useCallback } from 'react';
import './index.css';
// 阉割版 虚拟列表
// 计算可视区域起始索引，开始位置和结束位置
const VisualListCopy = ({
    data = [],
    itemHeight = 50,
    containerHeight = 400
}) => {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0)

    const totalHeight = useMemo(() => data.length * itemHeight, [data.length, itemHeight])
    const startIndex = useMemo(() => Math.max(0, Math.floor(scrollTop / itemHeight)), [scrollTop, itemHeight])
    const endIndex = useMemo(() => Math.min(data.length - 1, Math.ceil(scrollTop + containerHeight) / itemHeight), [data.length, scrollTop, containerHeight, itemHeight])

    const handleScroll = (e) => {
        const scrollTop = e.target.scrollTop;
        setScrollTop(scrollTop)
    }

    const getVisibleItems = useMemo(() => {
        console.log('startIndex',startIndex,endIndex);
        
        return data.slice(startIndex, endIndex + 1)
    }, [startIndex, endIndex, data])

    return (
        <div className="visual-list"
            ref={containerRef}
            onScroll={handleScroll}
            style={{
                height: containerHeight,
                overflowY: 'scroll'
            }}
        >
            <div style={{ height: totalHeight, position: 'relative' }} className='visual-list-content'>
                {getVisibleItems.map((item, index) => {
                    // 重点：可见项目
                    const itemIndex = startIndex + index;
                    return (
                    <div key={index}
                    className="virtual-list-item"
                    style={{
                        position: 'absolute',
                        top: itemIndex * itemHeight,
                        height: itemHeight,
                        width: '100%',
                    }}>
                        {item.name}
                    </div>
                )})}
            </div>
        </div>
    )
}

/**
 * 虚拟列表示例组件
 */
const VisualList = () => {
  // 生成大量测试数据
  const generateData = (count) => {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      name: `项目 ${index + 1}`,
      description: `这是第 ${index + 1} 个项目的描述信息`,
      value: Math.floor(Math.random() * 10000),
      status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
      date: new Date(2024, 0, index + 1).toLocaleDateString('zh-CN'),
    }));
  };

  const [dataCount, setDataCount] = useState(1000);
  const [itemHeight, setItemHeight] = useState(80);
  const [containerHeight, setContainerHeight] = useState(500);

  const data = useMemo(() => generateData(dataCount), [dataCount]);

  // 渲染每个项目的函数
  const renderItem = useCallback((item, index) => {
    return (
      <div className="virtual-list-item-content">
        <div className="item-header">
        <span className="item-index">#{index + 1}</span>
          <span className="item-name">{item.name}</span>
          <span className={`item-status item-status-${item.status}`}>
            {item.status}
          </span>
        </div>
        <div className="item-body">
          <p className="item-description">{item.description}</p>
          <div className="item-footer">
            <span>值: {item.value}</span>
            <span>日期: {item.date}</span>
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="visual-list-page">
      <h2>虚拟列表组件演示</h2>
      
      <div className="controls">
        <div className="control-group">
          <label>
            数据量：
            <input
              type="number"
              min="100"
              max="100000"
              step="100"
              value={dataCount}
              onChange={(e) => setDataCount(Number(e.target.value))}
            />
          </label>
        </div>
        
        <div className="control-group">
          <label>
            项目高度 (px)：
            <input
              type="number"
              min="30"
              max="200"
              step="10"
              value={itemHeight}
              onChange={(e) => setItemHeight(Number(e.target.value))}
            />
          </label>
        </div>
        
        <div className="control-group">
          <label>
            容器高度 (px)：
            <input
              type="number"
              min="200"
              max="1000"
              step="50"
              value={containerHeight}
              onChange={(e) => setContainerHeight(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="info-bar">
        <span>总数据量: {data.length.toLocaleString()}</span>
        <span>可见项目: ~{Math.ceil(containerHeight / itemHeight)}</span>
        <span>实际渲染: 仅可见区域 + 缓冲区</span>
      </div>

      <div className="virtual-list-wrapper">
        <VisualListCopy
          data={data}
          itemHeight={itemHeight}
          containerHeight={containerHeight}
          renderItem={renderItem}
        />
      </div>

      <div className="performance-info">
        <h3>性能优势</h3>
        <ul>
          <li>✅ 只渲染可见区域的项目，大幅提升性能</li>
          <li>✅ 支持大量数据（10万+）流畅滚动</li>
          <li>✅ 内存占用低，不会因为数据量大而卡顿</li>
          <li>✅ 支持固定高度和动态高度</li>
          <li>✅ 自动计算可见区域，无需手动管理</li>
        </ul>
      </div>
    </div>
  );
};

export default VisualList;