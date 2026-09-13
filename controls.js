import * as T from './vendor/three.module.js';
export function stickAxes(source){const a=source?.gamepad?.axes||[];const index=a.length>=4?2:0;return [a[index]||0,a[index+1]||0];}
export function deadzone(v){return Math.abs(v)<.16?0:Math.sign(v)*(Math.abs(v)-.16)/.84;}
// A viewer pose is in XR reference-space coordinates. Apply the rig once to get
// the world heading; the renderer's ArrayCamera may still describe last frame.
export function moveVector(x,y,viewerOrientation,rigQuaternion,distance){const q=new T.Quaternion(viewerOrientation.x,viewerOrientation.y,viewerOrientation.z,viewerOrientation.w).premultiply(rigQuaternion);const forward=new T.Vector3(0,0,-1).applyQuaternion(q);forward.y=0;if(forward.lengthSq()<.001)forward.set(0,0,-1).applyQuaternion(rigQuaternion);forward.y=0;forward.normalize();const right=new T.Vector3(-forward.z,0,forward.x);const magnitude=Math.max(1,Math.hypot(x,y));return forward.multiplyScalar(-y*distance/magnitude).addScaledVector(right,x*distance/magnitude);}
