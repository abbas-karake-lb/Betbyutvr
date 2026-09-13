import * as T from './vendor/three.module.js';

// Both hover and trigger selection use this exact ray/UV calculation.
const rotationMatrix = new T.Matrix4();
export function panelTarget(raycaster, controller, panel, buttons, width, height) {
  controller.updateWorldMatrix(true, false);
  rotationMatrix.extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rotationMatrix).normalize();
  if (!panel.visible || !controller.visible) return { hit: null, buttonIndex: -1 };
  panel.updateWorldMatrix(true, false);
  const hit = raycaster.intersectObject(panel, false)[0] || null;
  if (!hit) return { hit: null, buttonIndex: -1 };
  const x = hit.uv.x * width, y = (1 - hit.uv.y) * height;
  const buttonIndex = buttons.findIndex(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  return { hit, buttonIndex, button: buttons[buttonIndex] };
}

export function createControllerPointer(controller, scene) {
  // A thin cylinder stays visible in stereo; WebGL line width is often only one pixel.
  const beamGeometry = new T.CylinderGeometry(.0018, .0018, 1, 8);
  beamGeometry.rotateX(-Math.PI / 2);
  beamGeometry.translate(0, 0, -.5);
  const overlay = { depthTest: false, depthWrite: false, transparent: true, toneMapped: false };
  const beam = new T.Mesh(beamGeometry, new T.MeshBasicMaterial({ ...overlay, color: '#efc773', opacity: .9 }));
  beam.renderOrder = 101; beam.visible = false; controller.add(beam);
  const cursor = new T.Group(); cursor.visible = false;
  const ring = new T.Mesh(new T.RingGeometry(.008, .013, 24), new T.MeshBasicMaterial({ ...overlay, color: '#63ffe0', side: T.DoubleSide }));
  const dot = new T.Mesh(new T.CircleGeometry(.0045, 16), new T.MeshBasicMaterial({ ...overlay, color: '#ffffff', side: T.DoubleSide }));
  ring.renderOrder = 102; dot.renderOrder = 103; cursor.add(ring, dot); scene.add(cursor);
  return {
    beam, cursor,
    update(hit, surface, overButton) {
      beam.visible = controller.visible;
      beam.scale.z = hit ? hit.distance : 5;
      beam.material.color.set(overButton ? '#63ffe0' : '#efc773');
      cursor.visible = !!hit && controller.visible;
      if (hit) {
        cursor.position.copy(hit.point);
        (surface || controller).getWorldQuaternion(cursor.quaternion);
        cursor.scale.setScalar(overButton ? 1.2 : 1);
        ring.material.color.set(overButton ? '#63ffe0' : '#efc773');
      }
    },
    hide() { beam.visible = false; cursor.visible = false; }
  };
}
