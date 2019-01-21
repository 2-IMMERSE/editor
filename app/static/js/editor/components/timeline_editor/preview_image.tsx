/**
 * Copyright 2018 Centrum Wiskunde & Informatica
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";
import { Image as KonvaImage } from "react-konva";

import { Nullable, Coords } from "../../util";

interface PreviewImageProps {
  url: string;
  position: Coords;
  height: number;
}

interface PreviewImageState {
  image: Nullable<HTMLImageElement>;
}

class PreviewImage extends React.Component<PreviewImageProps, PreviewImageState> {
  constructor(props: PreviewImageProps) {
    super(props);

    this.state = {
      image: null
    };
  }

  public componentDidMount() {
    // Construct new Image object and set src to props.url
    const image = new Image();
    image.src = this.props.url;

    // Update state once image is loaded
    image.onload = () => {
      this.setState({ image });
    };
  }

  public render() {
    const { position: [x, y], height } = this.props;
    const { image } = this.state;

    // Render and scale image once it's loaded
    if (image !== null) {
      const width = (image.width / image.height) * height;

      return (
        <KonvaImage
          x={x}
          y={y}
          width={width}
          height={height}
          image={image}
        />
      );
    }

    return null;
  }
}

export default PreviewImage;
