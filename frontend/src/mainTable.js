import React, { Component } from "react";
import { Grid, Button, Progress, Header, Dropdown } from "semantic-ui-react";
import { useState, useEffect } from "react";
import { connect } from "react-redux";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";
import axios from "axios";
import { useAlert } from "react-alert";
import { Icon, Label, Menu, Table } from "semantic-ui-react";

class mainTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      api: "https://c4r8tzi2r4.execute-api.us-east-1.amazonaws.com/dev",
      scanApi: "https://0opz07581b.execute-api.us-east-1.amazonaws.com/dev",
      payload: {
        sourceLanguage: "",
        fileName: "",
        targetLanguage: "",
        username: "",
      },
      statusPayload: { username: "" },
      options: [
        { value: "en", label: "US English" },
        { value: "fr", label: "French" },
        { value: "es", label: "Spanish" },
        { value: "de", label: "German" },
      ],
      showUploadForm : 'false'
    };

    this.onChange = this.onChange.bind(this);
    this.sourceLanguageChosen = this.sourceLanguageChosen.bind(this);
    this.callApi = this.callApi.bind(this);
    this.argetLanguageChosen = this.argetLanguageChosen.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.showAlert = this.showAlert.bind(this);
    this.toggleUploadStatusi = this.toggleUploadStatus.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.downloadData = this.downloadData.bind(this);
    this.showTable = this.showTable.bind(this);
    this.refreshPage = this.refreshPage.bind(this);
    this.callApi = this.callApi.bind(this);
  }



  onChange(e) {
     let file = e.target.files[0];
  }

  sourceLanguageChosen(option) {
    payload["sourceLanguage"] = option.value;
    console.log("Source Language ", option.value);
  }


  callApi() {
    console.log("payload");
    console.log(payload);
    Auth.currentSession().then((data) => {
      payload["username"] = data["accessToken"]["payload"]["username"];
      axios
        .post(api, payload)
        .then((response) => {
          let job_name = response["data"]["body"];
          console.log("response");
          console.log(response);
          statusPayload["job_name"] = job_name.substring(
            1,
            job_name.length - 1
          );
          console.log(statusPayload["job_name"]);
          let newJob = jobState.jobs.slice();
          newJob.push({
            username: payload["username"],
            fileName: payload["fileName"],
            job_name: job_name.substring(1, job_name.length - 1),
            status: "In progress",
            transcriptionUrl: " ",
            translateKey: " ",
            sourceLanguage: payload["sourceLanguage"],
            targetLanguage: payload["targetLanguage"],
          });
          updateJobState({
            jobs: newJob,
          });
          toggleUploadStatus();
        })
        .catch((error) => {
          console.log(error);
        });
    });
  }

  targetLanguageChosen(option) {
    payload["targetLanguage"] = option.value;
    console.log("Target Language ", option.value);
  }

  async onSubmit() {
    try {
      await Storage.put(file.name, file, {
        progressCallback(progress) {
          console.log(`Uploaded: (${progress.loaded}/${progress.total})`);
        },
      });
      payload.fileName = file.name;
      console.log("Calling api...");
      callApi();
    } catch (err) {
      console.log("Error uploading file: ", err);
    }
  }


  showAlert() {
    axios
      .post(scanApi, statusPayload)
      .then((response) => {
        const alert = useAlert()
        alert.show(response["data"]["body"]);
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  toggleUploadStatus() {
    updateUploadFormStatus({
      showUploadForm: !showUploadFormStatus.showUploadForm,
    });
  }

  fetchData() {
    Auth.currentSession().then((data) => {
      statusPayload["username"] = data["accessToken"]["payload"]["username"];
      console.log(statusPayload["username"]);
      axios
        .post(scanApi, statusPayload)
        .then((response) => {
          let newJob = JSON.parse(response["data"]["body"]);
          newJob = newJob["Items"];
          console.log(newJob);
          updateJobState({
            jobs: newJob,
          });
        })
        .catch((error) => {
          console.log(error);
        });
    });
  }

  async downloadData(key) {
    const signedURL = await Storage.get(key);
    console.log(signedURL);
    let a = document.createElement("a");
    a.href = signedURL;
    a.download = "key";
    a.click();
  }

  showTable() {
    const newRows = jobState.jobs.map((job) => {
      let tokens = job.transcriptionUrl.split("/").slice(4);
      const transcribeKey = tokens.join("/");
      tokens = job.translateKey.split("/").slice(1);
      const translateKey = tokens.join("/");
      return (
        <Table.Row>
          <Table.Cell> {job.fileName} </Table.Cell>
          <Table.Cell>{job.sourceLanguage}</Table.Cell>
          <Table.Cell>{job.targetLanguage}</Table.Cell>
          <Table.Cell> {job.status} </Table.Cell>
          <Table.Cell>
            {" "}
            {job.transcriptionUrl != " " ? (
              <Button onClick={() => downloadData(transcribeKey)}>
                {" "}
                Download
              </Button>
            ) : (
              "In progress"
            )}
          </Table.Cell>
          <Table.Cell>
            {" "}
            {job.translateKey != " " ? (
              <Button onClick={() => downloadData(translateKey)}>
                {" "}
                Download
              </Button>
            ) : (
              "In progress"
            )}
          </Table.Cell>
        </Table.Row>
      );
    });
    return newRows;
  }

    //useEffect(() => {
    //fetchData()
    //}, [])

  refreshPage() {
    window.location.reload(false);
  }

  render() {
    return (
      <Grid style={{ width: "100vw", height: "100vh" }}>
        <Grid.Row style={{ width: "100vw", height: "100vh" }}>
          <Grid.Column style={{ width: "100vw", height: "100vh" }}>
            {currentLoginState !== "signedIn" && (
              /* Login component options:
               * [animateTitle: true, false]
               * [type: "video", "image", "static"]
               * [title: string]
               * [darkMode (changes font/logo color): true, false]
               * */
              <Login
                animateTitle={true}
                type={"video"}
                title={"Transcribe & Translate"}
                darkMode={true}
              />
            )}
            {this.props.currentLoginState === "signedIn" &&
              (showUploadFormStatus.showUploadForm ? (
                <div className="UploadForm">
                  <p>
                    <Header as="h4" inverted color="grey">
                      Translate from
                    </Header>
                    <Dropdown
                      search
                      fluid
                      options={options}
                      onChange={_sourceLanguageChosen}
                      placeholder="Choose from dropdown"
                    />
                  </p>
                  <p>
                    <Header as="h4" inverted color="grey">
                      Translate to:
                    </Header>
                    <Dropdown
                      search
                      fluid
                      options={options}
                      onChange={_targetLanguageChosen}
                      placeholder="Choose from dropdown"
                    />
                  </p>
                  <p>
                    <input
                      type="file"
                      onChange={onChange}
                      className="InputFileButton"
                    />
                  </p>
                  {status.showStatus ? (
                    <p>
                      <Button onClick={showAlert} className="InputFileButton">
                        Check Status
                      </Button>
                    </p>
                  ) : null}
                  <p>
                    <Button onClick={onSubmit} className="InputFileButton">
                      Submit
                    </Button>{" "}
                    <Button
                      onClick={toggleUploadStatus}
                      className="InputFileButton"
                    >
                      Go back
                    </Button>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="TableView">
                    <Table
                      celled
                      class="ui inverted black table"
                      className="Table"
                    >
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell>File Name</Table.HeaderCell>
                          <Table.HeaderCell>Source Language</Table.HeaderCell>
                          <Table.HeaderCell>Target Language</Table.HeaderCell>
                          <Table.HeaderCell>Status</Table.HeaderCell>
                          <Table.HeaderCell>Transcription</Table.HeaderCell>
                          <Table.HeaderCell>Translation</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>

                      <Table.Body>{showTable()}</Table.Body>
                      <Table.Footer>
                        <Table.Row>
                          <Table.HeaderCell colSpan="1">
                            <Menu floated="right" pagination>
                              <Menu.Item as="a" icon>
                                <Icon name="chevron left" />
                              </Menu.Item>
                              <Menu.Item as="a">1</Menu.Item>
                              <Menu.Item as="a">2</Menu.Item>
                              <Menu.Item as="a">3</Menu.Item>
                              <Menu.Item as="a">4</Menu.Item>
                              <Menu.Item as="a" icon>
                                <Icon name="chevron right" />
                              </Menu.Item>
                            </Menu>
                          </Table.HeaderCell>
                        </Table.Row>
                      </Table.Footer>
                    </Table>
                    <p className="MenuBar">
                      <Button
                        className="InputFileButton"
                        onClick={toggleUploadStatus}
                      >
                        Upload File
                      </Button>{" "}
                      <Button className="InputFileButton" onClick={refreshPage}>
                        Refresh
                      </Button>{" "}
                      <Button onClick={onSignOut} className="InputFileButton">
                        Sign Out
                      </Button>
                    </p>
                  </div>
                </div>
              ))}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}
