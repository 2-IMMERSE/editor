import * as React from "react";
import { List } from "immutable";
import { bindActionCreators } from "redux";
import { connect, Dispatch } from "react-redux";
import * as classNames from "classnames";

import { Nullable, makeRequest } from "../util";
import { ApplicationState, navigate } from "../store";
import { DocumentState } from "../reducers/document";

import { actionCreators as documentActionCreators, DocumentActions } from "../actions/document";
import { actionCreators as screenActionCreators, ScreenActions } from "../actions/screens";
import { actionCreators as assetActionCreators, AssetActions } from "../actions/assets";
import { actionCreators as chapterActionCreators, ChapterActions } from "../actions/chapters";
import { actionCreators as timelineActionCreators, TimelineActions } from "../actions/timelines";

interface Asset {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  duration: number;
}

interface Area {
  region: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Device {
  name: string;
  type: "communal" | "personal";
  orientation: "portrait" | "landscape";
  areas: Array<Area>;
}

interface Region {
  id: string;
  name: string;
  color: string;
}

interface Layout {
  devices: Array<Device>;
  regions: Array<Region>;
}

interface Element {
  asset: string;
  duration: number;
  offset: number;
}

interface Track {
  id: string;
  region: string;
  elements: Array<Element>;
}

export interface ChapterTree {
  id: string;
  name: string;
  tracks: Array<Track>;
  chapters: Array<ChapterTree>;
}

interface StartPageProps {
  document: DocumentState;

  documentActions: DocumentActions;
  screenActions: ScreenActions;
  assetActions: AssetActions;
  chapterActions: ChapterActions;
  timelineActions: TimelineActions;
}

interface StartPageState {
  isLoading: boolean;
  selectedMethod: "url" | "upload" | "id";
  existingDocuments: Array<{ id: string, description: string }>;
}

function getRegionForArea(id: string, layout: Layout) {
  return List(layout.regions).find((region) => region.id === id)!;
}

class StartPage extends React.Component<StartPageProps, StartPageState> {
  private urlInput: Nullable<HTMLInputElement>;
  private fileInput: Nullable<HTMLInputElement>;
  private idInput: Nullable<HTMLSelectElement>;

  constructor(props: never) {
    super(props);

    this.state = {
      isLoading: false,
      selectedMethod: "url",
      existingDocuments: []
    };
  }

  public async componentDidUpdate() {
    const { documentId } = this.props.document;

    if (documentId !== "") {
      console.log("constructing document", documentId);
      const baseUrl = `/api/v1/document/${documentId}/editing/`;

      // Retrieve document assets and parse them
      const assetData = await makeRequest("GET", baseUrl + "getAssets");
      const assets: Array<Asset> = JSON.parse(assetData);
      console.log("assets", assets);

      // Allocate all assets locally
      assets.forEach((asset) => {
        const { id, name, description, previewUrl, duration } = asset;
        this.props.assetActions.addAsset(id, name, description, previewUrl, duration);
      });

      // Retrieve layout and parse it
      const layoutData = await makeRequest("GET", baseUrl + "getLayout");
      const layout: Layout = JSON.parse(layoutData);
      console.log("layout", layout);

      // Allocate devices and create regions
      layout.devices.forEach((device) => {
        // Join areas with corresponding regions
        const regions: Array<Area & Region> = device.areas.map((area) => {
          const { id, name, color } = getRegionForArea(area.region, layout);

          return {
            ...area,
            id, name, color
          };
        });

        // Allocate device and create regions
        this.props.screenActions.addDeviceAndPlaceRegions(
          device.type,
          device.name,
          device.orientation,
          regions
        );
      });

      // Retrieve and parse chapter data
      const chapterData = await makeRequest("GET", baseUrl + "getChapters");
      const chapterTree: ChapterTree = JSON.parse(chapterData);
      console.log("chapter tree", chapterTree);

      // Load chapter tree and timelines
      this.props.chapterActions.loadChapterTree(chapterTree);
      this.props.timelineActions.loadTimelines(chapterTree);

      navigate("/layout");
    }
  }

