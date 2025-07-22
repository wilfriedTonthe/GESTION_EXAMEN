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

/**
 * Composant pour la vérification faciale des étudiants
 * Ce composant est utilisé dans la page d'examen pour vérifier l'identité de l'étudiant
 */
const StudentFaceVerification = ({ examId, studentName, sessionId, onVerificationComplete }) => {
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, verifying, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [securityStarted, setSecurityStarted] = useState(false);

  // Fonction pour démarrer la caméra
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStream(stream);

      

      
      return true;
    } catch (err) {
      console.error('Erreur lors de l\'accès à la caméra:', err);
      setErrorMessage(`Impossible d'accéder à la caméra: ${err.message}`);
      setVerificationStatus('error');
      return false;
    }
  };

  // Fonction pour arrêter la caméra
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Vérifier l'identité de l'étudiant
  const verifyIdentity = async () => {
    setVerificationStatus('verifying');
    
    try {
      // Vérifier si l'étudiant est autorisé à passer l'examen
      const verificationResult = await securityService.verifyStudentForExam(examId, studentName);
      
      if (verificationResult.authorized) {
        setVerificationStatus('success');
        
        // Démarrer la surveillance de sécurité avec reconnaissance faciale
        await startSecurityMonitoring();
        
        // Informer le composant parent que la vérification est terminée
        onVerificationComplete(true);
      } else {
        setVerificationStatus('error');
        setErrorMessage(verificationResult.message || 'Vous n\'êtes pas autorisé à passer cet examen.');
        onVerificationComplete(false);
      }
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      setVerificationStatus('error');
      setErrorMessage(`Erreur lors de la vérification: ${err.message}`);
      onVerificationComplete(false);
    }
  };

  // Démarrer la surveillance de sécurité avec reconnaissance faciale
  const startSecurityMonitoring = async () => {
    try {
      const result = await securityService.startExamSecurity(sessionId, examId, studentName);
      setSecurityStarted(true);
      console.log('Surveillance de sécurité démarrée:', result);
      
      // Afficher une notification
      toast({
        title: 'Surveillance activée',
        description: 'La surveillance de sécurité avec reconnaissance faciale est active.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      
      return true;
    } catch (err) {
      console.error('Erreur lors du démarrage de la surveillance:', err);
      toast({
        title: 'Erreur',
        description: `Impossible de démarrer la surveillance: ${err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  // Arrêter la surveillance de sécurité
  const stopSecurityMonitoring = async () => {
    if (securityStarted) {
      try {
        await securityService.stopExamSecurity(sessionId);
        setSecurityStarted(false);
        console.log('Surveillance de sécurité arrêtée');
      } catch (err) {
        console.error('Erreur lors de l\'arrêt de la surveillance:', err);
      }
    }
  };

  // Ouvrir le modal et tenter d'activer la caméra au montage
  useEffect(() => {
    onOpen();
    startCamera(); // Tentative d'activation automatique de la caméra

    // Nettoyer lors du démontage du composant
    return () => {
      stopCamera();
      stopSecurityMonitoring();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onOpen]);





  // Effet pour la surveillance continue
  useEffect(() => {
    if (!securityStarted || !cameraStream) {
      return;
    }

    const intervalId = setInterval(async () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Extraire l'image en base64
        const imageData = canvas.toDataURL('image/jpeg').split(',')[1];

        if (imageData) {
          const result = await securityService.verifyFrame(sessionId, imageData);
          if (!result.identity_confirmed) {
            toast({
              title: 'Alerte de Sécurité',
              description: 'Votre visage n\'est pas détecté. Veuillez vous replacer devant la caméra.',
              status: 'warning',
              duration: 4000,
              isClosable: true,
            });
          }
        }
      }
    }, 5000); // Vérification toutes les 5 secondes

    // Nettoyer l'intervalle lors du démontage
    return () => clearInterval(intervalId);
  }, []);

  // Gérer la fermeture du modal
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
            <VStack spacing={4} align="stretch">
              <Text>
                Nous devons vérifier votre identité avant de commencer l'examen.
                Veuillez cliquer sur le bouton ci-dessous pour activer votre caméra.
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
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
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
                    <AlertTitle>Erreur de vérification</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Box>
                </Alert>
              )}
              
              {verificationStatus === 'success' && (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Vérification réussie</AlertTitle>
                    <AlertDescription>Votre identité a été vérifiée avec succès.</AlertDescription>
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
