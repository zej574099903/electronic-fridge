# 电子冰箱 App：数据库设计与 API 设计

## 1. 设计目标

本设计面向 MVP 阶段，要求：

- 结构足够简单，适合单人开发
- 支持用户、家庭、物品、提醒等核心流程
- 支持后续逐步扩展 AI 识别、菜谱、会员等能力

本方案默认使用：

- `MongoDB`
- `Mongoose`
- `Next.js API`

## 2. 数据模型总览

本期核心集合：

- `users`
- `households`
- `householdMembers`
- `storageSpaces`
- `items`
- `notifications`
- `itemActions`
- `categoryRules`

后续可扩展集合：

- `recipes`
- `shoppingLists`
- `aiRecognitions`
- `subscriptions`
- `feedbacks`

## 3. 集合设计

## 3.1 users

### 用途

存储用户基础信息。

### 字段建议

```ts
{
  _id: ObjectId,
  nickname: string,
  avatar?: string,
  email?: string,
  phone?: string,
  passwordHash?: string,
  authProvider: 'email' | 'phone' | 'apple' | 'wechat' | 'guest',
  currentHouseholdId?: ObjectId,
  timezone?: string,
  reminderEnabled: boolean,
  reminderAdvanceDays: number,
  createdAt: Date,
  updatedAt: Date
}
```

## 3.2 households

### 用途

存储家庭空间。

### 字段建议

```ts
{
  _id: ObjectId,
  name: string,
  ownerUserId: ObjectId,
  inviteCode?: string,
  status: 'active' | 'archived',
  createdAt: Date,
  updatedAt: Date
}
```

## 3.3 householdMembers

### 用途

存储家庭成员关系。

### 字段建议

```ts
{
  _id: ObjectId,
  householdId: ObjectId,
  userId: ObjectId,
  role: 'owner' | 'member',
  joinedAt: Date,
  status: 'active' | 'left'
}
```

## 3.4 storageSpaces

### 用途

存储空间位置，如冷藏、冷冻等。

### 字段建议

