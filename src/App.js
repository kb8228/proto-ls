import { useEffect, useState } from 'react';
import { HelloWorldLogic } from './HelloWorldLogic';

import './App.css';

function App() {
  const [app,setApp] = useState(null);

  const [joined, setJoined] = useState(false);

  const handleJoinClick = () => {
    app.startLocalMedia().then(() => {
      loadInputs();

      app.joinAsync().then(() => {
        setJoined(true);
      });
    });
  };

  const handleLeaveClick = () => {
    app.stopLocalMedia().then(() => {         
      app.leaveAsync().then(() => {
        clearInputs();
        setJoined(false);
      });
    });
  };
  
  useEffect(() => {
    const appInstance = HelloWorldLogic.getInstance();

    appInstance.displayMessage = msg => {
        const textContainer = document.getElementById("text-container");
        textContainer.appendChild(document.createTextNode(msg));
        textContainer.appendChild(document.createElement("br"));
      };

    appInstance.saveFile = (fileName, data) => {
      // Prompt the user to download the file.
      if (prompt(`You've received a file from this channel, do you wish to download ${fileName}?`) === true) {
        const file = new Blob([data]);

        if (window.navigator.msSaveOrOpenBlob) {
          // For IE.
          window.navigator.msSaveOrOpenBlob(file, fileName);
        } else {
          // For other browsers.
          const anchor = document.createElement("a");
          const url = URL.createObjectURL(file);
          anchor.href = url;
          anchor.download = fileName;
          document.body.appendChild(anchor);
          anchor.click();
          setTimeout(() => {
            document.body.removeChild(anchor);
            window.URL.revokeObjectURL(url);
          }, 0);
        }
      }
    };

    setApp(HelloWorldLogic.getInstance());
  }, [])
  // <Share Screen>
  //const screenShareToggleBtn: HTMLButtonElement = document.getElementById("screenshare-toggle-btn") as HTMLButtonElement;
  //screenShareToggleBtn.onclick = () => app.toggleScreenSharing();
  //app.localScreenMedia.addOnVideoStarted(() => {
  //    app.localScreenMedia.getVideoTrack().addOnStopped(() => {
  //        app.toggleScreenSharing();
  //    });
  //})
  // </Share Screen>
  // <Text Chat>
  //const sendMessageBtn: HTMLButtonElement = document.getElementById("send-message-btn") as HTMLButtonElement;
  //sendMessageBtn.onclick = () => {
  //    const inputbox: HTMLButtonElement = document.getElementById("inputbox") as HTMLButtonElement;
  //    const msg: string = inputbox.value;
  //    if (msg != null && msg.length > 0) {
  //        inputbox.value = "";
  //        app.sendMessage(msg);
  //    }
  //}
  // </Text Chat>
  // <File Transfer>
  //const uploadFileBtn: HTMLButtonElement = document.getElementById("upload-file-btn") as HTMLButtonElement;
  //const fileInput: HTMLInputElement = document.getElementById("fileId") as HTMLInputElement;
  //uploadFileBtn.onclick = () => fileInput.click();
  //fileInput.onchange = (e) => {
  //    const file = (e.target as HTMLInputElement).files[0];
  //    if (!file) {
  //        return;
  //    }
  //    // Read the file to an array buffer and send it through the data channel.
  //    const reader = new FileReader();
  //    reader.onload = (e) => {
  //        const contents = new Uint8Array(e.target.result as ArrayBuffer);
  //        app.sendFile(file.name, contents);
  //        alert(`You've sent ${file.name} to the channel!`);
  //    };
  //    reader.readAsArrayBuffer(file);
  //}
  // </File Transfer>
  // <broadcast>
  //const broadcastBtn: HTMLButtonElement = document.getElementById("broadcast-btn") as HTMLButtonElement;
  //const receiveBtn: HTMLButtonElement = document.getElementById("receive-btn") as HTMLButtonElement;
  //broadcastBtn.onclick = () => startAs(new Broadcaster());
  //receiveBtn.onclick = () => startAs(new Receiver());
  //function startAs(participant: Participant) {
  //    // Start capturing local media (broadcaster only).
  //    participant.start().then(() => {
  //        // Register and establish connection.
  //        participant.joinAsync().then(() => {
  //            joinBtn.disabled = true;
  //            broadcastBtn.disabled = true;
  //            receiveBtn.disabled = true;
  //        });
  //    });
  //}
  // </broadcast>
  // <Mute Streams>
  let muteButtonText = "Mute Audio";
  let muteVideoButtonText = "Mute Video";

  handleMute = () => {
    app.toggleMuteLocalAudio().then(() => {
      muteButtonText = (app.localMedia.getAudioMuted()) ? "Unmute Audio" : "Mute Audio";
    });
  };
  handleMuteVideo = () => {
    app.toggleMuteLocalVideo().then(() => {
      muteVideoButtonText = (app.localMedia.getVideoMuted()) ? "Unmute Video" : "Mute Video";
    });
  };

  let disableRemoteAudioBtn = document.getElementById("disable-remote-audio-btn");
  let disableRemoteVideoBtn = document.getElementById("disable-remote-video-btn");

  disableRemoteAudioBtn.onclick = () => {
     app.toggleDisableRemoteAudio();
     disableRemoteAudioBtn.innerText = (disableRemoteAudioBtn.innerText.indexOf("Disable") !== -1) ? "Enable Remote Audio" : "Disable Remote Audio";
  };
  disableRemoteVideoBtn.onclick = () => {
     app.toggleDisableRemoteVideo();
     disableRemoteVideoBtn.innerText = (disableRemoteVideoBtn.innerText.indexOf("Disable") !== -1) ? "Enable Remote Video" : "Disable Remote Video";
  };
  // <Mute Streams>


  function loadInputs() {// <Change Devices>
    // app.getAudioInputs().then(audioInputs => {
    //    const selectBox = document.getElementById("audioInputs");
    //    for (const input of audioInputs) {
    //        const option = document.createElement("option");
    //        option.text = input.getName();
    //        selectBox.add(option);
    //    }
    //    selectBox.onchange = () => app.setAudioInput(audioInputs[selectBox.selectedIndex]);
    // });
    // app.getVideoInputs().then(videoInputs => {
    //    const selectBox = document.getElementById("videoInputs");
    //    for (const input of videoInputs) {
    //        const option = document.createElement("option");
    //        option.text = input.getName();
    //        selectBox.add(option);
    //    }
    //    selectBox.onchange = () => app.setVideoInput(videoInputs[selectBox.selectedIndex]);
    // });
    // app.getAudioOutputs().then(audioOutputs => {
    //    const selectBox = document.getElementById("audioOutputs");
    //    for (const output of audioOutputs) {
    //        const option = document.createElement("option");
    //        option.text = output.getName();
    //        selectBox.add(option);
    //    }
    //    selectBox.onchange = () => app.setAudioOutput(audioOutputs[selectBox.selectedIndex]);
    // });
    // </Change Devices>
  }

  function clearInputs() {// // Remove the lists of available devices
  //   // removeOptions(document.getElementById("audioInputs")
  //   // removeOptions(document.getElementById("videoInputs")
  //   // removeOptions(document.getElementById("audioOutputs")
  // }

  // function removeOptions(selectElement) {
  //   const length = selectElement.options.length - 1;

  //   for (let i = length; i >= 0; i--) {
  //     selectElement.remove(i);
  //   }
  }

  const joinBtnDisplay = joined ? "none" : "inline-block";
  const leaveBtnDisplay = joined ? "inline-block" : "none";

  return (
    <div className="App">
      <div style={{ float: 'left' }}>
        <div id="my-container" style={{ width:"800px", height:"600px" }}></div>
        <div style={{ float: 'left', marginTop: "5px" }}>
          <label htmlFor="audioInputs">Audio Inputs:</label>
          <select id="audioInputs" style={{ margin: "2px" }}>
          </select>
          <br />
          <label htmlFor="videoInputs">Video Inputs:</label>
          <select id="videoInputs" style={{ margin: "2px" }}>
          </select>
          <br />
          <label htmlFor="audioOutputs">Audio Outputs:</label>
          <select id="audioOutputs" style={{ margin: "2px" }}>
          </select>
          <br />
          <button type="button" id="mute-audio-btn" style={{ margin: "2px", marginTop: "10px" }} onClick={handleMute}>{muteButtonText}</button>
          <button type="button" id="disable-remote-audio-btn" style={{ margin: "2px" }}>Disable Remote Audio</button>
          <br />
          <button type="button" id="mute-video-btn" style={{ margin: "2px" }} onClick={handleMuteVideo}>{muteVideoButtonText}</button>
          <button type="button" id="disable-remote-video-btn" style={{ margin: "2px" }}>Disable Remote Video</button>
        </div>
        <div style={{ marginLeft: "50%" }}>
          <button type="button" id="join-btn" style={{ margin: "2px", display: joinBtnDisplay }} onClick={handleJoinClick}>Join</button>
          <button type="button" id="leave-btn" style={{ margin: "2px", display: leaveBtnDisplay }} onClick={handleLeaveClick}>Leave</button>
          <button type="button" id="broadcast-btn" style={{ margin: "2px" }}>Broadcast</button>
          <button type="button" id="receive-btn" style={{ margin: "2px" }}>Receive</button>
          <br />
          <button type="button" id="screenshare-toggle-btn" style={{ margin: "2px" }}>Toggle ScreenShare</button>
        </div>
      </div>
      <div style={{ marginLeft: "810px" }}>
        <div id="text-container"
          style={{ boxSizing: "border-box", width: "400px", height: "600px", border: "1px solid black", padding: "5px" }}></div>
        <div style={{ marginTop: "5px", width: "100%" }}>
          <div style={{ float: 'left', width: "70%" }}>
            <input type="text" id="inputbox"
              style={{ boxSizing: "border-box", width: "100%", height: "30px", border: "1px solid black", padding: "4px" }} />
        </div>
            <div style={{ marginLeft: "71%" }}>
              <button type="button" id="send-message-btn"
                style={{ width: "70%", height: "30px", verticalAlign: "top" }}>Send</button>
              <button type="button" id="upload-file-btn" style={{ width: "25%", height: "30px" }}>????</button>
              <input type="file" id="fileId" style={{ display:"none" }}/>
        </div>
        </div>
      </div>
    </div>
  );
}

export default App;
