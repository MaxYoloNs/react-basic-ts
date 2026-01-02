import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Spin, message } from 'antd';
import prizesData from './prizes.json';
import { generateRequestId, lotteryResult, lotteryWithTimeout } from './api';
import './index.css';
// canvas直线、曲线、文字、图片绘制方法
// 直线：moveTo(x, y)，lineTo(x, y)，stroke()
// 曲线：arc(x, y, radius, startAngle, endAngle, counterclockwise)，stroke()
// 文字：fillText(text, x, y)，strokeText(text, x, y)
// 图片：drawImage(image, x, y, width, height)
// cubic-bezier贝塞尔曲线：动画速度曲线，用于控制动画的加速度

// 旋转效果：canvas外层盒子通过tansform属性实现，canvas内部通过rotate方法实现旋转效果
/**
 * 大转盘游戏组件
 * 实现完整的抽奖流程：请求后端 -> 超时处理 -> 结果查询 -> 旋转动画
 * 重复请求处理、弱网情况处理、
 * @returns {React.ReactNode}
 */

const TurntableCopy = () => {
    const canvasRef = useRef(null)
    const [prizes] = useState(prizesData.prizes); // 修复：添加数组解构
    // 旋转中
    const [isSpinning, setIsSpinning] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [rotation, setRotation] = useState(0);
    const [currentPrize, setCurrentPrize] = useState(null);
    const loadingAnimationRef = useRef(null);
    const rotationRef = useRef(0); // 用于存储当前旋转角度
    const queryResultTimerRef = useRef(null);

    // 绘制canvas
    const drawCanvas = () => {
        // 找到canvas元素
        const canvas = canvasRef.current;
        
        if(!canvas) return;
        // 获取canvas上下文
        const ctx = canvas.getContext('2d');
        // 计算画布水平、垂直中心位置
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        // 计算出转盘的半径(-20为了居中显示，给转盘留出一些空间，使得转盘不会被画布边缘裁剪)
        const radius = Math.min(centerX, centerY) - 20;
        // 计算每个奖品的角度Math.PI表示圆周率π；2 * Math.PI表示一个完整的圆周(360度)
        const anglePerPrize = (2 * Math.PI) / prizes.length;
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 绘制每个奖品扇形
        prizes.forEach((prize, index) => {
            // 计算每个奖品的起始和结束角度
            // todo 重要：x轴顺时针往下为0度，顺时针为正，逆时针为负，所以第四象限开始角度为0, 结束角度为90(π/2)；第一象限开始角度为-90，结束角度为0
            const startAngle = index * anglePerPrize - Math.PI / 2;
            const endAngle = (index + 1) * anglePerPrize - Math.PI / 2;

            // 绘制扇形
            ctx.beginPath();
            // 把路径移动到画布中的指定点，不创建线条。
            ctx.moveTo(centerX, centerY);
            // 创建弧线
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = prize.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke(); // 绘制边框

            // 绘制文字
            ctx.save();
            // 重新映射画布上的(0,0)坐标，使得文字绘制在奖品中心位置
            ctx.translate(centerX, centerY);
            // 旋转到扇形中心角度
            ctx.rotate(startAngle + anglePerPrize / 2);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#333';
            // 绘制图标
            ctx.font = '24px Arial';
            ctx.fillText(prize.icon, radius * 0.6, -10);
            // 绘制奖品名称
            ctx.font = 'bold 14px Arial';
            ctx.fillText(prize.name, radius * 0.6, 15);
            // 恢复画布的映射
            ctx.restore();
        })

        // 绘制中心园
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
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

    // 轮询抽奖结果(弱网/断网情况下)
    const queryLotteryResult = (requestId) => {
        const maxAttempts = 10; // 最多查10次；
        let attemps = 0;
        const query = async () => {
            if(attemps >= maxAttempts) {
                setIsLoading(false);
                startLoadingAnimation();
                setIsSpinning(false);
                return;
            }
            attemps++;

            try {
                const result = await lotteryResult(requestId);
                if(result && result.prizeId) {
                    // 查询到结果，执行旋转动画
                    executeRotationAnimation(result.prizeId);
                } else {
                    // 还没有结果，继续查询
                    queryResultTimerRef.current = setTimeout(query, 500); // 每500ms查询一次
                }
            } catch(err) {
                console.error('查询抽奖结果失败:', err.message);
                queryResultTimerRef.current = setTimeout(query, 500);
            }
        }
        query();
    }

    // 开始抽奖
    const handleSpin = async () => {
        if(isSpinning || isLoading) return;
        // 1. 防止用户连续点击/弱网情况下重复请求
        const requestId = generateRequestId();
        // 2. 禁用开始抽奖按钮 + 开启预加载动画
        setIsLoading(true);
        setIsSpinning(true);
        // 清空中奖奖品
        setCurrentPrize(null);
        startLoadingAnimation();

        try {
            const result = await lotteryWithTimeout(requestId, 3000);
            setIsLoading(false);
            executeRotationAnimation(result.prizeId);
        } catch(err) {
            console.error('抽奖请求失败:', err.message);
            setIsLoading(false);
            // setIsSpinning(false);
            // 请求失败，超时重发
            queryLotteryResult(requestId);
        }
    }

    // 开启预加载动画
    const startLoadingAnimation = useCallback(() => {
        const speed = 20; // 每帧旋转角度
    
        loadingAnimationRef.current = setInterval(() => {
          rotationRef.current += speed;
          setRotation(rotationRef.current);
        }, 16); // 约 60fps
    }, [])

    // 停止预加载动画
    const stopLoadingAnimation = useCallback(() => {
        if (loadingAnimationRef.current) {
            clearInterval(loadingAnimationRef.current);
            loadingAnimationRef.current = null;
        }
    }, [])

    // 计算中奖模块的旋转角度
    const calculateRotation = useCallback((prizeId) => {
        const prizeIndex = prizes.findIndex(p => p.id === prizeId);
        if(prizeIndex === -1) {
            console.error('奖品ID不存在:', prizeId);
            return 0;
        }

        // 注意：这里使用的是角度，不是弧度
        // 平均每个奖品的角度
        const averageAngle = 360 / prizes.length;
        // 当前奖品所在扇形的中心位置
        const curPrizeAngle = prizeIndex * averageAngle + averageAngle / 2;

        // 当前指针位置的角度
        const pointerAngle = rotationRef.current % 360;

        // 计算相对旋转角度：让奖品中心移动到指针位置（270度）
        // 当前奖品中心位置：pointerAngle + (curPrizeAngle - 90)
        // 目标位置：270度
        // 需要旋转：270 - (pointerAngle + curPrizeAngle - 90) = 360 - pointerAngle - curPrizeAngle
        const relativeRotation = (360 - pointerAngle - curPrizeAngle + 360) % 360;
        // 固定旋转 6 圈 + 相对角度
        const angle = 360 * 6 + relativeRotation;
        return angle;
    }, [prizes])

    // 执行旋转动画
    const executeRotationAnimation = useCallback((prizeId) => {
        // 停止预加载动画
        stopLoadingAnimation();
        // 计算目标旋转角度
        const targetRotation = calculateRotation(prizeId);
        // 更新旋转角度（累加到当前角度）
        setRotation(prev => {
            const newRotation = prev + targetRotation;
            rotationRef.current = newRotation; // 更新旋转角度
            return newRotation; // 返回新的旋转角度
        });
        // 设置旋转状态
        setIsSpinning(true);

        setTimeout(() => {
            setIsSpinning(false);
            // 找到中奖奖品，设置中奖奖品
            const winningPrize = prizes.find(p => p.id === prizeId);
            if(winningPrize) {
                setCurrentPrize(winningPrize);
                // 显示中奖消息
                if (winningPrize.id === 1) {
                  message.info(winningPrize.description);
                } else {
                  message.success(winningPrize.description);
                }
            }
        }, 3000);
    }, [calculateRotation, stopLoadingAnimation, prizes])

    useEffect(() => {
        console.log('canvasRef====', canvasRef.current);
        requestIdleCallback(() => {
            drawCanvas()
        })
    }, [])
    return (
        <div className="turntable-page">
            <div className='turntable-container'>
                <div className="turntable-wrapper">
                    {/* 指针 */}
                    <div className="pointer">
                        <div className="pointer-triangle"></div>
                    </div>
                    {/* 转盘 */}
                    <div className="turntable"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning && !isLoading 
                ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' 
                : 'none',
            }}>
                        <canvas ref={canvasRef} width={400} height={400} className='turntable-canvas'/>
                    </div>
                    {/* 中心按钮 */}
                    <div className="center-button">
                        <Button type="primary" size="large" shape="circle" onClick={handleSpin} disabled={isSpinning || isLoading} className="spin-button">
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
            </div>
            <h3>{currentPrize?.name}</h3>
        </div>
    )
}

export default TurntableCopy;