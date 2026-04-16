/**
 * 远程服务器动态发现工具
 */

const DISCOVERY_URL = 'https://raw.githubusercontent.com/zej574099903/electronic-fridge/main/discovery.json';

// 全局内联网状态
let dynamicServerUrl: string | null = null;

/**
 * 初始化网络发现：从 GitHub 拉取最新的私有服务器入口
 */
export async function initializeDiscovery(): Promise<string | null> {
  try {
    console.log('[Discovery] 正在搜寻主人的电脑入口...');
    
    // 增加随机数防止 CDN 或 Raw 缓存导致拿到旧地址
    const response = await fetch(`${DISCOVERY_URL}?cache_bust=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) throw new Error('Network discovery failed');

    const data = await response.json();
    if (data && data.url) {
      console.log('[Discovery] 寻址成功:', data.url);
      dynamicServerUrl = data.url;
      return data.url;
    }
    return null;
  } catch (error) {
    console.warn('[Discovery] 寻址由于网络原因失败，将尝试使用本地硬编码地址。', error);
    return null;
  }
}

/**
 * 获取当前的动态服务器地址
 */
export function getDynamicServerUrl(): string | null {
  return dynamicServerUrl;
}
