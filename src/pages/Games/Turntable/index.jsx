import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, message, Modal, Spin } from 'antd';
import { TrophyOutlined, ReloadOutlined } from '@ant-design/icons';
import TurntableCopy from './indexCopy';
import prizesData from './prizes.json';
import { 
  generateRequestId, 
  lotteryWithTimeout, 
  lotteryResult 
} from './api';
import './index.css';

/**
 * 大转盘游戏组件
 * 实现完整的抽奖流程：请求后端 -> 超时处理 -> 结果查询 -> 旋转动画
 */
const Turntable = () => {
  const [prizes] = useState(prizesData.prizes);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 预加载旋转状态
  const [currentPrize, setCurrentPrize] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const canvasRef = useRef(null);
  const turntableRef = useRef(null);
  const loadingAnimationRef = useRef(null);
  const queryResultTimerRef = useRef(null);
  const rotationRef = useRef(0); // 用于存储当前旋转角度

  // 初始化转盘
  useEffect(() => {
    drawTurntable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (loadingAnimationRef.current) {
        clearInterval(loadingAnimationRef.current);
      }
      if (queryResultTimerRef.current) {
        clearInterval(queryResultTimerRef.current);
      }
    };
  }, []);

  /**
   * 绘制转盘
   */
  const drawTurntable = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const anglePerPrize = (2 * Math.PI) / prizes.length;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制每个奖品扇形
    prizes.forEach((prize, index) => {
      const startAngle = index * anglePerPrize - Math.PI / 2;
      const endAngle = (index + 1) * anglePerPrize - Math.PI / 2;

      // 绘制扇形
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制文字
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerPrize / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#333';
      
      // 绘制图标
      ctx.font = '24px Arial';
      ctx.fillText(prize.icon, radius * 0.6, -10);
      
      // 绘制奖品名称
      ctx.font = 'bold 14px Arial';
      ctx.fillText(prize.name, radius * 0.6, 15);
      
      // 绘制概率（可选）
      ctx.font = '10px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(`${(prize.probability * 100).toFixed(1)}%`, radius * 0.6, 30);
      
      ctx.restore();
    });

    // 绘制中心圆
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  /**
   * 启动预加载旋转动画（快速旋转）
   */
  const startLoadingAnimation = useCallback(() => {
    const speed = 20; // 每帧旋转角度
    
    loadingAnimationRef.current = setInterval(() => {
      rotationRef.current += speed;
      setRotation(rotationRef.current);
    }, 16); // 约 60fps
  }, []);

  /**
   * 停止预加载旋转动画
   */
  const stopLoadingAnimation = useCallback(() => {
    if (loadingAnimationRef.current) {
      clearInterval(loadingAnimationRef.current);
      loadingAnimationRef.current = null;
    }
  }, []);

  /**
   * 计算转盘应该旋转的角度
   * 指针固定在顶部（270度位置），需要让中奖奖品旋转到指针位置
   * 
   * @param {number} prizeId - 中奖奖品的ID
   * @returns {number} 目标旋转角度
   */
  const calculateRotation = useCallback((prizeId) => {
    const prizeIndex = prizes.findIndex(p => p.id === prizeId);
    if (prizeIndex === -1) {
      console.error('奖品ID不存在:', prizeId);
      return 0;
    }

    const anglePerPrize = 360 / prizes.length;
    const prizeCenterAngle = prizeIndex * anglePerPrize + anglePerPrize / 2;
    
    // 获取当前转盘的归一化角度（0-360度）
    const normalizedCurrentRotation = rotationRef.current % 360;
    
    // 计算相对旋转角度：让奖品中心移动到指针位置（270度）
    // 当前奖品中心位置：normalizedCurrentRotation + (prizeCenterAngle - 90)
    // 目标位置：270度
    // 需要旋转：270 - (normalizedCurrentRotation + prizeCenterAngle - 90) = 360 - normalizedCurrentRotation - prizeCenterAngle
    const relativeRotation = (360 - normalizedCurrentRotation - prizeCenterAngle + 360) % 360;
    
    // 固定旋转 6 圈 + 相对角度
    const targetRotation = 360 * 6 + relativeRotation;
    
    return targetRotation;
  }, [prizes]);

  /**
   * 执行旋转动画（根据 prizeId）
   */
  const executeRotationAnimation = useCallback((prizeId) => {
    // 停止预加载动画
    stopLoadingAnimation();
    
    // 计算目标旋转角度
    const targetRotation = calculateRotation(prizeId);
    
    // 更新旋转角度（累加到当前角度）
    setRotation(prev => {
      const newRotation = prev + targetRotation;
      rotationRef.current = newRotation;
      return newRotation;
    });
    
    // 设置旋转状态
    setIsSpinning(true);
    
    // 旋转动画完成后（3秒）
    setTimeout(() => {
      setIsSpinning(false);
      
      // 找到中奖奖品
      const winningPrize = prizes.find(p => p.id === prizeId);
      if (winningPrize) {
        setCurrentPrize(winningPrize);
        setShowResult(true);
        setSpinCount(prev => prev + 1);
        setHistory(prev => [winningPrize, ...prev.slice(0, 9)]);
        
        // 显示中奖消息
        if (winningPrize.id === 1) {
          message.info(winningPrize.description);
        } else {
          message.success(winningPrize.description);
        }
      }
    }, 3000); // 3秒旋转动画
  }, [calculateRotation, stopLoadingAnimation, prizes]);

  /**
   * 查询抽奖结果（轮询）
   */
  const queryLotteryResult = useCallback(async (requestId) => {
    const maxAttempts = 10; // 最多查询10次
    let attempts = 0;

    const query = async () => {
      if (attempts >= maxAttempts) {
        message.error('查询超时，请稍后重试');
        setIsLoading(false);
        stopLoadingAnimation();
        setIsSpinning(false);
        setCurrentRequestId(null);
        return;
      }

      attempts++;
      
      try {
        const result = await lotteryResult(requestId);
        
        if (result && result.prizeId) {
          // 查询到结果，执行旋转动画
          executeRotationAnimation(result.prizeId);
          setCurrentRequestId(null);
        } else {
          // 还没有结果，继续查询
          queryResultTimerRef.current = setTimeout(query, 500); // 每500ms查询一次
        }
      } catch (error) {
        console.error('查询抽奖结果失败:', error);
        queryResultTimerRef.current = setTimeout(query, 500);
      }
    };

    query();
  }, [executeRotationAnimation, stopLoadingAnimation]);

  /**
   * 开始抽奖
   */
  const handleSpin = async () => {
    if (isSpinning || isLoading) return;

    // 1. 生成 requestId
    const requestId = generateRequestId();
    setCurrentRequestId(requestId);

    // 2. 禁用按钮 + 启动预加载旋转动画
    setIsLoading(true);
    setIsSpinning(true);
    setShowResult(false);
    setCurrentPrize(null);
    startLoadingAnimation();

    try {
      // 3. 请求后端 /lottery（设置超时 3 秒）
      const result = await lotteryWithTimeout(requestId, 3000);
      
      // 4. 成功返回 prizeId，停止 loading 动画，执行旋转动画
      setIsLoading(false);
      executeRotationAnimation(result.prizeId);
      setCurrentRequestId(null);
      
    } catch (error) {
      // 5. 超时，调用 /lottery/result 查询结果
      console.log('抽奖请求超时，开始查询结果...', error.message);
      setIsLoading(false);
      queryLotteryResult(requestId);
    }
  };

  /**
   * 重置转盘
   */
  const handleReset = () => {
    stopLoadingAnimation();
    if (queryResultTimerRef.current) {
      clearTimeout(queryResultTimerRef.current);
    }
    rotationRef.current = 0;
    setRotation(0);
    setCurrentPrize(null);
    setShowResult(false);
    setSpinCount(0);
    setHistory([]);
    setCurrentRequestId(null);
    setIsLoading(false);
    setIsSpinning(false);
    message.info('转盘已重置');
  };

  return (
    <div className="turntable-page">
      <div className="turntable-header">
        <h2>
          <TrophyOutlined /> 大转盘抽奖游戏
        </h2>
        <div className="header-info">
          <span>抽奖次数: {spinCount}</span>
          {currentRequestId && (
            <span className="request-id">请求ID: {currentRequestId.slice(-8)}</span>
          )}
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleReset}
            size="small"
            disabled={isSpinning || isLoading}
          >
            重置
          </Button>
        </div>
      </div>

      <div className="turntable-container">
        <div className="turntable-wrapper">
          {/* 指针 */}
          <div className="pointer">
            <div className="pointer-triangle"></div>
          </div>

          {/* 转盘 */}
          <div 
            className="turntable"
            ref={turntableRef}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning && !isLoading 
                ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' 
                : 'none',
            }}
          >
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="turntable-canvas"
            />
          </div>

          {/* 中心按钮 */}
          <div className="center-button">
            <Button
              type="primary"
              size="large"
              shape="circle"
              onClick={handleSpin}
              disabled={isSpinning || isLoading}
              className="spin-button"
            >
              {isLoading ? (
                <>
                  <Spin size="small" style={{ marginRight: 8 }} />
                  抽奖中...
                </>
              ) : isSpinning ? (
                <Spin />
              ) : (
                '开始'
              )}
            </Button>
          </div>
        </div>

        {/* 奖品列表 */}
        <div className="prizes-panel">
          <h3>奖品列表</h3>
          <div className="prizes-list">
            {prizes.map((prize) => (
              <div 
                key={prize.id} 
                className={`prize-item ${currentPrize?.id === prize.id ? 'current' : ''}`}
                style={{ borderLeftColor: prize.color }}
              >
                <span className="prize-icon">{prize.icon}</span>
                <div className="prize-info">
                  <div className="prize-name">{prize.name}</div>
                  <div className="prize-probability">
                    中奖概率: {(prize.probability * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 中奖历史 */}
      {history.length > 0 && (
        <div className="history-panel">
          <h3>中奖历史</h3>
          <div className="history-list">
            {history.map((prize, index) => (
              <div key={index} className="history-item">
                <span className="history-icon">{prize.icon}</span>
                <span className="history-name">{prize.name}</span>
                <span className="history-time">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 中奖结果弹窗 */}
      <Modal
        open={showResult}
        onCancel={() => setShowResult(false)}
        footer={[
          <Button key="close" onClick={() => setShowResult(false)}>
            关闭
          </Button>,
          <Button key="spin-again" type="primary" onClick={() => {
            setShowResult(false);
            handleSpin();
          }}>
            再抽一次
          </Button>,
        ]}
        centered
        width={400}
      >
        <div className="result-modal">
          <div className="result-icon" style={{ color: currentPrize?.color }}>
            {currentPrize?.icon}
          </div>
          <h3>{currentPrize?.name}</h3>
          <p>{currentPrize?.description}</p>
          {currentPrize?.id === 8 && (
            <div className="extra-chance">
              <Button type="primary" onClick={() => {
                setShowResult(false);
                handleSpin();
              }}>
                立即使用
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <TurntableCopy />
    </div>
  );
};

export default Turntable;
