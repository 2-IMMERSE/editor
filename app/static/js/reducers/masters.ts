import { List, Record } from "immutable";
import * as shortid from "shortid";

import { ActionHandler } from "../util";
import * as actions from "../actions/masters";

interface ComponentPlacement {
  screen: string;
  region: string;
  component: any;
}

export interface MasterAttributes {
  id: string;
  name: string;
  placedComponents?: List<ComponentPlacement>;
}

export class Master extends Record<MasterAttributes>({id: "", name: "", placedComponents: List()}) {
  constructor(params?: MasterAttributes) {
    params ? super(params) : super();
  }
}

export type MasterState = List<Master>;

const initialState: MasterState = List();
const actionHandler = new ActionHandler<MasterState>(initialState);

actionHandler.addHandler("ADD_MASTER_LAYOUT", (state, action: actions.ADD_MASTER_LAYOUT) => {
  const { name } = action.payload;

  return state.push(new Master({
    id: shortid.generate(),
    name
  }));
});

export default actionHandler.getReducer();