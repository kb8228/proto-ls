import { Config } from './Config';
import fmLiveswitch from 'fm.liveswitch';

export class HelloWorldLogic {
  constructor() {
    this.applicationId = Config.applicationId;
    this.channelId = Config.channelId;
    this.gatewayUrl = Config.gatewayUrl;
    this.sharedSecret = Config.sharedSecret;
    this.upstreamConnection = undefined;
    this.downstreamConnections = {};

    this.reRegisterBackoff = 200;
    this.maxRegisterBackoff = 60000;
    // Log to console
    fmLiveswitch.Log.registerProvider(new fmLiveswitch.ConsoleLogProvider(fmLiveswitch.LogLevel.Debug));
  }

  static getInstance = () => {
    if (HelloWorldLogic.instance == null) {
      HelloWorldLogic.instance = new HelloWorldLogic();
    }
    return HelloWorldLogic.instance;
  };

  #registerClient = (token, promise) => {
    // Register client with token.
    this.client.register(token)
      .then(channels => {
        // Reset re-register backoff after successful registration.
        this.reRegisterBackoff = 200;
        this.onClientRegistered(channels);
        promise.resolve(null);
      })
      .fail(ex => {
        fmLiveswitch.Log.error("Failed to register with Gateway.");
        promise.reject(ex)
      });
  }

  joinAsync = () => {
    var promise = new fmLiveswitch.Promise();
    // Create a client
    this.client = new fmLiveswitch.Client(this.gatewayUrl, this.applicationId);
    // Write registration state to log
    this.client.addOnStateChange(() => { return fmLiveswitch.Log.debug("Client is " + new fmLiveswitch.ClientStateWrapper(this.client.getState()) + "."); });
    // Generate a token (do this on the server to avoid exposing your shared secret).
    var token = fmLiveswitch.Token.generateClientRegisterToken(this.applicationId, this.client.getUserId(), this.client.getDeviceId(), this.client.getId(), null, [new fmLiveswitch.ChannelClaim(this.channelId)], this.sharedSecret);
    
    this.unregistering = false;

    this.client.addOnStateChange(() => {
      // Write registration state to log.
      fmLiveswitch.Log.debug(`Client is ${new fmLiveswitch.ClientStateWrapper(this.client.getState())}.`);

      if (this.client.getState() === fmLiveswitch.ClientState.Unregistered && !this.unregistering) {
        fmLiveswitch.Log.debug(`Registering with backoff = ${this.reRegisterBackoff}.`);
        this.displayMessage("Client unregistered unexpectedly, trying to re-register.");

        // Re-register after a backoff.
        setTimeout(() => {
          // Incrementally increase register backoff to prevent runaway process.
          if (this.reRegisterBackoff <= this.maxRegisterBackoff) {
            this.reRegisterBackoff += this.reRegisterBackoff;
          }

          this.#registerClient(token, promise);

        }, this.reRegisterBackoff);
      }
    });

    this.#registerClient(token, promise);

    return promise;
  };

  leaveAsync = () => {
    // Disable re-register.
    this.unregistering = true;
    return this.client.unregister()
      .then(() => this.displayMessage(`Client ${this.client.getId()} has successfully unregistered from channel ${this.channel.getId()}.`))
      .fail(() => fmLiveswitch.Log.error("Unregistration failed."));
  }

  onClientRegistered(channels) {
    // Store our channel reference.
    this.channel = channels[0];
    this.displayMessage(`Client ${this.client.getId()} has successfully connected to channel ${this.channel.getId()}, Hello World!`);

    // Open a new SFU upstream connection.
    this.upstreamConnection = this.openSfuUpstreamConnection(this.localMedia);

    // Open a new SFU downstream connection when a remote upstream connection is opened.
    this.channel.addOnRemoteUpstreamConnectionOpen(remoteConnectionInfo => this.openSfuDownstreamConnection(remoteConnectionInfo));
  };

  startLocalMedia() {
    this.layoutManager = new fmLiveswitch.DomLayoutManager(document.getElementById("my-container"));
    const promise = new fmLiveswitch.Promise();

    if (this.localMedia == null) {
      // Create local media with audio and video enabled.
      const audioEnabled = true;
      const videoEnabled = true;
      this.localMedia = new fmLiveswitch.LocalMedia(audioEnabled, videoEnabled);

      // Set local media in the layout.
      this.layoutManager.setLocalMedia(this.localMedia);
    }

    // Start capturing local media.
    this.localMedia.start()
      .then(() => {
        fmLiveswitch.Log.debug("Media capture started.");
        promise.resolve(null);
      })
      .fail(ex => {
        fmLiveswitch.Log.error(ex.message);
        promise.reject(ex);
      });

    return promise;
  }

  stopLocalMedia() {
    const promise = new fmLiveswitch.Promise();

    // Stop capturing local media.
    this.localMedia.stop()
      .then(() => {
        fmLiveswitch.Log.debug("Media capture stopped.");
        promise.resolve(null);
      })
      .fail(ex => {
        fmLiveswitch.Log.error(ex.message);
        promise.reject(ex);
      });

    return promise;
  }

  openSfuUpstreamConnection(localMedia: fm.liveswitch.LocalMedia) {
    // Create audio and video streams from local media.
    const audioStream = new fm.liveswitch.AudioStream(localMedia);
    const videoStream = new fm.liveswitch.VideoStream(localMedia);

    // Create a SFU upstream connection with local audio and video.
    const connection = this.channel.createSfuUpstreamConnection(audioStream, videoStream);

    connection.addOnStateChange(conn => {
      fm.liveswitch.Log.debug(`Upstream connection is ${new fm.liveswitch.ConnectionStateWrapper(conn.getState()).toString()}.`);
    });

    connection.open();
    return connection;
  }

  openSfuDownstreamConnection(remoteConnectionInfo) {
    // Create remote media.
    const remoteMedia = new fm.liveswitch.RemoteMedia();
    const audioStream = new fm.liveswitch.AudioStream(remoteMedia);
    const videoStream = new fm.liveswitch.VideoStream(remoteMedia);

    // Add remote media to the layout.
    this.layoutManager.addRemoteMedia(remoteMedia);

    // Create a SFU downstream connection with remote audio and video.
    const connection = this.channel.createSfuDownstreamConnection(remoteConnectionInfo, audioStream, videoStream);

    // Store the downstream connection.
    this.downstreamConnections[connection.getId()] = connection;

    connection.addOnStateChange(conn => {
      fm.liveswitch.Log.debug(`Downstream connection is ${new fm.liveswitch.ConnectionStateWrapper(conn.getState()).toString()}.`);

      // Remove the remote media from the layout and destroy it if the remote is closed.
      if (conn.getRemoteClosed()) {
        delete this.downstreamConnections[connection.getId()];
        this.layoutManager.removeRemoteMedia(remoteMedia);
        remoteMedia.destroy();
      }
    });

    connection.open();
    return connection;
  }

  toggleMuteLocalAudio() {
    // Retrieve and update the config of the upstream connection.
    const config = this.upstreamConnection.getConfig();
    config.setLocalAudioMuted(!config.getLocalAudioMuted());
    return this.upstreamConnection.update(config);
  }

  toggleMuteLocalVideo() {
    // Retrieve and update the config of the upstream connection.
    const config = this.upstreamConnection.getConfig();
    config.setLocalVideoMuted(!config.getLocalVideoMuted());
    return this.upstreamConnection.update(config);
  }

  toggleDisableRemoteAudio() {
    // Retrieve and update the config of each of the downstream connections.
    for (const id in this.downstreamConnections) {
      const connection = this.downstreamConnections[id];
      const config = connection.getConfig();
      config.setRemoteAudioDisabled(!config.getRemoteAudioDisabled());
      connection.update(config);
    }
  }

  toggleDisableRemoteVideo() {
    // Retrieve and update the config of each of the downstream connections.
    for (const id in this.downstreamConnections) {
      const connection = this.downstreamConnections[id];
      const config = connection.getConfig();
      config.setRemoteVideoDisabled(!config.getRemoteVideoDisabled());
      connection.update(config);
    }
  }
};
