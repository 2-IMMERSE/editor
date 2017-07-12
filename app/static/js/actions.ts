import { ActionCreatorsMapObject } from "redux";

export interface BasicAction<T> {
  type: T;
}

export interface PayloadAction<T, U> extends BasicAction<T> {
  payload: U;
}

export type ADD_DEVICE = PayloadAction<"ADD_DEVICE", {type: "personal" | "communal"}>
function addDevice(type: "personal" | "communal"): ADD_DEVICE {
  return {
    type: "ADD_DEVICE",
    payload: {
      type
    }
  };
}

export type REMOVE_DEVICE = PayloadAction<"REMOVE_DEVICE", {id: string}>
function removeDevice(id: string): REMOVE_DEVICE {
  return {
    type: "REMOVE_DEVICE",
    payload: {
      id
    }
  };
}

export type SPLIT_REGION = PayloadAction<"SPLIT_REGION", {screenId: string, regionId: string, orientation: "horizontal" | "vertical", position: number}>;
function splitRegion(screenId: string, regionId: string, orientation: "horizontal" | "vertical", position: number): SPLIT_REGION {
  return {
    type: "SPLIT_REGION",
    payload: {
      screenId,
      regionId,
      orientation,
      position
    }
  };
}

export type MERGE_REGIONS = PayloadAction<"MERGE_REGIONS", {screenId: string, regionId1: string, regionId2: string}>;
function mergeRegions(screenId: string, regionId1: string, regionId2: string): MERGE_REGIONS {
  return {
    type: "MERGE_REGIONS",
    payload: {
      screenId,
      regionId1,
      regionId2
    }
  };
}

export type ADD_CHAPTER_BEFORE = PayloadAction<"ADD_CHAPTER_BEFORE", {accessPath: Array<number>}>;
function addChapterBefore(accessPath: Array<number>): ADD_CHAPTER_BEFORE {
  return {
    type: "ADD_CHAPTER_BEFORE",
    payload: {
      accessPath
    }
  };
}

export type ADD_CHAPTER_AFTER = PayloadAction<"ADD_CHAPTER_AFTER", {accessPath: Array<number>}>;
function addChapterAfter(accessPath: Array<number>): ADD_CHAPTER_AFTER {
  return {
    type: "ADD_CHAPTER_AFTER",
    payload: {
      accessPath
    }
  };
}

export type ADD_CHAPTER_CHILD = PayloadAction<"ADD_CHAPTER_CHILD", {accessPath: Array<number>}>;
function addChapterChild(accessPath: Array<number>): ADD_CHAPTER_CHILD {
  return {
    type: "ADD_CHAPTER_CHILD",
    payload: {
      accessPath
    }
  };
}

export type RENAME_CHAPTER = PayloadAction<"RENAME_CHAPTER", {accessPath: Array<number>, name: string}>;
function renameChapter(accessPath: Array<number>, name: string): RENAME_CHAPTER {
  return {
    type: "RENAME_CHAPTER",
    payload: {
      accessPath,
      name
    }
  };
}

export type Action = ADD_DEVICE | REMOVE_DEVICE | SPLIT_REGION | MERGE_REGIONS |
                     ADD_CHAPTER_BEFORE | ADD_CHAPTER_AFTER | ADD_CHAPTER_CHILD | RENAME_CHAPTER;

export const actionCreators: ActionCreatorsMapObject = {
  addDevice,
  removeDevice,
  splitRegion,
  addChapterBefore,
  addChapterAfter,
  addChapterChild,
  renameChapter
};
