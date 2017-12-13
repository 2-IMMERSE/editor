import { List, Record } from "immutable";
import * as shortid from "shortid";

import { ActionHandler } from "../util";
import * as actions from "../actions/timelines";

export interface TimelineElement {
  id: string;
  x: number;
  width: number;
  color?: string;
}

export interface TimelineTrack {
  componentId: string;
  timelineElements: List<TimelineElement>;
}

export interface TimelineAttributes {
  id: string;
  chapterId: string;
  timelineTracks?: List<TimelineTrack>;
}

export class Timeline extends Record<TimelineAttributes>({id: "", chapterId: "", timelineTracks: List()}) {
  constructor(params?: TimelineAttributes) {
    params ? super(params) : super();
  }
}

export type TimelineState = List<Timeline>;

export const initialState: TimelineState = List([]);

const actionHandler = new ActionHandler<TimelineState>(initialState);

actionHandler.addHandler("ADD_TIMELINE", (state, action: actions.ADD_TIMELINE) => {
  const { chapterId } = action.payload;

  const result = state.find((timeline) => {
    return timeline.chapterId === chapterId;
  });

  if (result !== undefined) {
    return state;
  }

  return state.push(new Timeline({
    id: shortid.generate(),
    chapterId
  }));
});

actionHandler.addHandler("ADD_TIMELINE_TRACK", (state, action: actions.ADD_TIMELINE_TRACK) => {
  const { chapterId, componentId } = action.payload;

  const id = state.findIndex((timeline) => {
    return timeline.chapterId === chapterId;
  });

  if (id < 0) {
    return state;
  }

  return state.updateIn([id, "timelineTracks"], (tracks: List<TimelineTrack>) => {
    return tracks.push({
      componentId,
      timelineElements: List()
    });
  });
});

export default actionHandler.getReducer();
