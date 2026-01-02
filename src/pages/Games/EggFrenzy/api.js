import prizesData from '../Turntable/prizes.json';

// 模拟后端存储的抽奖结果
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
 * 获取奖品列表 API - 模拟后端接口
 * @returns {Promise<Array>} 奖品列表
 */
export const getPrizes = async() => {
    // 模拟网络延迟（200-500ms）
    const delay = Math.random() * 300 + 200;
    await new Promise(resolve => setTimeout(resolve, delay));

    // 返回奖品列表，每个奖品对应一个金蛋
    return prizesData.prizes;
};

/**
 * 砸金蛋 API - 模拟后端抽奖接口
 * @param {string} requestId - 请求ID
 * @param {number} eggIndex - 选中的金蛋索引
 * @returns {Promise<{ prizeId: number, prize: object }>}
 */
export const smashEgg = async(requestId, eggIndex) => {
    // 模拟网络延迟（1-3秒）
    const delay = Math.random() * 2000 + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // 计算中奖奖品
    const winningPrize = calculatePrize();

    // 存储结果（模拟后端存储）
    lotteryResults.set(requestId, {
        prizeId: winningPrize.id,
        prize: winningPrize,
        eggIndex: eggIndex,
        timestamp: Date.now(),
    });

    return {
        prizeId: winningPrize.id,
        prize: winningPrize,
    };
};

/**
 * 查询抽奖结果 API - 模拟后端查询接口
 * @param {string} requestId - 请求ID
 * @returns {Promise<{ prizeId: number, prize: object } | null>}
 */
export const queryEggResult = async(requestId) => {
    // 模拟网络延迟（200-500ms）
    const delay = Math.random() * 300 + 200;
    await new Promise(resolve => setTimeout(resolve, delay));

    // 查询结果
    const result = lotteryResults.get(requestId);

    if (result) {
        return {
            prizeId: result.prizeId,
            prize: result.prize,
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
    return `egg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 带超时的砸金蛋请求
 * @param {string} requestId - 请求ID
 * @param {number} eggIndex - 选中的金蛋索引
 * @param {number} timeout - 超时时间（毫秒），默认 3000ms
 * @returns {Promise<{ prizeId: number, prize: object }>}
 */
export const smashEggWithTimeout = async(requestId, eggIndex, timeout = 3000) => {
    return Promise.race([
        smashEgg(requestId, eggIndex),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('请求超时')), timeout)
        ),
    ]);
};