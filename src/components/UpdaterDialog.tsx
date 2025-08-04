import React, { useState, useEffect } from 'react';
import { UpdaterService, UpdateStatus } from '../services/updaterService';
import { Dialog, DialogContent, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { YarnLogo } from '@/components/v0-components/yarn-logo';
import { V0ModalHeader } from '@/components/v0-components/composition-patterns';
import { Loader2, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface UpdaterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  updateStatus?: UpdateStatus;
}

export const UpdaterDialog: React.FC<UpdaterDialogProps> = ({
  isOpen,
  onClose,
  updateStatus
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState<string>('');
  const [installError, setInstallError] = useState<string>('');
  const [installSuccess, setInstallSuccess] = useState(false);
  const updaterService = UpdaterService.getInstance();

  useEffect(() => {
    // Subscribe to update progress and error events
    const unsubscribeProgress = updaterService.onUpdateProgress((message) => {
      setInstallProgress(message);
    });

    const unsubscribeError = updaterService.onUpdateError((error) => {
      setInstallError(error);
      setIsInstalling(false);
    });

    return () => {
      unsubscribeProgress();
      unsubscribeError();
    };
  }, [updaterService]);

  const handleInstallUpdate = async () => {
    if (!updateStatus?.available) return;

    setIsInstalling(true);
    setInstallError('');
    setInstallProgress('Preparing to install update...');

    try {
      await updaterService.installUpdate();
      setInstallSuccess(true);
      setInstallProgress('Update installed successfully! Restart required.');
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : 'Failed to install update');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRestartApp = async () => {
    try {
      await updaterService.restartApp();
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : 'Failed to restart application');
    }
  };

  const handleClose = () => {
    if (!isInstalling) {
      onClose();
    }
  };

  const formatReleaseNotes = (body: string) => {
    // Simple markdown-like formatting for release notes
    return body
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('## ')) {
          return <h3 key={index} className="font-serif font-semibold text-xl mt-4 mb-2">{line.slice(3)}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="ml-4">{line.slice(2)}</li>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="mb-2">{line}</p>;
      });
  };

  if (!updateStatus) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <V0ModalHeader
          title={updateStatus.available ? 'Update Available' : 'No Updates Available'}
          description={
            updateStatus.available 
              ? `A new version of Project Yarn is available.`
              : 'You are running the latest version of Project Yarn.'
          }
          icon={<YarnLogo className="w-5 h-5" />}
          badge={updateStatus.available && updateStatus.latest_version ? (
            <Badge variant="default" className="ml-2">{updateStatus.latest_version}</Badge>
          ) : undefined}
        />

        <div className="space-y-4">
          {/* Version Information */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Version</p>
              <Badge variant="outline">{updateStatus.current_version}</Badge>
            </div>
            {updateStatus.available && updateStatus.latest_version && (
              <div>
                <p className="text-sm text-muted-foreground">Latest Version</p>
                <Badge variant="default">{updateStatus.latest_version}</Badge>
              </div>
            )}
          </div>

          {/* Update Information */}
          {updateStatus.available && updateStatus.update_info && (
            <div className="space-y-3">
              <div>
                <h4 className="text-lg font-serif font-medium mb-2">What's New</h4>
                <div className="bg-v0-bg-secondary p-3 rounded-md max-h-48 overflow-y-auto text-sm">
                  {formatReleaseNotes(updateStatus.update_info.body)}
                </div>
              </div>
              
              {updateStatus.update_info.date && (
                <p className="text-sm text-muted-foreground">
                  Released: {new Date(updateStatus.update_info.date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Installation Progress */}
          {isInstalling && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                {installProgress || 'Installing update...'}
              </AlertDescription>
            </Alert>
          )}

          {/* Installation Success */}
          {installSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-v0-teal" />
              <AlertDescription className="text-v0-teal">
                Update installed successfully! Please restart the application to complete the update.
              </AlertDescription>
            </Alert>
          )}

          {/* Installation Error */}
          {installError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {installError}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {installSuccess ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Later
              </Button>
              <Button onClick={handleRestartApp}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Restart Now
              </Button>
            </>
          ) : updateStatus.available ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isInstalling}>
                Skip
              </Button>
              <Button 
                onClick={handleInstallUpdate} 
                disabled={isInstalling}
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Install Update
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdaterDialog;
