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

`PineWorld.items.get(id)` 提供元数据。`PineWorld.geometry(id)` 返回可复用的 `{body, model}`。原始车和飞机每个高度的像素都保存在各自的切片中，Canvas 可以重新沿 X、Y 或 Z 轴排片，Three.js 可以从同一批像素生成网格。

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

## 动作绑定

```js
const plan = PineMotion.compile({
  version: 1,
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
