import prizesData from './prizes.json';

// 模拟后端存储的抽奖结果（实际应该在后端）
const lotteryResults = new Map();

/**
 * 根据概率计算中奖奖品
 */
const calculatePrize = () => {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const prize of prizesData.prizes) {
        cumulativeProbability += prize.probability;
        if (random <= cumulativeProbability) {
            return prize;
        }
    }

    return prizesData.prizes[0];
};

/**
 * 抽奖 API - 模拟后端抽奖接口
 * @param {string} requestId - 请求ID
 * @returns {Promise<{ prizeId: number }>}
 */
export const lottery = async(requestId) => {
    // 模拟网络延迟（1-3秒）
    const delay = Math.random() * 2000 + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // 计算中奖奖品
    const winningPrize = calculatePrize();

    // 存储结果（模拟后端存储）
    lotteryResults.set(requestId, {
        prizeId: winningPrize.id,
        prize: winningPrize,
        timestamp: Date.now(),
    });

    return {
        prizeId: winningPrize.id,
    };
};

/**
 * 查询抽奖结果 API - 模拟后端查询接口
 * @param {string} requestId - 请求ID
 * @returns {Promise<{ prizeId: number } | null>}
 */
export const lotteryResult = async(requestId) => {
    // 模拟网络延迟（200-500ms）
    const delay = Math.random() * 300 + 200;
    await new Promise(resolve => setTimeout(resolve, delay));

    // 查询结果
    const result = lotteryResults.get(requestId);

    if (result) {
        return {
            prizeId: result.prizeId,
        };
    }

    // 如果还没有结果，返回 null（表示还在处理中）
    return null;
};

/**
 * 生成唯一的请求ID
 * @returns {string}
 */
export const generateRequestId = () => {
    return `lottery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 带超时的抽奖请求
 * @param {string} requestId - 请求ID
 * @param {number} timeout - 超时时间（毫秒），默认 3000ms
 * @returns {Promise<{ prizeId: number }>}
 */
export const lotteryWithTimeout = async(requestId, timeout = 3000) => {
    return Promise.race([
        lottery(requestId),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('请求超时')), timeout)
        ),
    ]);
};