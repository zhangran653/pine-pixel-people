# 松溪像素世界 · 物件与场景规范 v1

世界图鉴、动作工坊和 Three.js 读取同一组物件。人物配方使用 `pine-character`，带演员的编排包使用 `pine-cast`。场景保存在编排的可选 `scene` 数组中，依照 [编排 Schema](score-v1.schema.json) 验证。

## 分类

| 用途 | 分类 ID | 内置例子 |
| --- | --- | --- |
| 交通工具 | transport | 原始 28 层勘探车、双发飞机、自行车、木轮手推车、通勤艇 |
| 花草树木 | plants | 青草、雏菊、松树、阔叶树、花树、月光巨菇 |
| 建筑与设施 | buildings | 街屋、摊位、凉亭、观测站穹顶 |
| 家具与照明 | furniture | 桌、椅、长凳、灯笼、台灯 |
| 书写与数码 | office | 手机、电脑、书、笔记本、夹板、双轴长卷 |
| 日用与文娱 | home | 浇花壶、杯碗、包裹、乐器、球、宝宝摇铃 |
| 职业器具 | trades | 导游旗、扫码器、毛笔、折扇 |
| 奇幻与科技装置 | wonders | 观星盘、晶石、环境探测仪、航标、拱门 |

每个物件有一个用途，可以有多个时代标签。`modern`、`historic`、`fantasy`、`scifi` 分别表示现代、古代、奇幻、科幻。人物配方的 `identity.era` 使用相同的词汇。`identity.role` 是可编辑的身份或职业名称。

## 坐标、切片与接触点

世界坐标使用 +X 向前、+Y 向左、+Z 向上。默认每单位对应 3.4 厘米。实例的 `x, y, z` 指定地面原点，`heading` 是绕 Z 轴的弧度。编辑器显示角度。物件登记的 `box` 是采样盒的全尺寸。`lift` 是从原点到绘制坐标系的高度，`scale` 是从素材尺寸到场景尺寸的倍率。`anchors` 中的点使用素材的局部绘制坐标。将接触点换算到场景时，先加上 lift，再乘 scale，最后施加实例的旋转和平移。

`PineWorld.items.get(id)` 提供元数据。`PineWorld.geometry(id, detail)` 返回可复用的 `{body, model}`，默认精度为 `figure`。原始车和飞机的 28 层手绘切片在各档精度下共用同一份数据。Three.js 可以从这些像素生成网格。

## 场景精细度与遮挡

在世界图鉴的「精细度」选「精细」或「标准」。精细模式使用人物的精细全身与五官，在单件物件的采样预算内提高家具、植物和建筑的采样密度，并按屏幕像素密度绘制。标准模式使用基础切片，适合较慢的设备。每个场景可以独立保存选择，导出的编排、动作工坊和 Three.js 预览会读取同一设置。[打开精细书桌场景](index.html?scene=study&detail=figure)

编排顶层的可选字段 `detail` 取 `"figure"` 或 `"standard"`。省略时场景默认精细。链接参数 `?detail=standard` 可以指定打开时的精细度，已有场景或 `#current` 上的角色与编排仍可使用。世界图鉴和动作工坊把已放置的物件、活动道具和人物投到同一张深度图，逐个画面像素显示最近的实心切片格。桌腿间和树枝间的空隙可以看到后方，调低精细度也使用同样的遮挡规则。[同一人物在凉亭里的前后对照](scene-occlusion-preview.png)

下面的扩展示例使用两个盒子画出有不同颜色上下层的坐垫。把脚本放在世界图鉴的依赖之后、页面控制器之前加载，就可以在家具分类中选用它。引入模块的顺序见 [世界图鉴入口](index.html)。

```js
PineWorld.register({
  id: 'woven-cushion',
  label: '编织坐垫',
  family: 'furniture',
  realms: ['modern', 'historic', 'fantasy'],
  box: [12, 12, 4],
  anchors: { seat: [0, 0, 2.6] }
}, ({box, k}) => {
  box([0, 0, 0.9], [5, 5, 0.9], k.teal);
  box([0, 0, 2.15], [4.8, 4.8, 0.45], k.linen);
});
```

