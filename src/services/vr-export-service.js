/**
 * Knowledge Graph VR/AR Export Service
 * Генерация glTF/WebXR сцены Графа Знаний для просмотра в VR-шлемах
 */

export class KnowledgeGraphVRExporter {
  constructor(options = {}) {
    this.graphData = null;
    this.sceneConfig = {
      nodeRadius: options.nodeRadius || 0.3,
      edgeWidth: options.edgeWidth || 0.05,
      sceneScale: options.sceneScale || 1.0,
      colors: options.colors || {
        node: '#4a90d9',
        edge: '#cccccc',
        highlight: '#ff6b6b',
        text: '#ffffff'
      },
      layout: {
        type: options.layoutType || 'force',
        forceStrength: options.forceStrength || -100,
        charge: options.charge || -30,
        linkDistance: options.linkDistance || 3
      }
    };
    
    // Буфер геометрии
    this.geometryBuffer = {
      positions: [],
      normals: [],
      indices: [],
      colors: []
    };
  }

  /**
   * Установка данных графа знаний
   */
  setGraphData(graphData) {
    this.graphData = graphData;
    return this;
  }

  /**
   * Генерация полной glTF сцены
   */
  async generateGLTF() {
    if (!this.graphData) {
      throw new Error('Graph data not set. Call setGraphData() first.');
    }

    console.log('🥽 Generating VR scene...');
    
    // Применяем force-directed layout
    const layout = await this.applyForceLayout();
    
    // Генерируем геометрию
    const geometry = this.generateGeometry(layout);
    
    // Создаем glTF структуру
    const gltf = this.createGLTFStructure(geometry);
    
    // Конвертируем в бинарный формат
    const glb = this.convertToGLB(gltf);
    
    console.log(`✅ Generated VR scene with ${layout.nodes.length} nodes and ${layout.edges.length} edges`);
    
    return {
      gltf,
      glb,
      stats: {
        nodes: layout.nodes.length,
        edges: layout.edges.length,
        fileSize: glb.byteLength
      }
    };
  }

  /**
   * Применение force-directed layout к узлам
   */
  async applyForceLayout() {
    const nodes = this.graphData.nodes.map(n => ({
      ...n,
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 20,
      z: (Math.random() - 0.5) * 10,
      vx: 0,
      vy: 0,
      vz: 0
    }));

    const edges = this.graphData.edges || [];
    const iterations = 300;
    const alpha = 0.3;
    const alphaDecay = Math.pow(alpha, 1 / iterations);

    for (let i = 0; i < iterations; i++) {
      // Силы отталкивания между узлами
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const dx = nodes[k].x - nodes[j].x;
          const dy = nodes[k].y - nodes[j].y;
          const dz = nodes[k].z - nodes[j].z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
          
          const force = this.sceneConfig.layout.charge / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          const fz = (dz / distance) * force;
          
          nodes[j].vx -= fx;
          nodes[j].vy -= fy;
          nodes[j].vz -= fz;
          nodes[k].vx += fx;
          nodes[k].vy += fy;
          nodes[k].vz += fz;
        }
      }

