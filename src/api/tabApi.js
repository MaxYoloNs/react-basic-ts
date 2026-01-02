// 模拟标签页数据
// tab1: 数据多，返回时间长
// tab2: 数据少，返回时间短
const tabData = {
    'tab1': Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `标签1-项目${i + 1}`,
        value: (i + 1) * 100,
    })),
    'tab2': [
        { id: 1, name: '标签2-项目1', value: 400 },
        { id: 2, name: '标签2-项目2', value: 500 },
    ],
    'tab3': [
        { id: 1, name: '标签3-项目1', value: 700 },
        { id: 2, name: '标签3-项目2', value: 800 },
        { id: 3, name: '标签3-项目3', value: 900 },
    ],
    'tab4': [
        { id: 1, name: '标签4-项目1', value: 1000 },
        { id: 2, name: '标签4-项目2', value: 1100 },
        { id: 3, name: '标签4-项目3', value: 1200 },
    ],
};

// 模拟网络延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟随机延迟（用于展示竞态条件）
const randomDelay = (min = 500, max = 2500) => {
    const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
    return delay(delayTime);
};

/**
 * 模拟获取标签页数据的 API 调用
 * @param {string} tabId - 标签页 ID
 * @param {number} requestId - 请求 ID，用于追踪请求
 * @returns {Promise<Array>} 标签页数据
 */
export const fetchTabData = async(tabId, requestId = 0) => {
    console.log(`[Tab API] 请求 #${requestId} 开始获取标签页 "${tabId}" 的数据...`);

    // 根据标签页设置不同的延迟时间
    // tab1: 数据多，延迟长（2500-3500ms）- 确保足够慢
    // tab2: 数据少，延迟短（200-400ms）- 确保足够快
    // 其他: 中等延迟（800-1500ms）
    let delayTime;
    if (tabId === 'tab1') {
        // tab1 数据多，返回时间长
        delayTime = await randomDelay(2500, 3500);
    } else if (tabId === 'tab2') {
        // tab2 数据少，返回时间短
        delayTime = await randomDelay(200, 400);
    } else {
        // 其他标签页中等延迟
        delayTime = await randomDelay(800, 1500);
    }

    console.log(`[Tab API] 请求 #${requestId} 延迟 ${delayTime}ms (标签页: ${tabId})`);

    // 模拟数据
    const data = tabData[tabId] || [];

    console.log(`[Tab API] 请求 #${requestId} 完成，返回标签页 "${tabId}" 的数据（${data.length} 条）`);

    // 返回数据的副本，并添加请求 ID 用于追踪
    return data.map(item => ({
        ...item,
        _requestId: requestId,
        _tabId: tabId,
    }));
};

/**
 * 模拟更新标签页数据的 API 调用
 * @param {string} tabId - 标签页 ID
 * @param {number} itemId - 项目 ID
 * @param {object} updates - 更新数据
 * @param {number} requestId - 请求 ID，用于追踪请求
 * @returns {Promise<Object>} 更新后的项目
 */
export const updateTabItem = async(tabId, itemId, updates, requestId = 0) => {
    console.log(`[Tab API] 请求 #${requestId} 开始更新标签页 "${tabId}" 的项目 ${itemId}...`);

    // 随机延迟
    await randomDelay(600, 2000);

    const tabItems = tabData[tabId] || [];
    const item = tabItems.find(i => i.id === itemId);

    if (!item) {
        throw new Error(`标签页 "${tabId}" 中不存在项目 ${itemId}`);
    }

    const updatedItem = {
        ...item,
        ...updates,
    };

    // 更新原始数据
    const index = tabItems.findIndex(i => i.id === itemId);
    tabItems[index] = updatedItem;

    console.log(`[Tab API] 请求 #${requestId} 完成，项目 ${itemId} 已更新`);

    return {
        ...updatedItem,
        _requestId: requestId,
        _tabId: tabId,
    };
};