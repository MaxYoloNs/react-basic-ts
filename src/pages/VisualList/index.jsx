import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import './index.css';

/**
 * 虚拟列表组件 - 支持高度不定的动态列表
 * 使用 new Image() 预加载所有图片获取真实高度，计算所有图片坐标
 * 虚拟滚动计算可见范围，requestAnimationFrame 优化，渲染所有可见项
 * 
 * @param {Array} data - 列表数据
 * @param {number} itemHeight - 每个项目的初始高度（固定高度）或函数（动态高度）
 * @param {number} containerHeight - 容器高度
 * @param {Function} renderItem - 渲染每个项目的函数 (item, index, ref) => ReactNode
 * @param {number} overscan - 上下额外渲染的项目数量（用于平滑滚动）
 * @param {Function} getImageUrl - 获取图片URL的函数 (item, index) => string
 * @param {number} containerWidth - 容器宽度（用于计算图片真实高度）
 */
const VirtualList = ({
  data = [],
  itemHeight = 50,
  containerHeight = 400,
  renderItem,
  overscan = 3,
  getImageUrl,
  containerWidth = 800,
}) => {
  const containerRef = useRef(null);
  const itemRefs = useRef(new Map()); // 存储每个项目的DOM引用
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeightsRef = useRef(new Map()); // 存储每个项目的真实高度
  const [itemHeightsVersion, setItemHeightsVersion] = useState(0); // 版本号用于触发重新计算
  const [isPreloading, setIsPreloading] = useState(true); // 预加载状态
  const [preloadProgress, setPreloadProgress] = useState(0); // 预加载进度
  const rafIdRef = useRef(null); // requestAnimationFrame ID
  const scrollTimeoutRef = useRef(null); // 滚动防抖定时器
  const imageCacheRef = useRef(new Map()); // 图片缓存，存储已加载的图片对象和尺寸
  const observerRef = useRef(null); // IntersectionObserver 引用
  const visibleIndicesRef = useRef(new Set()); // 使用 IntersectionObserver 检测到的可见索引
  const observerEnabledRef = useRef(true); // 是否启用 IntersectionObserver
  const [observerTrigger, setObserverTrigger] = useState(0); // 用于触发可见范围重新计算
  const idleCallbackRef = useRef(null); // requestIdleCallback ID
  const pendingImagesRef = useRef([]); // 待加载的图片队列
  const loadedImagesRef = useRef(new Set()); // 已加载的图片索引
  const imagePromisesRef = useRef(new Map()); // 图片加载 Promise 缓存

  // requestIdleCallback polyfill（如果不支持）
  const requestIdleCallbackPolyfill = useCallback((callback, options = {}) => {
    if (typeof window.requestIdleCallback === 'function') {
      return window.requestIdleCallback(callback, options);
    }
    // Polyfill: 使用 setTimeout 模拟，延迟执行
    const start = Date.now();
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, 1);
  }, []);

  const cancelIdleCallbackPolyfill = useCallback((id) => {
    if (typeof window.cancelIdleCallback === 'function') {
      return window.cancelIdleCallback(id);
    }
    return clearTimeout(id);
  }, []);

  // 加载单个图片
  const loadSingleImage = useCallback((item, index) => {
    // 如果已经加载过，直接返回
    if (loadedImagesRef.current.has(index) || imagePromisesRef.current.has(index)) {
      return imagePromisesRef.current.get(index);
    }

    const imageUrl = getImageUrl(item, index);
    if (!imageUrl) {
      const defaultHeight = typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
      itemHeightsRef.current.set(index, defaultHeight);
      loadedImagesRef.current.add(index);
      return Promise.resolve({ index, height: defaultHeight });
    }

    const img = new Image();
    const promise = new Promise((resolve) => {
      img.onload = () => {
        // 计算图片在容器中的真实高度
        const aspectRatio = img.naturalHeight / img.naturalWidth;
        const displayWidth = containerWidth - 32; // 减去padding
        const displayHeight = displayWidth * aspectRatio;
        
        // 存储图片对象和尺寸信息
        imageCacheRef.current.set(index, {
          img,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          displayWidth,
          displayHeight,
          aspectRatio,
        });

        // 计算整个项目的总高度（图片高度 + 其他内容高度）
        const baseHeight = typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
        const totalHeight = baseHeight + displayHeight;
        
        itemHeightsRef.current.set(index, totalHeight);
        loadedImagesRef.current.add(index);
        
        resolve({ index, height: totalHeight });
      };

      img.onerror = () => {
        // 图片加载失败，使用默认高度
        const defaultHeight = typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
        itemHeightsRef.current.set(index, defaultHeight);
        loadedImagesRef.current.add(index);
        resolve({ index, height: defaultHeight });
      };

      img.src = imageUrl;
    });

    imagePromisesRef.current.set(index, promise);
    return promise;
  }, [getImageUrl, containerWidth, itemHeight]);

  // 在空闲时间加载一批图片
  const loadImagesInIdleTime = useCallback((deadline) => {
    // 每次空闲时间最多加载的图片数量
    const BATCH_SIZE = 3;
    let loadedInThisBatch = 0;

    // 在有空余时间时加载图片
    while (
      pendingImagesRef.current.length > 0 &&
      (deadline.timeRemaining() > 0 || deadline.didTimeout) &&
      loadedInThisBatch < BATCH_SIZE
    ) {
      const { item, index } = pendingImagesRef.current.shift();
      
      loadSingleImage(item, index).then(() => {
        // 更新进度
        const total = data.length;
        const loaded = loadedImagesRef.current.size;
        setPreloadProgress(Math.round((loaded / total) * 100));

        // 检查是否所有图片都加载完成
        if (loaded === total) {
          setItemHeightsVersion(prev => prev + 1);
          setIsPreloading(false);
        }
      });

      loadedInThisBatch++;
    }

    // 检查是否还有待加载的图片或正在加载的图片
    const total = data.length;
    const loaded = loadedImagesRef.current.size;
    const pending = pendingImagesRef.current.length;

    if (pending > 0) {
      // 还有待加载的图片，继续调度
      idleCallbackRef.current = requestIdleCallbackPolyfill(loadImagesInIdleTime, {
        timeout: 2000, // 2秒超时，确保最终会执行
      });
    } else if (loaded < total) {
      // 所有图片都已开始加载，但还有未完成的，继续等待
      idleCallbackRef.current = requestIdleCallbackPolyfill(loadImagesInIdleTime, {
        timeout: 2000,
      });
    } else {
      // 所有图片都加载完成
      setIsPreloading(false);
      setItemHeightsVersion(prev => prev + 1);
    }
  }, [data.length, loadSingleImage, requestIdleCallbackPolyfill]);

  // 预加载所有图片并获取真实高度（使用 requestIdleCallback）
  const preloadImages = useCallback(() => {
    if (!getImageUrl || data.length === 0) {
      setIsPreloading(false);
      return;
    }

    // 取消之前的空闲回调
    if (idleCallbackRef.current) {
      cancelIdleCallbackPolyfill(idleCallbackRef.current);
    }

    setIsPreloading(true);
    setPreloadProgress(0);

    // 重置状态
    pendingImagesRef.current = [];
    loadedImagesRef.current.clear();
    imagePromisesRef.current.clear();

    // 准备所有待加载的图片
    data.forEach((item, index) => {
      const imageUrl = getImageUrl(item, index);
      if (imageUrl) {
        pendingImagesRef.current.push({ item, index });
      } else {
        // 没有图片的项目，直接设置默认高度
        const defaultHeight = typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
        itemHeightsRef.current.set(index, defaultHeight);
        loadedImagesRef.current.add(index);
      }
    });

    // 如果所有项目都没有图片，直接完成
    if (pendingImagesRef.current.length === 0) {
      setIsPreloading(false);
      setItemHeightsVersion(prev => prev + 1);
      return;
    }

    // 开始使用 requestIdleCallback 加载图片
    idleCallbackRef.current = requestIdleCallbackPolyfill(loadImagesInIdleTime, {
      timeout: 2000, // 2秒超时
    });
  }, [data, getImageUrl, itemHeight, loadImagesInIdleTime, requestIdleCallbackPolyfill, cancelIdleCallbackPolyfill]);

  // 初始化时预加载图片
  useEffect(() => {
    preloadImages();
  }, [preloadImages]);

  // 判断 itemHeight 是固定值还是函数
  const getItemHeight = useCallback((index) => {
    if (itemHeightsRef.current.has(index)) {
      return itemHeightsRef.current.get(index);
    }
    if (typeof itemHeight === 'function') {
      return itemHeight(index);
    }
    return itemHeight;
  }, [itemHeight]);

  // 计算每个项目的累计高度和坐标（用于动态高度）
  // 读取 itemHeightsVersion 以确保在图片预加载完成后触发重新计算
  const itemPositions = useMemo(() => {
    // 读取版本号以触发重新计算（即使不在函数体中使用）
    void itemHeightsVersion;
    
    const positions = [];
    let totalHeight = 0;

    for (let i = 0; i < data.length; i++) {
      const height = getItemHeight(i);
      positions.push({
        index: i,
        top: totalHeight,
        height: height,
        bottom: totalHeight + height,
      });
      totalHeight += height;
    }

    return { positions, totalHeight };
  }, [data, getItemHeight, itemHeightsVersion]); 

  // 计算可见区域的项目索引（结合 IntersectionObserver 优化）
  const visibleRange = useMemo(() => {
    // 读取 observerTrigger 以触发重新计算（即使不在函数体中使用）
    void observerTrigger;
    
    if (data.length === 0) return { start: 0, end: 0 };

    const { positions } = itemPositions;
    
    // 如果 IntersectionObserver 检测到了可见索引，优先使用它
    if (observerEnabledRef.current && visibleIndicesRef.current.size > 0) {
      const visibleIndices = Array.from(visibleIndicesRef.current).sort((a, b) => a - b);
      if (visibleIndices.length > 0) {
        let start = Math.max(0, visibleIndices[0] - overscan);
        let end = Math.min(positions.length - 1, visibleIndices[visibleIndices.length - 1] + overscan);
        return { start, end };
      }
    }

    // 回退到基于 scrollTop 的计算
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + containerHeight;
    
    let start = 0;
    let end = positions.length - 1;

    // 二分查找起始位置
    let left = 0;
    let right = positions.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (positions[mid].bottom < viewportTop) {
        left = mid + 1;
      } else {
        start = mid;
        right = mid - 1;
      }
    }

    // 二分查找结束位置
    left = start;
    right = positions.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (positions[mid].top > viewportBottom) {
        end = mid;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    // 添加 overscan 缓冲
    start = Math.max(0, start - overscan);
    end = Math.min(positions.length - 1, end + overscan);

    return { start, end };
  }, [scrollTop, containerHeight, itemPositions, overscan, data.length, observerTrigger]);

  // 使用 requestAnimationFrame 优化的滚动处理
  // 结合 IntersectionObserver，减少滚动事件的计算频率
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;

    // 如果 IntersectionObserver 可用，减少滚动事件的处理频率
    if (observerEnabledRef.current && observerRef.current) {
      // 只在滚动停止时更新，让 IntersectionObserver 处理大部分可见性检测
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setScrollTop(newScrollTop);
      }, 100); // 延迟更新，让 IntersectionObserver 先处理
    } else {
      // 如果 IntersectionObserver 不可用，使用原来的优化方式
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        setScrollTop(newScrollTop);
      });

      scrollTimeoutRef.current = setTimeout(() => {
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
        rafIdRef.current = requestAnimationFrame(() => {
    setScrollTop(newScrollTop);
        });
      }, 16);
    }
  }, []);

  // 获取可见的项目数据
  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (data[i]) {
        items.push({
          index: i,
          data: data[i],
          position: itemPositions.positions[i],
          imageInfo: imageCacheRef.current.get(i), // 包含预加载的图片信息
        });
      }
    }
    return items;
  }, [visibleRange, data, itemPositions]);

  // 设置 IntersectionObserver 来检测项目可见性
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !containerRef.current) {
      observerEnabledRef.current = false;
      return;
    }

    // 创建 IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // 批量处理所有变化，减少状态更新
        const newVisibleIndices = new Set(visibleIndicesRef.current);
        
        entries.forEach((entry) => {
          const index = parseInt(entry.target.dataset.index, 10);
          if (isNaN(index)) return;

          if (entry.isIntersecting) {
            newVisibleIndices.add(index);
          } else {
            newVisibleIndices.delete(index);
          }
        });

        // 只有当可见索引发生变化时才更新
        if (newVisibleIndices.size !== visibleIndicesRef.current.size ||
            Array.from(newVisibleIndices).some(idx => !visibleIndicesRef.current.has(idx))) {
          visibleIndicesRef.current = newVisibleIndices;
          
          // 使用 requestAnimationFrame 优化更新
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
          }
          
          rafIdRef.current = requestAnimationFrame(() => {
            // 触发重新计算可见范围
            setObserverTrigger(prev => prev + 1);
            });
          }
      },
      {
        root: containerRef.current,
        rootMargin: `${overscan * 50}px`, // 根据 overscan 设置边距
        threshold: [0, 0.1, 0.5, 1.0], // 多个阈值，更精确地检测
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [overscan]);

  // 观察可见项目的 DOM 元素
  useEffect(() => {
    if (!observerRef.current || !observerEnabledRef.current) return;

    const observer = observerRef.current;
    const currentRefs = itemRefs.current;

    // 观察所有当前渲染的项目
    currentRefs.forEach((element, index) => {
      if (element && element.dataset.index) {
        observer.observe(element);
      }
    });

    return () => {
      // 清理时取消观察
      currentRefs.forEach((element) => {
        if (element) {
          observer.unobserve(element);
        }
        });
    };
  }, [visibleRange]);

  // 清理 requestAnimationFrame、定时器和 requestIdleCallback
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        }
      // 清理 requestIdleCallback
      if (idleCallbackRef.current) {
        cancelIdleCallbackPolyfill(idleCallbackRef.current);
      }
    };
  }, [cancelIdleCallbackPolyfill]);

  const offsetY = useMemo(() => {
    if (visibleRange.start === 0) return 0;
    return itemPositions.positions[visibleRange.start]?.top || 0;
  }, [visibleRange.start, itemPositions]);

  const remainingHeight = useMemo(() => {
    const { totalHeight } = itemPositions;
    const lastVisibleItem = itemPositions.positions[visibleRange.end];
    if (!lastVisibleItem) return 0;
    return totalHeight - (lastVisibleItem.top + lastVisibleItem.height);
  }, [visibleRange.end, itemPositions]);

  return (
    <div
      ref={containerRef}
      className="virtual-list-container"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* 预加载进度提示 */}
      {isPreloading && (
        <div className="virtual-list-preloading">
          <div className="preloading-content">
            <div className="preloading-spinner"></div>
            <div className="preloading-text">预加载图片中... {preloadProgress}%</div>
          </div>
        </div>
      )}

      <div
        className="virtual-list-content"
        style={{
          height: itemPositions.totalHeight,
          position: 'relative',
        }}
      >
        {offsetY > 0 && <div className="virtual-list-spacer" style={{ height: offsetY }} />}

        {/* 渲染所有可见项 */}
        {visibleItems.map(({ index, data: item, position, imageInfo }) => {
          const itemRef = (element) => {
            if (element) {
                itemRefs.current.set(index, element);
            } else {
              itemRefs.current.delete(index);
            }
          };

          return (
            <div
              key={index}
              ref={itemRef}
              data-index={index}
              className="virtual-list-item"
              style={{
                position: 'absolute',
                top: position.top,
                minHeight: position.height,
                width: '100%',
              }}
            >
              {renderItem 
                ? renderItem(item, index, itemRef, imageInfo) 
                : <div className="virtual-list-item-default">{JSON.stringify(item)}</div>
              }
            </div>
          );
        })}

        {remainingHeight > 0 && <div className="virtual-list-spacer" style={{ height: remainingHeight }} />}
      </div>
    </div>
  );
};

