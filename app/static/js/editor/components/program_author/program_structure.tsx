import * as React from "react";
import { List } from "immutable";
import { Chapter } from "../../reducers/chapters";
import { Nullable, arraysEqual } from "../../util";

interface ProgramStructureProps {
  chapters: List<Chapter>;
  levelIndent: number;
  selectedChapter?: Array<number>;
  chapterClicked: (accessPath: Array<number>) => void;
}

const rightTriangle = String.fromCodePoint(9656);
const downTriangle = String.fromCodePoint(9662);

const ProgramStructure: React.SFC<ProgramStructureProps> = (props) => {
  const { chapters, levelIndent, chapterClicked, selectedChapter } = props;

  const renderTreeLevel = (chapters: List<Chapter>, accessPath: Array<number> = []): Nullable<JSX.Element> => {
    if (chapters.isEmpty()) {
      return null;
    }

    return (
      <div style={{marginLeft: (accessPath.length === 0) ? 8 : levelIndent}}>
        {chapters.map((chapter, i) => {
          const name = (chapter.name) ? chapter.name : <span style={{color: "#555555"}}>(to be named)</span>;
          const bullet = (chapter.children!.isEmpty()) ? rightTriangle : downTriangle;

          const currentPath = accessPath.concat([i]);
          const bgColor = (selectedChapter && arraysEqual(currentPath, selectedChapter)) ? "#389CEB" : "transparent";

          return (
            <div key={i}>
              <div
                style={{padding: "3px 0", cursor: "pointer", backgroundColor: bgColor}}
                onClick={chapterClicked.bind(this, currentPath)}
              >
                {bullet} {name}
              </div>
              {renderTreeLevel(chapter.children!, currentPath)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div style={{fontWeight: "bold", padding: 8, marginBottom: 8, borderBottom: "2px solid #161616"}}>
        Structure
      </div>
      {renderTreeLevel(chapters)}
    </div>
  );
};

export default ProgramStructure;
