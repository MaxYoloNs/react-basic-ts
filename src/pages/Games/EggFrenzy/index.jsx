import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button, Spin, message } from 'antd';
import { getPrizes, generateRequestId, smashEggWithTimeout, queryEggResult } from './api';
import './index.css';

/**
 * 砸金蛋游戏组件
 * 实现完整的砸金蛋流程：获取奖品列表 -> 展示金蛋 -> 点击金蛋 -> 锤子动画 -> 金蛋裂开 -> 弹框展示奖品
 */
const EggFrenzy = () => {
    const [prizes, setPrizes] = useState([]); // 奖品列表（对应金蛋个数）
    const [selectedEggIndex, setSelectedEggIndex] = useState(null); // 选中的金蛋索引
    const [isSmashing, setIsSmashing] = useState(false); // 是否正在砸金蛋
    const [isLoading, setIsLoading] = useState(false); // 是否正在加载
    const [currentPrize, setCurrentPrize] = useState(null); // 当前中奖奖品（用于弹框）
    const [showResult, setShowResult] = useState(false); // 是否显示结果弹框
    const [smashedEggs, setSmashedEggs] = useState(new Set()); // 已砸碎的金蛋索引
    const [eggPrizes, setEggPrizes] = useState(new Map()); // 存储每个金蛋对应的实际中奖奖品
    const [hammerPosition, setHammerPosition] = useState({ x: 0, y: 0 }); // 锤子位置
    const [isHammerVisible, setIsHammerVisible] = useState(false); // 锤子是否可见
    const [isEggCracking, setIsEggCracking] = useState(false); // 金蛋是否正在裂开
    const queryResultTimerRef = useRef(null);
    const eggRefs = useRef([]);

    // 初始化：获取奖品列表
    useEffect(() => {
        const fetchPrizes = async () => {
            try {
                const prizesList = await getPrizes();
                setPrizes(prizesList);
            } catch (error) {
                console.error('获取奖品列表失败:', error);
                message.error('获取奖品列表失败，请刷新重试');
            }
        };
        fetchPrizes();
    }, []);

    // 清理定时器
    useEffect(() => {
        return () => {
            if (queryResultTimerRef.current) {
                clearTimeout(queryResultTimerRef.current);
            }
        };
    }, []);

    // 处理奖品结果
    const handlePrizeResult = useCallback((prize, eggIndex) => {
        // 停止锤子动画
        setIsHammerVisible(false);
        // 开始金蛋裂开动画
        setIsEggCracking(true);
        // 存储该金蛋对应的实际中奖奖品
        setEggPrizes(prev => {
            const newMap = new Map(prev);
            newMap.set(eggIndex, prize);
            return newMap;
        });
        setSmashedEggs(prev => new Set([...prev, eggIndex]));

        // 延迟显示弹框
        setTimeout(() => {
            setCurrentPrize(prize);
            setShowResult(true);
            setIsEggCracking(false);
            setIsSmashing(false);
            setIsLoading(false);
        }, 800); // 等待裂开动画完成
    }, []);

    // 轮询抽奖结果（弱网/断网情况下）
    const queryEggResultPolling = useCallback((requestId, eggIndex) => {
        const maxAttempts = 10; // 最多查10次
        let attempts = 0;
        const query = async () => {
            if (attempts >= maxAttempts) {
                setIsLoading(false);
                setIsSmashing(false);
                message.error('请求超时，请重试');
                return;
            }
            attempts++;

            try {
                const result = await queryEggResult(requestId);
                if (result && result.prizeId) {
                    // 查询到结果，执行动画
                    handlePrizeResult(result.prize, eggIndex);
                } else {
                    // 还没有结果，继续查询
                    queryResultTimerRef.current = setTimeout(query, 500); // 每500ms查询一次
                }
            } catch (err) {
                console.error('查询抽奖结果失败:', err.message);
                queryResultTimerRef.current = setTimeout(query, 500);
            }
        };
        query();
    }, [handlePrizeResult]);

    // 处理金蛋点击
    const handleEggClick = useCallback(async (index) => {
        if (isSmashing || isLoading || smashedEggs.has(index)) {
            return; // 正在砸金蛋或已砸碎的金蛋不能点击
        }

        // 设置选中的金蛋
        setSelectedEggIndex(index);
        setIsSmashing(true);
        setIsLoading(true);
        setCurrentPrize(null);
        setShowResult(false);

        // 获取金蛋位置，用于定位锤子
        const eggElement = eggRefs.current[index];
        if (eggElement) {
            const rect = eggElement.getBoundingClientRect();
            setHammerPosition({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            });
        }

        // 显示锤子并开始动画
        setIsHammerVisible(true);

        // 生成请求ID
        const requestId = generateRequestId();

        try {
            const result = await smashEggWithTimeout(requestId, index, 3000);
            setIsLoading(false);
            handlePrizeResult(result.prize, index);
        } catch (err) {
            console.error('砸金蛋请求失败:', err.message);
            setIsLoading(false);
            // 请求失败，超时重发
            queryEggResultPolling(requestId, index);
        }
    }, [isSmashing, isLoading, smashedEggs, handlePrizeResult, queryEggResultPolling]);

    // 关闭结果弹框
    const handleCloseResult = useCallback(() => {
        setShowResult(false);
        setCurrentPrize(null);
    }, []);

    return (
        <div className="egg-frenzy-page">
            <div className="egg-frenzy-header">
                <h2>🎯 砸金蛋游戏</h2>
                <p>点击金蛋，看看你能砸中什么奖品！</p>
            </div>

            <div className="egg-frenzy-container">
                {prizes.length === 0 ? (
                    <div className="loading-container">
                        <Spin size="large" />
                        <p>正在加载奖品...</p>
                    </div>
                ) : (
                    <div className="eggs-grid">
                        {prizes.map((prize, index) => {
                            const isSmashed = smashedEggs.has(index);
                            const isSelected = selectedEggIndex === index;
                            const isCracking = isEggCracking && isSelected;
                            // 获取该金蛋对应的实际中奖奖品
                            const actualPrize = eggPrizes.get(index) || prize;

                            return (
                                <div
                                    key={prize.id}
                                    ref={el => eggRefs.current[index] = el}
                                    className={`egg-item ${isSmashed ? 'smashed' : ''} ${isCracking ? 'cracking' : ''} ${isSelected && isSmashing ? 'selected' : ''} ${isSelected && isSmashing ? 'hammer-hit' : ''}`}
                                    onClick={() => handleEggClick(index)}
                                    style={{
                                        pointerEvents: isSmashing || isSmashed ? 'none' : 'auto',
                                        cursor: isSmashing || isSmashed ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {/* 金蛋碎片效果 */}
                                    {isCracking && (
                                        <>
                                            <div className="egg-fragment fragment-1"></div>
                                            <div className="egg-fragment fragment-2"></div>
                                            <div className="egg-fragment fragment-3"></div>
                                            <div className="egg-fragment fragment-4"></div>
                                        </>
                                    )}
                                    
                                    {isSmashed ? (
                                        <div className="egg-smashed">
                                            <div className="egg-prize-icon" style={{ color: actualPrize.color }}>
                                                {actualPrize.icon}
                                            </div>
                                            <div className="egg-prize-name">{actualPrize.name}</div>
                                        </div>
                                    ) : (
                                        <div className="egg-normal">
                                            <div className="egg-icon">🥚</div>
                                            <div className="egg-number">{index + 1}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 锤子动画 */}
                {isHammerVisible && (
                    <div
                        className={`hammer ${isSmashing ? 'smashing' : ''}`}
                        style={{
                            left: `${hammerPosition.x}px`,
                            top: `${hammerPosition.y - 100}px`,
                        }}
                    >
                        <div className="hammer-icon">🔨</div>
                        <div className="hammer-shadow"></div>
                    </div>
                )}

                {/* 加载提示 */}
                {isLoading && (
                    <div className="loading-overlay">
                        <Spin size="large" />
                        <p>正在砸金蛋...</p>
                    </div>
                )}
            </div>

            {/* 结果弹框 */}
            <Modal
                open={showResult}
                onCancel={handleCloseResult}
                footer={[
                    <Button key="close" onClick={handleCloseResult}>
                        关闭
                    </Button>,
                    <Button
                        key="play-again"
                        type="primary"
                        onClick={() => {
                            handleCloseResult();
                            // 重置状态，可以重新开始
                            setSmashedEggs(new Set());
                            setEggPrizes(new Map());
                            setSelectedEggIndex(null);
                        }}
                    >
                        再玩一次
                    </Button>,
                ]}
                centered
                width={400}
                className={showResult ? 'result-modal-show' : ''}
            >
                <div className={`result-modal ${showResult ? 'show' : ''}`}>
                    <div className="result-sparkles">
                        <div className="sparkle sparkle-1">✨</div>
                        <div className="sparkle sparkle-2">✨</div>
                        <div className="sparkle sparkle-3">✨</div>
                        <div className="sparkle sparkle-4">✨</div>
                    </div>
                    <div className="result-icon" style={{ color: currentPrize?.color }}>
                        {currentPrize?.icon}
                    </div>
                    <h3>{currentPrize?.name}</h3>
                    <p>{currentPrize?.description}</p>
                </div>
            </Modal>
        </div>
    );
};

export default EggFrenzy;

