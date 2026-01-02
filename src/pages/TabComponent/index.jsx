import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchTabData, updateTabItem } from '../../api/tabApi';
import './index.css';

const TabComponent = () => {
  const [activeTab, setActiveTab] = useState('tab1');
  const [tabData, setTabData] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);
  const [raceConditionDetected, setRaceConditionDetected] = useState(false);
  const [raceConditionInfo, setRaceConditionInfo] = useState(null);
  
  // 请求计数器，用于追踪请求
  const requestCounterRef = useRef(0);
  // 使用 ref 存储最新的 activeTab，以便在异步回调中获取最新值
  const activeTabRef = useRef(activeTab);
  
  // 同步更新 ref
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  
  // 标签页配置
  const tabs = [
    { id: 'tab1', label: '标签页 1' },
    { id: 'tab2', label: '标签页 2' },
    { id: 'tab3', label: '标签页 3' },
    { id: 'tab4', label: '标签页 4' },
  ];

  // 获取标签页数据 - 存在竞态条件问题
  // ⚠️ 问题：如果快速连续切换标签页，后发起的请求可能先返回，导致状态被旧的请求结果覆盖
  const loadTabData = useCallback(async (tabId, mounted) => {
    const requestId = ++requestCounterRef.current;
    const requestStartTime = Date.now();
    console.log(`[TabComponent] 发起请求 #${requestId} 获取标签页 "${tabId}" 的数据 (时间: ${new Date().toLocaleTimeString()})`);
    
    setLoading(prev => ({ ...prev, [tabId]: true }));
    setError(null);
    try {
      // 模拟异步 API 调用，有随机延迟
      const data = await fetchTabData(tabId, requestId);
      
      // 获取最新的 activeTab 值
      const currentActiveTab = activeTabRef.current;
      const elapsedTime = Date.now() - requestStartTime;
      
      // ⚠️ 竞态条件问题：这里没有检查请求是否仍然是最新的
      // 如果在这期间切换到了其他标签页，旧的请求结果可能会覆盖新的请求结果
      console.warn(`[TabComponent] 请求 #${requestId} 返回${requestCounterRef.current}，耗时 ${elapsedTime}ms（当前激活标签: ${currentActiveTab}，请求标签: ${tabId}）`);
    //   if (tabId !== currentActiveTab) {
    //     console.warn(`[TabComponent] ⚠️⚠️⚠️ 竞态条件发生！⚠️⚠️⚠️`);
    //     console.warn(`[TabComponent] 请求标签 ${tabId} 的数据返回时，当前激活标签已经是 ${currentActiveTab}`);
    //     console.warn(`[TabComponent] 但数据仍会被更新，导致显示错误的数据！`);
    //     console.warn(`[TabComponent] 这就是竞态条件问题：旧的请求结果覆盖了新的请求结果`);
        
    //     // 设置竞态条件检测状态
    //     setRaceConditionDetected(true);
    //     setRaceConditionInfo({
    //       requestTab: tabId,
    //       currentTab: currentActiveTab,
    //       requestId: requestId,
    //       elapsedTime: elapsedTime
    //     });
        
    //     // 3秒后自动清除警告（可选）
    //     setTimeout(() => {
    //       setRaceConditionDetected(false);
    //     }, 10000);
    //   }
      
      // ⚠️ 关键：这里直接更新状态，不检查 tabId 是否等于 currentActiveTab
      // 这就是竞态条件的根源：旧的请求结果会覆盖新的请求结果
      //
      // 竞态条件场景：
      // 1. 用户点击 tab1，发起请求 #1（延迟 5-6 秒）
      // 2. 用户立即点击 tab2，发起请求 #2（延迟 0.05-0.15 秒）
      // 3. 请求 #2 先返回，更新 tabData[tab2]，显示 tab2 的数据
      // 4. 请求 #1 后返回，此时 currentActiveTab 已经是 tab2
      // 5. ⚠️ 竞态条件：我们错误地将 tab1 的数据更新到 tabData[tab2]，覆盖了 tab2 的数据！
    // if(tabId === currentActiveTab) {
    if(requestCounterRef.current === requestId) {
        setTabData(prev => {
        const newData = {
          ...prev,
          [tabId]: data, // 正常更新对应标签的数据
        };
        
        // ⚠️ 竞态条件模拟：如果请求返回时，当前激活标签已经改变
        // 我们错误地将旧标签的数据更新到当前激活标签（这是错误的，但模拟了竞态条件）
        if (tabId !== currentActiveTab) {
          console.error(`[TabComponent] ⚠️⚠️⚠️ 竞态条件发生！${requestCounterRef.current},${requestId}`);
          console.error(`[TabComponent] 请求标签 ${tabId} 的数据返回时，当前激活标签已经是 ${currentActiveTab}`);
          console.error(`[TabComponent] 错误地将 ${tabId} 的数据更新到了 ${currentActiveTab}，覆盖了 ${currentActiveTab} 的数据！`);
          
          // ⚠️ 关键：错误地更新当前激活标签的数据
          // 这模拟了竞态条件：旧的请求结果覆盖了新的请求结果
          newData[currentActiveTab] = data.map(item => ({
            ...item,
            _tabId: tabId, // 保留原始标签ID，用于识别这是错误的数据
            _requestId: requestId,
            _isRaceCondition: true, // 标记这是竞态条件导致的数据
          }));
        }
        
        return newData;
      });
    // }
    }
    setLoading(prev => ({ ...prev, [tabId]: false }));
    } catch (err) {
      console.error(`[TabComponent] 请求 #${requestId} 失败:`, err);
      setError(err.message);
      setLoading(prev => ({ ...prev, [tabId]: false }));
    }
  }, []);

  // 当激活标签页改变时，每次都重新加载数据
  useEffect(() => {
    let mounted = true;
    // 每次切换都重新调用接口
    loadTabData(activeTab, mounted);
    return () => {
      mounted = false;
    };
  }, [activeTab, loadTabData]);

  // 处理标签页切换
  const handleTabChange = (tabId) => {
    console.log(`[TabComponent] 切换到标签页: ${tabId}`);
    
    setActiveTab(tabId);
    // 注意：数据加载由 useEffect 处理，这里只需要切换标签
  };

  // 处理刷新当前标签页数据
  const handleRefresh = () => {
    console.log(`[TabComponent] 刷新标签页: ${activeTab}`);
    loadTabData(activeTab);
  };

  // 处理更新项目
  const handleUpdateItem = async (itemId, updates) => {
    const requestId = ++requestCounterRef.current;
    console.log(`[TabComponent] 发起请求 #${requestId} 更新项目 ${itemId}`);
    
    try {
      const updatedItem = await updateTabItem(activeTab, itemId, updates, requestId);
      
      // ⚠️ 竞态条件问题：这里没有检查请求是否仍然是最新的
      setTabData(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(item =>
          item.id === itemId ? updatedItem : item
        ),
      }));
    } catch (err) {
      console.error(`[TabComponent] 更新失败:`, err);
      setError(err.message);
    }
  };

  // 获取当前应该显示的数据
  // ⚠️ 竞态条件：直接使用 tabData[activeTab]
  // 如果出现了竞态条件，tabData[activeTab] 中会包含错误的数据（来自其他标签）
  const currentData = tabData[activeTab] || [];
  const isLoading = loading[activeTab];

  return (
    <div className="tab-component">
      <div className="tab-header">
        <h2>标签页组件 - 竞态条件演示</h2>
        <div className="tab-controls">
          <button onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? '加载中...' : '刷新当前标签'}
          </button>
          {error && <span className="error">错误: {error}</span>}
        </div>
      </div>
      
      {raceConditionDetected && raceConditionInfo && (
        <div style={{
          backgroundColor: '#ff1744',
          color: 'white',
          padding: '15px',
          margin: '10px 0',
          borderRadius: '8px',
          border: '3px solid #d32f2f',
          animation: 'pulse 1s infinite',
          fontSize: '16px',
          fontWeight: 'bold',
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '10px' }}>
            ⚠️⚠️⚠️ 竞态条件已发生！⚠️⚠️⚠️
          </div>
          <div>
            当前激活标签: <strong>{raceConditionInfo.currentTab}</strong>，
            但显示的是标签 <strong>{raceConditionInfo.requestTab}</strong> 的数据！
          </div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>
            请求ID: #{raceConditionInfo.requestId}，耗时: {raceConditionInfo.elapsedTime}ms
          </div>
        </div>
      )}

      <div className="tab-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            // disabled={isLoading}
          >
            {tab.label}
            {loading[tab.id] && <span className="loading-indicator">⏳</span>}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {
        isLoading ? (
          <div className="loading">加载中...</div>
        ) : 
        error ? (
          <div className="error">错误: {error}</div>
        ) : (
          <div className="tab-data">
            <h3>
              {tabs.find(t => t.id === activeTab)?.label} 的数据
              {currentData.length > 0 && currentData[0]?._tabId && currentData[0]?._tabId !== activeTab && (
                <span style={{ 
                  color: '#ff1744', 
                  marginLeft: '10px', 
                  fontSize: '18px',
                  fontWeight: 'bold',
                  backgroundColor: '#ffebee',
                  padding: '8px 15px',
                  borderRadius: '6px',
                  border: '3px solid #ff1744',
                  display: 'inline-block',
                  animation: 'pulse 1s infinite',
                  boxShadow: '0 4px 8px rgba(255, 23, 68, 0.4)'
                }}>
                  ⚠️⚠️⚠️ 竞态条件！当前标签是 {activeTab}，但显示的是 {currentData[0]?._tabId} 的数据！⚠️⚠️⚠️
                </span>
              )}
            </h3>
            {currentData.length > 0 && (
              <div style={{ 
                marginBottom: '10px', 
                padding: '10px', 
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                <strong>调试信息：</strong>
                <div>当前激活标签: <strong>{activeTab}</strong></div>
                <div>数据来源标签: <strong>{currentData[0]?._tabId || '未知'}</strong></div>
                <div>数据条数: <strong>{currentData.length}</strong></div>
                {currentData[0]?._requestId && (
                  <div>请求ID: <strong>#{currentData[0]?._requestId}</strong></div>
                )}
              </div>
            )}
            {currentData.length === 0 ? (
              <p>暂无数据</p>
            ) : (
              <ul>
                {currentData.map(item => {
                  const isRaceCondition = item._tabId && item._tabId !== activeTab;
                  return (
                  <li 
                    key={item.id} 
                    className={`tab-item ${isRaceCondition ? 'race-condition-item' : ''}`}
                    style={{
                      borderLeft: isRaceCondition ? '4px solid #ff1744' : '4px solid transparent',
                      backgroundColor: isRaceCondition ? '#ffebee' : 'white',
                      border: isRaceCondition ? '2px solid #ff1744' : 'none',
                      boxShadow: isRaceCondition ? '0 0 15px rgba(255, 23, 68, 0.6)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <span>值: {item.value}</span>
                      {item._requestId && (
                        <span className="request-id">
                          请求ID: #{item._requestId}
                          {item._tabId && (
                            <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                              标签: {item._tabId}
                            </span>
                          )}
                          {item._tabId && item._tabId !== activeTab && (
                            <span style={{ 
                              color: '#ff1744', 
                              marginLeft: '8px', 
                              fontWeight: 'bold',
                              fontSize: '16px',
                              backgroundColor: '#ffebee',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '2px solid #ff1744'
                            }}>
                              ⚠️⚠️⚠️ 竞态条件！当前标签是 {activeTab}，但这是 {item._tabId} 的数据 ⚠️⚠️⚠️
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleUpdateItem(item.id, { value: item.value + 10 })}
                    >
                      增加 10
                    </button>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="tab-info">
        <h4>如何演示竞态条件问题：</h4>
        <ol>
          <li>打开浏览器控制台（F12），查看 Network 标签页（可选）</li>
          <li><strong>关键演示场景：</strong></li>
          <ul>
            <li><strong>tab1</strong>: 数据多（20条），返回时间长（5000-6000ms，约5-6秒）</li>
            <li><strong>tab2</strong>: 数据少（2条），返回时间短（50-150ms，约0.05-0.15秒）</li>
          </ul>
          <li><strong>演示步骤（重要！）：</strong></li>
          <ul>
            <li><strong>步骤1：</strong>点击 <strong>tab1</strong>，观察控制台会显示"发起请求 #1 获取标签页 tab1"</li>
            <li><strong>步骤2：</strong>立即（在0.5秒内）点击 <strong>tab2</strong>，观察控制台会显示"发起请求 #2 获取标签页 tab2"</li>
            <li><strong>步骤3：</strong>等待约0.05-0.15秒，tab2 的请求会先返回，页面会显示 tab2 的数据（2条，数据名称是"标签2-项目1"和"标签2-项目2"）</li>
            <li><strong>步骤4：</strong>继续等待约5-6秒，tab1 的请求会返回</li>
            <li><strong>步骤5：</strong>观察页面：</li>
            <ul>
              <li>虽然当前激活的是 <strong>tab2</strong>（标签按钮是蓝色的），但显示的数据变成了 <strong>tab1</strong> 的数据（20条，数据名称是"标签1-项目1"到"标签1-项目20"）！</li>
              <li>页面顶部会出现<strong>红色闪烁的警告横幅</strong>，显示"竞态条件已发生！"</li>
              <li>数据项会有<strong>红色边框和黄色背景</strong>，并且有抖动动画</li>
              <li>每个数据项会显示红色警告："⚠️⚠️⚠️ 竞态条件！当前标签是 tab2，但这是 tab1 的数据 ⚠️⚠️⚠️"</li>
            </ul>
          </ul>
          <li><strong>观察要点：</strong></li>
          <ul>
            <li>控制台会显示 <strong>红色警告</strong>："⚠️⚠️⚠️ 竞态条件发生！⚠️⚠️⚠️"</li>
            <li>页面上会显示 <strong>红色边框和黄色背景</strong> 的数据项</li>
            <li>页面标题下方会显示 <strong>红色警告框</strong>，说明出现了竞态条件</li>
            <li>调试信息区域会显示当前激活标签和数据来源标签不一致</li>
            <li>每个数据项会显示其请求ID和来源标签</li>
          </ul>
          <li><strong>如果看不到竞态条件：</strong></li>
          <ul>
            <li>确保在点击 tab1 后，立即（1秒内）点击 tab2</li>
            <li>如果切换太慢，tab1 可能已经返回了</li>
            <li>可以多次尝试，确保快速切换</li>
          </ul>
        </ol>
      </div>
    </div>
  );
};

export default TabComponent;

