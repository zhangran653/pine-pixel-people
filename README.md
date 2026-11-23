# 松溪像素人物 · Pine Pixel People

用二维像素切片制作可 360° 环视的人物。可以捏脸、组合服饰、保存形象，让不同身材的角色使用同一套动作。项目包含 Canvas 2D 创作室、动作编排器，以及可以装进 Three.js 场景的人物适配器。

![创作室的正面对照，两位成人角色均为 156 厘米，穿着同一套短袖和长裤](atelier-preview.png)

## 本地运行

在仓库根目录启动静态 HTTP 服务，无需构建或安装前端依赖。Three.js 随项目分发。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

- [人物创作室](http://127.0.0.1:8000/atelier.html)可以调整体型和五官、选择衣服和配色，也能并排对照两个人物。
- [动作工坊](http://127.0.0.1:8000/studio.html)可以更换演员、编排动作、指定时长和重复次数，保存循环编排。
- [Three.js 观景台](http://127.0.0.1:8000/three.html)用 WebGL 2 显示相同的演员与动作。创作室的「三维试演」会带入当前形象与搭档。
- [原始切片演示](http://127.0.0.1:8000/slice-study.html)可以旋转最初的徒步者，检查身体任一高度的像素横截面。

## 试演两个独立的形象

1. 打开创作室，在「默认体型」选女、男或儿童。两种成人体型有各自的肩线与腰胯轮廓，儿童使用中性体型。切换时会保留已选的五官、发型、衣服、颜色和比例滑杆。
2. 打开「发型」，可以转到侧面或背面比较披肩长发、长波浪和双麻花辫。点击色块试染八种发色，也能用「自定义发色」选任意 RGB 颜色。换发型会保留当前发色。[试戴披肩长发](http://127.0.0.1:8000/atelier.html?preset=look_body_female&tab=hair&hair=shoulder-length)
3. 给人物取名并保存。改变发型或服装，再点「另存为新形象」。两个存档拥有各自的稳定 ID。
4. 用「对照人物」选择另一个形象，试跑或相互击掌。导出角色 JSON 可以在另一台设备重新打开，文件内含所穿外部帽饰的版本、素材和声明。
5. 也可以直接把 [放学后的双人编排](packs/after-school.json) 导入动作工坊，试看跑步、跳跃、击掌与喝水的完整循环。

「体型」面板以每种默认体型为 100%。身高可调至 75%–130%，肩宽 70%–135%，臂长和腿长各为 80%–125%，步长均为 1%。成人站姿约为 117–203 cm，儿童约为 83–144 cm。已有形象首次使用扩展范围时会自动采用基础部件 `pine-core 1.3.0`。

全身镜头有固定的地面和厘米标尺。身高读数取站直时的裸头顶位置。拖动「环视」可以从正面和侧面看两种成人体型的差别。两个样本使用相同的身高、发型和衣装。[成人体型并排对照](http://127.0.0.1:8000/atelier.html?preset=look_body_female&compare=look_body_male&tab=shape) · [儿童身高对照](http://127.0.0.1:8000/atelier.html?preset=look_chorus&compare=look_relay&tab=shape) · [双马尾后侧近景](http://127.0.0.1:8000/atelier.html?preset=look_chorus&tab=hair)

在暂停待机时打开「五官」，镜子会对准正面。基础部件 `pine-core 1.5.0` 让唇线和喝水接触点共用脸部中线，头顶和后脑沿椭圆截面过渡到下颌和后颈。拖动环视可看轮廓，右下角的「精细五官」可以切换近景精度。已有形象可以点「采用新版头型」预览，满意后保存。[查看披肩长发正面](http://127.0.0.1:8000/atelier.html?preset=look_body_female&tab=face&hair=shoulder-length)

![同一角色修改前后的正面、侧面与后侧，展示唇线中点和头型](face-detail-preview.png)

## 角色与动作怎样复用

先确定骨长与关节，再在各部位的局部坐标中绘制体积。在每个姿势中，用格点采样身体和衣服。Canvas 路径按观察方向层叠像素切片。Three.js 适配器提取同一份格点的可见表面，支持遮挡和阴影。角色导出的是参数和部件引用，动作由独立的采样器根据骨架、标签与接触点重建姿势。

三种默认体型共用 13 个动作，包括跑、跳、喝水、打字和双人击掌。另有徒步者、测绘员、妈妈、儿童、学步幼儿和宝宝六个内置演员，整个动作库共有 16 个动作。亲子抱摇和躲猫猫使用已校准的妈妈与宝宝。

每种体型都能使用 12 款发型、5 款上衣、4 款下装、4 款鞋和 3 种颈饰。在「五官」先选一组眼眉鼻唇，再单独微调，每个部位各有 4 款。「穿搭」提供四套可拆开搭配的服装，也可通过 JSON 添加帽子。成人体型随基础部件 `pine-core 1.2.0` 引入，打开 1.0.0 或 1.1.0 的角色文件时会按存档还原。旧成人角色在编辑器中显示为「原版成人体型」，可以手动选择新体型。

披肩长发、长波浪、半扎长发、双麻花辫和偏分短发使用基础部件 `pine-core 1.4.0`。所有版本都用 `colors.hair` 保存发色，「配色」和「发型」面板编辑同一个值。

![同一角色的五款新发型与发色，依次展示正面、侧面和背面](hairstyles-preview.png)

| 想做的事 | 文档或示例 |
| --- | --- |
| 编写和验证形象 | [形象与部件规范](appearance-standard.html) · [角色 Schema](character-v1.schema.json) · [溪谷学童](packs/creek-child.json) · [枫林信使](packs/maple-child.json) · [双马尾合唱队员](packs/chorus-child.json) · [单马尾接力跑手](packs/relay-child.json) |
| 导入同身高、同装的成人样本 | [女体型 JSON](packs/female-adult.json) · [男体型 JSON](packs/male-adult.json) |
| 贡献一顶帽子 | [溪谷帽饰 JSON 原稿](packs/creek-hats.json) · [部件包 Schema](part-pack-v1.schema.json) |
| 贡献动作或导出编排 | [骨架、接触点与动作 API](motion-standard.html) · [动作编排 Schema](score-v1.schema.json) · [可移植角色编排包 Schema](cast-v1.schema.json) |
| 接入 Three.js | [人物适配器](pine-three.mjs) · [示例集成](three-demo.mjs) |

## 兼容性检查

使用 Node.js 22 或更新版本。在项目根目录运行以下检查。第三项调用本机 Chrome，Linux 默认使用 google-chrome，可通过 CHROME_BIN 指定可执行文件。GitHub Actions 在推送和拉取请求时运行这三项检查。

```sh
node check-motion.cjs
node check-appearance.cjs
node tests/check-atelier.cjs
```

检查涵盖内置动作与演员标签、时序和接触点，还会在独立运行环境中验证形象的逐像素还原、部件版本和冲突处理。贡献新帽子时应为新版本保留唯一的包名与版本组合，分别检查儿童和成人佩戴时的正面、侧面与后脑。

## 许可

本项目原创工具、人物、部件、动作、场景及示例按 [MIT 许可证](LICENSE) 分发。版权为 2026 zhangran653 and contributors。复制或分发时请保留版权与许可声明。随附 Three.js r187 与 OrbitControls 的版权属于 three.js authors，[上游许可](vendor/three-r187/LICENSE) 已保留。外部导入的部件包保留包作者的声明。
