/**
 * Unit tests for KnowledgeGraphVRExporter (src/services/vr-export-service.js)
 * Raises branch/line coverage for the VR/AR knowledge-graph export path.
 */
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;
import { KnowledgeGraphVRExporter } from '@services/vr-export-service.js';

const SAMPLE_GRAPH = {
  nodes: [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
    { id: 'c', label: 'Gamma' }
  ],
  edges: [
    { source: 'a', target: 'b' },
    { source: 'b', target: 'c' }
  ]
};

describe('KnowledgeGraphVRExporter', () => {
  test('constructor applies defaults', () => {
    const e = new KnowledgeGraphVRExporter();
    expect(e.sceneConfig.nodeRadius).toBe(0.3);
    expect(e.sceneConfig.layout.type).toBe('force');
    expect(e.geometryBuffer.positions).toEqual([]);
  });

  test('constructor honors options', () => {
    const e = new KnowledgeGraphVRExporter({ nodeRadius: 1.5, layoutType: 'grid' });
    expect(e.sceneConfig.nodeRadius).toBe(1.5);
    expect(e.sceneConfig.layout.type).toBe('grid');
  });

  test('setGraphData returns this for chaining', () => {
    const e = new KnowledgeGraphVRExporter();
    expect(e.setGraphData(SAMPLE_GRAPH)).toBe(e);
  });

  test('generateGLTF throws when no graph data', async () => {
    const e = new KnowledgeGraphVRExporter();
    await expect(e.generateGLTF()).rejects.toThrow(/Graph data not set/);
  });

  test('generateGLTF produces gltf/glb with stats', async () => {
    const e = new KnowledgeGraphVRExporter();
    e.setGraphData(SAMPLE_GRAPH);
    const result = await e.generateGLTF();
    expect(result.gltf).toBeDefined();
    expect(result.glb).toBeInstanceOf(ArrayBuffer);
    expect(result.stats.nodes).toBe(3);
    expect(result.stats.edges).toBe(2);
    expect(result.stats.fileSize).toBe(result.glb.byteLength);
  });

  test('generateGeometry builds materials, meshes, accessors, bufferViews', async () => {
    const e = new KnowledgeGraphVRExporter();
    e.setGraphData(SAMPLE_GRAPH);
    const layout = await e.applyForceLayout();
    const geom = e.generateGeometry(layout);
    // 3 node meshes + 2 edge meshes = 5
    expect(geom.meshes.length).toBe(5);
    expect(geom.materials.length).toBe(2);
    expect(geom.nodes.length).toBe(5);
    expect(geom.accessors.length).toBeGreaterThan(0);
    expect(geom.bufferViews.length).toBeGreaterThan(0);
  });

  test('applyForceLayout centers graph around origin', async () => {
    const e = new KnowledgeGraphVRExporter();
    e.setGraphData(SAMPLE_GRAPH);
    const layout = await e.applyForceLayout();
    const center = e.calculateCenter(layout.nodes);
    expect(Math.abs(center.x)).toBeLessThan(1e-9);
    expect(Math.abs(center.y)).toBeLessThan(1e-9);
    expect(Math.abs(center.z)).toBeLessThan(1e-9);
  });

  test('calculateCenter averages node positions', () => {
    const e = new KnowledgeGraphVRExporter();
    const nodes = [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 4, z: 6 }
    ];
    const c = e.calculateCenter(nodes);
    expect(c).toEqual({ x: 1, y: 2, z: 3 });
  });

  test('createSphereGeometry returns positions/normals/indices with bounds', () => {
    const e = new KnowledgeGraphVRExporter();
    const g = e.createSphereGeometry(1, 8, 8);
    expect(g.positions.length).toBeGreaterThan(0);
    expect(g.normals.length).toBe(g.positions.length);
    expect(g.indices.length).toBeGreaterThan(0);
    expect(g.minPos.length).toBe(3);
    expect(g.maxPos.length).toBe(3);
  });

  test('createCylinderGeometry returns bounded geometry', () => {
    const e = new KnowledgeGraphVRExporter();
    const g = e.createCylinderGeometry(0.1, 2, 8, 1);
    expect(g.positions.length).toBeGreaterThan(0);
    expect(g.indices.length).toBeGreaterThan(0);
    expect(g.minPos[1]).toBeCloseTo(-1);
    expect(g.maxPos[1]).toBeCloseTo(1);
  });

  test('calculateDistance euclidean', () => {
    const e = new KnowledgeGraphVRExporter();
    const d = e.calculateDistance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 });
    expect(d).toBe(5);
  });

  test('calculateCylinderRotation yields normalized quaternion', () => {
    const e = new KnowledgeGraphVRExporter();
    const r = e.calculateCylinderRotation({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    const len = Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z + r.w * r.w);
    expect(len).toBeCloseTo(1, 5);
  });

  test('createBufferView / createAccessor shape', () => {
    const e = new KnowledgeGraphVRExporter();
    const bv = e.createBufferView(new Float32Array([1, 2, 3]), 34962);
    expect(bv.target).toBe(34962);
    expect(bv.byteLength).toBeGreaterThan(0);
    const ac = e.createAccessor(0, 'VEC3', 'FLOAT', 3, [0, 0, 0], [1, 1, 1]);
    expect(ac.componentType).toBe(5126);
    expect(ac.count).toBe(3);
    expect(ac.min).toEqual([0, 0, 0]);
    const acShort = e.createAccessor(1, 'SCALAR', 'UNSIGNED_SHORT', 2);
    expect(acShort.componentType).toBe(5123);
    expect(acShort.min).toBeUndefined();
  });

  test('hexToRGBA parses hex', () => {
    const e = new KnowledgeGraphVRExporter();
    // Returns [r, g, b, a] (alpha included)
    expect(e.hexToRGBA('#4a90d9')).toEqual([0x4a / 255, 0x90 / 255, 0xd9 / 255, 1]);
    expect(e.hexToRGBA('cccccc')[0]).toBeCloseTo(0xcc / 255);
    // Invalid hex falls back to the default grey (source does not return null)
    expect(e.hexToRGBA('#zzzzzz')).toEqual([0.5, 0.5, 0.5, 1.0]);
  });
});
