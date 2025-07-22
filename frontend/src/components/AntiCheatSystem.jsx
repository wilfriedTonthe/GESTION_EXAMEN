import { useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';

const AntiCheatSystem = ({ isActive = true }) => {
  const toast = useToast();
  const detectionInterval = useRef(null);
  const lastWarningTime = useRef(0);

  // Check for remote desktop/control software
  const checkForRemoteAccess = () => {
    const remoteSoftware = [
      'anydesk', 'teamviewer', 'chrome-remote', 'msra', 'vnc', 'splashtop',
      'logmein', 'gotomypc', 'connectwise', 'screenconnect', 'webex', 'zoom'
    ];

    const processes = window.require('electron')?.remote?.require('ps-list')?.default || [];
    
    processes.forEach(process => {
      const processName = process.name.toLowerCase();
      if (remoteSoftware.some(sw => processName.includes(sw))) {
        showWarning('Logiciel de contrôle à distance détecté');
        // Attempt to terminate the process
        try {
          window.require('electron')?.remote?.require('process').kill(process.pid);
        } catch (e) {
          console.error('Failed to terminate process:', e);
        }
      }
    });
  };

  // Check for screen recording/streaming
  const checkForScreenRecording = () => {
    const recordingSoftware = [
      'obs', 'xsplit', 'nvidia', 'bandicam', 'fraps', 'camtasia', 'screencast',
      'screencapture', 'snagit', 'screencam', 'camtasia', 'screencast-o-matic'
    ];

    const processes = window.require('electron')?.remote?.require('ps-list')?.default || [];
    
    processes.forEach(process => {
      const processName = process.name.toLowerCase();
      if (recordingSoftware.some(sw => processName.includes(sw))) {
        showWarning('Logiciel d\'enregistrement d\'écran détecté');
      }
    });
  };

  // Check for virtual machines
  const checkForVirtualMachine = async () => {
    try {
      const { exec } = window.require('child_process').promises;
      const { stdout } = await exec('systeminfo');
      
      const vmIndicators = [
        'VMware', 'VirtualBox', 'Parallels', 'Hyper-V', 'Virtual Machine',
        'Xen', 'QEMU', 'KVM', 'Bochs', 'Virtual HD'
      ];
      
      if (vmIndicators.some(indicator => stdout.includes(indicator))) {
        showWarning('Machine virtuelle détectée');
      }
    } catch (error) {
      console.error('Failed to check VM status:', error);
    }
  };

  // Show warning to user
  const showWarning = (message) => {
    const now = Date.now();
    // Only show warning once per 30 seconds to avoid spamming
    if (now - lastWarningTime.current > 30000) {
      lastWarningTime.current = now;
      
      toast({
        title: 'Alerte de sécurité',
        description: `${message}. Cette activité est enregistrée.`,
        status: 'warning',
        duration: 10000,
        isClosable: true,
        position: 'top',
      });
      
      // Log the violation
      logViolation(message);
    }
  };

  // Log violation to server
  const logViolation = async (violationType) => {
    try {
      await fetch('/api/security/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: violationType,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.error('Failed to log security violation:', error);
    }
  };

  // Start monitoring
  useEffect(() => {
    if (!isActive) return;

    const startMonitoring = async () => {
      try {
        // Check for remote access and screen recording every 30 seconds
        checkForRemoteAccess();
        checkForScreenRecording();
        await checkForVirtualMachine();
        
        // Set up periodic checks
        detectionInterval.current = setInterval(() => {
          checkForRemoteAccess();
          checkForScreenRecording();
        }, 30000);
        
        // Check for tab/window switching
        window.addEventListener('blur', handleVisibilityChange);
        
        // Check for developer tools
        setInterval(checkDevTools, 1000);
        
      } catch (error) {
        console.error('Error initializing anti-cheat system:', error);
      }
    };

    // Check if developer tools are open
    const checkDevTools = () => {
      const devtools = /./;
      devtools.toString = () => {
        showWarning('Outil de développement détecté');
        return '';
      };
      console.log('%c', devtools);
    };

    // Handle tab/window switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        showWarning('Changement d\'onglet ou de fenêtre détecté');
      }
    };

    startMonitoring();

    // Cleanup
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, [isActive]);

  return null; // This component doesn't render anything
};

export default AntiCheatSystem;