绘制函数可使用 `box(中心, 半尺寸, 色号)`、`oval(中心, 半径, 色号)` 和 `line(起点, 终点, 半径, 色号)`。场景 JSON 保存物件 ID。使用第三方物件的项目需要在导入编排前注册对应的定义。每个场景支持 64 个实例。

## 建筑空间与层级

凉亭、街屋、摊位和观测站穹顶都能作为空间。世界图鉴在有建筑的场景中显示层级，普通物件显示在所属空间下。点「看内部」可临时收起屋顶和靠近镜头的一侧，旋转视角时会露出另一侧。此时从物件库添加的物品落在该建筑的地坪中心。点「返回全景」可检查柱子、家具与演员之间的实际遮挡。剖开视图只用于编辑。[全景示例](index.html?scene=pavilion) · [同一凉亭的内部](index.html?scene=pavilion&inside=0)

选中建筑，点「将范围内的人物和物件移入」，会按地坪范围收进同层普通物件和演员组，整组只抬高至最低物品落在室内地面，书与桌面之间的距离得以保留。也可逐件修改「所属空间」。原点已在建筑范围内时保留平面位置，范围外的物件会落到地坪中心。移出到上层或移除建筑会保留成员的世界位置和朝向。如果新坐标超出编排允许的范围，编辑器会提示并保留原布置。

```js
const score = {
  version: 1,
  scene: [
    {kind: 'pavilion', x: 30, y: -10, heading: Math.PI / 2},
    {kind: 'desk', parent: 0, x: -12, y: 5},
    {kind: 'book', parent: 0, x: -12, y: 5, z: 21.1},
    {kind: 'pine', x: 75, y: -25}
  ],
  actorPlacement: {parent: 0, x: 12, y: 4},
  steps: [{action: 'idle', actors: ['child']}]
};
const plan = PineMotion.compile(score);
const placedDesk = plan.worldScene[1];
```

`parent` 指向同一 `scene` 数组中的建筑下标，可以前向引用或嵌套。省略时坐标相对场景原点。设置后，子物件的位置与朝向相对建筑，局部高度 0 对应室内地坪，坐标单位与世界一致。`actorPlacement` 设置整组演员的默认位置，双人动作及其接触点共享这一变换。有 `target` 的动作跟随目标家具所在的空间。

`PineWorld.normalize(scene)` 返回用于存档的局部坐标，`PineWorld.resolveScene(scene)` 返回可直接渲染的世界坐标，实例顺序一致。编排会缓存求得的位置。第三方建筑可在注册定义中提供 `interior: {floor: 2.2, cutHeight: 20, footprint: [16, 14]}`。这三个值使用缩放前的素材单位，分别是地坪高度、剖视时保留的远侧墙体高度、可收纳区域的 X/Y 半宽。后两项可省略，分别默认到地坪高度和采样盒半宽。

## 动作绑定

```js
const plan = PineMotion.compile({
  version: 1,
  detail: 'figure',
  loop: true,
  scene: [
    {kind: 'desk', x: -12, y: 18, heading: 0.4},
    {kind: 'lamp', x: -12, y: 26, z: 21.1}
  ],
  steps: [
    {action: 'desk-code', actors: ['look_programmer'], target: 0},
    {action: 'switch-lamp', actors: ['look_developer'], target: 1}
  ]
});
```

`target` 是场景实例的零起始下标。动作声明 `station` 指定可绑定的类型。采样器把演员及动作中的道具一起转到对应的桌子或台灯旁。当前动作接管的物件由动画绘制，例如手按下开关后灯罩底部的颜色会改变。其余实例通过 `plan.scenery(time)` 返回。动作结束后，静态实例恢复显示。导出、导入及删除前面的物件时应保留或重映射这一引用。

工坊使用 `stage.setFrame(plan.sample(t), plan.scenery(t))`。Three.js 的 `cast.setTime(plan,t)` 同时更新人物和场景，也可以对独立场景调用 `cast.setScene(PineWorld.normalize(placements))`。同一物件的多个实例共享几何体，`cast.dispose()` 会释放缓存。
