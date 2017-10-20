import * as React from "react";
import * as classNames from "classnames";

import { makeRequest, padStart } from "../editor/util";

interface RemoteControlProps {
  documentId: string;
}

interface PreviewStatus {
  active: boolean;
  status: string;
  playing?: boolean;
  position?: number;
}

interface RemoteControlState {
  previewStatus: PreviewStatus;
  lastPositionUpdate?: number;
}

class RemoteControl extends React.Component<RemoteControlProps, RemoteControlState> {
  private statusInterval: any;
  private timerInterval: any;

  public constructor(props: RemoteControlProps) {
    super(props);

    this.state = {
      previewStatus: {
        active: false,
        status: "Preview player is not running"
      }
    };
  }

  public componentDidMount() {
    this.statusInterval = setInterval(() => {
      makeRequest("GET", `/api/v1/document/${this.props.documentId}/remote`).then((data) => {
        const previewStatus = JSON.parse(data);
        console.log("Preview status:", previewStatus);

        this.setState({
          previewStatus,
          lastPositionUpdate: Date.now() / 1000
        });
      }).catch((err) => {
        console.error("Could not fetch preview status:", err);
      });
    }, 1000);

    this.timerInterval = setInterval(() => {
      const { lastPositionUpdate, previewStatus } = this.state;

      if (previewStatus.playing && previewStatus.position && lastPositionUpdate) {
        const delta = (Date.now() / 1000) - lastPositionUpdate;

        this.setState({
          previewStatus: {
            ...previewStatus,
            position: previewStatus.position + delta
          },
          lastPositionUpdate: Date.now() / 1000
        });
      }
    }, 10);
  }

  public componentWillUnmount() {
    this.statusInterval && clearInterval(this.statusInterval);
    this.timerInterval && clearInterval(this.timerInterval);
  }

  private togglePlayback() {
    const { previewStatus } = this.state;

    if (previewStatus.playing) {
      this.setState({
        previewStatus: {
          ...previewStatus,
          playing: false
        }
      });
    }

    this.sendControlCommand({ playing: !previewStatus.playing });
  }

  private sendControlCommand(command: any) {
    const { previewStatus } = this.state;
    const controlUrl = `/api/v1/document/${this.props.documentId}/remote/control`;

    if (previewStatus.active) {
      console.log("Sending playback command: ", command);

      makeRequest("POST", controlUrl, JSON.stringify(command), "application/json").then(() => {
        console.log("Playback state toggled");
      }).catch((err) => {
        console.warn("Could not toggle playback:", err);
      });
    } else {
      console.log("Preview not active, this is a no-op");
    }
  }

  private renderTimestamp() {
    const { previewStatus: { position } } = this.state;

    if (position) {
      const hours = Math.floor(position / 3600);
      const minutes = Math.floor(position / 60) - hours * 60;
      const seconds = Math.floor(position) - minutes * 60 - hours * 3600;
      const msecs = Math.floor((position - Math.floor(position)) * 1000);

      return `${padStart(hours, 2)}:${padStart(minutes, 2)}:${padStart(seconds, 2)}.${padStart(msecs, 3)}`;
    }

    return "--:--:--.---";
  }

  public render() {
    const { previewStatus } = this.state;

    const containerStyle: React.CSSProperties = {
      position: "fixed",
      height: 80,
      bottom: 0,
      left: 0,
      width: "100%",
      padding: 10,
      borderTop: "2px solid #161616"
    };

    const buttonStyle: React.CSSProperties = {
      width: 55,
      flexGrow: 0,
      margin: "0 5px"
    };

    const timestampStyle = {
      fontFamily: "monospace",
      fontSize: 24,
      borderRadius: 3,
      padding: "0 5px",
      marginLeft: 20,
      border: "1px solid #E2E2E2",
      height: 36
    };

    return (
      <div style={containerStyle}>
        <div style={{display: "flex", justifyContent: "center"}}>
          <button className="button is-info"
                  style={buttonStyle}
                  disabled={!previewStatus.active}
                  onClick={this.sendControlCommand.bind(this, { adjust: -5.0 })}>
            <i className="fa fa-fast-backward"></i>
          </button>
          <button className="button is-info"
                  style={buttonStyle}
                  disabled={!previewStatus.active}
                  onClick={this.sendControlCommand.bind(this, { adjust: -0.04 })}>
            <i className="fa fa-step-backward"></i>
          </button>
          <button className={classNames("button", (previewStatus.playing) ? "is-error" : "is-success")}
                  style={buttonStyle}
                  disabled={!previewStatus.active}
                  onClick={this.togglePlayback.bind(this)}>
            <i className={classNames("fa", (previewStatus.playing) ? "fa-pause" : "fa-play")}></i>
          </button>
          <button className="button is-info"
                  style={buttonStyle}
                  disabled={!previewStatus.active}
                  onClick={this.sendControlCommand.bind(this, { adjust: 0.04 })}>
            <i className="fa fa-step-forward"></i>
          </button>
          <div style={timestampStyle}>
            <p style={{marginTop: -2, padding: "0 10px"}}>{this.renderTimestamp()}</p>
          </div>
        </div>
        <div style={{marginTop: 7}}>
          <p style={{color: "#FF3860", textAlign: "center"}}>{previewStatus.status}</p>
        </div>
      </div>
    );
  }
}

export default RemoteControl;
