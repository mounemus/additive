import { Composition } from "remotion";
import { PrintLayers } from "./PrintLayers";

export const RemotionRoot = () => {
  return (
    <Composition
      id="PrintLayers"
      component={PrintLayers}
      durationInFrames={180}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