```ts
{
  _id: ObjectId,
  householdId: ObjectId,
  name: string,
  type: 'fridge' | 'freezer' | 'room' | 'other',
  sortOrder: number,
  isDefault: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 3.5 items

### 用途

核心物品表。

### 字段建议

```ts
{
  _id: ObjectId,
  householdId: ObjectId,
  createdBy: ObjectId,
  updatedBy?: ObjectId,
  name: string,
  category: 'ingredient' | 'fruit' | 'drink' | 'dessert' | 'snack' | 'leftover' | 'prepared' | 'other',
  storageSpaceId?: ObjectId,
  quantity?: number,
  quantityUnit?: string,
  imageUrl?: string,
  note?: string,
  source: 'manual' | 'leftover_quick_add' | 'barcode' | 'ai' | 'import',
  status: 'active' | 'eaten' | 'discarded' | 'expired',
  purchasedAt?: Date,
  storedAt?: Date,
  openedAt?: Date,
  expireAt?: Date,
  remindAt?: Date,
  reminderStrategy?: {
    type: 'manual' | 'default_rule',
    advanceDays?: number,
  },
  tags?: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### 索引建议

- `householdId + status`
- `householdId + category`
- `householdId + expireAt`
- `householdId + remindAt`
- `name` 文本索引

## 3.6 notifications

### 用途

记录提醒消息。

### 字段建议

```ts
{
  _id: ObjectId,
  householdId: ObjectId,
  userId: ObjectId,
  itemId?: ObjectId,
  type: 'expiring_soon' | 'expired' | 'leftover_reminder' | 'system',
  title: string,
  content: string,
  read: boolean,
  actionStatus?: 'pending' | 'done' | 'dismissed',
  sentAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 3.7 itemActions

### 用途

记录对物品的操作历史。

### 字段建议

```ts
{
  _id: ObjectId,
  householdId: ObjectId,
  itemId: ObjectId,
  userId: ObjectId,
  action: 'create' | 'update' | 'eat' | 'discard' | 'expire' | 'delete',
  snapshot?: Record<string, any>,
  createdAt: Date
}
```

## 3.8 categoryRules

### 用途

管理默认分类规则和默认提醒策略。

### 字段建议

```ts
{
  _id: ObjectId,
  category: string,
  displayName: string,
  defaultStorageType?: string,
  defaultExpireDays?: number,
  defaultReminderAdvanceDays?: number,
  enabled: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 4. 推荐状态设计

## 4.1 物品状态

```ts
active
expired
eaten
discarded
```

### 建议说明

- `active`：正常存在中
- `expired`：系统判定或用户标记过期
- `eaten`：已消耗
- `discarded`：已丢弃

## 4.2 通知状态

```ts
pending
done
dismissed
```

## 5. API 设计原则

- REST 风格优先
- 返回结构统一
- MVP 阶段不追求过度抽象
- 所有列表接口支持分页
- 关键数据操作记录审计日志

### 返回格式建议

```ts
{
  code: 0,
  message: 'ok',
  data: {}
}
```

错误示例：

```ts
{
  code: 4001,
  message: 'item not found',
  data: null
}
```

## 6. API 清单

## 6.1 认证与用户

### POST /api/auth/register

用户注册。

### POST /api/auth/login

用户登录。

### POST /api/auth/logout

用户退出。

### GET /api/users/me

获取当前用户信息。

### PATCH /api/users/me

更新当前用户信息。

## 6.2 家庭相关

### POST /api/households

创建家庭。

请求示例：

```json
{
  "name": "我的家庭"
}
```

### GET /api/households/current

获取当前家庭详情。

### POST /api/households/join

通过邀请码加入家庭。

```json
{
  "inviteCode": "ABC123"
}
```

### GET /api/households/members

获取当前家庭成员列表。

## 6.3 存放空间

### GET /api/storage-spaces

获取空间列表。

### POST /api/storage-spaces

创建空间。

### PATCH /api/storage-spaces/:id

更新空间。

### DELETE /api/storage-spaces/:id

删除空间。

## 6.4 物品管理

### GET /api/items

获取物品列表。

#### Query 参数建议

- `keyword`
- `category`
- `status`
- `storageSpaceId`
- `page`
- `pageSize`
- `sortBy`

### POST /api/items

新增普通物品。

请求示例：

```json
{
  "name": "草莓",
  "category": "fruit",
  "storageSpaceId": "xxx",
  "quantity": 1,
  "quantityUnit": "盒",
  "expireAt": "2026-04-10T12:00:00.000Z",
  "note": "周末买的"
}
```

### POST /api/items/leftover

新增剩菜快捷记录。

请求示例：

```json
{
  "name": "红烧排骨",
  "storedAt": "2026-04-07T13:00:00.000Z",
  "remindAt": "2026-04-08T10:00:00.000Z",
  "note": "昨晚剩的"
}
```

### GET /api/items/:id

获取物品详情。

### PATCH /api/items/:id

编辑物品。

### DELETE /api/items/:id

删除物品。

### POST /api/items/:id/eat

标记已吃掉。

### POST /api/items/:id/discard

标记已丢弃。

### POST /api/items/:id/expire

手动标记已过期。

## 6.5 首页聚合接口

### GET /api/dashboard

返回首页看板数据。

### 返回建议结构

```json
{
  "todayFirst": [],
  "expiringSoon": [],
  "leftoverReminders": [],
  "recentAdded": []
}
```

## 6.6 提醒系统

### GET /api/notifications

获取提醒列表。

### PATCH /api/notifications/:id/read

标记已读。

### POST /api/notifications/read-all

全部标记已读。

## 6.7 分类规则

### GET /api/category-rules

获取默认分类规则。

## 6.8 操作记录

### GET /api/items/:id/actions

获取某个物品的操作历史。

## 7. 首页聚合逻辑建议

`/api/dashboard` 可在服务端完成聚合，避免前端多次请求。

### todayFirst

优先展示：

- 剩菜
- 24-48 小时内到期
- 已经过提醒但未处理的物品

### expiringSoon

未来 48 小时内到期的物品。

### leftoverReminders

分类为 `leftover` 且 `status = active` 的物品。

### recentAdded

按创建时间倒序返回最近新增物品。

## 8. 后端任务建议

## 8.1 每日检查任务

建议每天定时执行：

- 找出 `active` 且已到提醒时间的物品
- 生成通知
- 更新过期状态

### 简化伪代码

```ts
for each active item:
  if item.expireAt <= now:
    set status = expired
    create expired notification
  else if item.remindAt <= now:
    create expiring notification if not exists
```

## 9. 后续扩展点

后续版本可以扩展：

- `recipes`：菜谱推荐
- `shoppingLists`：购物清单
- `aiRecognitions`：AI 识别结果
- `feedbacks`：用户反馈
- `subscriptions`：会员订阅

## 10. 开发建议

### 先做最重要的接口

建议优先顺序：

1. 登录
2. 当前用户
3. 当前家庭
4. 物品 CRUD
5. 剩菜快捷接口
6. 首页聚合接口
7. 提醒接口

### 先保证 3 条主链路

- 新增普通物品
- 新增剩菜
- 首页处理临期内容

只要这三条链路顺畅，MVP 就具备测试价值。
