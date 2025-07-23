import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

export interface UpdateInfo {
  version: string;
  date: string;
  body: string;
  signature: string;
  url: string;
}

export interface UpdateStatus {
  available: boolean;
  current_version: string;
  latest_version?: string;
  update_info?: UpdateInfo;
}

export class UpdaterService {
  private static instance: UpdaterService;
  private updateListeners: ((status: UpdateStatus) => void)[] = [];
  private progressListeners: ((message: string) => void)[] = [];
  private errorListeners: ((error: string) => void)[] = [];

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): UpdaterService {
    if (!UpdaterService.instance) {
      UpdaterService.instance = new UpdaterService();
    }
    return UpdaterService.instance;
  }

  private async setupEventListeners() {
    try {
      // Listen for update progress events
      await listen('update_progress', (event) => {
        const message = event.payload as string;
        this.progressListeners.forEach(listener => listener(message));
      });

      // Listen for update error events
      await listen('update_error', (event) => {
        const error = event.payload as string;
        this.errorListeners.forEach(listener => listener(error));
      });
    } catch (error) {
      console.error('Failed to setup update event listeners:', error);
    }
  }

  /**
   * Check for available updates
   */
  public async checkForUpdates(): Promise<UpdateStatus> {
    try {
      const status = await invoke<UpdateStatus>('check_for_updates');
      this.updateListeners.forEach(listener => listener(status));
      return status;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      throw new Error(`Failed to check for updates: ${error}`);
    }
  }

  /**
   * Install available update
   */
  public async installUpdate(): Promise<void> {
    try {
      await invoke('install_update');
    } catch (error) {
      console.error('Failed to install update:', error);
      throw new Error(`Failed to install update: ${error}`);
    }
  }

  /**
   * Get current application version
   */
  public async getAppVersion(): Promise<string> {
    try {
      return await invoke<string>('get_app_version');
    } catch (error) {
      console.error('Failed to get app version:', error);
      throw new Error(`Failed to get app version: ${error}`);
    }
  }

  /**
   * Restart the application
   */
  public async restartApp(): Promise<void> {
    try {
      await invoke('restart_app');
    } catch (error) {
      console.error('Failed to restart app:', error);
      throw new Error(`Failed to restart app: ${error}`);
    }
  }

  /**
   * Subscribe to update status changes
   */
  public onUpdateStatusChange(listener: (status: UpdateStatus) => void): () => void {
    this.updateListeners.push(listener);
    return () => {
      const index = this.updateListeners.indexOf(listener);
      if (index > -1) {
        this.updateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to update progress events
   */
  public onUpdateProgress(listener: (message: string) => void): () => void {
    this.progressListeners.push(listener);
    return () => {
      const index = this.progressListeners.indexOf(listener);
      if (index > -1) {
        this.progressListeners.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to update error events
   */
  public onUpdateError(listener: (error: string) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Check for updates automatically on startup
   */
  public async checkForUpdatesOnStartup(): Promise<UpdateStatus | null> {
    try {
      // Only check for updates in production builds
      if (process.env.NODE_ENV === 'development') {
        console.log('Skipping update check in development mode');
        return null;
      }

      console.log('Checking for updates on startup...');
      const status = await this.checkForUpdates();
      
      if (status.available) {
        console.log(`Update available: ${status.latest_version}`);
      } else {
        console.log('No updates available');
      }
      
      return status;
    } catch (error) {
      console.error('Failed to check for updates on startup:', error);
      return null;
    }
  }
}