      // Силы притяжения вдоль связей
      for (const edge of edges) {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dz = target.z - source.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
          
          const force = (distance - this.sceneConfig.layout.linkDistance) * 0.01;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          const fz = (dz / distance) * force;
          
          source.vx += fx;
          source.vy += fy;
          source.vz += fz;
          target.vx -= fx;
          target.vy -= fy;
          target.vz -= fz;
        }
      }

      // Применение скоростей и затухание
      for (const node of nodes) {
        node.x += node.vx * alpha;
        node.y += node.vy * alpha;
        node.z += node.vz * alpha;
        node.vx *= alphaDecay;
        node.vy *= alphaDecay;
        node.vz *= alphaDecay;
      }

      alpha *= alphaDecay;
    }

    // Центрирование графа
    const center = this.calculateCenter(nodes);
    for (const node of nodes) {
      node.x -= center.x;
      node.y -= center.y;
      node.z -= center.z;
    }

    return { nodes, edges };
  }

  /**
   * Расчет центра масс узлов
   */
  calculateCenter(nodes) {
    const center = { x: 0, y: 0, z: 0 };
    for (const node of nodes) {
      center.x += node.x;
      center.y += node.y;
      center.z += node.z;
    }
    center.x /= nodes.length;
    center.y /= nodes.length;
    center.z /= nodes.length;
    return center;
  }

  /**
   * Генерация геометрии для glTF
   */
  generateGeometry(layout) {
    const geometry = {
      nodes: [],
      meshes: [],
      materials: [],
      accessors: [],
      bufferViews: []
    };

    let accessorIndex = 0;
    let bufferViewIndex = 0;

    // Материал для узлов
    geometry.materials.push({
      pbrMetallicRoughness: {
        baseColorFactor: this.hexToRGBA(this.sceneConfig.colors.node),
        metallicFactor: 0.1,
        roughnessFactor: 0.5
      },
      doubleSided: true
    });

    // Материал для связей
    geometry.materials.push({
      pbrMetallicRoughness: {
        baseColorFactor: this.hexToRGBA(this.sceneConfig.colors.edge),
        metallicFactor: 0.0,
        roughnessFactor: 0.8
      },
      doubleSided: false
    });

    // Генерация сфер для узлов
    for (let i = 0; i < layout.nodes.length; i++) {
      const node = layout.nodes[i];
      const sphereGeometry = this.createSphereGeometry(
        this.sceneConfig.nodeRadius, 
        16, 
        16
      );

      // Создаем mesh для каждого узла
      const mesh = {
        primitives: [{
          attributes: {
            POSITION: accessorIndex++,
            NORMAL: accessorIndex++
          },
          indices: accessorIndex++,
          material: 0,
          mode: 4 // TRIANGLES
        }]
      };

      // Добавляем буферные представления
      const positionBuffer = new Float32Array(sphereGeometry.positions);
      const normalBuffer = new Float32Array(sphereGeometry.normals);
      const indexBuffer = new Uint16Array(sphereGeometry.indices);

      geometry.bufferViews.push(
        this.createBufferView(positionBuffer, 34962), // ARRAY_BUFFER
        this.createBufferView(normalBuffer, 34962),
        this.createBufferView(indexBuffer, 34963) // ELEMENT_ARRAY_BUFFER
      );

      geometry.accessors.push(
        this.createAccessor(bufferViewIndex++, 'VEC3', 'FLOAT', positionBuffer.length / 3, sphereGeometry.minPos, sphereGeometry.maxPos),
        this.createAccessor(bufferViewIndex++, 'VEC3', 'FLOAT', normalBuffer.length / 3),
        this.createAccessor(bufferViewIndex++, 'SCALAR', 'UNSIGNED_SHORT', indexBuffer.length)
      );

      // Позиционируем узел в 3D пространстве
      geometry.nodes.push({
        mesh: i,
        translation: [node.x, node.y, node.z],
        name: node.label || `Node-${i}`
      });

      geometry.meshes.push(mesh);
    }

    // Генерация цилиндров для связей
    for (const edge of layout.edges) {
      const source = layout.nodes.find(n => n.id === edge.source);
      const target = layout.nodes.find(n => n.id === edge.target);
      
      if (!source || !target) continue;

      const cylinderGeometry = this.createCylinderGeometry(
        this.sceneConfig.edgeWidth,
        this.calculateDistance(source, target),
        8,
        1
      );

      const mesh = {
        primitives: [{
          attributes: {
            POSITION: accessorIndex++,
            NORMAL: accessorIndex++
          },
          indices: accessorIndex++,
          material: 1,
          mode: 4
        }]
      };

      const positionBuffer = new Float32Array(cylinderGeometry.positions);
      const normalBuffer = new Float32Array(cylinderGeometry.normals);
      const indexBuffer = new Uint16Array(cylinderGeometry.indices);

      geometry.bufferViews.push(
        this.createBufferView(positionBuffer, 34962),
        this.createBufferView(normalBuffer, 34962),
        this.createBufferView(indexBuffer, 34963)
      );

      geometry.accessors.push(
        this.createAccessor(bufferViewIndex++, 'VEC3', 'FLOAT', positionBuffer.length / 3, cylinderGeometry.minPos, cylinderGeometry.maxPos),
        this.createAccessor(bufferViewIndex++, 'VEC3', 'FLOAT', normalBuffer.length / 3),
        this.createAccessor(bufferViewIndex++, 'SCALAR', 'UNSIGNED_SHORT', indexBuffer.length)
      );

      // Вычисляем трансформацию для цилиндра
      const midPoint = {
        x: (source.x + target.x) / 2,
        y: (source.y + target.y) / 2,
        z: (source.z + target.z) / 2
      };

      const rotation = this.calculateCylinderRotation(source, target);

      geometry.nodes.push({
        mesh: layout.nodes.length + geometry.meshes.length,
        translation: [midPoint.x, midPoint.y, midPoint.z],
        rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
        name: `Edge-${edge.source}-${edge.target}`
      });

      geometry.meshes.push(mesh);
    }

    return geometry;
  }

  /**
   * Создание сферы
   */
  createSphereGeometry(radius, widthSegments, heightSegments) {
    const positions = [];
    const normals = [];
    const indices = [];

    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments;
      const phi = v * Math.PI;

      for (let x = 0; x <= widthSegments; x++) {
        const u = x / widthSegments;
        const theta = u * Math.PI * 2;

        const px = radius * Math.sin(phi) * Math.cos(theta);
        const py = radius * Math.cos(phi);
        const pz = radius * Math.sin(phi) * Math.sin(theta);

        positions.push(px, py, pz);
        normals.push(px / radius, py / radius, pz / radius);
      }
    }

    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = y * (widthSegments + 1) + x;
        const b = a + 1;
        const c = (y + 1) * (widthSegments + 1) + x;
        const d = c + 1;

        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    return {
      positions,
      normals,
      indices,
      minPos: [Math.min(...positions.filter((_, i) => i % 3 === 0)), Math.min(...positions.filter((_, i) => i % 3 === 1)), Math.min(...positions.filter((_, i) => i % 3 === 2))],
      maxPos: [Math.max(...positions.filter((_, i) => i % 3 === 0)), Math.max(...positions.filter((_, i) => i % 3 === 1)), Math.max(...positions.filter((_, i) => i % 3 === 2))]
    };
  }

  /**
   * Создание цилиндра
   */
  createCylinderGeometry(radius, height, radialSegments, heightSegments) {
    const positions = [];
    const normals = [];
    const indices = [];

    const halfHeight = height / 2;

    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments;
      const yPos = (v - 0.5) * height;

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * Math.PI * 2;

        const px = radius * Math.cos(theta);
        const pz = radius * Math.sin(theta);

        positions.push(px, yPos, pz);
        normals.push(Math.cos(theta), 0, Math.sin(theta));
      }
    }

    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < radialSegments; x++) {
        const a = y * (radialSegments + 1) + x;
        const b = a + 1;
        const c = (y + 1) * (radialSegments + 1) + x;
        const d = c + 1;

        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    return {
      positions,
      normals,
      indices,
      minPos: [-radius, -halfHeight, -radius],
      maxPos: [radius, halfHeight, radius]
    };
  }

  /**
   * Расчет расстояния между точками
   */
  calculateDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Расчет вращения для цилиндра
   */
  calculateCylinderRotation(source, target) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dz = target.z - source.z;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Кватернион для поворота от оси Y к направлению связи
    const up = { x: 0, y: 1, z: 0 };
    const dir = { x: dx / length, y: dy / length, z: dz / length };

    const cross = {
      x: up.y * dir.z - up.z * dir.y,
      y: up.z * dir.x - up.x * dir.z,
      z: up.x * dir.y - up.y * dir.x
    };

    const dot = up.x * dir.x + up.y * dir.y + up.z * dir.z;
    const w = Math.sqrt((1 + dot) * 2);

    return {
      x: cross.x / w,
      y: cross.y / w,
      z: cross.z / w,
      w: w / 2
    };
  }

  /**
   * Создание Buffer View
   */
  createBufferView(buffer, target) {
    return {
      byteOffset: 0, // Будет рассчитано при сборке
      byteLength: buffer.byteLength,
      target: target
    };
  }

  /**
   * Создание Accessor
   */
  createAccessor(bufferView, type, componentType, count, min, max) {
    return {
      bufferView: bufferView,
      componentType: componentType === 'FLOAT' ? 5126 : 5123,
      count: count,
      type: type,
      min: min || undefined,
      max: max || undefined
    };
  }

  /**
   * Конвертация HEX в RGBA
   */
  hexToRGBA(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
      1.0
    ] : [0.5, 0.5, 0.5, 1.0];
  }

  /**
   * Создание структуры glTF
   */
  createGLTFStructure(geometry) {
    return {
      asset: {
        version: '2.0',
        generator: 'KnowledgeGraph-VR-Exporter/1.0'
      },
      extensionsUsed: ['KHR_webxr'],
      scenes: [{
        nodes: geometry.nodes.map((_, i) => i)
      }],
      scene: 0,
      nodes: geometry.nodes,
      meshes: geometry.meshes,
      materials: geometry.materials,
      accessors: geometry.accessors,
      bufferViews: geometry.bufferViews,
      buffers: [{
        byteLength: 0 // Будет рассчитано
      }]
    };
  }

  /**
   * Конвертация в GLB (бинарный glTF)
   */
  convertToGLB(gltf) {
    const jsonChunk = JSON.stringify(gltf);
    const jsonPadded = this.padToMultipleOf4(jsonChunk);
    
    // Здесь должна быть логика упаковки бинарных данных
    // Для простоты возвращаем заглушку
    const header = new ArrayBuffer(12);
    const headerView = new DataView(header);
    
    headerView.setUint32(0, 0x46546C67, true); // 'glTF'
    headerView.setUint32(4, 2, true); // version
    headerView.setUint32(8, 12 + 8 + jsonPadded.length, true); // length

    const jsonHeader = new ArrayBuffer(8);
    const jsonHeaderView = new DataView(jsonHeader);
    jsonHeaderView.setUint32(0, jsonPadded.length, true);
    jsonHeaderView.setUint32(4, 0x4E4F534A, true); // 'JSON'

    const combined = new Uint8Array(header.byteLength + jsonHeader.byteLength + jsonPadded.length);
    combined.set(new Uint8Array(header), 0);
    combined.set(new Uint8Array(jsonHeader), header.byteLength);
    combined.set(new TextEncoder().encode(jsonPadded), header.byteLength + jsonHeader.byteLength);

    return combined.buffer;
  }

  /**
   * Выравнивание по 4 байтам
   */
  padToMultipleOf4(str) {
    const padding = (4 - (str.length % 4)) % 4;
    return str + ' '.repeat(padding);
  }

  /**
   * Экспорт в файл
   */
  async exportToFile(filename = 'knowledge-graph.glb') {
    const { glb } = await this.generateGLTF();
    
    const blob = new Blob([glb], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    
    console.log(`📥 Downloaded: ${filename}`);
    return url;
  }

  /**
   * Генерация WebXR HTML обертки
   */
  generateWebXRHTML(gltfUrl) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Knowledge Graph VR</title>
  <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-envmap-component@1.0.0/dist/aframe-envmap-component.min.js"></script>
</head>
<body>
  <a-scene vr-mode-ui="enabled: true" renderer="antialias: true">
    <!-- Environment -->
    <a-sky color="#1a1a2e"></a-sky>
    <a-light type="ambient" intensity="0.5"></a-light>
    <a-light type="point" position="5 5 5" intensity="0.8"></a-light>
    
    <!-- Knowledge Graph Model -->
    <a-entity gltf-model="url(${gltfUrl})" position="0 0 -5"></a-entity>
    
    <!-- Camera Rig -->
    <a-entity id="rig" position="0 0 0">
      <a-camera look-controls wasd-controls></a-camera>
    </a-entity>
    
    <!-- UI Overlay -->
    <a-text value="Knowledge Graph VR" position="0 2 -3" align="center" color="#fff"></a-text>
    <a-text value="Use WASD to move, Mouse to look" position="0 1.5 -3" align="center" color="#aaa" scale="0.5 0.5 0.5"></a-text>
  </a-scene>
  
  <script>
    // VR button handler
    document.addEventListener('DOMContentLoaded', () => {
      const scene = document.querySelector('a-scene');
      scene.addEventListener('enter-vr', () => {
        console.log('Entered VR mode');
      });
      scene.addEventListener('exit-vr', () => {
        console.log('Exited VR mode');
      });
    });
  </script>
</body>
</html>`;
  }
}

export default KnowledgeGraphVRExporter;
