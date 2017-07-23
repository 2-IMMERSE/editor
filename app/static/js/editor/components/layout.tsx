import * as React from "react";

import CurrentVersion from "./current_version";
import MenuBar from "./menu_bar";

interface ApplicationProps {
  children?: any;
}

class Layout extends React.Component<ApplicationProps, {}> {
  public render() {
    return (
      <div className="wrapper">
        <MenuBar />
        {React.cloneElement(this.props.children, Object.assign({}, this.props))}
        <CurrentVersion />
      </div>
    );
  }
}

export default Layout;