  private async submitForm(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();

    let formData: FormData | undefined;
    let submitUrl = "/api/v1/document";
    let docBaseUrl = "";

    if (this.fileInput && this.fileInput.files) {
      const document = this.fileInput.files.item(0)!;

      formData = new FormData();
      formData.append("document", document, document.name);
    } else if (this.urlInput && this.urlInput.value) {
      submitUrl = "/api/v1/document?url=" + this.urlInput.value;
      docBaseUrl = this.urlInput.value.split("/").slice(0, -1).join("/") + "/";
    } else if (this.idInput && this.idInput.value) {
      this.props.documentActions.assignDocumentId(this.idInput.value, docBaseUrl);
      return;
    }

    this.setState({
      isLoading: true
    });

    // Submit form data and get new document ID
    const data = await makeRequest("POST", submitUrl, formData);
    const { documentId } = JSON.parse(data);
    console.log("document id:", documentId);

    // Assign document ID to local session
    this.setState({ isLoading: false });
    this.props.documentActions.assignDocumentId(documentId, docBaseUrl);
  }

  public render() {
    const { selectedMethod } = this.state;

    const boxStyle: React.CSSProperties = {
      width: "30vw",
      margin: "15% auto 0 auto",
      backgroundColor: "#EFEFEF",
      padding: 25,
      borderRadius: 15,
    };

    const onMethodUpdated = (ev: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedMethod = ev.target.value as "url" | "upload";

      this.setState({
        selectedMethod
      });
    };

    return (
      <div className="columnlayout">
        <div className="column-content" style={{width: "100%"}}>

          <div style={boxStyle}>
            <form className="column" onSubmit={this.submitForm.bind(this)}>
              <div className="field">
                <label className="label">Start session from</label>
                <div className="control">
                  <div className="select is-fullwidth is-info">
                    <select className="is-info" value={selectedMethod} onChange={onMethodUpdated.bind(this)}>
                      <option value="upload">File upload&emsp;&emsp;</option>
                      <option value="url">URL</option>
                      <option value="id">Document ID</option>
                    </select>
                  </div>
                </div>
              </div>

              {(selectedMethod === "url") ?
                <div className="field">
                  <label className="label">Document URL</label>
                  <div className="control">
                    <input key="url" className="input is-info" required={true} ref={(e) => this.urlInput = e} type="url" placeholder="URL" />
                  </div>
                </div>
              : (selectedMethod === "upload") ?
                <div className="field">
                  <label className="label">File</label>
                  <div className="control">
                    <input key="upload" className="input is-info" required={true} ref={(e) => this.fileInput = e} type="file" placeholder="File" />
                  </div>
                </div>
              :
                <div className="field">
                  <label className="label">Document ID</label>
                  <div className="control">
                    <div className="select is-fullwidth is-info">
                      <select key="id" ref={(e) => this.idInput = e} required={true}>
                        {this.state.existingDocuments.map((document, i) => {
                          return <option key={i} value={document.id}>{document.description}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                </div>
             }

              <div className="field" style={{marginTop: 25}}>
                <div className="control">
                  <button className={classNames("button", "is-info", {"is-loading": this.state.isLoading})}>
                    Continue
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>
      </div>
    );
  }
}

function mapStateToProps(state: ApplicationState): Partial<StartPageProps> {
  return {
    document: state.document
  };
}

function mapDispatchToProps(dispatch: Dispatch<any>): Partial<StartPageProps> {
  return {
    assetActions: bindActionCreators(assetActionCreators, dispatch),
    documentActions: bindActionCreators(documentActionCreators, dispatch),
    screenActions: bindActionCreators(screenActionCreators, dispatch),
    chapterActions: bindActionCreators(chapterActionCreators, dispatch),
    timelineActions: bindActionCreators(timelineActionCreators, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(StartPage);
