// @ts-expect-error The repository vendors the Anatomy kit as untyped ESM.
import * as k from '../../docs/anatomy-map/vendor/iso-kit.mjs';
// @ts-expect-error The repository vendors the Anatomy turned-body kit as untyped ESM.
import * as G from '../../docs/anatomy-map/vendor/lathe.mjs';

export type FenaProjection = {
  origin: number[];
  xVector: number[];
  yVector: number[];
  zVector: number[];
};
export const fenaPoint = (P: FenaProjection, x: number, y: number, z: number) => [
  P.origin[0] + P.xVector[0] * x + P.yVector[0] * y + P.zVector[0] * z,
  P.origin[1] + P.xVector[1] * x + P.yVector[1] * y + P.zVector[1] * z,
];
// The exact kit camera is serialized in the art. Build and browser share this geometry.
export function fenaColumn(camera: object, x: number, y: number, height: number): string {
  if (height <= 0) return '';
  const F = G.frameAlong([x, y, 16], [0, 0, 1]);
  return k.solidSvg(G.disc(0, height, 8.5, F, camera, { smooth: { slope: () => 0 } }), {
    lit: true,
    tone: 'hi',
  });
}
