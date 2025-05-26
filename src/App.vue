<script setup>
import { ref, onMounted } from 'vue';
// 导入 three.js 核心库
import * as THREE from 'three';
// `Draco` 库压缩的几何加载器
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
// `GLTFLoader` 加载器
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// 模型地址
import modelUrl from '@/assets/models/ferrari.glb';
// 导入环境贴图文件
import envMapUrl from '@/assets/models/venice_sunset_1k.hdr';
// 导入车身阴影贴图
import bodyShadowUrl from '@/assets/models/ferrari_ao.png';
// 轨道控制器
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// 相机、场景、渲染器
let camera, scene, renderer;
// 轨道控制器
let controls;
// 网格地面
let grid;
// 车轮组
let wheels = [];
// 阴影
let shadow;

function init() {
    const container = document.getElementById('container');
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);

    // 创建相机
    camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        0.1,
        100
    );
    camera.position.set(4.25, 1.4, -4.5)
    // 抗锯齿
    renderer = new THREE.WebGLRenderer({ antialias: true });

    // 设置渲染器大小
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setAnimationLoop(render);
    // 将渲染器的输出添加到页面中
    container.appendChild(renderer.domElement);

    // 创建轨道控制器
    controls = new OrbitControls(camera, container);
    // 启用阻尼
    controls.enableDamping = true;
    controls.maxDistance = 9;
    controls.target.set(0, 0.5, 0);
    controls.update();

    // 引入阴影贴图
    shadow = new THREE.TextureLoader().load(bodyShadowUrl)

    // 环境贴图
    scene.environment = new RGBELoader().load(envMapUrl)
    // 贴图球形映射
    scene.environment.mapping = THREE.EquirectangularReflectionMapping;

    // GridHelper 辅助线
    grid = new THREE.GridHelper(20, 40, 0xffffff, 0xffffff);
    grid.material.opacity = 0.2;
    grid.material.depthWrite = false;
    grid.material.transparent = true;
    scene.add(grid);

    // 材质（反光）
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xff0000,
        metalness: 1,
        roughness: 0.5,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        sheen: 0.5,
    });
    // 玻璃材质（反光）
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.25,
        roughness: 0,
        transmission: 1,
    });
    // 轮毂材质（不反光）
    const detailsMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 1,
        roughness: 0.5,
    });
    // 修改车身色值
    document.getElementById('body-color').addEventListener('input', (event) => {
        bodyMaterial.color.set(event.target.value);
    }) 
    // 修改轮毂色值
    document.getElementById('details-color').addEventListener('input', (event) => {
        detailsMaterial.color.set(event.target.value);
    })
    // 修改玻璃色值
    document.getElementById('glass-color').addEventListener('input', (event) => {
        glassMaterial.color.set(event.target.value);
    })

    // 2、加载模型
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('decoder/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
    gltfLoader.load(modelUrl, (gltf) => {
        const carModel = gltf.scene.children[0];
        // 给模型添加材质
        carModel.getObjectByName('body').material = bodyMaterial;
        // 给四个轮毂添加普通材质
        carModel.getObjectByName('rim_fl').material = detailsMaterial;
        carModel.getObjectByName('rim_fr').material = detailsMaterial;
        carModel.getObjectByName('rim_rr').material = detailsMaterial;
        carModel.getObjectByName('rim_rl').material = detailsMaterial;
        carModel.getObjectByName('glass').material = glassMaterial;

        // 获取车轮
        wheels.push(carModel.getObjectByName('wheel_fl'));
        wheels.push(carModel.getObjectByName('wheel_fr'));
        wheels.push(carModel.getObjectByName('wheel_rr'));
        wheels.push(carModel.getObjectByName('wheel_rl'));
        scene.add(carModel);
    });

}

function render() {
    // 视图改变后，刷新控制器
    controls.update();
    // 网格循环
    const time = performance.now() / 1000;
    grid.position.z = time % 1;
    // 轮毂循环
    wheels.forEach((wheel) => {
        wheel.rotation.x = -time * Math.PI * 2;
    })
    // 阴影配置
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4), 
        new THREE.MeshBasicMaterial({
            map: shadow,
            blending: THREE.MultiplyBlending
        })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 2;
    scene.add(mesh);
    // 动画渲染
    renderer.render(scene, camera);
}
onMounted(() => {
    init();
});
</script>

<template>
    <div>
        <div id="info">
            <span class="colorPicker">
                <input id="body-color" type="color" value="#ff0000" />
                <br />
                车身
            </span>
            <span class="colorPicker">
                <input id="details-color" type="color" value="#ffffff" />
                <br />
                轮毂
            </span>
            <span class="colorPicker">
                <input id="glass-color" type="color" value="#ffffff" />
                <br />
                玻璃
            </span>
            <!-- 渲染汽车 -->
            <div id="container"></div>
        </div>
    </div>
</template>

<style>
body {
    color: #bbbbbb;
    background: #333;
    text-align: center;
    overflow: hidden;
}

a {
    color: #08f;
}

.colorPicker {
    display: inline-block;
    margin: 0 10px;
}
</style>
