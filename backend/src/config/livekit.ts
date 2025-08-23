import { AccessToken } from 'livekit-server-sdk';

interface LiveKitConfig {
  apiKey: string;
  apiSecret: string;
  url: string;
}

class LiveKitConfiguration {
  private static instance: LiveKitConfiguration;
  private cloudConfig: LiveKitConfig;
  private selfHostedConfig: LiveKitConfig;

  private constructor() {
    // Cloud configuration
    this.cloudConfig = {
      // Support both LIVEKIT_CLOUD_* and generic LIVEKIT_* envs
      apiKey: process.env.LIVEKIT_CLOUD_API_KEY || process.env.LIVEKIT_API_KEY || '',
      apiSecret: process.env.LIVEKIT_CLOUD_API_SECRET || process.env.LIVEKIT_API_SECRET || '',
      url: process.env.LIVEKIT_CLOUD_URL || process.env.LIVEKIT_URL || ''
    };

    // Self-hosted configuration
    this.selfHostedConfig = {
      apiKey: process.env.LIVEKIT_SELF_API_KEY || '',
      apiSecret: process.env.LIVEKIT_SELF_API_SECRET || '',
      url: process.env.LIVEKIT_SELF_URL || ''
    };

    // Validate configuration
    this.validateConfig();
  }

  private validateConfig() {
    const missingCloudVars: string[] = [];

    // Check cloud config only
    if (!this.cloudConfig.apiKey) missingCloudVars.push('LIVEKIT_CLOUD_API_KEY');
    if (!this.cloudConfig.apiSecret) missingCloudVars.push('LIVEKIT_CLOUD_API_SECRET');
    if (!this.cloudConfig.url) missingCloudVars.push('LIVEKIT_CLOUD_URL');

    // Log warnings for missing variables
    if (missingCloudVars.length > 0) {
      console.warn('⚠️ Missing LiveKit Cloud configuration:', missingCloudVars.join(', '));
      console.warn('   Video conferencing feature will be disabled');
    } else {
      console.log('✅ LiveKit Cloud configuration found');
    }
  }

  public static getInstance(): LiveKitConfiguration {
    if (!LiveKitConfiguration.instance) {
      LiveKitConfiguration.instance = new LiveKitConfiguration();
    }
    return LiveKitConfiguration.instance;
  }

  public getConfig(isCloud: boolean): LiveKitConfig {
    return isCloud ? this.cloudConfig : this.selfHostedConfig;
  }

  public async generateToken(params: {
    userId: string;
    userName: string;
    roomName: string;
    isCloud: boolean;
    metadata?: string;
  }): Promise<string> {
    const config = this.getConfig(params.isCloud);
    
    if (!config.apiKey || !config.apiSecret) {
      throw new Error(`LiveKit ${params.isCloud ? 'Cloud' : 'Self-hosted'} configuration is missing`);
    }

    const at = new AccessToken(config.apiKey, config.apiSecret, {
      identity: params.userId,
      name: params.userName,
      metadata: params.metadata
    });

    at.addGrant({
      room: params.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    return await at.toJwt();
  }

  public getServerUrl(isCloud: boolean): string {
    const config = this.getConfig(isCloud);
    if (!config.url) {
      throw new Error(`LiveKit ${isCloud ? 'Cloud' : 'Self-hosted'} URL is missing`);
    }
    return config.url;
  }
}

export const livekitConfig = LiveKitConfiguration.getInstance(); 