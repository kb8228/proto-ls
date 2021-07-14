import { Config } from './Config';
import fmLiveswitch from './lib/Libraries/fm.liveswitch';

export class HelloWorldLogic {
  constructor() {
    this.applicationId = Config.applicationId;
    this.channelId = Config.channelId;
    this.gatewayUrl = Config.gatewayUrl;
    this.sharedSecret = Config.sharedSecret;

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
    // Store our channel reference
    this.channel = channels[0];
    var msg = "Client " + this.client.getId() + " has successfully connected to channel " + this.channel.getId() + ", Hello World!";
    fmLiveswitch.Log.debug(msg);
    this.displayMessage(msg);
  };
};
