import { useMemo, useState } from "react";
import { getCharacterMeta } from "../constants/characters";

const FALLBACK_PNG_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAJUbvuoAAAAASUVORK5CYII=";

const CharacterPortrait = ({
  characterName,
  alt,
  className = "",
  rounded = "rounded-xl",
  fit = "cover",
  imageClassName = ""
}) => {
  const meta = useMemo(() => getCharacterMeta(characterName), [characterName]);
  const [src, setSrc] = useState(meta.portrait);

  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`}>
      <img
        src={src}
        alt={alt || characterName}
        className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} ${imageClassName}`}
        onError={() => {
          if (src !== FALLBACK_PNG_DATA_URI) setSrc(FALLBACK_PNG_DATA_URI);
        }}
      />
    </div>
  );
};

export default CharacterPortrait;
