/**
 * 全局网络配置文件
 * 用于管理自建“私有冰芯”服务器的连接地址
 */

// 您的电脑局域网 IP (由您提供)
export const LOCAL_SERVER_IP = '10.30.56.27';
export const LOCAL_SERVER_PORT = '3000';

// 基础访问地址
export const IMAGE_SERVER_BASE_URL = `http://${LOCAL_SERVER_IP}:${LOCAL_SERVER_PORT}`;

// 上传接口地址
export const UPLOAD_ENDPOINT = `${IMAGE_SERVER_BASE_URL}/upload`;

// 静态图片访问前缀
export const STATIC_IMAGES_BASE_URL = `${IMAGE_SERVER_BASE_URL}`;