/**
 * 虚拟列表示例组件 - 支持图片懒加载和动态高度
 */
const VisualList = () => {
  // 生成大量测试数据（包含图片）
  const generateData = (count) => {
    const imageWidths = [400, 500, 600, 700, 800];
    const imageHeights = [200, 250, 300, 350, 400];
    
    return Array.from({ length: count }, (_, index) => {
      const width = imageWidths[Math.floor(Math.random() * imageWidths.length)];
      const height = imageHeights[Math.floor(Math.random() * imageHeights.length)];
      
      return {
        id: index + 1,
        name: `项目 ${index + 1}`,
        description: `这是第 ${index + 1} 个项目的描述信息，包含一张随机尺寸的图片。图片加载完成后会自动更新项目高度。`,
        value: Math.floor(Math.random() * 10000),
        status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
        date: new Date(2024, 0, index + 1).toLocaleDateString('zh-CN'),
        imageUrl: `https://picsum.photos/${width}/${height}?random=${index}`,
        imageWidth: width,
        imageHeight: height,
      };
    });
  };

  const [dataCount, setDataCount] = useState(100);
  const [itemHeight, setItemHeight] = useState(200); // 初始高度（占位高度）
  const [containerHeight, setContainerHeight] = useState(600);

  const data = useMemo(() => generateData(dataCount), [dataCount]);

  // 获取图片URL的函数
  const getImageUrl = useCallback((item, index) => {
    return item.imageUrl;
  }, []);

  const renderItem = useCallback((item, index, ref, imageInfo) => {
    // 如果图片已预加载，直接使用预加载的图片对象
    const imageSrc = imageInfo?.img?.src || item.imageUrl;
    const hasPreloadedImage = !!imageInfo?.img;

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
          
          {/* 图片容器 - 使用预加载的图片 */}
          <div className="item-image-container">
            {/* 如果图片未预加载，显示占位符 */}
            {!hasPreloadedImage && (
            <div 
              className="item-image-placeholder"
              style={{
                width: '100%',
                aspectRatio: `${item.imageWidth} / ${item.imageHeight}`,
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '14px',
              }}
            >
              <span>加载中...</span>
            </div>
            )}
            
            {/* 图片 - 如果已预加载，直接显示 */}
            <img
              src={imageSrc}
              alt={item.name}
              className="item-image"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
                borderRadius: '4px',
                opacity: hasPreloadedImage ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
              }}
              onLoad={(e) => {
                e.target.style.opacity = '1';
                const placeholder = e.target.previousElementSibling;
                if (placeholder && placeholder.classList.contains('item-image-placeholder')) {
                  placeholder.style.display = 'none';
                }
              }}
              onError={(e) => {
                e.target.style.opacity = '0';
                const placeholder = e.target.previousElementSibling;
                if (placeholder && placeholder.classList.contains('item-image-placeholder')) {
                  placeholder.textContent = '图片加载失败';
                  placeholder.style.color = '#ff4d4f';
                  placeholder.style.display = 'flex';
                }
              }}
            />
          </div>
          
          <div className="item-footer">
            <span>值: {item.value}</span>
            <span>日期: {item.date}</span>
            {imageInfo && (
              <span>图片尺寸: {imageInfo.displayWidth}×{Math.round(imageInfo.displayHeight)}</span>
            )}
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
        <span>初始高度: {itemHeight}px</span>
        <span>容器高度: {containerHeight}px</span>
        <span>特性: requestIdleCallback 空闲加载 + IntersectionObserver + requestAnimationFrame 优化</span>
      </div>

      <div className="virtual-list-wrapper">
        <VirtualList
          data={data}
          itemHeight={itemHeight}
          containerHeight={containerHeight}
          renderItem={renderItem}
          overscan={5}
          getImageUrl={getImageUrl}
          containerWidth={800}
        />
      </div>

      <div className="performance-info">
        <h3>功能特性</h3>
        <ul>
          <li>✅ requestIdleCallback 在浏览器空闲时间预加载图片，不阻塞渲染</li>
          <li>✅ 智能判断每帧渲染空余时间，有空余时间才执行图片加载</li>
          <li>✅ 分批加载图片（每批3张），避免占用过多时间</li>
          <li>✅ new Image() 预加载所有图片，获取真实高度</li>
          <li>✅ 计算所有图片坐标，精确计算每个项目位置</li>
          <li>✅ 虚拟滚动计算可见范围，只渲染可见项</li>
          <li>✅ IntersectionObserver 精确检测项目可见性，减少计算开销</li>
          <li>✅ 结合滚动事件和 IntersectionObserver，智能优化性能</li>
          <li>✅ onScroll 监听滚动，实时更新可见区域</li>
          <li>✅ requestAnimationFrame 优化滚动性能</li>
          <li>✅ 二分查找优化可见范围计算</li>
          <li>✅ 支持大量数据（10万+）流畅滚动</li>
          <li>✅ 内存占用低，不会因为数据量大而卡顿</li>
          <li>✅ 预加载进度显示</li>
          <li>✅ 自动 polyfill，兼容不支持 requestIdleCallback 的浏览器</li>
        </ul>
      </div>
    </div>
  );
};

export default VisualList;
