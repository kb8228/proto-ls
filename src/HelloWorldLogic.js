import { Config } from '../Config';
import fm from './lib/Libraries/fm.liveswitch.js'

export class HelloWorldLogic {
  constructor() {
    // </SingletonPattern>
    this.applicationId = Config.applicationId;
    this.channelId = Config.channelId;
    this.gatewayUrl = Config.gatewayUrl;
    this.sharedSecret = Config.sharedSecret;
    // Log to console
    // fm.liveswitch.Log.registerProvider(new fm.liveswitch.ConsoleLogProvider(fm.liveswitch.LogLevel.Debug));
  }
  static getInstance = () => {
    if (HelloWorldLogic.instance == null) {
      HelloWorldLogic.instance = new HelloWorldLogic();
    }
    return HelloWorldLogic.instance;
  };
  static joinAsync = () => {
    var promise = new fm.liveswitch.Promise();
    // Create a client
    this.client = new fm.liveswitch.Client(this.gatewayUrl, this.applicationId);
    // Write registration state to log
    this.client.addOnStateChange(function () { return fm.liveswitch.Log.debug("Client is " + new fm.liveswitch.ClientStateWrapper(this.client.getState()) + "."); });
    // Generate a token (do this on the server to avoid exposing your shared secret).
    var token = fm.liveswitch.Token.generateClientRegisterToken(this.applicationId, this.client.getUserId(), this.client.getDeviceId(), this.client.getId(), null, [new fm.liveswitch.ChannelClaim(this.channelId)], this.sharedSecret);
    // Register client with token
    this.client.register(token)
      .then(function (channels) {
        this.onClientRegistered(channels);
        promise.resolve(null);
      })
      .fail(function (ex) {
        fm.liveswitch.Log.error("Failed to register with Gateway.");
        promise.reject(ex);
      });
    return promise;
  };
  static onClientRegistered = (channels) => {
    // Store our channel reference
    this.channel = channels[0];
    var msg = "Client " + this.client.getId() + " has successfully connected to channel " + this.channel.getId() + ", Hello World!";
    fm.liveswitch.Log.debug(msg);
    this.displayMessage(msg);
  };
};
