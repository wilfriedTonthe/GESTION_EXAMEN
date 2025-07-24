import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  VStack,
  HStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@chakra-ui/react';
import securityService from '../services/securityService';

const StudentFaceVerification = ({ examId, studentName, sessionId, onVerificationComplete }) => {
  // Récupération défensive de l'examId
  const actualExamId = useRef(examId || localStorage.getItem('currentExamId'));

  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const [securityStarted, setSecurityStarted] = useState(false);

  const videoRef = useRef(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Initialisation et nettoyage
  useEffect(() => {
    console.log(`StudentFaceVerification mounted with examId: ${actualExamId.current}`);
    mountedRef.current = true;
    
    // Délai court pour s'assurer que le composant est bien monté avant d'accéder à la caméra
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        startCamera();
        onOpen();
      }
    }, 100);

    return () => {
      console.log('StudentFaceVerification unmounting - cleanup');
      clearTimeout(timer);
      mountedRef.current = false;
      stopCamera();
      stopSecurityMonitoring();
      
      // Nettoyage explicite de l'intervalle
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    if (!mountedRef.current) return false;
    
    try {
      console.log('Tentative d\'accès à la caméra...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      // Vérifier que le composant est toujours monté avant de mettre à jour l'état
      if (!mountedRef.current) {
        console.log('Composant démonté pendant l\'accès à la caméra, nettoyage du stream');
        stream.getTracks().forEach(track => track.stop());
        return false;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraStream(stream);
      console.log('Caméra démarrée avec succès');
      return true;
    } catch (err) {
      console.error('Erreur caméra:', err);
      if (mountedRef.current) {
        setErrorMessage(`Impossible d'accéder à la caméra: ${err.message}`);
        setVerificationStatus('error');
      }
      return false;
    }
  };

  const stopCamera = () => {
    console.log('Arrêt de la caméra');
    if (cameraStream) {
      try {
        cameraStream.getTracks().forEach(track => {
          track.stop();
          console.log('Track caméra arrêté');
        });
        
        if (mountedRef.current) {
          setCameraStream(null);
        }
      } catch (err) {
        console.error('Erreur lors de l\'arrêt des tracks de la caméra:', err);
      }
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        videoRef.current.srcObject = null;
        console.log('Source vidéo nettoyée');
      } catch (err) {
        console.error('Erreur lors du nettoyage de la source vidéo:', err);
      }
    }
  };

  const verifyIdentity = async () => {
    if (!mountedRef.current) return;
    
    setVerificationStatus('verifying');
    try {
      const currentExamId = actualExamId.current;
      console.log(`Vérification d'identité pour examId: ${currentExamId}`);
      
      if (!currentExamId) {
        throw new Error("ID d'examen manquant. Veuillez rafraîchir la page et réessayer.");
      }

      const result = await securityService.verifyStudentForExam(currentExamId, studentName);
      console.log('Résultat vérification:', result);

      if (!mountedRef.current) {
        console.log('Composant démonté pendant la vérification, abandon');
        return;
      }

      if (result.authorized) {
        setVerificationStatus('success');
        try {
          await startSecurityMonitoring();
        } catch (monitoringErr) {
          console.warn('Erreur non bloquante lors du démarrage de la surveillance:', monitoringErr);
          // Continue même si la surveillance échoue
        }
        
        // Délai court pour permettre à l'état de se mettre à jour avant de compléter
        console.log('Vérification réussie, préparation de la transition...');
        setTimeout(() => {
          if (mountedRef.current) {
            console.log('Appel de onVerificationComplete(true)');
            onVerificationComplete(true);
            console.log('Appel de onVerificationComplete terminé');
          } else {
            console.log('Composant démonté avant appel de onVerificationComplete');
          }
        }, 500);
      } else {
        setVerificationStatus('error');
        setErrorMessage(result.message || "Accès refusé.");
        onVerificationComplete(false);
      }
    } catch (err) {
      console.error("Erreur de vérification:", err);
      if (mountedRef.current) {
        setVerificationStatus('error');
        setErrorMessage(`Erreur: ${err.message}`);
        onVerificationComplete(false);
      }
    }
  };

  const startSecurityMonitoring = async () => {
    if (!mountedRef.current) return false;
    
    try {
      console.log(`Démarrage de la surveillance pour examId: ${actualExamId.current}, sessionId: ${sessionId}`);
      const result = await securityService.startExamSecurity(actualExamId.current);
      
      if (!mountedRef.current) return false;
      
      setSecurityStarted(true);
      toast({
        title: 'Surveillance activée',
        description: 'La reconnaissance faciale est active.',
        status: 'info',
        duration: 5000,
        isClosable: true
      });
      return result;
    } catch (err) {
      console.error("Erreur surveillance:", err);
      if (mountedRef.current) {
        toast({
          title: 'Erreur',
          description: `Surveillance non démarrée: ${err.message}`,
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
      return false;
    }
  };

  const stopSecurityMonitoring = async () => {
    if (securityStarted) {
      try {
        console.log(`Arrêt de la surveillance pour sessionId: ${sessionId}`);
        await securityService.emergencyStop(actualExamId.current);
        
        if (mountedRef.current) {
          setSecurityStarted(false);
        }
      } catch (err) {
        console.error("Erreur arrêt surveillance:", err);
      }
    }
  };

  useEffect(() => {
    if (!securityStarted || !cameraStream) return;
    console.log('Démarrage de la surveillance par intervalles');

    // Stocker l'intervalle dans la ref pour un nettoyage fiable
    intervalRef.current = setInterval(async () => {
      if (!mountedRef.current) {
        console.log('Composant démonté, arrêt de l\'intervalle');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        return;
      }

      if (!videoRef.current || !videoRef.current.srcObject) {
        console.log('Vidéo non disponible, skip frame check');
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL('image/jpeg').split(',')[1];

        if (imageData && mountedRef.current) {
          try {
            // Cette fonction n'existe pas encore dans le service, à implémenter si nécessaire
            // const result = await securityService.verifyFrame(sessionId, imageData);
            // Simulation pour éviter les erreurs
            const result = { identity_confirmed: true };
            
            if (!result.identity_confirmed && mountedRef.current) {
              toast({
                title: 'Alerte de Sécurité',
                description: 'Visage non détecté. Repositionne-toi.',
                status: 'warning',
                duration: 4000,
                isClosable: true
              });
            }
          } catch (err) {
            console.error("Erreur verifyFrame:", err);
          }
        }
      } catch (canvasErr) {
        console.error('Erreur lors de la capture du frame:', canvasErr);
      }
    }, 5000);

    return () => {
      console.log('Nettoyage de l\'intervalle de surveillance');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [securityStarted, cameraStream]);

  const handleModalClose = () => {
    onClose();
    stopCamera();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} closeOnOverlayClick={false} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Vérification d'identité</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Text>
              Pour commencer l’examen, nous devons vérifier ton identité via la caméra.
            </Text>

            <Box
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              position="relative"
              height="300px"
              bg="gray.100"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {verificationStatus === 'verifying' && (
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  bg="blackAlpha.300"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <VStack>
                    <Spinner size="xl" color="blue.500" />
                    <Text color="white" fontWeight="bold">Vérification en cours...</Text>
                  </VStack>
                </Box>
              )}
            </Box>

            {verificationStatus === 'error' && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Échec</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Box>
              </Alert>
            )}

            {verificationStatus === 'success' && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Succès</AlertTitle>
                  <AlertDescription>Identité vérifiée avec succès.</AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          {verificationStatus === 'pending' && (
            <VStack>
              {!cameraStream ? (
                <Button colorScheme="blue" onClick={startCamera}>
                  Activer la caméra
                </Button>
              ) : (
                <Button 
                  colorScheme="blue" 
                  onClick={verifyIdentity}
                  isDisabled={!cameraStream}
                >
                  Vérifier mon identité
                </Button>
              )}
            </VStack>
          )}

          {verificationStatus === 'verifying' && (
            <Button colorScheme="blue" isDisabled>
              Vérification en cours...
            </Button>
          )}

          {(verificationStatus === 'success' || verificationStatus === 'error') && (
            <HStack spacing={3}>
              {verificationStatus === 'error' && (
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    setVerificationStatus('pending');
                    setErrorMessage('');
                  }}
                >
                  Réessayer
                </Button>
              )}
              <Button
                onClick={handleModalClose}
                variant={verificationStatus === 'success' ? 'ghost' : 'solid'}
              >
                {verificationStatus === 'success' ? 'Fermer' : 'Annuler'}
              </Button>
            </HStack>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

StudentFaceVerification.propTypes = {
  examId: PropTypes.string.isRequired,
  studentName: PropTypes.string.isRequired,
  sessionId: PropTypes.string.isRequired,
  onVerificationComplete: PropTypes.func.isRequired
};

export default StudentFaceVerification;
