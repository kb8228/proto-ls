import { Config } from './Config';
// import * as fm from './lib/Libraries/fm.liveswitch.js'
import fmLiveswitch from './lib/Libraries/fm.liveswitch';

export class HelloWorldLogic {
  constructor() {
    this.applicationId = Config.applicationId;
    this.channelId = Config.channelId;
    this.gatewayUrl = Config.gatewayUrl;
    this.sharedSecret = Config.sharedSecret;

    // Log to console
    fmLiveswitch.Log.registerProvider(new fmLiveswitch.ConsoleLogProvider(fmLiveswitch.LogLevel.Debug));
  }

  static getInstance = () => {
    if (HelloWorldLogic.instance == null) {
      HelloWorldLogic.instance = new HelloWorldLogic();
    }
    return HelloWorldLogic.instance;
  };

  joinAsync = () => {
    var promise = new fmLiveswitch.Promise();
    // Create a client
    this.client = new fmLiveswitch.Client(this.gatewayUrl, this.applicationId);
    // Write registration state to log
    this.client.addOnStateChange(() => { return fmLiveswitch.Log.debug("Client is " + new fmLiveswitch.ClientStateWrapper(this.client.getState()) + "."); });
    // Generate a token (do this on the server to avoid exposing your shared secret).
    var token = fmLiveswitch.Token.generateClientRegisterToken(this.applicationId, this.client.getUserId(), this.client.getDeviceId(), this.client.getId(), null, [new fmLiveswitch.ChannelClaim(this.channelId)], this.sharedSecret);
    // Register client with token
    this.client.register(token)
      .then((channels) => {
        this.onClientRegistered(channels);
        promise.resolve(null);
      })
      .fail((ex) => {
        fmLiveswitch.Log.error("Failed to register with Gateway.");
        promise.reject(ex);
      });
    return promise;
  };

  onClientRegistered(channels) {
    // Store our channel reference
    this.channel = channels[0];
    var msg = "Client " + this.client.getId() + " has successfully connected to channel " + this.channel.getId() + ", Hello World!";
    fmLiveswitch.Log.debug(msg);
    this.displayMessage(msg);
  };
};
