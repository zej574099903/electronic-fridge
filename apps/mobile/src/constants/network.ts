import { getDynamicServerUrl } from '../utils/discovery';

/**
 * 全局网络配置文件
 * 支持从本地局域网到动态公网的无感切换
 */

export const LOCAL_SERVER_IP = '10.30.56.27';
export const LOCAL_SERVER_PORT = '3000';

/**
 * 核心：获取当前最有效的服务器基础地址
 */
export const getBaseUrl = () => {
  const dynamicUrl = getDynamicServerUrl();
  // 优先使用 Cloudflare 发现的公网地址，备选使用本地 IP 地址
  return dynamicUrl || `http://${LOCAL_SERVER_IP}:${LOCAL_SERVER_PORT}`;
};

/**
 * 获取上传接口地址
 */
export const getUploadEndpoint = () => `${getBaseUrl()}/upload`;

/**
 * 图片资源的获取前缀
 */
export const getImagePath = (filename: string) => {
  if (!filename) return '';
  // 如果已经是完整路径则直接返回 (兼容旧数据)
  if (filename.startsWith('http')) return filename;
  // 否则拼装当前有效映射地址
  return `${getBaseUrl()}/uploads/${filename}`;
};

/**
 * 远程删除物理图片
 */
export const deleteRemoteImage = async (photoUri: string): Promise<boolean> => {
  if (!photoUri) return false;

  // 智能解析：如果是 URL，提取最后的文件名部分 (支持老数据)
  let filename = photoUri;
  if (photoUri.startsWith('http')) {
    const parts = photoUri.split('/');
    filename = parts[parts.length - 1];
  }

  try {
    console.log(`[Network] Triggering remote delete: ${filename}`);
    const response = await fetch(`${getBaseUrl()}/delete/${filename}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('[Delete Error]', error);
    return false;
  }
};
